"""Hastane referans seed — departman + örnek doktor zinciri."""

from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.security import hash_password
from app.features.departmanlar.models import Departman
from app.features.doktorlar.models import Doktor
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel

DEPARTMANLAR = [
    ("Aile Hekimliği", "Dahili"),
    ("Kardiyoloji", "Dahili"),
    ("Nöroloji", "Dahili"),
    ("Dahiliye", "Dahili"),
    ("Çocuk Hastalıkları", "Dahili"),
    ("Genel Cerrahi", "Cerrahi"),
    ("Ortopedi ve Travmatoloji", "Cerrahi"),
    ("Kadın Hastalıkları ve Doğum", "Cerrahi"),
    ("Göz Hastalıkları", "Cerrahi"),
    ("Acil Servis", "Ozellikli"),
    ("Radyoloji", "Laboratuvar"),
]

ORNEK_DOKTORLAR = [
    ("Kardiyoloji", "Ufuk", "Öztürk", "doktor.kardiyoloji@hastane.example.com", "DIP-KARD-01"),
    ("Genel Cerrahi", "Ali", "Yarımkaya", "doktor.cerrahi@hastane.example.com", "DIP-CER-01"),
    ("Ortopedi ve Travmatoloji", "Ahmet", "Filiz", "doktor.ortopedi@hastane.example.com", "DIP-ORT-01"),
    ("Acil Servis", "Begüm", "Kartal", "doktor.acil@hastane.example.com", "DIP-ACL-01"),
]


def seed_hastane_referans(session: Session) -> None:
    deps: dict[str, Departman] = {}
    for ad, kategori in DEPARTMANLAR:
        dep = session.exec(select(Departman).where(Departman.ad == ad)).first()
        if not dep:
            dep = Departman(ad=ad, kategori=kategori)
            session.add(dep)
            session.flush()
        deps[ad] = dep

    sifre = hash_password("Test1234!")
    for i, (dep_ad, ad, soyad, email, diploma) in enumerate(ORNEK_DOKTORLAR, start=1):
        tc = f"2000000000{i}"
        kullanici = session.exec(
            select(Kullanici).where(
                (Kullanici.email == email) | (Kullanici.tc_kimlik_no == tc)
            )
        ).first()
        if not kullanici:
            kullanici = Kullanici(
                tc_kimlik_no=tc,
                ad=ad,
                soyad=soyad,
                email=email,
                sifre_hash=sifre,
                rol=Rol.DOKTOR,
                aktif_mi=True,
            )
            session.add(kullanici)
            session.flush()
        else:
            kullanici.email = email
            session.add(kullanici)
            session.flush()
        personel = session.exec(
            select(Personel).where(Personel.kullanici_id == kullanici.id)
        ).first()
        if not personel:
            personel = Personel(
                kullanici_id=kullanici.id,
                sicil_no=f"SIC-{diploma}",
                departman_id=deps[dep_ad].id,
                unvan="Uzman Doktor",
            )
            session.add(personel)
            session.flush()
        doktor = session.exec(
            select(Doktor).where(Doktor.personel_id == personel.id)
        ).first()
        if not doktor:
            session.add(
                Doktor(
                    personel_id=personel.id,
                    uzmanlik_alani=dep_ad,
                    diploma_no=diploma,
                    online_randevu_acik_mi=True,
                )
            )
    session.commit()
