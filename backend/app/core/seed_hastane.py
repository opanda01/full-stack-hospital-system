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

# Bilinen örnek doktorlar (ilgili poliklinikte 1. sıra olarak korunur)
ORNEK_DOKTORLAR = [
    ("Kardiyoloji", "Ufuk", "Öztürk", "doktor.kardiyoloji@hastane.example.com", "DIP-KARD-01"),
    ("Genel Cerrahi", "Ali", "Yarımkaya", "doktor.cerrahi@hastane.example.com", "DIP-CER-01"),
    ("Ortopedi ve Travmatoloji", "Ahmet", "Filiz", "doktor.ortopedi@hastane.example.com", "DIP-ORT-01"),
    ("Acil Servis", "Begüm", "Kartal", "doktor.acil@hastane.example.com", "DIP-ACL-01"),
]

# Hasta randevu ekranı için her poliklinikte en az bu kadar doktor
DOKTOR_SAYISI_POLIKLINIK = 3

_ADLAR = [
    "Ahmet", "Mehmet", "Ayşe", "Fatma", "Mustafa", "Emine", "Ali", "Zeynep",
    "Hüseyin", "Elif", "Hasan", "Merve", "İbrahim", "Selin", "Yusuf", "Deniz",
    "Ömer", "Ceren", "Can", "Burcu", "Emre", "Gül", "Murat", "Pınar",
    "Serkan", "Esra", "Onur", "Melis", "Kerem", "İrem",
]
_SOYADLAR = [
    "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Yıldırım", "Öztürk",
    "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara",
    "Koç", "Kurt", "Özkan", "Şimşek", "Erdoğan", "Güneş", "Aksoy", "Polat",
    "Tekin", "Karaca", "Bulut", "Acar", "Keskin", "Avcı",
]


def _slug(ad: str) -> str:
    tr = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")
    s = ad.translate(tr).lower()
    return "".join(ch if ch.isalnum() else "-" for ch in s).strip("-")


def _ensure_doktor(
    session: Session,
    *,
    dep: Departman,
    ad: str,
    soyad: str,
    email: str,
    diploma: str,
    tc: str,
    sifre: str,
) -> None:
    kullanici = session.exec(select(Kullanici).where(Kullanici.email == email)).first()
    if not kullanici:
        kullanici = session.exec(
            select(Kullanici).where(Kullanici.tc_kimlik_no == tc)
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
        kullanici.ad = ad
        kullanici.soyad = soyad
        kullanici.rol = Rol.DOKTOR
        kullanici.aktif_mi = True
        session.add(kullanici)
        session.flush()

    personel = session.exec(
        select(Personel).where(Personel.kullanici_id == kullanici.id)
    ).first()
    if not personel:
        personel = Personel(
            kullanici_id=kullanici.id,
            sicil_no=f"SIC-{diploma}",
            departman_id=dep.id,
            unvan="Uzman Doktor",
        )
        session.add(personel)
        session.flush()
    else:
        personel.departman_id = dep.id
        personel.sicil_no = f"SIC-{diploma}"
        personel.unvan = "Uzman Doktor"
        session.add(personel)
        session.flush()

    doktor = session.exec(
        select(Doktor).where(Doktor.personel_id == personel.id)
    ).first()
    if not doktor:
        session.add(
            Doktor(
                personel_id=personel.id,
                uzmanlik_alani=dep.ad,
                diploma_no=diploma,
                online_randevu_acik_mi=True,
            )
        )
    else:
        doktor.uzmanlik_alani = dep.ad
        doktor.online_randevu_acik_mi = True
        session.add(doktor)


def _departman_doktor_sayisi(session: Session, departman_id: int) -> int:
    rows = session.exec(
        select(Doktor)
        .join(Personel, Doktor.personel_id == Personel.id)
        .where(Personel.departman_id == departman_id)
    ).all()
    return len(rows)


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
    named_by_dep: dict[str, list[tuple[str, str, str, str]]] = {}
    for dep_ad, ad, soyad, email, diploma in ORNEK_DOKTORLAR:
        named_by_dep.setdefault(dep_ad, []).append((ad, soyad, email, diploma))

    # İsimli örnek doktorlar: eski seed ile uyumlu TC (20…)
    for i, (dep_ad, ad, soyad, email, diploma) in enumerate(ORNEK_DOKTORLAR, start=1):
        if dep_ad not in deps:
            continue
        _ensure_doktor(
            session,
            dep=deps[dep_ad],
            ad=ad,
            soyad=soyad,
            email=email,
            diploma=diploma,
            tc=f"20{i:09d}",
            sifre=sifre,
        )

    # Her poliklinikte en az DOKTOR_SAYISI_POLIKLINIK doktor (üretim TC: 21…)
    seq = 0
    for dep_ad, dep in deps.items():
        mevcut = _departman_doktor_sayisi(session, dep.id)
        for slot in range(mevcut, DOKTOR_SAYISI_POLIKLINIK):
            seq += 1
            slug = _slug(dep_ad)
            ad = _ADLAR[(seq + slot) % len(_ADLAR)]
            soyad = _SOYADLAR[(seq * 3 + slot) % len(_SOYADLAR)]
            # slot+1 ile çakışmasın diye mevcut+1 kullan (isimli doktorlar 01 olabilir)
            n = mevcut + (slot - mevcut) + 1
            email = f"doktor.{slug}.{n:02d}@hastane.example.com"
            diploma = f"DIP-{slug.upper().replace('-', '')[:10]}-{n:02d}"
            _ensure_doktor(
                session,
                dep=dep,
                ad=ad,
                soyad=soyad,
                email=email,
                diploma=diploma,
                tc=f"21{seq:09d}",
                sifre=sifre,
            )
    session.commit()
