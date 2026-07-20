from fastapi import APIRouter, Depends

from app.core.enums import Rol
from app.core.security import require_role
from app.features.rbac.schemas import IzinRead, RolIzinlerUpdate, RolRead

router = APIRouter()


@router.get("/roller", response_model=list[RolRead])
def list_roller(_user=Depends(require_role(Rol.ADMIN))):
    raise NotImplementedError("TODO: GET /rbac/roller")


@router.get("/izinler", response_model=list[IzinRead])
def list_izinler(_user=Depends(require_role(Rol.ADMIN))):
    raise NotImplementedError("TODO: GET /rbac/izinler")


@router.get("/roller/{kod}/izinler", response_model=list[str])
def get_rol_izinler(kod: str, _user=Depends(require_role(Rol.ADMIN))):
    raise NotImplementedError("TODO: GET /rbac/roller/{kod}/izinler")


@router.put("/roller/{kod}/izinler", response_model=list[str])
def update_rol_izinler(
    kod: str,
    body: RolIzinlerUpdate,
    _user=Depends(require_role(Rol.ADMIN)),
):
    raise NotImplementedError("TODO: PUT /rbac/roller/{kod}/izinler")
