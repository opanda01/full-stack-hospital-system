from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import require_permission
from app.features.ilac_talep import service as ilac_service
from app.features.ilac_talep.schemas import (
    IlacTalepCreate,
    IlacTalepDurumPatch,
    IlacTalepRead,
    IlacTalepSatirRead,
    StokDurumRead,
    VerilenIlacRead,
)
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


@router.get("/", response_model=list[IlacTalepRead])
def list_talepler(
    hasta_id: int | None = None,
    yatis_id: int | None = None,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("ilac_talep:goruntule")),
):
    return ilac_service.list_talepler(
        session, hasta_id=hasta_id, yatis_id=yatis_id
    )


@router.get("/satirlar", response_model=list[IlacTalepSatirRead])
def list_satirlar(
    hasta_id: int | None = None,
    yatis_id: int | None = None,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("ilac_talep:goruntule")),
):
    return ilac_service.list_talepler_satir(
        session, hasta_id=hasta_id, yatis_id=yatis_id
    )


@router.get("/stok", response_model=StokDurumRead)
def get_stok(
    ilac_id: int | None = None,
    urun_kodu: str | None = None,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("eczane:goruntule")),
):
    return ilac_service.stok_durumu(session, ilac_id=ilac_id, urun_kodu=urun_kodu)


@router.get("/hasta/{hasta_id}/verilen", response_model=list[VerilenIlacRead])
def get_verilen(
    hasta_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("ilac_talep:goruntule")),
):
    return ilac_service.verilen_ilaclar(session, hasta_id)


@router.get("/{talep_id}", response_model=IlacTalepRead)
def get_talep(
    talep_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("ilac_talep:goruntule")),
):
    return ilac_service.get_talep(session, talep_id)


@router.post("/", response_model=IlacTalepRead, status_code=201)
def create_talep(
    body: IlacTalepCreate,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("ilac_talep:olustur")),
):
    return ilac_service.create_talep(session, body, current_user)


@router.patch("/{talep_id}/durum", response_model=IlacTalepRead)
def patch_durum(
    talep_id: int,
    body: IlacTalepDurumPatch,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("ilac_talep:durum_guncelle")),
):
    return ilac_service.patch_durum(session, talep_id, body)
