from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.db import get_session
from app.core.enums import KlinikOnayDurumu, OturumTipi, Rol
from app.core.lookups import hasta_getir
from app.core.pagination import Page, PaginationParams, get_pagination, make_page, paginate
from app.core.permissions import Kapsam
from app.core.public_id import (
    optional_hasta_pk_from_public_id,
    optional_hasta_public_id_from_pk,
)
from app.core.request_ip import istemci_ip_al
from app.core.scope import erisim_rolu
from app.core.security import require_permission
from app.features.bashekim.router import phi_goruntuleme_logla
from app.features.hastalar import service as hasta_service
from app.features.faturalandirma.sevk_kural_service import sevk_onay_ek_ucret_uygula
from app.features.klinik_onay.models import KlinikOnayKaydi
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


class KlinikOnayCreate(BaseModel):
    tur: str = Field(pattern="^(RECETE|SEVK|TIBBI_RAPOR|ACIL_RIZASIZ)$")
    muayene_id: int | None = None
    hasta_id: UUID | None = None
    icerik: str = Field(min_length=1, max_length=4000)
    aile_hekimi_sevk_no: str | None = Field(default=None, max_length=64)
    # ACIL_RIZASIZ için zorunlu: ikinci hekim (kullanıcı id)
    ikinci_hekim_id: int | None = None


class KlinikOnayRead(BaseModel):
    id: int
    tur: str
    muayene_id: int | None
    hasta_id: UUID | None
    icerik: str
    onay_durumu: str
    olusturan_id: int | None
    onaylayan_id: int | None
    onay_tarihi: datetime | None
    ikinci_onaylayan_id: int | None = None
    bilgilendirme_yapildi_mi: bool = False
    bilgilendirme_tarihi: datetime | None = None
    bilgilendirme_notu: str | None = None
    aile_hekimi_sevk_no: str | None = None

    model_config = {"from_attributes": True}


class AcilBilgilendirRequest(BaseModel):
    notu: str | None = Field(default=None, max_length=2000)


def _to_read(session: Session, row: KlinikOnayKaydi) -> KlinikOnayRead:
    return KlinikOnayRead(
        id=row.id,
        tur=row.tur,
        muayene_id=row.muayene_id,
        hasta_id=optional_hasta_public_id_from_pk(session, row.hasta_id),
        icerik=row.icerik,
        onay_durumu=row.onay_durumu.value
        if hasattr(row.onay_durumu, "value")
        else str(row.onay_durumu),
        olusturan_id=row.olusturan_id,
        onaylayan_id=row.onaylayan_id,
        onay_tarihi=row.onay_tarihi,
        ikinci_onaylayan_id=row.ikinci_onaylayan_id,
        bilgilendirme_yapildi_mi=bool(row.bilgilendirme_yapildi_mi),
        bilgilendirme_tarihi=row.bilgilendirme_tarihi,
        bilgilendirme_notu=row.bilgilendirme_notu,
        aile_hekimi_sevk_no=row.aile_hekimi_sevk_no,
    )


def _hasta_pk_for_user(session: Session, current_user: Kullanici) -> int:
    hasta = hasta_getir(session, current_user.id)
    assert hasta.id is not None
    return hasta.id


def _assert_erisim(
    session: Session,
    current_user: Kullanici,
    row: KlinikOnayKaydi,
    kapsam: Kapsam,
    *,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
) -> None:
    if kapsam == Kapsam.GLOBAL:
        return
    if kapsam == Kapsam.KENDI_KAYDIM:
        if erisim_rolu(current_user, oturum_tipi) == Rol.HASTA:
            kendi_pk = _hasta_pk_for_user(session, current_user)
            if row.hasta_id != kendi_pk:
                raise HTTPException(status_code=403, detail="Bu kayda erişim yetkiniz yok")
            if row.onay_durumu != KlinikOnayDurumu.ONAYLANDI:
                raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
            return
        if row.olusturan_id != current_user.id:
            raise HTTPException(status_code=403, detail="Bu kayda erişim yetkiniz yok")
        return
    raise HTTPException(status_code=403, detail="Klinik onay için yetkiniz yok")


@router.get("/", response_model=Page[KlinikOnayRead])
def list_klinik_onay(
    request: Request,
    durum: KlinikOnayDurumu | None = None,
    tur: str | None = None,
    pagination: PaginationParams = Depends(get_pagination),
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("klinik_onay:goruntule")),
):
    q = select(KlinikOnayKaydi).order_by(KlinikOnayKaydi.id.desc())
    if durum is not None:
        q = q.where(KlinikOnayKaydi.onay_durumu == durum)
    if tur is not None:
        q = q.where(KlinikOnayKaydi.tur == tur)
    kapsam = request.state.kapsam
    oturum = getattr(request.state, "oturum_tipi", OturumTipi.PERSONEL)
    if kapsam == Kapsam.KENDI_KAYDIM:
        if erisim_rolu(current_user, oturum) == Rol.HASTA:
            kendi_pk = _hasta_pk_for_user(session, current_user)
            q = q.where(
                KlinikOnayKaydi.hasta_id == kendi_pk,
                KlinikOnayKaydi.onay_durumu == KlinikOnayDurumu.ONAYLANDI,
            )
        else:
            q = q.where(KlinikOnayKaydi.olusturan_id == current_user.id)
    elif kapsam != Kapsam.GLOBAL:
        raise HTTPException(status_code=403, detail="Klinik onay listesi için yetkiniz yok")
    rows, total = paginate(
        session, q, page=pagination.page, page_size=pagination.page_size
    )
    return make_page(
        [_to_read(session, r) for r in rows],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get("/{kayit_id}", response_model=KlinikOnayRead)
def get_klinik_onay(
    kayit_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("klinik_onay:goruntule")),
):
    row = session.get(KlinikOnayKaydi, kayit_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    _assert_erisim(
        session,
        current_user,
        row,
        request.state.kapsam,
        oturum_tipi=getattr(request.state, "oturum_tipi", OturumTipi.PERSONEL),
    )
    if row.hasta_id:
        phi_goruntuleme_logla(
            session,
            actor=current_user,
            kaynak="klinik_onay",
            kaynak_id=kayit_id,
            request=request,
        )
    return _to_read(session, row)


@router.post("/", response_model=KlinikOnayRead, status_code=status.HTTP_201_CREATED)
def create_klinik_onay(
    body: KlinikOnayCreate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("klinik_onay:olustur")),
):
    kapsam = request.state.kapsam
    oturum = getattr(request.state, "oturum_tipi", OturumTipi.PERSONEL)
    hasta_pk = optional_hasta_pk_from_public_id(session, body.hasta_id)
    if hasta_pk is not None and kapsam == Kapsam.KENDI_KAYDIM:
        if erisim_rolu(current_user, oturum) == Rol.DOKTOR and not hasta_service.doktor_hasta_erisim_var_mi(
            session, current_user, hasta_pk
        ):
            raise HTTPException(
                status_code=403, detail="Bu hasta için klinik belge oluşturamazsınız"
            )

    ikinci_id: int | None = None
    onay_durumu = KlinikOnayDurumu.BEKLEMEDE
    onaylayan_id: int | None = None
    onay_tarihi = None

    if body.tur == "ACIL_RIZASIZ":
        if body.ikinci_hekim_id is None:
            raise HTTPException(
                status_code=400,
                detail="Acil rızasız müdahale için ikinci_hekim_id zorunludur",
            )
        if body.ikinci_hekim_id == current_user.id:
            raise HTTPException(
                status_code=400,
                detail="İkinci hekim, oluşturan hekimden farklı olmalıdır",
            )
        ikinci = session.get(Kullanici, body.ikinci_hekim_id)
        if ikinci is None or ikinci.rol not in (Rol.DOKTOR, Rol.BASHEKIM):
            raise HTTPException(
                status_code=400, detail="İkinci hekim geçerli bir doktor olmalıdır"
            )
        if current_user.rol not in (Rol.DOKTOR, Rol.BASHEKIM, Rol.ADMIN):
            raise HTTPException(
                status_code=403, detail="Acil rızasız kayıt yalnızca hekim açabilir"
            )
        if hasta_pk is None:
            raise HTTPException(
                status_code=400, detail="Acil rızasız müdahale için hasta_id zorunludur"
            )
        if len(body.icerik.strip()) < 20:
            raise HTTPException(
                status_code=400,
                detail="Acil gerekçe en az 20 karakter olmalıdır",
            )
        ikinci_id = body.ikinci_hekim_id
        onay_durumu = KlinikOnayDurumu.ONAYLANDI
        onaylayan_id = current_user.id
        onay_tarihi = datetime.utcnow()

    row = KlinikOnayKaydi(
        tur=body.tur,
        muayene_id=body.muayene_id,
        hasta_id=hasta_pk,
        icerik=body.icerik,
        olusturan_id=current_user.id,
        onay_durumu=onay_durumu,
        onaylayan_id=onaylayan_id,
        onay_tarihi=onay_tarihi,
        ikinci_onaylayan_id=ikinci_id,
        aile_hekimi_sevk_no=body.aile_hekimi_sevk_no,
    )
    session.add(row)
    session.flush()
    if body.tur == "ACIL_RIZASIZ":
        denetim_kaydi_yaz(
            session,
            aksiyon="ACIL_RIZASIZ_ONAY",
            actor_id=current_user.id,
            kaynak="klinik_onay",
            kaynak_id=row.id,
            detay={
                "ikinci_onaylayan_id": ikinci_id,
                "hasta_id": hasta_pk,
            },
            ip_adresi=istemci_ip_al(request),
            commit=False,
        )
    session.commit()
    session.refresh(row)
    return _to_read(session, row)


@router.post("/{kayit_id}/bilgilendir", response_model=KlinikOnayRead)
def acil_bilgilendir(
    kayit_id: int,
    body: AcilBilgilendirRequest,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("klinik_onay:olustur")),
):
    """Acil rızasız müdahale sonrası hasta/yakın bilgilendirmesini kaydet."""
    row = session.get(KlinikOnayKaydi, kayit_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    if row.tur != "ACIL_RIZASIZ":
        raise HTTPException(
            status_code=400, detail="Bilgilendirme yalnızca ACIL_RIZASIZ için geçerlidir"
        )
    _assert_erisim(
        session,
        current_user,
        row,
        request.state.kapsam,
        oturum_tipi=getattr(request.state, "oturum_tipi", OturumTipi.PERSONEL),
    )
    row.bilgilendirme_yapildi_mi = True
    row.bilgilendirme_tarihi = datetime.utcnow()
    row.bilgilendirme_notu = body.notu
    session.add(row)
    denetim_kaydi_yaz(
        session,
        aksiyon="ACIL_RIZASIZ_BILGILENDIRME",
        actor_id=current_user.id,
        kaynak="klinik_onay",
        kaynak_id=kayit_id,
        ip_adresi=istemci_ip_al(request),
        commit=False,
    )
    session.commit()
    session.refresh(row)
    return _to_read(session, row)


@router.post("/{kayit_id}/onayla", response_model=KlinikOnayRead)
def onayla(
    kayit_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("klinik_onay:onayla")),
):
    row = session.get(KlinikOnayKaydi, kayit_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    row.onay_durumu = KlinikOnayDurumu.ONAYLANDI
    row.onaylayan_id = current_user.id
    row.onay_tarihi = datetime.utcnow()
    session.add(row)
    if row.tur == "SEVK":
        sevk_onay_ek_ucret_uygula(session, row)
    denetim_kaydi_yaz(
        session,
        aksiyon="KLINIK_ONAY",
        actor_id=current_user.id,
        kaynak="klinik_onay",
        kaynak_id=kayit_id,
        ip_adresi=istemci_ip_al(request),
        commit=False,
    )
    session.commit()
    session.refresh(row)
    return _to_read(session, row)


@router.post("/{kayit_id}/reddet", response_model=KlinikOnayRead)
def reddet(
    kayit_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("klinik_onay:onayla")),
):
    row = session.get(KlinikOnayKaydi, kayit_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    row.onay_durumu = KlinikOnayDurumu.REDDEDILDI
    row.onaylayan_id = current_user.id
    row.onay_tarihi = datetime.utcnow()
    session.add(row)
    denetim_kaydi_yaz(
        session,
        aksiyon="KLINIK_ONAY_RED",
        actor_id=current_user.id,
        kaynak="klinik_onay",
        kaynak_id=kayit_id,
        ip_adresi=istemci_ip_al(request),
        commit=False,
    )
    session.commit()
    session.refresh(row)
    return _to_read(session, row)
