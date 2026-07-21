"""Hastane referans seed — birim + departman + örnek doktor.

Kaynak branşlar: Çanakkale Mehmet Akif Ersoy Devlet Hastanesi
(https://canakkaledh.saglik.gov.tr / branş listeleri)
"""

from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.security import hash_password
from app.features.departmanlar.models import Birim, Departman
from app.features.doktorlar.models import Doktor
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel

# Üst birimler (organizasyon)
BIRIMLER: list[tuple[str, str, int]] = [
    ("Dahili Birimler", "DAHILI", 10),
    ("Cerrahi Birimler", "CERRAHI", 20),
    ("Kadın Doğum ve Çocuk", "KADIN_COCUK", 30),
    ("Acil ve Yoğun Bakım", "ACIL_YB", 40),
    ("Tanı ve Laboratuvar", "TANI", 50),
    ("Özellikli / Destek Birimler", "DESTEK", 60),
]

# (departman_adı, birim_kodu)
DEPARTMANLAR: list[tuple[str, str]] = [
    # Dahili
    ("Aile Hekimliği", "DAHILI"),
    ("İç Hastalıkları", "DAHILI"),
    ("Kardiyoloji", "DAHILI"),
    ("Nöroloji", "DAHILI"),
    ("Göğüs Hastalıkları", "DAHILI"),
    ("Enfeksiyon Hastalıkları", "DAHILI"),
    ("Gastroenteroloji", "DAHILI"),
    ("Nefroloji", "DAHILI"),
    ("Endokrinoloji", "DAHILI"),
    ("Romatoloji", "DAHILI"),
    ("Tıbbi Onkoloji", "DAHILI"),
    ("Hematoloji", "DAHILI"),
    ("Deri ve Zührevi Hastalıkları", "DAHILI"),
    ("Ruh Sağlığı ve Hastalıkları", "DAHILI"),
    ("Fiziksel Tıp ve Rehabilitasyon", "DAHILI"),
    # Cerrahi
    ("Genel Cerrahi", "CERRAHI"),
    ("Ortopedi ve Travmatoloji", "CERRAHI"),
    ("Üroloji", "CERRAHI"),
    ("Göz Hastalıkları", "CERRAHI"),
    ("Kulak Burun Boğaz", "CERRAHI"),
    ("Beyin ve Sinir Cerrahisi", "CERRAHI"),
    ("Kalp ve Damar Cerrahisi", "CERRAHI"),
    ("Göğüs Cerrahisi", "CERRAHI"),
    ("Plastik Rekonstrüktif ve Estetik Cerrahi", "CERRAHI"),
    ("Anesteziyoloji ve Reanimasyon", "CERRAHI"),
    # Kadın-çocuk
    ("Kadın Hastalıkları ve Doğum", "KADIN_COCUK"),
    ("Çocuk Sağlığı ve Hastalıkları", "KADIN_COCUK"),
    ("Çocuk Cerrahisi", "KADIN_COCUK"),
    ("Çocuk ve Ergen Ruh Sağlığı", "KADIN_COCUK"),
    ("Yenidoğan", "KADIN_COCUK"),
    # Acil / YB
    ("Acil Servis", "ACIL_YB"),
    ("Genel Yoğun Bakım", "ACIL_YB"),
    ("Koroner Yoğun Bakım", "ACIL_YB"),
    ("Çocuk Yoğun Bakım", "ACIL_YB"),
    ("Yenidoğan Yoğun Bakım", "ACIL_YB"),
    # Tanı
    ("Radyoloji", "TANI"),
    ("Nükleer Tıp", "TANI"),
    ("Radyasyon Onkolojisi", "TANI"),
    ("Tıbbi Biyokimya", "TANI"),
    ("Tıbbi Mikrobiyoloji", "TANI"),
    ("Tıbbi Patoloji", "TANI"),
    # Destek
    ("Getat", "DESTEK"),
    ("Sağlık Turizmi Birimi", "DESTEK"),
    ("Anjiyo Birimi", "DESTEK"),
]

# Eski seed adları → yeni ad (mevcut satırları güncellemek için)
ESKI_AD_MAP = {
    "Dahiliye": "İç Hastalıkları",
    "Çocuk Hastalıkları": "Çocuk Sağlığı ve Hastalıkları",
}

ORNEK_DOKTORLAR = [
    ("Kardiyoloji", "Ufuk", "Öztürk", "doktor.kardiyoloji@hastane.example.com", "DIP-KARD-01"),
    ("Genel Cerrahi", "Ali", "Yarımkaya", "doktor.cerrahi@hastane.example.com", "DIP-CER-01"),
    ("Ortopedi ve Travmatoloji", "Ahmet", "Filiz", "doktor.ortopedi@hastane.example.com", "DIP-ORT-01"),
    ("Acil Servis", "Begüm", "Kartal", "doktor.acil@hastane.example.com", "DIP-ACL-01"),
]


def seed_hastane_referans(session: Session) -> None:
    birimler: dict[str, Birim] = {}
    for ad, kod, sira in BIRIMLER:
        birim = session.exec(select(Birim).where(Birim.kod == kod)).first()
        if not birim:
            birim = session.exec(select(Birim).where(Birim.ad == ad)).first()
        if not birim:
            birim = Birim(ad=ad, kod=kod, sira=sira)
            session.add(birim)
            session.flush()
        else:
            birim.ad = ad
            birim.kod = kod
            birim.sira = sira
            session.add(birim)
            session.flush()
        birimler[kod] = birim

    # Eski adları yeni ada taşı
    for eski, yeni in ESKI_AD_MAP.items():
        row = session.exec(select(Departman).where(Departman.ad == eski)).first()
        if row and not session.exec(select(Departman).where(Departman.ad == yeni)).first():
            row.ad = yeni
            session.add(row)
            session.flush()

    deps: dict[str, Departman] = {}
    for ad, birim_kod in DEPARTMANLAR:
        birim = birimler[birim_kod]
        dep = session.exec(select(Departman).where(Departman.ad == ad)).first()
        if not dep:
            dep = Departman(
                ad=ad,
                kategori=birim.ad,
                birim_id=birim.id,
            )
            session.add(dep)
            session.flush()
        else:
            dep.birim_id = birim.id
            dep.kategori = birim.ad
            session.add(dep)
            session.flush()
        deps[ad] = dep

    # Eski kategori eşlemesi (birim_id yoksa)
    for dep in session.exec(select(Departman).where(Departman.birim_id.is_(None))).all():
        if dep.kategori:
            for kod, birim in birimler.items():
                if birim.ad == dep.kategori or kod.lower() in (dep.kategori or "").lower():
                    dep.birim_id = birim.id
                    session.add(dep)
                    break
            else:
                # Dahili / Cerrahi / Laboratuvar / Ozellikli eski etiketler
                mapping = {
                    "Dahili": "DAHILI",
                    "Cerrahi": "CERRAHI",
                    "Laboratuvar": "TANI",
                    "Ozellikli": "ACIL_YB",
                    "Özellikli": "ACIL_YB",
                }
                kod = mapping.get(dep.kategori)
                if kod and kod in birimler:
                    dep.birim_id = birimler[kod].id
                    dep.kategori = birimler[kod].ad
                    session.add(dep)

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
        else:
            personel.departman_id = deps[dep_ad].id
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
