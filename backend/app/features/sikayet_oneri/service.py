from sqlmodel import Session, select

from app.features.kullanicilar.models import Kullanici
from app.features.sikayet_oneri.models import SikayetOneri
from app.features.sikayet_oneri.schemas import SikayetOneriCreate


def list_sikayetler(session: Session) -> list[SikayetOneri]:
    return list(
        session.exec(select(SikayetOneri).order_by(SikayetOneri.tarih.desc())).all()
    )


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
