"""Örnek hasta + randevu seed — admin panel listelerinin dolu görünmesi için."""

from datetime import date, datetime, timedelta, timezone

from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.security import hash_password
from app.features.doktorlar.models import Doktor
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.randevular.models import Randevu

ORNEK_HASTALAR = [
    {
        "tc": "30000000001",
        "ad": "Ayşe",
        "soyad": "Yılmaz",
        "email": "hasta.ayse@hastane.example.com",
        "cinsiyet": "K",
        "kan_grubu": "A+",
    },
    {
        "tc": "30000000002",
        "ad": "Mehmet",
        "soyad": "Demir",
        "email": "hasta.mehmet@hastane.example.com",
        "cinsiyet": "E",
        "kan_grubu": "0+",
    },
    {
        "tc": "30000000003",
        "ad": "Zeynep",
        "soyad": "Kaya",
        "email": "hasta.zeynep@hastane.example.com",
        "cinsiyet": "K",
        "kan_grubu": "B+",
    },
]


def seed_ornek_islemler(session: Session) -> None:
    sifre = hash_password("Test1234!")
    hastalar: list[Hasta] = []

    for item in ORNEK_HASTALAR:
        kullanici = session.exec(
            select(Kullanici).where(
                (Kullanici.email == item["email"])
                | (Kullanici.tc_kimlik_no == item["tc"])
            )
        ).first()
        if not kullanici:
            kullanici = Kullanici(
                tc_kimlik_no=item["tc"],
                ad=item["ad"],
                soyad=item["soyad"],
                email=item["email"],
                sifre_hash=sifre,
                rol=Rol.HASTA,
                aktif_mi=True,
                sifre_degistirmeli_mi=False,
                kvkk_onaylandi_mi=True,
            )
            session.add(kullanici)
            session.flush()

        hasta = session.exec(
            select(Hasta).where(Hasta.kullanici_id == kullanici.id)
        ).first()
        if not hasta:
            hasta = Hasta(
                kullanici_id=kullanici.id,
                tc_kimlik_no=item["tc"],
                dogum_tarihi=date(1990, 1, 15),
                cinsiyet=item["cinsiyet"],
                kan_grubu=item["kan_grubu"],
            )
            session.add(hasta)
            session.flush()
        hastalar.append(hasta)

    doktorlar = list(session.exec(select(Doktor).order_by(Doktor.id)).all())
    if not doktorlar or not hastalar:
        session.commit()
        return

    # Randevu seed: her doktor için en az bir örnek (idempotent: notlar etiketi)
    base = datetime.now(timezone.utc).replace(
        hour=10, minute=0, second=0, microsecond=0
    ) + timedelta(days=1)
    for i, doktor in enumerate(doktorlar[:5]):
        etiket = f"SEED-RANDEVU-{doktor.id}"
        mevcut = session.exec(
            select(Randevu).where(Randevu.notlar == etiket)
        ).first()
        if mevcut:
            continue

        personel = session.get(Personel, doktor.personel_id)
        departman_id = personel.departman_id if personel and personel.departman_id else 1
        hasta = hastalar[i % len(hastalar)]
        session.add(
            Randevu(
                hasta_id=hasta.id,
                doktor_id=doktor.id,
                departman_id=departman_id,
                tarih_saat=base + timedelta(hours=i),
                durum="BEKLEMEDE",
                notlar=etiket,
            )
        )

    session.commit()
