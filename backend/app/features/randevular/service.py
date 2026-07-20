from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.lookups import doktor_getir, hasta_getir, personel_getir
from app.core.permissions import Kapsam
from app.core.scope import kullanici_kapsamli_filtre_uygula
from app.features.kullanicilar.models import Kullanici
from app.features.randevular.models import Randevu
from app.features.randevular.schemas import RandevuCreate

SLOT_MINUTES = 15


def _cakisma_var_mi(session: Session, doktor_id: int, tarih_saat: datetime) -> bool:
    bas = tarih_saat - timedelta(minutes=SLOT_MINUTES - 1)
    bit = tarih_saat + timedelta(minutes=SLOT_MINUTES - 1)
    rows = session.exec(
        select(Randevu).where(
            Randevu.doktor_id == doktor_id,
            Randevu.durum != "IPTAL",
            Randevu.tarih_saat >= bas,
            Randevu.tarih_saat <= bit,
        )
    ).all()
    return len(rows) > 0


def listele(
    session: Session, current_user: Kullanici, kapsam: Kapsam
) -> list[Randevu]:
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
    return list(session.exec(query).all())


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
    if kapsam == Kapsam.KENDI_KAYDIM and current_user.rol == Rol.HASTA:
        hasta = hasta_getir(session, current_user.id)
        if veri.hasta_id != hasta.id:
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

    if _cakisma_var_mi(session, veri.doktor_id, veri.tarih_saat):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu saatte doktorun başka randevusu var",
        )

    randevu = Randevu(
        hasta_id=veri.hasta_id,
        doktor_id=veri.doktor_id,
        departman_id=veri.departman_id,
        tarih_saat=veri.tarih_saat,
        notlar=veri.notlar,
        durum="BEKLEMEDE",
    )
    session.add(randevu)
    session.commit()
    session.refresh(randevu)
    return randevu


def iptal_et(session: Session, current_user: Kullanici, randevu_id: int) -> Randevu:
    randevu = session.get(Randevu, randevu_id)
    if randevu is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Randevu bulunamadı"
        )
    randevu_erisim_kontrolu(session, randevu, current_user)
    randevu.durum = "IPTAL"
    randevu.updated_at = datetime.now(timezone.utc)
    session.add(randevu)
    session.commit()
    session.refresh(randevu)
    return randevu


def getir(session: Session, current_user: Kullanici, randevu_id: int) -> Randevu:
    randevu = session.get(Randevu, randevu_id)
    if randevu is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Randevu bulunamadı"
        )
    randevu_erisim_kontrolu(session, randevu, current_user)
    return randevu


def musait_slotlar(
    session: Session, doktor_id: int, gun: date
) -> list[datetime]:
    """09:00–17:00 arası 15 dk slot; dolu olanlar hariç."""
    baslangic = datetime(gun.year, gun.month, gun.day, 9, 0, 0)
    bitis = datetime(gun.year, gun.month, gun.day, 17, 0, 0)
    dolu = {
        r.tarih_saat.replace(tzinfo=None) if r.tarih_saat.tzinfo else r.tarih_saat
        for r in session.exec(
            select(Randevu).where(
                Randevu.doktor_id == doktor_id,
                Randevu.durum != "IPTAL",
                Randevu.tarih_saat >= baslangic,
                Randevu.tarih_saat < bitis,
            )
        ).all()
    }
    slotlar: list[datetime] = []
    cur = baslangic
    while cur < bitis:
        if cur not in dolu and not _cakisma_var_mi(session, doktor_id, cur):
            slotlar.append(cur)
        cur += timedelta(minutes=SLOT_MINUTES)
    return slotlar
