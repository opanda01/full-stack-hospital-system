from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.enums import (
    OturumTipi,
    RadyolojiAciliyet,
    RadyolojiIstemDurumu,
    RadyolojiTetkikTuru,
    Rol,
)
from app.core.lookups import doktor_getir, hasta_getir
from app.core.pagination import Page, make_page, paginate
from app.core.permissions import Kapsam
from app.core.public_id import hasta_from_public_id, hasta_pk_from_public_id, hasta_public_id_from_pk
from app.core.scope import erisim_rolu, kullanici_kapsamli_filtre_uygula
from app.features.doktorlar.models import Doktor
from app.features.hastalar import service as hasta_service
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.radyoloji.models import RadyolojiIstemi, RadyolojiSonucu
from app.features.radyoloji.orthanc_client import (
    orthanc_studies_getir,
    orthanc_viewer_url,
)
from app.features.radyoloji.schemas import (
    RadyolojiGoruntuLink,
    RadyolojiIstemOlustur,
    RadyolojiIstemOku,
    RadyolojiRaporGir,
    RadyolojiSonucOku,
)


def _enum_val(v) -> str:
    return v.value if hasattr(v, "value") else str(v)


def _kullanici_ad(k: Kullanici | None, *, fallback: str) -> str:
    if k is None:
        return fallback
    return f"{k.ad} {k.soyad}".strip() or fallback


def _doktor_ad(
    session: Session,
    doktor_id: int,
    *,
    doktorlar: dict[int, Doktor] | None = None,
    personeller: dict[int, Personel] | None = None,
    kullanicilar: dict[int, Kullanici] | None = None,
) -> str | None:
    if doktorlar is None:
        d = session.get(Doktor, doktor_id)
        if d is None:
            return f"Doktor #{doktor_id}"
        p = session.get(Personel, d.personel_id)
        if p is None:
            return f"Doktor #{doktor_id}"
        k = session.get(Kullanici, p.kullanici_id)
        return _kullanici_ad(k, fallback=f"Doktor #{doktor_id}")
    doktor = doktorlar.get(doktor_id)
    if doktor is None:
        return f"Doktor #{doktor_id}"
    personel = (personeller or {}).get(doktor.personel_id)
    if personel is None:
        return f"Doktor #{doktor_id}"
    return _kullanici_ad(
        (kullanicilar or {}).get(personel.kullanici_id),
        fallback=f"Doktor #{doktor_id}",
    )


def _sonuc_oku(session: Session, istem_id: int) -> RadyolojiSonucOku | None:
    row = session.exec(
        select(RadyolojiSonucu).where(RadyolojiSonucu.istem_id == istem_id)
    ).first()
    if row is None:
        return None
    return RadyolojiSonucOku(
        id=row.id,
        istem_id=row.istem_id,
        orthanc_study_instance_uid=row.orthanc_study_instance_uid,
        orthanc_series_instance_uid=row.orthanc_series_instance_uid,
        raporlayan_radyolog_id=row.raporlayan_radyolog_id,
        rapor_metni=row.rapor_metni,
        rapor_zamani=row.rapor_zamani,
    )


def _istem_oku(session: Session, istem: RadyolojiIstemi) -> RadyolojiIstemOku:
    hasta = session.get(Hasta, istem.hasta_id)
    if hasta is None:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")
    ku = session.get(Kullanici, hasta.kullanici_id)
    return RadyolojiIstemOku(
        id=istem.id,
        hasta_id=hasta_public_id_from_pk(session, istem.hasta_id),
        hasta_ad_soyad=_kullanici_ad(ku, fallback=f"Hasta #{istem.hasta_id}"),
        isteyen_doktor_id=istem.isteyen_doktor_id,
        isteyen_doktor_ad_soyad=_doktor_ad(session, istem.isteyen_doktor_id),
        muayene_id=istem.muayene_id,
        tetkik_turu=_enum_val(istem.tetkik_turu),
        vucut_bolgesi=istem.vucut_bolgesi,
        aciliyet=_enum_val(istem.aciliyet),
        durum=_enum_val(istem.durum),
        istem_zamani=istem.istem_zamani,
        sonuc=_sonuc_oku(session, istem.id),
    )


def _liste_sorgu(
    session: Session,
    current_user: Kullanici,
    kapsam: Kapsam,
    *,
    hasta_public_id: UUID | None = None,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
):
    query = select(RadyolojiIstemi)
    if hasta_public_id is not None:
        hasta_pk = hasta_pk_from_public_id(session, hasta_public_id)
        query = query.where(RadyolojiIstemi.hasta_id == hasta_pk)

    rol = erisim_rolu(current_user, oturum_tipi)

    def kendi(q):
        if rol == Rol.DOKTOR:
            doktor = doktor_getir(session, current_user.id)
            return q.where(RadyolojiIstemi.isteyen_doktor_id == doktor.id)
        if rol == Rol.HASTA:
            hasta = hasta_getir(session, current_user.id)
            q = q.where(RadyolojiIstemi.hasta_id == hasta.id)
            return q.where(
                RadyolojiIstemi.durum == RadyolojiIstemDurumu.RAPORLANDI
            )
        if rol == Rol.RADYOLOG:
            return q
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kendi kaydı kapsamı bu rol için tanımlı değil",
        )

    def departman(q):
        ids = hasta_service.hemsire_erisebilir_hasta_idler(
            session, current_user, sadece_yatan=False
        )
        if not ids:
            return q.where(RadyolojiIstemi.id == -1)
        return q.where(RadyolojiIstemi.hasta_id.in_(ids))  # type: ignore[attr-defined]

    query = kullanici_kapsamli_filtre_uygula(
        query,
        kapsam,
        kendi_kaydim_filtresi=kendi,
        departmanim_filtresi=departman,
    )
    return query.order_by(RadyolojiIstemi.id.desc())


def istem_erisim_kontrolu(
    session: Session,
    istem: RadyolojiIstemi,
    current_user: Kullanici,
    *,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
) -> None:
    rol = erisim_rolu(current_user, oturum_tipi)
    if rol == Rol.ADMIN:
        return
    if rol in (Rol.BASHEKIM, Rol.MUDUR):
        return
    if rol == Rol.DOKTOR:
        doktor = doktor_getir(session, current_user.id)
        if istem.isteyen_doktor_id == doktor.id:
            return
    elif rol == Rol.HASTA:
        hasta = hasta_getir(session, current_user.id)
        if istem.hasta_id == hasta.id:
            if _enum_val(istem.durum) == RadyolojiIstemDurumu.RAPORLANDI.value:
                return
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Radyoloji sonucu bulunamadı",
            )
    elif rol == Rol.RADYOLOG:
        return
    elif rol in (Rol.HEMSIRE, Rol.EBE):
        ids = hasta_service.hemsire_erisebilir_hasta_idler(session, current_user)
        if istem.hasta_id in ids:
            return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Bu radyoloji istemine erişiminiz yok.",
    )


def listele(
    session: Session,
    current_user: Kullanici,
    kapsam: Kapsam,
    *,
    hasta_public_id: UUID | None = None,
    page: int = 1,
    page_size: int = 50,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
) -> Page[RadyolojiIstemOku]:
    query = _liste_sorgu(
        session,
        current_user,
        kapsam,
        hasta_public_id=hasta_public_id,
        oturum_tipi=oturum_tipi,
    )
    rows, total = paginate(session, query, page=page, page_size=page_size)
    items = [_istem_oku(session, r) for r in rows]
    return make_page(items, total=total, page=page, page_size=page_size)


def getir(
    session: Session,
    current_user: Kullanici,
    istem_id: int,
    *,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
) -> RadyolojiIstemOku:
    istem = session.get(RadyolojiIstemi, istem_id)
    if istem is None:
        raise HTTPException(status_code=404, detail="Radyoloji istemi bulunamadı")
    istem_erisim_kontrolu(session, istem, current_user, oturum_tipi=oturum_tipi)
    return _istem_oku(session, istem)


def radyoloji_istem_olustur(
    session: Session,
    current_user: Kullanici,
    veri: RadyolojiIstemOlustur,
    kapsam: Kapsam,
) -> RadyolojiIstemOku:
    rol = erisim_rolu(current_user, OturumTipi.PERSONEL)
    if rol == Rol.DOKTOR:
        doktor = doktor_getir(session, current_user.id)
        if veri.isteyen_doktor_id != doktor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sadece kendi adınıza radyoloji isteyebilirsiniz.",
            )
    hasta = hasta_from_public_id(session, veri.hasta_id)
    assert hasta.id is not None
    istem = RadyolojiIstemi(
        hasta_id=hasta.id,
        isteyen_doktor_id=veri.isteyen_doktor_id,
        muayene_id=veri.muayene_id,
        tetkik_turu=RadyolojiTetkikTuru(veri.tetkik_turu),
        vucut_bolgesi=veri.vucut_bolgesi,
        aciliyet=RadyolojiAciliyet(veri.aciliyet),
        durum=RadyolojiIstemDurumu.ISTENDI,
    )
    session.add(istem)
    session.commit()
    session.refresh(istem)
    return _istem_oku(session, istem)


def rapor_gir(
    session: Session,
    current_user: Kullanici,
    istem_id: int,
    body: RadyolojiRaporGir,
) -> RadyolojiIstemOku:
    if current_user.rol not in (Rol.ADMIN, Rol.RADYOLOG):
        raise HTTPException(status_code=403, detail="Rapor girme yetkiniz yok")

    istem = session.get(RadyolojiIstemi, istem_id)
    if istem is None:
        raise HTTPException(status_code=404, detail="Radyoloji istemi bulunamadı")
    if _enum_val(istem.durum) == RadyolojiIstemDurumu.IPTAL.value:
        raise HTTPException(status_code=400, detail="İptal edilmiş istem")

    orthanc_studies_getir(body.orthanc_study_instance_uid)

    radyolog_id = body.raporlayan_radyolog_id
    if radyolog_id is None:
        if current_user.rol == Rol.RADYOLOG:
            radyolog_id = doktor_getir(session, current_user.id).id
        else:
            raise HTTPException(status_code=400, detail="Radyolog seçimi gerekli")

    mevcut = session.exec(
        select(RadyolojiSonucu).where(RadyolojiSonucu.istem_id == istem_id)
    ).first()
    now = datetime.now(timezone.utc)
    if mevcut is not None:
        mevcut.orthanc_study_instance_uid = body.orthanc_study_instance_uid
        mevcut.orthanc_series_instance_uid = body.orthanc_series_instance_uid
        mevcut.raporlayan_radyolog_id = radyolog_id
        mevcut.rapor_metni = body.rapor_metni
        mevcut.rapor_zamani = now
        session.add(mevcut)
    else:
        session.add(
            RadyolojiSonucu(
                istem_id=istem_id,
                orthanc_study_instance_uid=body.orthanc_study_instance_uid,
                orthanc_series_instance_uid=body.orthanc_series_instance_uid,
                raporlayan_radyolog_id=radyolog_id,
                rapor_metni=body.rapor_metni,
                rapor_zamani=now,
            )
        )

    istem.durum = RadyolojiIstemDurumu.RAPORLANDI
    session.add(istem)
    session.commit()
    session.refresh(istem)
    return _istem_oku(session, istem)


def goruntu_linki(
    session: Session,
    current_user: Kullanici,
    istem_id: int,
    *,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
) -> RadyolojiGoruntuLink:
    istem = session.get(RadyolojiIstemi, istem_id)
    if istem is None:
        raise HTTPException(status_code=404, detail="Radyoloji istemi bulunamadı")
    istem_erisim_kontrolu(session, istem, current_user, oturum_tipi=oturum_tipi)

    sonuc = session.exec(
        select(RadyolojiSonucu).where(RadyolojiSonucu.istem_id == istem_id)
    ).first()
    uid = sonuc.orthanc_study_instance_uid if sonuc else None
    meta = None
    viewer = None
    if uid:
        try:
            meta = orthanc_studies_getir(uid)
            viewer = orthanc_viewer_url(uid)
        except HTTPException:
            viewer = orthanc_viewer_url(uid)

    return RadyolojiGoruntuLink(
        istem_id=istem_id,
        study_instance_uid=uid,
        viewer_url=viewer,
        orthanc_meta=meta,
    )
