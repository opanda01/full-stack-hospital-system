from sqlmodel import Session, select

from app.core.enums import (
    YONETIM_GOREVI_TO_ROL,
    YONETIM_ROL_KODLARI,
    YonetimGorevi,
)
from app.features.kullanicilar.models import Kullanici
from app.features.rbac.models import Izin, KullaniciRol, Rol, RolIzin


def list_roller(session: Session) -> list[Rol]:
    return list(session.exec(select(Rol).order_by(Rol.kod)).all())


def list_izinler(session: Session) -> list[Izin]:
    return list(session.exec(select(Izin).order_by(Izin.kaynak, Izin.kod)).all())


def get_rol_by_kod(session: Session, kod: str) -> Rol | None:
    return session.exec(select(Rol).where(Rol.kod == kod)).first()


def get_rol_izin_kodlari(session: Session, rol_kod: str) -> list[str]:
    rol = get_rol_by_kod(session, rol_kod)
    if rol is None:
        return []
    session.refresh(rol, attribute_names=["izinler"])
    return sorted(i.kod for i in rol.izinler)


def set_rol_izinleri(
    session: Session, rol_kod: str, izin_kodlari: list[str]
) -> list[str]:
    rol = get_rol_by_kod(session, rol_kod)
    if rol is None:
        raise ValueError(f"Rol bulunamadı: {rol_kod}")

    izinler = list(
        session.exec(select(Izin).where(Izin.kod.in_(izin_kodlari))).all()  # type: ignore[attr-defined]
    )
    found = {i.kod for i in izinler}
    missing = set(izin_kodlari) - found
    if missing:
        raise ValueError(f"Bilinmeyen izin kodları: {sorted(missing)}")

    existing = list(session.exec(select(RolIzin).where(RolIzin.rol_id == rol.id)).all())
    for link in existing:
        session.delete(link)
    session.flush()

    for izin in izinler:
        session.add(RolIzin(rol_id=rol.id, izin_id=izin.id))
    session.commit()
    session.refresh(rol)
    return get_rol_izin_kodlari(session, rol_kod)


def sync_yonetim_rolu(
    session: Session,
    kullanici_id: int,
    yonetim_gorevi: YonetimGorevi,
    *,
    commit: bool = True,
) -> None:
    """Personel.yonetim_gorevi değişince yönetim rollerini kullanici_roller ile senkronize et.

    Meslek / sistem rolleri (DOKTOR, HASTA, …) korunur.
    """
    kullanici = session.get(Kullanici, kullanici_id)
    if kullanici is None:
        raise ValueError(f"Kullanıcı bulunamadı: {kullanici_id}")

    session.refresh(kullanici, attribute_names=["roller"])
    mevcut_yonetim = [r for r in kullanici.roller if r.kod in YONETIM_ROL_KODLARI]

    for rol in mevcut_yonetim:
        link = session.exec(
            select(KullaniciRol).where(
                KullaniciRol.kullanici_id == kullanici_id,
                KullaniciRol.rol_id == rol.id,
            )
        ).first()
        if link:
            session.delete(link)

    hedef = YONETIM_GOREVI_TO_ROL.get(yonetim_gorevi)
    hedef_kod = hedef.value if hedef is not None else None
    if hedef_kod:
        hedef_rol = get_rol_by_kod(session, hedef_kod)
        if hedef_rol is None:
            raise ValueError(f"Yönetim rolü seed edilmemiş: {hedef_kod}")
        existing = session.exec(
            select(KullaniciRol).where(
                KullaniciRol.kullanici_id == kullanici_id,
                KullaniciRol.rol_id == hedef_rol.id,
            )
        ).first()
        if not existing:
            session.add(
                KullaniciRol(kullanici_id=kullanici_id, rol_id=hedef_rol.id)
            )

    if commit:
        session.commit()
    else:
        session.flush()


def set_kullanici_meslek_rolleri(
    session: Session,
    kullanici_id: int,
    rol_kodlari: list[str],
) -> list[str]:
    """Meslek/sistem rollerini ata. Yönetim rolleri bu endpoint ile değiştirilemez."""
    yasak = set(rol_kodlari) & YONETIM_ROL_KODLARI
    if yasak:
        raise ValueError(
            "Yönetim rolleri Personel.yonetim_gorevi üzerinden atanır: "
            + ", ".join(sorted(yasak))
        )

    kullanici = session.get(Kullanici, kullanici_id)
    if kullanici is None:
        raise ValueError(f"Kullanıcı bulunamadı: {kullanici_id}")

    session.refresh(kullanici, attribute_names=["roller"])
    yonetim_rolleri = [r for r in kullanici.roller if r.kod in YONETIM_ROL_KODLARI]

    # Mevcut meslek/sistem linklerini sil
    for rol in list(kullanici.roller):
        if rol.kod in YONETIM_ROL_KODLARI:
            continue
        link = session.exec(
            select(KullaniciRol).where(
                KullaniciRol.kullanici_id == kullanici_id,
                KullaniciRol.rol_id == rol.id,
            )
        ).first()
        if link:
            session.delete(link)
    session.flush()

    for kod in rol_kodlari:
        rol = get_rol_by_kod(session, kod)
        if rol is None:
            raise ValueError(f"Rol bulunamadı: {kod}")
        session.add(KullaniciRol(kullanici_id=kullanici_id, rol_id=rol.id))

    # Yönetim rollerini koru
    for rol in yonetim_rolleri:
        existing = session.exec(
            select(KullaniciRol).where(
                KullaniciRol.kullanici_id == kullanici_id,
                KullaniciRol.rol_id == rol.id,
            )
        ).first()
        if not existing:
            session.add(KullaniciRol(kullanici_id=kullanici_id, rol_id=rol.id))

    session.commit()
    session.refresh(kullanici, attribute_names=["roller"])
    return sorted(r.kod for r in kullanici.roller)
