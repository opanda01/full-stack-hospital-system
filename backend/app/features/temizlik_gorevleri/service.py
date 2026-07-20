from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.lookups import personel_getir
from app.core.permissions import Kapsam
from app.core.scope import kullanici_kapsamli_filtre_uygula
from app.features.kullanicilar.models import Kullanici
from app.features.temizlik_gorevleri.models import TemizlikGorevi
from app.features.temizlik_gorevleri.schemas import (
    TemizlikGoreviCreate,
    TemizlikGoreviUpdate,
)


def listele(
    session: Session, current_user: Kullanici, kapsam: Kapsam
) -> list[TemizlikGorevi]:
    query = select(TemizlikGorevi)

    def kendi(q):
        personel = personel_getir(session, current_user.id)
        return q.where(TemizlikGorevi.personel_id == personel.id)

    return list(
        session.exec(
            kullanici_kapsamli_filtre_uygula(
                query, kapsam, kendi_kaydim_filtresi=kendi
            )
        ).all()
    )


def ata(
    session: Session, current_user: Kullanici, veri: TemizlikGoreviCreate
) -> TemizlikGorevi:
    gorev = TemizlikGorevi(
        personel_id=veri.personel_id,
        oda_bolum=veri.oda_bolum,
        gorev_tarihi=veri.gorev_tarihi,
        durum="ATANDI",
    )
    session.add(gorev)
    session.commit()
    session.refresh(gorev)
    return gorev


def guncelle(
    session: Session,
    current_user: Kullanici,
    gorev_id: int,
    veri: TemizlikGoreviUpdate,
) -> TemizlikGorevi:
    gorev = session.get(TemizlikGorevi, gorev_id)
    if gorev is None:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")

    if current_user.rol != Rol.ADMIN:
        personel = personel_getir(session, current_user.id)
        if gorev.personel_id != personel.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bu temizlik görevini güncelleyemezsiniz.",
            )

    gorev.durum = veri.durum
    gorev.updated_at = datetime.now(timezone.utc)
    session.add(gorev)
    session.commit()
    session.refresh(gorev)
    return gorev
