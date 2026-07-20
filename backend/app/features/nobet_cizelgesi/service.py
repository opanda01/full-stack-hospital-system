from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.lookups import personel_getir
from app.core.permissions import Kapsam
from app.core.scope import kullanici_kapsamli_filtre_uygula
from app.features.kullanicilar.models import Kullanici
from app.features.nobet_cizelgesi.models import NobetCizelgesi
from app.features.nobet_cizelgesi.schemas import NobetCreate


def list_nobetler(
    session: Session, current_user: Kullanici, kapsam: Kapsam
) -> list[NobetCizelgesi]:
    query = select(NobetCizelgesi)

    def kendi(q):
        personel = personel_getir(session, current_user.id)
        return q.where(NobetCizelgesi.personel_id == personel.id)

    return list(
        session.exec(
            kullanici_kapsamli_filtre_uygula(query, kapsam, kendi_kaydim_filtresi=kendi)
        ).all()
    )


def create_nobet(session: Session, data: NobetCreate) -> NobetCizelgesi:
    n = NobetCizelgesi(**data.model_dump())
    session.add(n)
    session.commit()
    session.refresh(n)
    return n
