"""Demo kullanıcı seed — kod tabanlı Rol enum + IZIN_MATRISI.

Kaynak: docs/rbac-yetki-matrisi.md, app/core/permissions.py
Her rol için 1 demo kullanıcı; email varsa atlanır (idempotent).
"""

from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.security import hash_password
import app.core.models_registry  # noqa: F401
from app.features.kullanicilar.models import Kullanici

DEMO_SIFRE = "Test1234!"

DEMO_KULLANICILAR: list[dict] = [
    {
        "email": "admin@hastane.example.com",
        "ad": "Sistem",
        "soyad": "Admin",
        "rol": Rol.ADMIN,
        "tc": "10000000001",
    },
    {
        "email": "bashekim@hastane.example.com",
        "ad": "Test",
        "soyad": "Başhekim",
        "rol": Rol.BASHEKIM,
        "tc": "10000000002",
    },
    {
        "email": "mudur@hastane.example.com",
        "ad": "Test",
        "soyad": "Müdür",
        "rol": Rol.MUDUR,
        "tc": "10000000008",
    },
    {
        "email": "doktor@hastane.example.com",
        "ad": "Test",
        "soyad": "Doktor",
        "rol": Rol.DOKTOR,
        "tc": "10000000003",
    },
    {
        "email": "hemsire@hastane.example.com",
        "ad": "Test",
        "soyad": "Hemşire",
        "rol": Rol.HEMSIRE,
        "tc": "10000000004",
    },
    {
        "email": "ebe@hastane.example.com",
        "ad": "Test",
        "soyad": "Ebe",
        "rol": Rol.EBE,
        "tc": "10000000009",
    },
    {
        "email": "laborant@hastane.example.com",
        "ad": "Test",
        "soyad": "Laborant",
        "rol": Rol.LABORANT,
        "tc": "10000000007",
    },
    {
        "email": "temizlik@hastane.example.com",
        "ad": "Test",
        "soyad": "Temizlik",
        "rol": Rol.TEMIZLIK_PERSONELI,
        "tc": "10000000005",
    },
    {
        "email": "guvenlik@hastane.example.com",
        "ad": "Test",
        "soyad": "Güvenlik",
        "rol": Rol.GUVENLIK,
        "tc": "10000000010",
    },
    {
        "email": "idari@hastane.example.com",
        "ad": "Test",
        "soyad": "İdari",
        "rol": Rol.IDARI_PERSONEL,
        "tc": "10000000011",
    },
    {
        "email": "hasta@hastane.example.com",
        "ad": "Test",
        "soyad": "Hasta",
        "rol": Rol.HASTA,
        "tc": "10000000006",
    },
]

_PERSONEL_ROLLER = {
    Rol.DOKTOR,
    Rol.HEMSIRE,
    Rol.EBE,
    Rol.TEMIZLIK_PERSONELI,
    Rol.BASHEKIM,
    Rol.LABORANT,
    Rol.MUDUR,
    Rol.GUVENLIK,
    Rol.IDARI_PERSONEL,
}


def seed_demo_kullanicilar(session: Session) -> None:
    from app.features.departmanlar.models import Departman
    from app.features.doktorlar.models import Doktor
    from app.features.hastalar.models import Hasta
    from app.features.personel.models import Personel

    sifre_hash = hash_password(DEMO_SIFRE)
    for item in DEMO_KULLANICILAR:
        existing = session.exec(
            select(Kullanici).where(Kullanici.email == item["email"])
        ).first()
        if existing:
            # Idempotent: email varsa atla (duplicate oluşturma)
            kullanici = existing
        else:
            # TC çakışması varsa da atla
            tc_existing = session.exec(
                select(Kullanici).where(Kullanici.tc_kimlik_no == item["tc"])
            ).first()
            if tc_existing:
                continue
            kullanici = Kullanici(
                tc_kimlik_no=item["tc"],
                ad=item["ad"],
                soyad=item["soyad"],
                email=item["email"],
                telefon=None,
                sifre_hash=sifre_hash,
                rol=item["rol"],
                aktif_mi=True,
            )
            session.add(kullanici)
            session.flush()

        if item["rol"] == Rol.HASTA:
            hasta = session.exec(
                select(Hasta).where(Hasta.kullanici_id == kullanici.id)
            ).first()
            if not hasta:
                session.add(
                    Hasta(kullanici_id=kullanici.id, tc_kimlik_no=item["tc"])
                )

        if item["rol"] in _PERSONEL_ROLLER:
            dep = session.exec(
                select(Departman).where(Departman.ad == "Kardiyoloji")
            ).first()
            if not dep:
                dep = Departman(ad="Kardiyoloji", kategori="Dahili")
                session.add(dep)
                session.flush()
            personel = session.exec(
                select(Personel).where(Personel.kullanici_id == kullanici.id)
            ).first()
            if not personel:
                personel = Personel(
                    kullanici_id=kullanici.id,
                    sicil_no=f"DEMO-{item['rol']}-{item['tc'][-4:]}",
                    departman_id=dep.id,
                    unvan=item["rol"],
                )
                session.add(personel)
                session.flush()
            if item["rol"] == Rol.DOKTOR:
                doktor = session.exec(
                    select(Doktor).where(Doktor.personel_id == personel.id)
                ).first()
                if not doktor:
                    session.add(
                        Doktor(
                            personel_id=personel.id,
                            uzmanlik_alani="Kardiyoloji",
                            diploma_no=f"DEMO-DIP-{item['tc'][-4:]}",
                            online_randevu_acik_mi=True,
                        )
                    )
    session.commit()


def seed_rbac(session: Session, *, demo_admin: bool = True) -> None:
    """Geriye uyum — demo kullanıcıları oluşturur."""
    seed_demo_kullanicilar(session)
