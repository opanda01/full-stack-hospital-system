"""RBAC okuma API — yetki kaynağı kod matrisi (IZIN_MATRISI).

PUT ile dinamik izin düzenleme desteklenmez; matris kodda tutulur.
DB tabloları (roller/izinler) şema uyumu için kalır; canlı guard kullanmaz.

`sync_yonetim_rolu` (kullanici_roller) canlı auth'ta kullanılmaz; yalnızca
Personel.yonetim_gorevi metadata senkronu için opsiyonel yardımcıdır.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.enums import Rol
from app.core.permissions import (
    rol_izin_detaylari,
    rol_izin_kodlari,
    tum_izin_kodlari,
)
from app.core.security import require_role
from app.features.rbac.schemas import IzinRead, RolIzinDetay, RolRead

router = APIRouter()


@router.get("/roller", response_model=list[RolRead])
def list_roller(_user=Depends(require_role(Rol.ADMIN))):
    return [
        RolRead(
            id=i + 1,
            kod=rol.value,
            ad=rol.value.replace("_", " ").title(),
            aciklama=None,
            sistem_mi=True,
        )
        for i, rol in enumerate(Rol)
    ]


@router.get("/izinler", response_model=list[IzinRead])
def list_izinler(_user=Depends(require_role(Rol.ADMIN))):
    return [
        IzinRead(
            id=i + 1,
            kod=kod,
            ad=kod.replace(":", " ").replace("_", " "),
            kaynak=kod.split(":", 1)[0] if ":" in kod else kod,
        )
        for i, kod in enumerate(tum_izin_kodlari())
    ]


@router.get("/roller/{kod}/izinler", response_model=list[RolIzinDetay])
def get_rol_izinler(kod: str, _user=Depends(require_role(Rol.ADMIN))):
    try:
        rol = Rol(kod.upper())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=f"Rol bulunamadı: {kod}") from exc
    return [RolIzinDetay(**d) for d in rol_izin_detaylari(rol)]


@router.put("/roller/{kod}/izinler", include_in_schema=True)
def update_rol_izinler(kod: str, _user=Depends(require_role(Rol.ADMIN))):
    raise HTTPException(
        status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
        detail=(
            "İzin matrisi kod tabanlıdır (IZIN_MATRISI) ve runtime'da değiştirilemez. "
            f"Okuma: GET /rbac/roller/{kod}/izinler"
        ),
    )
