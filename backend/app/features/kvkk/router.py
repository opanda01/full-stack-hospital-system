from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.enums import KvkkMetinTur
from app.core.security import get_current_user
from app.features.kvkk.models import KvkkMetni
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


class KvkkMetinRead(BaseModel):
    id: int
    tur: str
    versiyon: str
    baslik: str
    govde: str

    model_config = {"from_attributes": True}


@router.get("/aktif", response_model=list[KvkkMetinRead])
def aktif_metinler(
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(get_current_user),
):
    rows = session.exec(
        select(KvkkMetni).where(KvkkMetni.aktif_mi == True)  # noqa: E712
    ).all()
    return [
        KvkkMetinRead(
            id=r.id,  # type: ignore[arg-type]
            tur=r.tur.value if hasattr(r.tur, "value") else str(r.tur),
            versiyon=r.versiyon,
            baslik=r.baslik,
            govde=r.govde,
        )
        for r in rows
    ]


def aktif_metin(session: Session, tur: KvkkMetinTur) -> KvkkMetni | None:
    return session.exec(
        select(KvkkMetni)
        .where(KvkkMetni.tur == tur, KvkkMetni.aktif_mi == True)  # noqa: E712
        .order_by(KvkkMetni.id.desc())
    ).first()
