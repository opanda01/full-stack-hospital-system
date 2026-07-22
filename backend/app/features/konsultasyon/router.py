from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.enums import KonsultasyonDurumu
from app.core.lookups import doktor_getir
from app.core.permissions import Kapsam
from app.core.security import require_permission
from app.features.hastalar import service as hasta_service
from app.features.konsultasyon.models import KonsultasyonIstegi
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


class KonsultasyonCreate(BaseModel):
    hedef_doktor_id: int
    hasta_id: int
    notlar: str | None = Field(default=None, max_length=2000)


class KonsultasyonYanit(BaseModel):
    kabul: bool
    yanit_notu: str | None = Field(default=None, max_length=2000)


class KonsultasyonRead(BaseModel):
    id: int
    isteyen_doktor_id: int
    hedef_doktor_id: int
    hasta_id: int
    notlar: str | None
    durum: str
    yanit_notu: str | None
    yanit_tarihi: datetime | None

    model_config = {"from_attributes": True}


def _to_read(row: KonsultasyonIstegi) -> KonsultasyonRead:
    return KonsultasyonRead(
        id=row.id,
        isteyen_doktor_id=row.isteyen_doktor_id,
        hedef_doktor_id=row.hedef_doktor_id,
        hasta_id=row.hasta_id,
        notlar=row.notlar,
        durum=row.durum.value if hasattr(row.durum, "value") else str(row.durum),
        yanit_notu=row.yanit_notu,
        yanit_tarihi=row.yanit_tarihi,
    )


def _ilgili_mi(doktor_id: int, row: KonsultasyonIstegi) -> bool:
    return row.isteyen_doktor_id == doktor_id or row.hedef_doktor_id == doktor_id


@router.get("/", response_model=list[KonsultasyonRead])
def list_konsultasyonlar(
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("konsultasyon:goruntule")),
):
    q = select(KonsultasyonIstegi).order_by(KonsultasyonIstegi.id.desc())
    kapsam = request.state.kapsam
    if kapsam == Kapsam.KENDI_KAYDIM:
        doktor = doktor_getir(session, current_user.id)
        q = q.where(
            (KonsultasyonIstegi.isteyen_doktor_id == doktor.id)
            | (KonsultasyonIstegi.hedef_doktor_id == doktor.id)
        )
    elif kapsam != Kapsam.GLOBAL:
        raise HTTPException(status_code=403, detail="Konsültasyon listesi için yetkiniz yok")
    return [_to_read(r) for r in session.exec(q).all()]


@router.post("/", response_model=KonsultasyonRead, status_code=status.HTTP_201_CREATED)
def create_konsultasyon(
    body: KonsultasyonCreate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("konsultasyon:olustur")),
):
    doktor = doktor_getir(session, current_user.id)
    if body.hedef_doktor_id == doktor.id:
        raise HTTPException(status_code=400, detail="Kendinize konsültasyon isteği gönderemezsiniz")
    if request.state.kapsam == Kapsam.KENDI_KAYDIM:
        if not hasta_service.doktor_hasta_erisim_var_mi(
            session, current_user, body.hasta_id
        ):
            raise HTTPException(
                status_code=403, detail="Bu hasta için konsültasyon isteyemezsiniz"
            )
    row = KonsultasyonIstegi(
        isteyen_doktor_id=doktor.id,
        hedef_doktor_id=body.hedef_doktor_id,
        hasta_id=body.hasta_id,
        notlar=body.notlar,
        durum=KonsultasyonDurumu.BEKLEMEDE,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return _to_read(row)


@router.post("/{kayit_id}/yanitla", response_model=KonsultasyonRead)
def yanitla_konsultasyon(
    kayit_id: int,
    body: KonsultasyonYanit,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("konsultasyon:yanitla")),
):
    row = session.get(KonsultasyonIstegi, kayit_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Konsültasyon bulunamadı")
    doktor = doktor_getir(session, current_user.id)
    if request.state.kapsam == Kapsam.KENDI_KAYDIM and row.hedef_doktor_id != doktor.id:
        raise HTTPException(status_code=403, detail="Yalnızca hedef doktor yanıtlayabilir")
    if row.durum != KonsultasyonDurumu.BEKLEMEDE:
        raise HTTPException(status_code=400, detail="Bu istek zaten yanıtlanmış")
    row.durum = KonsultasyonDurumu.KABUL if body.kabul else KonsultasyonDurumu.RED
    row.yanit_notu = body.yanit_notu
    row.yanit_tarihi = datetime.utcnow()
    session.add(row)
    session.commit()
    session.refresh(row)
    return _to_read(row)
