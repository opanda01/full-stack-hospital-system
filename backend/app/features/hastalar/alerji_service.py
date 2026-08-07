from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.enums import OturumTipi, Rol
from app.core.lookups import hasta_getir
from app.core.permissions import Kapsam
from app.core.public_id import hasta_from_public_id
from app.core.scope import erisim_rolu
from app.features.hastalar import service as hasta_service
from app.features.hastalar.alerji_models import HastaAlerjisi
from app.features.kullanicilar.models import Kullanici
from app.features.muayeneler.schemas import HastaAlerjiCreate, HastaAlerjiRead


def _assert_hasta_erisim(
    session: Session,
    current_user: Kullanici,
    hasta_id: int,
    kapsam: Kapsam,
    *,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
) -> None:
    rol = erisim_rolu(current_user, oturum_tipi)
    if rol == Rol.ADMIN or kapsam == Kapsam.GLOBAL:
        return
    if rol == Rol.HASTA:
        kendi = hasta_getir(session, current_user.id)
        if hasta_id != kendi.id:
            raise HTTPException(status_code=403, detail="Hasta erişim yetkiniz yok")
        return
    if rol == Rol.DOKTOR:
        allowed = hasta_service.doktor_erisebilir_hasta_idler(session, current_user)
        if hasta_id not in allowed:
            raise HTTPException(status_code=403, detail="Hasta erişim yetkiniz yok")
        return
    if rol in (Rol.HEMSIRE, Rol.EBE):
        allowed = hasta_service.hemsire_erisebilir_hasta_idler(session, current_user)
        if hasta_id not in allowed:
            raise HTTPException(status_code=403, detail="Hasta erişim yetkiniz yok")
        return
    if rol in (Rol.BASHEKIM, Rol.MUDUR, Rol.IDARI_PERSONEL):
        return
    raise HTTPException(status_code=403, detail="Alerji işlem yetkiniz yok")


def list_alerjiler(
    session: Session,
    current_user: Kullanici,
    public_id: UUID,
    kapsam: Kapsam,
    *,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
) -> list[HastaAlerjiRead]:
    h = hasta_from_public_id(session, public_id)
    assert h.id is not None
    _assert_hasta_erisim(
        session, current_user, h.id, kapsam, oturum_tipi=oturum_tipi
    )
    rows = session.exec(
        select(HastaAlerjisi).where(
            HastaAlerjisi.hasta_id == h.id,
            HastaAlerjisi.silindi_mi == False,  # noqa: E712
        )
    ).all()
    return [
        HastaAlerjiRead(
            id=r.id,  # type: ignore[arg-type]
            hasta_id=r.hasta_id,
            allerjen_tipi=r.allerjen_tipi.value
            if hasattr(r.allerjen_tipi, "value")
            else str(r.allerjen_tipi),
            allerjen_kodu=r.allerjen_kodu,
            allerjen_adi=r.allerjen_adi,
            siddet=r.siddet.value if hasattr(r.siddet, "value") else str(r.siddet),
            notlar=r.notlar,
        )
        for r in rows
    ]


def create_alerji(
    session: Session,
    current_user: Kullanici,
    public_id: UUID,
    data: HastaAlerjiCreate,
    kapsam: Kapsam,
    *,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
) -> HastaAlerjiRead:
    h = hasta_from_public_id(session, public_id)
    assert h.id is not None
    _assert_hasta_erisim(
        session, current_user, h.id, kapsam, oturum_tipi=oturum_tipi
    )
    row = HastaAlerjisi(
        hasta_id=h.id,
        allerjen_tipi=data.allerjen_tipi,
        allerjen_kodu=data.allerjen_kodu,
        allerjen_adi=data.allerjen_adi,
        siddet=data.siddet,
        notlar=data.notlar,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return HastaAlerjiRead(
        id=row.id,  # type: ignore[arg-type]
        hasta_id=row.hasta_id,
        allerjen_tipi=row.allerjen_tipi.value,
        allerjen_kodu=row.allerjen_kodu,
        allerjen_adi=row.allerjen_adi,
        siddet=row.siddet.value,
        notlar=row.notlar,
    )


def soft_delete_alerji(
    session: Session,
    current_user: Kullanici,
    public_id: UUID,
    alerji_id: int,
    kapsam: Kapsam,
    *,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
) -> None:
    h = hasta_from_public_id(session, public_id)
    assert h.id is not None
    _assert_hasta_erisim(
        session, current_user, h.id, kapsam, oturum_tipi=oturum_tipi
    )
    row = session.get(HastaAlerjisi, alerji_id)
    if row is None or row.hasta_id != h.id or row.silindi_mi:
        raise HTTPException(status_code=404, detail="Alerji bulunamadı")
    row.silindi_mi = True
    row.updated_at = datetime.now(timezone.utc)
    session.add(row)
    session.commit()
