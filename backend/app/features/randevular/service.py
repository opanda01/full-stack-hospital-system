from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.lookups import doktor_getir, hasta_getir, personel_getir
from app.core.permissions import Kapsam
from app.core.public_id import get_by_public_id, hasta_from_public_id
from app.core.scope import kullanici_kapsamli_filtre_uygula
from app.core.timezone import ISTANBUL, as_utc, to_istanbul
from app.features.kullanicilar.models import Kullanici
from app.features.randevular.clinic_slots import (
    klinik_saatleri_icinde_mi,
    oglen_arasi_mi,
    iter_klinik_slotlari,
    SLOT_MINUTES,
)
from app.features.randevular.models import Randevu
from app.features.randevular.schemas import RandevuCreate


def _cakisma_var_mi(session: Session, doktor_id: int, tarih_saat: datetime) -> bool:
    ts = as_utc(tarih_saat)
    bas = ts - timedelta(minutes=SLOT_MINUTES - 1)
    bit = ts + timedelta(minutes=SLOT_MINUTES - 1)
    rows = session.exec(
        select(Randevu).where(
            Randevu.doktor_id == doktor_id,
            Randevu.durum != "IPTAL",
            Randevu.tarih_saat >= bas,
            Randevu.tarih_saat <= bit,
        )
    ).all()
    return len(rows) > 0


def listele_sorgu(
    session: Session, current_user: Kullanici, kapsam: Kapsam
):
    query = select(Randevu)

    def kendi(q):
        if current_user.rol == Rol.DOKTOR:
            doktor = doktor_getir(session, current_user.id)
            return q.where(Randevu.doktor_id == doktor.id)
        if current_user.rol == Rol.HASTA:
            hasta = hasta_getir(session, current_user.id)
            return q.where(Randevu.hasta_id == hasta.id)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kendi kaydı kapsamı bu rol için tanımlı değil",
        )

    def departman(q):
        personel = personel_getir(session, current_user.id)
        if personel.departman_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Departman atanmamış",
            )
        return q.where(Randevu.departman_id == personel.departman_id)

    query = kullanici_kapsamli_filtre_uygula(
        query,
        kapsam,
        kendi_kaydim_filtresi=kendi,
        departmanim_filtresi=departman,
    )
    return query.order_by(Randevu.tarih_saat.desc(), Randevu.id.desc())


def listele(
    session: Session, current_user: Kullanici, kapsam: Kapsam
) -> list[Randevu]:
    return list(session.exec(listele_sorgu(session, current_user, kapsam)).all())


def randevu_erisim_kontrolu(
    session: Session, randevu: Randevu, current_user: Kullanici
) -> None:
    if current_user.rol in (Rol.ADMIN, Rol.BASHEKIM, Rol.MUDUR):
        return
    if current_user.rol == Rol.DOKTOR:
        doktor = doktor_getir(session, current_user.id)
        if randevu.doktor_id == doktor.id:
            return
    elif current_user.rol == Rol.HASTA:
        hasta = hasta_getir(session, current_user.id)
        if randevu.hasta_id == hasta.id:
            return
    elif current_user.rol in (Rol.HEMSIRE, Rol.EBE):
        personel = personel_getir(session, current_user.id)
        if (
            personel.departman_id is not None
            and randevu.departman_id == personel.departman_id
        ):
            return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Bu randevuya erişiminiz yok.",
    )


def olustur(
    session: Session, current_user: Kullanici, veri: RandevuCreate, kapsam: Kapsam
) -> Randevu:
    hasta = hasta_from_public_id(session, veri.hasta_id)
    assert hasta.id is not None

    if kapsam == Kapsam.KENDI_KAYDIM and current_user.rol == Rol.HASTA:
        kendi = hasta_getir(session, current_user.id)
        if hasta.id != kendi.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sadece kendi adınıza randevu oluşturabilirsiniz.",
            )
    elif kapsam == Kapsam.DEPARTMANIM:
        personel = personel_getir(session, current_user.id)
        if personel.departman_id != veri.departman_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sadece kendi departmanınız için randevu oluşturabilirsiniz.",
            )

    if veri.public_id is not None:
        clash = session.exec(
            select(Randevu).where(Randevu.public_id == veri.public_id)
        ).first()
        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="public_id zaten kullanılıyor",
            )

    tarih_saat = as_utc(veri.tarih_saat)
    if not klinik_saatleri_icinde_mi(tarih_saat):
        if oglen_arasi_mi(tarih_saat):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Öğle arası (12:00–13:00) randevu alılamaz",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Randevu yalnızca 09:00–17:00 arasında alınabilir (öğle arası hariç)",
        )
    if _cakisma_var_mi(session, veri.doktor_id, tarih_saat):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu saatte doktorun başka randevusu var",
        )

    kwargs: dict = {
        "hasta_id": hasta.id,
        "doktor_id": veri.doktor_id,
        "departman_id": veri.departman_id,
        "tarih_saat": tarih_saat,
        "notlar": veri.notlar,
        "durum": "BEKLEMEDE",
    }
    if veri.public_id is not None:
        kwargs["public_id"] = veri.public_id
    randevu = Randevu(**kwargs)
    session.add(randevu)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu saatte doktorun başka randevusu var",
        ) from exc
    session.refresh(randevu)
    return randevu


def iptal_et(session: Session, current_user: Kullanici, public_id: UUID) -> Randevu:
    randevu = get_by_public_id(session, Randevu, public_id)
    randevu_erisim_kontrolu(session, randevu, current_user)
    if randevu.durum == "IPTAL":
        raise HTTPException(status_code=400, detail="Randevu zaten iptal edilmiş")
    if randevu.tarih_saat <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400,
            detail="Geçmiş randevu iptal edilemez",
        )
    randevu.durum = "IPTAL"
    randevu.updated_at = datetime.now(timezone.utc)
    session.add(randevu)
    session.commit()
    session.refresh(randevu)
    return randevu


def getir(session: Session, current_user: Kullanici, public_id: UUID) -> Randevu:
    randevu = get_by_public_id(session, Randevu, public_id)
    randevu_erisim_kontrolu(session, randevu, current_user)
    return randevu


def musait_slotlar(session: Session, doktor_id: int, gun: date) -> list[datetime]:
    """09:00–17:00 İstanbul; 12:00–13:00 öğle arası kapalı."""
    slotlar_ist = iter_klinik_slotlari(gun)
    bas_utc = slotlar_ist[0].astimezone(timezone.utc) if slotlar_ist else None
    bit_utc = (
        datetime(gun.year, gun.month, gun.day, 17, 0, 0, tzinfo=ISTANBUL).astimezone(
            timezone.utc
        )
    )
    dolu = set()
    if bas_utc is not None:
        dolu = {
            as_utc(r.tarih_saat)
            for r in session.exec(
                select(Randevu).where(
                    Randevu.doktor_id == doktor_id,
                    Randevu.durum != "IPTAL",
                    Randevu.tarih_saat >= bas_utc,
                    Randevu.tarih_saat < bit_utc,
                )
            ).all()
        }
    slotlar: list[datetime] = []
    for cur in slotlar_ist:
        cur_utc = cur.astimezone(timezone.utc)
        if cur_utc not in dolu and not _cakisma_var_mi(session, doktor_id, cur_utc):
            slotlar.append(to_istanbul(cur_utc))
    return slotlar
