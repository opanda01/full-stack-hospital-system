from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.lookups import doktor_getir, hasta_getir, personel_getir
from app.core.permissions import Kapsam
from app.core.scope import kullanici_kapsamli_filtre_uygula
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


def list_muayeneler(
    session: Session, current_user: Kullanici, kapsam: Kapsam
) -> list[MuayeneKaydi]:
    query = select(MuayeneKaydi).join(Randevu, MuayeneKaydi.randevu_id == Randevu.id)

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
