from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.transfuzyon import service as tf_service
from app.features.transfuzyon.models import TransfuzyonKaydi
from app.features.transfuzyon.schemas import TransfuzyonCreate, TransfuzyonRead

router = APIRouter()


@router.get("/kayitlar", response_model=list[TransfuzyonRead])
def list_kayitlar(
    yatis_id: int | None = None,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("transfuzyon:goruntule")),
):
    q = select(TransfuzyonKaydi).order_by(TransfuzyonKaydi.id.desc()).limit(100)
    if yatis_id is not None:
        q = q.where(TransfuzyonKaydi.yatis_id == yatis_id)
    return [TransfuzyonRead.model_validate(r) for r in session.exec(q).all()]


@router.post("/kayitlar", response_model=TransfuzyonRead, status_code=201)
def create_kayit(
    body: TransfuzyonCreate,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("transfuzyon:olustur")),
):
    return tf_service.kayit_olustur(session, actor=current_user, body=body)
