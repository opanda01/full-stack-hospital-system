"""Demo kullanıcı seed — kod tabanlı Rol enum + IZIN_MATRISI.

Kaynak: docs/rbac-yetki-matrisi.md, app/core/permissions.py
Her rol için 1 demo kullanıcı; email varsa atlanır (idempotent).
"""

from sqlmodel import Session, select

from app.core.enums import ErisimDurumu, Rol
from app.core.security import hash_password
from app.core.tc_kimlik import gecerli_tc_kimlik_no, tc_ilk_dokuz_haneden
import app.core.models_registry  # noqa: F401
from app.features.kullanicilar.models import Kullanici
from app.features.personel.erisim_service import apply_erisim_durumu

DEMO_SIFRE = "Test1234!"
DEMO_HASTA_EMAIL = "hasta@hastane.example.com"
DEMO_HASTA_TC = "34917047162"
DEMO_HASTA_TELEFON = "05551234567"


def _demo_tc(raw: str, *, unique_key: str | None = None) -> str:
    if gecerli_tc_kimlik_no(raw):
        return raw
    if unique_key:
        nine = str(abs(hash(unique_key)) % 900_000_000 + 100_000_000)
        return tc_ilk_dokuz_haneden(nine)
    nine = raw[:9].zfill(9) if len(raw) >= 9 else raw.zfill(9)
    if nine[0] == "0":
        nine = "1" + nine[1:]
    return tc_ilk_dokuz_haneden(nine)


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
        "email": "radyolog@hastane.example.com",
        "ad": "Test",
        "soyad": "Radyolog",
        "rol": Rol.RADYOLOG,
        "tc": "10000000012",
        "kullanici_adi": "radyolog",
        "sicil_no": "R-001",
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
        "email": DEMO_HASTA_EMAIL,
        "ad": "Test",
        "soyad": "Hasta",
        "rol": Rol.HASTA,
        "tc": DEMO_HASTA_TC,
        "telefon": DEMO_HASTA_TELEFON,
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
    Rol.RADYOLOG,
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
    for raw in DEMO_KULLANICILAR:
        item = {**raw, "tc": _demo_tc(raw["tc"], unique_key=raw["email"])}
        kullanici = session.exec(
            select(Kullanici).where(Kullanici.email == item["email"])
        ).first()
        if kullanici is None:
            tc = item["tc"]
            if session.exec(
                select(Kullanici).where(Kullanici.tc_kimlik_no == tc)
            ).first():
                nine = str(abs(hash(item["email"] + ":tc")) % 900_000_000 + 100_000_000)
                tc = tc_ilk_dokuz_haneden(nine)
            kullanici = Kullanici(
                tc_kimlik_no=tc,
                ad=item["ad"],
                soyad=item["soyad"],
                email=item["email"],
                telefon=item.get("telefon"),
                kullanici_adi=item.get("kullanici_adi"),
                sifre_hash=sifre_hash,
                rol=item["rol"],
                sifre_degistirmeli_mi=False,
                kvkk_onaylandi_mi=True,
                aktif_mi=True,
            )
            apply_erisim_durumu(kullanici, ErisimDurumu.ONAYLANDI)
            session.add(kullanici)
            session.flush()
        else:
            kullanici.sifre_hash = sifre_hash
            kullanici.rol = item["rol"]
            kullanici.sifre_degistirmeli_mi = False
            kullanici.kvkk_onaylandi_mi = True
            kullanici.aktif_mi = True
            if item.get("kullanici_adi"):
                kullanici.kullanici_adi = item["kullanici_adi"]
            if item.get("telefon"):
                kullanici.telefon = item["telefon"]
            if item["email"] == DEMO_HASTA_EMAIL and kullanici.tc_kimlik_no != item["tc"]:
                kullanici.tc_kimlik_no = item["tc"]
            apply_erisim_durumu(kullanici, ErisimDurumu.ONAYLANDI)
            session.add(kullanici)
            session.flush()

        if item["rol"] == Rol.HASTA:
            hasta = session.exec(
                select(Hasta).where(Hasta.kullanici_id == kullanici.id)
            ).first()
            if not hasta:
                session.add(
                    Hasta(kullanici_id=kullanici.id, tc_kimlik_no=kullanici.tc_kimlik_no)
                )
            elif hasta.tc_kimlik_no != kullanici.tc_kimlik_no:
                hasta.tc_kimlik_no = kullanici.tc_kimlik_no
                session.add(hasta)

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
                    sicil_var.sicil_no = f"LEGACY-{target_sicil}"
                    session.add(sicil_var)
                    session.flush()
                personel = Personel(
                    kullanici_id=kullanici.id,
                    sicil_no=target_sicil,
                    departman_id=dep.id,
                    unvan=item["rol"].value,
                )
                session.add(personel)
                session.flush()
            elif item.get("sicil_no") and personel.sicil_no != item["sicil_no"]:
                conflict = session.exec(
                    select(Personel).where(
                        Personel.sicil_no == item["sicil_no"],
                        Personel.id != personel.id,
                    )
                ).first()
                if conflict:
                    conflict.sicil_no = f"LEGACY-{item['sicil_no']}"
                    session.add(conflict)
                    session.flush()
                personel.sicil_no = item["sicil_no"]
                session.add(personel)
            if item["rol"] in (Rol.DOKTOR, Rol.RADYOLOG):
                doktor = session.exec(
                    select(Doktor).where(Doktor.personel_id == personel.id)
                ).first()
                if not doktor:
                    alan = (
                        "Radyoloji"
                        if item["rol"] == Rol.RADYOLOG
                        else "Kardiyoloji"
                    )
                    session.add(
                        Doktor(
                            personel_id=personel.id,
                            uzmanlik_alani=alan,
                            diploma_no=f"DEMO-DIP-{item['tc'][-4:]}",
                            online_randevu_acik_mi=item["rol"] == Rol.DOKTOR,
                        )
                    )
    session.commit()


def seed_rbac(session: Session, *, demo_admin: bool = True) -> None:
    """Geriye uyum — demo kullanıcıları oluşturur."""
    seed_demo_kullanicilar(session)


if __name__ == "__main__":
    from app.core.db import engine

    with Session(engine) as session:
        seed_demo_kullanicilar(session)
    print(
        f"Demo RBAC seed tamamlandı (hasta OTP: TC {DEMO_HASTA_TC}, tel {DEMO_HASTA_TELEFON})."
    )
