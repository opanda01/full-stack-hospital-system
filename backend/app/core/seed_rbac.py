"""Demo kullanıcı seed — kod tabanlı Rol enum + IZIN_MATRISI.

Kaynak: docs/rbac-yetki-matrisi.md, app/core/permissions.py
Her rol için 1 demo kullanıcı; email varsa atlanır (idempotent).
"""

from sqlmodel import Session, select

from app.core.enums import ErisimDurumu, Rol
from app.core.security import hash_password
import app.core.models_registry  # noqa: F401
from app.features.kullanicilar.models import Kullanici
from app.features.personel.erisim_service import apply_erisim_durumu

DEMO_SIFRE = "Test1234!"

DEMO_KULLANICILAR: list[dict] = [
    {
        "email": "admin@hastane.example.com",
        "ad": "Sistem",
        "soyad": "Admin",
        "rol": Rol.ADMIN,
        "tc": "10000000001",
        "kullanici_adi": "admin",
        "sicil_no": "ADM-001",
    },
    {
        "email": "bashekim@hastane.example.com",
        "ad": "Test",
        "soyad": "Başhekim",
        "rol": Rol.BASHEKIM,
        "tc": "10000000002",
        "kullanici_adi": "bashekim",
        "sicil_no": "BH-001",
    },
    {
        "email": "mudur@hastane.example.com",
        "ad": "Test",
        "soyad": "Müdür",
        "rol": Rol.MUDUR,
        "tc": "10000000008",
        "kullanici_adi": "mudur",
        "sicil_no": "M-001",
    },
    {
        "email": "doktor@hastane.example.com",
        "ad": "Test",
        "soyad": "Doktor",
        "rol": Rol.DOKTOR,
        "tc": "10000000003",
        "kullanici_adi": "doktor",
        "sicil_no": "D-001",
    },
    {
        "email": "hemsire@hastane.example.com",
        "ad": "Test",
        "soyad": "Hemşire",
        "rol": Rol.HEMSIRE,
        "tc": "10000000004",
        "kullanici_adi": "hemsire",
        "sicil_no": "H-001",
    },
    {
        "email": "ebe@hastane.example.com",
        "ad": "Test",
        "soyad": "Ebe",
        "rol": Rol.EBE,
        "tc": "10000000009",
        "kullanici_adi": "ebe",
        "sicil_no": "E-001",
    },
    {
        "email": "laborant@hastane.example.com",
        "ad": "Test",
        "soyad": "Laborant",
        "rol": Rol.LABORANT,
        "tc": "10000000007",
        "kullanici_adi": "laborant",
        "sicil_no": "L-001",
    },
    {
        "email": "temizlik@hastane.example.com",
        "ad": "Test",
        "soyad": "Temizlik",
        "rol": Rol.TEMIZLIK_PERSONELI,
        "tc": "10000000005",
        "kullanici_adi": "temizlik",
        "sicil_no": "T-001",
    },
    {
        "email": "guvenlik@hastane.example.com",
        "ad": "Test",
        "soyad": "Güvenlik",
        "rol": Rol.GUVENLIK,
        "tc": "10000000010",
        "kullanici_adi": "guvenlik",
        "sicil_no": "G-001",
    },
    {
        "email": "idari@hastane.example.com",
        "ad": "Test",
        "soyad": "İdari",
        "rol": Rol.IDARI_PERSONEL,
        "tc": "10000000011",
        "kullanici_adi": "idari",
        "sicil_no": "I-001",
    },
    {
        "email": "hasta@hastane.example.com",
        "ad": "Test",
        "soyad": "Hasta",
        "rol": Rol.HASTA,
        "tc": "10000000006",
        "telefon": "05551234567",
    },
]

_PERSONEL_ROLLER = {
    Rol.ADMIN,
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
            kullanici = existing
            # Eksik alanları tamamla (idempotent iyileştirme)
            if item.get("kullanici_adi") and not kullanici.kullanici_adi:
                kullanici.kullanici_adi = item["kullanici_adi"]
                session.add(kullanici)
            if item.get("telefon") and not kullanici.telefon:
                kullanici.telefon = item["telefon"]
                session.add(kullanici)
        else:
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
                telefon=item.get("telefon"),
                kullanici_adi=item.get("kullanici_adi"),
                sifre_hash=sifre_hash,
                rol=item["rol"],
                sifre_degistirmeli_mi=False,
                kvkk_onaylandi_mi=True,
            )
            apply_erisim_durumu(kullanici, ErisimDurumu.ONAYLANDI)
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
            target_sicil = item.get("sicil_no") or (
                f"DEMO-{item['rol'].value}-{item['tc'][-4:]}"
            )
            if not personel:
                sicil_var = session.exec(
                    select(Personel).where(Personel.sicil_no == target_sicil)
                ).first()
                if sicil_var and sicil_var.kullanici_id != kullanici.id:
                    target_sicil = f"DEMO-{item['rol'].value}-{item['tc'][-4:]}"
                personel = Personel(
                    kullanici_id=kullanici.id,
                    sicil_no=target_sicil,
                    departman_id=dep.id,
                    unvan=item["rol"].value,
                )
                session.add(personel)
                session.flush()
            elif item.get("sicil_no") and personel.sicil_no != item["sicil_no"]:
                # Eski DEMO-Rol.* sicillerini hedefe güncelle
                conflict = session.exec(
                    select(Personel).where(
                        Personel.sicil_no == item["sicil_no"],
                        Personel.id != personel.id,
                    )
                ).first()
                if not conflict:
                    personel.sicil_no = item["sicil_no"]
                    session.add(personel)
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
