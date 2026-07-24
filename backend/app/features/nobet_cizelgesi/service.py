from sqlmodel import Session, select

from app.core.lookups import personel_getir
from app.core.pagination import Page, make_page, paginate
from app.core.permissions import Kapsam
from app.core.scope import kullanici_kapsamli_filtre_uygula
from app.features.kullanicilar.models import Kullanici
from app.features.nobet_cizelgesi.models import NobetCizelgesi
from app.features.nobet_cizelgesi.schemas import NobetCreate


def list_nobetler(
    session: Session,
    current_user: Kullanici,
    kapsam: Kapsam,
    *,
    page: int = 1,
    page_size: int = 50,
) -> Page[NobetCizelgesi]:
    query = select(NobetCizelgesi)

    def kendi(q):
        personel = personel_getir(session, current_user.id)
        return q.where(NobetCizelgesi.personel_id == personel.id)

    query = kullanici_kapsamli_filtre_uygula(
        query, kapsam, kendi_kaydim_filtresi=kendi
    )
    query = query.order_by(NobetCizelgesi.tarih.desc(), NobetCizelgesi.id.desc())
    rows, total = paginate(session, query, page=page, page_size=page_size)
    return make_page(rows, total=total, page=page, page_size=page_size)


def create_nobet(session: Session, data: NobetCreate) -> NobetCizelgesi:
    n = NobetCizelgesi(**data.model_dump())
    session.add(n)
    session.commit()
    session.refresh(n)
    return n
