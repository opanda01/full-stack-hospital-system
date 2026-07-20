from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.lookups import doktor_getir
from app.core.permissions import Kapsam
from app.features.kullanicilar.models import Kullanici
from app.features.muayeneler.models import MuayeneKaydi
from app.features.muayeneler.schemas import MuayeneCreate
from app.features.randevular.models import Randevu


def create_muayene(
    session: Session, current_user: Kullanici, data: MuayeneCreate, kapsam: Kapsam
) -> MuayeneKaydi:
    randevu = session.get(Randevu, data.randevu_id)
    if randevu is None:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    if kapsam == Kapsam.KENDI_KAYDIM:
        doktor = doktor_getir(session, current_user.id)
        if randevu.doktor_id != doktor.id:
            raise HTTPException(
                status_code=403, detail="Sadece kendi randevunuza muayene kaydı açabilirsiniz"
            )
    existing = session.exec(
        select(MuayeneKaydi).where(MuayeneKaydi.randevu_id == data.randevu_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu randevu için muayene zaten var")
    kayit = MuayeneKaydi(**data.model_dump())
    session.add(kayit)
    randevu.durum = "TAMAMLANDI"
    randevu.updated_at = datetime.now(timezone.utc)
    session.add(randevu)
    session.commit()
    session.refresh(kayit)
    return kayit


def list_muayeneler(session: Session) -> list[MuayeneKaydi]:
    return list(session.exec(select(MuayeneKaydi)).all())
