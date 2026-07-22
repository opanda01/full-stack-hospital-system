from datetime import datetime

from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.config import get_settings
from app.core.db import get_session
from app.core.request_ip import istemci_ip_al
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.yetki_devri.models import YetkiDevriKaydi

router = APIRouter()
settings = get_settings()


class YetkiDevriCreate(BaseModel):
    alan_personel_id: int
    baslangic: datetime
    bitis: datetime
    izin_kodlari: str | None = None
    duyuru_metni: str = Field(min_length=5, max_length=4000)


class YetkiDevriRead(BaseModel):
    id: int
    veren_id: int
    alan_personel_id: int
    baslangic: datetime
    bitis: datetime
    izin_kodlari: str | None
    duyuru_metni: str
    aktif_mi: bool

    model_config = {"from_attributes": True}


class SistemGozetim(BaseModel):
    bildirim_backend: str
    cors_origins: str
    login_rate_limit_per_minute: int
    audit_retention_days: int
    otp_ttl_seconds: int
    access_token_expire_minutes: int
    health: str = "ok"


@router.get("/", response_model=list[YetkiDevriRead])
def list_yetki_devri(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("yetki:devret")),
):
    return list(
        session.exec(select(YetkiDevriKaydi).order_by(YetkiDevriKaydi.id.desc())).all()
    )


@router.post("/", response_model=YetkiDevriRead, status_code=status.HTTP_201_CREATED)
def create_yetki_devri(
    body: YetkiDevriCreate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("yetki:devret")),
):
    row = YetkiDevriKaydi(**body.model_dump(), veren_id=current_user.id)
    session.add(row)
    denetim_kaydi_yaz(
        session,
        aksiyon="YETKI_DEVRI",
        actor_id=current_user.id,
        kaynak="yetki_devri",
        kaynak_id=body.alan_personel_id,
        ip_adresi=istemci_ip_al(request),
        detay={"duyuru": body.duyuru_metni[:200]},
        commit=False,
    )
    session.commit()
    session.refresh(row)
    return row


@router.get("/sistem-gozetim", response_model=SistemGozetim)
def sistem_gozetim(
    _user=Depends(require_permission("sistem:gozetim")),
):
    return SistemGozetim(
        bildirim_backend=settings.BILDIRIM_BACKEND,
        cors_origins=settings.CORS_ORIGINS,
        login_rate_limit_per_minute=settings.LOGIN_RATE_LIMIT_PER_MINUTE,
        audit_retention_days=settings.AUDIT_RETENTION_DAYS,
        otp_ttl_seconds=settings.OTP_TTL_SECONDS,
        access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        health="ok",
    )
