from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.db import get_session
from app.core.enums import KlinikOnayDurumu
from app.core.request_ip import istemci_ip_al
from app.core.security import require_permission
from app.features.bashekim.router import phi_goruntuleme_logla
from app.features.klinik_onay.models import KlinikOnayKaydi
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


class KlinikOnayCreate(BaseModel):
    tur: str = Field(pattern="^(RECETE|SEVK|TIBBI_RAPOR)$")
    muayene_id: int | None = None
    hasta_id: int | None = None
    icerik: str = Field(min_length=1, max_length=4000)


class KlinikOnayRead(BaseModel):
    id: int
    tur: str
    muayene_id: int | None
    hasta_id: int | None
    icerik: str
    onay_durumu: str
    olusturan_id: int | None
    onaylayan_id: int | None
    onay_tarihi: datetime | None

    model_config = {"from_attributes": True}


def _to_read(row: KlinikOnayKaydi) -> KlinikOnayRead:
    return KlinikOnayRead(
        id=row.id,
        tur=row.tur,
        muayene_id=row.muayene_id,
        hasta_id=row.hasta_id,
        icerik=row.icerik,
        onay_durumu=row.onay_durumu.value
        if hasattr(row.onay_durumu, "value")
        else str(row.onay_durumu),
        olusturan_id=row.olusturan_id,
        onaylayan_id=row.onaylayan_id,
        onay_tarihi=row.onay_tarihi,
    )


@router.get("/", response_model=list[KlinikOnayRead])
def list_klinik_onay(
    durum: KlinikOnayDurumu | None = None,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("klinik_onay:goruntule")),
):
    q = select(KlinikOnayKaydi).order_by(KlinikOnayKaydi.id.desc())
    if durum is not None:
        q = q.where(KlinikOnayKaydi.onay_durumu == durum)
    return [_to_read(r) for r in session.exec(q).all()]


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
    if row.hasta_id:
        phi_goruntuleme_logla(
            session,
            actor=current_user,
            kaynak="klinik_onay",
            kaynak_id=kayit_id,
            request=request,
        )
    return _to_read(row)


@router.post("/", response_model=KlinikOnayRead, status_code=status.HTTP_201_CREATED)
def create_klinik_onay(
    body: KlinikOnayCreate,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("klinik_onay:goruntule")),
):
    row = KlinikOnayKaydi(
        **body.model_dump(),
        olusturan_id=current_user.id,
        onay_durumu=KlinikOnayDurumu.BEKLEMEDE,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return _to_read(row)


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
    return _to_read(row)


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
    return _to_read(row)
