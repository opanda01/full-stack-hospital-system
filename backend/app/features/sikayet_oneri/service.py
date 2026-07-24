from sqlmodel import Session, select

from app.core.pagination import Page, make_page, paginate
from app.features.kullanicilar.models import Kullanici
from app.features.sikayet_oneri.models import SikayetOneri
from app.features.sikayet_oneri.schemas import SikayetOneriCreate


def list_sikayetler(
    session: Session,
    *,
    page: int = 1,
    page_size: int = 50,
) -> Page[SikayetOneri]:
    q = select(SikayetOneri).order_by(
        SikayetOneri.tarih.desc(), SikayetOneri.id.desc()
    )
    rows, total = paginate(session, q, page=page, page_size=page_size)
    return make_page(rows, total=total, page=page, page_size=page_size)


def create_sikayet(
    session: Session, current_user: Kullanici, data: SikayetOneriCreate
) -> SikayetOneri:
    kayit = SikayetOneri(
        gonderen_kullanici_id=current_user.id,
        tur=data.tur,
        icerik=data.icerik,
        durum="ACIK",
    )
    session.add(kayit)
    session.commit()
    session.refresh(kayit)
    return kayit
