"""Sistemi randevu, yatak, şikayet/öneri ve diğer demo verilerle doldurur (idempotent).

Önce temel seed'leri çalıştırır, ardından zengin fake veri ekler.

Kullanım:
  python -m app.core.seed_demo_veri
  python -m app.core.seed_demo_veri --hasta 200 --randevu-per-doktor 20
"""

from __future__ import annotations

import argparse
from datetime import date, datetime, timedelta, timezone

import app.core.models_registry  # noqa: F401
from sqlmodel import Session, select

from app.core.db import engine
from app.core.enums import KlinikDurum, Rol, YatakDurumu
from app.core.seed_admin_dashboard_demo import seed_admin_dashboard_demo
from app.core.seed_ameliyathane import seed_ameliyathane_demo
from app.core.seed_bashekim import seed_bashekim_demo
from app.core.seed_doktor import seed_doktor_panel
from app.core.seed_hasta_toplu import seed_test_hastalar
from app.core.seed_hastane import seed_hastane_referans
from app.core.seed_hemsire_yatis import seed_hemsire_yatis
from app.core.seed_ornek_islemler import seed_ornek_islemler
from app.core.seed_plan_demo import seed_plan_demo
from app.core.seed_radyoloji import seed_radyoloji_demo
from app.core.seed_randevu_toplu import (
    _cakisma_var,
    _departman_for_doktor,
    _test_doktorlar,
    seed_randevular_toplu,
)
from app.core.seed_rbac import DEMO_SIFRE, seed_demo_kullanicilar
from app.core.seed_yatak_yonetimi import seed_yatak_yonetimi_demo
from app.core.timezone import as_utc
from app.features.departmanlar.models import Departman
from app.features.doktorlar.models import Doktor
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.randevular.models import Randevu
from app.features.sikayet_oneri.models import SikayetOneri
from app.features.sikayet_oneri.schemas import SikayetDurum
from app.features.yatak_yonetimi.models import Oda, Servis, Yatak
from app.features.yatis.models import YatisKaydi

TAG = "SEED-DEMO-VERI"

SIKAYET_ORNEKLERI: list[tuple[str, str, str]] = [
    ("SIKAYET", "Poliklinik bekleme süresi çok uzun, 2 saat bekledim.", SikayetDurum.ACIK.value),
    ("SIKAYET", "Oda temizliği yetersiz, çöp kutuları dolu.", SikayetDurum.ACIK.value),
    ("SIKAYET", "Acil serviste personel eksikliği var.", SikayetDurum.ACIK.value),
    ("SIKAYET", "Laboratuvar sonuçları 3 gündür gelmedi.", SikayetDurum.INCELENIYOR.value),
    ("SIKAYET", "Hasta yakınları için oturma alanı yetersiz.", SikayetDurum.INCELENIYOR.value),
    ("SIKAYET", "Yemekhane menüsü çeşitlendirilmeli.", SikayetDurum.INCELENIYOR.value),
    ("SIKAYET", "Otopark düzeni hakkında şikayet.", SikayetDurum.COZULDU.value),
    ("SIKAYET", "Asansörler sık sık arızalanıyor.", SikayetDurum.COZULDU.value),
    ("SIKAYET", "Gece vardiyasında gürültü yapılıyor.", SikayetDurum.ACIK.value),
    ("SIKAYET", "Hemşire çağrı butonu çalışmıyor.", SikayetDurum.ACIK.value),
    ("SIKAYET", "Radyoloji randevusu 2 hafta sonraya verildi.", SikayetDurum.INCELENIYOR.value),
    ("SIKAYET", "Hasta odasında klima çalışmıyor.", SikayetDurum.ACIK.value),
    ("ONERI", "Randevu hatırlatma SMS'i gönderilmesini öneriyorum.", SikayetDurum.ACIK.value),
    ("ONERI", "Online sıra takibi sistemi kurulmalı.", SikayetDurum.ACIK.value),
    ("ONERI", "Engelli rampası iyileştirilmeli.", SikayetDurum.COZULDU.value),
    ("ONERI", "Çocuk oyun alanı eklenmesi faydalı olur.", SikayetDurum.INCELENIYOR.value),
    ("ONERI", "Mobil uygulamaya lab sonuçları eklensin.", SikayetDurum.ACIK.value),
    ("ONERI", "Kafeteryada daha sağlıklı menü seçenekleri.", SikayetDurum.INCELENIYOR.value),
    ("ONERI", "Otopark için online rezervasyon sistemi.", SikayetDurum.COZULDU.value),
    ("ONERI", "Hasta bilgilendirme ekranları artırılmalı.", SikayetDurum.ACIK.value),
    ("SIKAYET", "Eczane ilaç teslim süresi uzun.", SikayetDurum.REDDEDILDI.value),
    ("SIKAYET", "Kayıt işlemleri çok yavaş ilerliyor.", SikayetDurum.ACIK.value),
    ("ONERI", "Doktor değerlendirme anketi eklensin.", SikayetDurum.INCELENIYOR.value),
    ("SIKAYET", "Refakatçi yatağı bulunmuyor.", SikayetDurum.ACIK.value),
    ("ONERI", "Wi-Fi hızı artırılmalı.", SikayetDurum.COZULDU.value),
]

RANDEVU_DURUMLARI = [
    "TAMAMLANDI",
    "TAMAMLANDI",
    "TAMAMLANDI",
    "BEKLEMEDE",
    "BEKLEMEDE",
    "ONAY_BEKLIYOR",
    "IPTAL",
    "GELMEDI",
]


def _hasta_kullanicilar(session: Session, limit: int = 200) -> list[Kullanici]:
    return list(
        session.exec(
            select(Kullanici)
            .where(Kullanici.rol == Rol.HASTA)
            .order_by(Kullanici.id)
            .limit(limit)
        ).all()
    )


def _hastalar(session: Session, limit: int = 200) -> list[Hasta]:
    return list(session.exec(select(Hasta).order_by(Hasta.id).limit(limit)).all())


def _seed_temel(session: Session) -> None:
    seed_demo_kullanicilar(session)
    seed_hastane_referans(session)
    seed_ornek_islemler(session)
    seed_bashekim_demo(session)
    seed_doktor_panel(session)
    seed_hemsire_yatis(session)
    seed_yatak_yonetimi_demo(session)
    seed_ameliyathane_demo(session)
    seed_radyoloji_demo(session)
    seed_plan_demo(session)


def _seed_ek_sikayetler(session: Session) -> int:
    gonderenler = _hasta_kullanicilar(session, 30)
    if not gonderenler:
        return 0

    created = 0
    for i, (tur, icerik, durum) in enumerate(SIKAYET_ORNEKLERI):
        etiket = f"{TAG}-SIKAYET-{i:03d}"
        mevcut = session.exec(
            select(SikayetOneri).where(SikayetOneri.icerik.startswith(etiket))
        ).first()
        if mevcut:
            continue
        gonderen = gonderenler[i % len(gonderenler)]
        session.add(
            SikayetOneri(
                gonderen_kullanici_id=gonderen.id,
                tur=tur,
                icerik=f"{etiket}: {icerik}",
                tarih=datetime.now(timezone.utc) - timedelta(days=i % 14, hours=i % 8),
                durum=durum,
            )
        )
        created += 1
    session.flush()
    return created


def _seed_ek_randevular(session: Session) -> int:
    doktorlar = _test_doktorlar(session)
    if not doktorlar:
        doktorlar = list(session.exec(select(Doktor).order_by(Doktor.id).limit(20)).all())
    hastalar = _hastalar(session)
    if not doktorlar or not hastalar:
        return 0

    dep = session.exec(select(Departman).limit(1)).first()
    if dep is None:
        return 0

    created = 0
    idx = 0

    for gun_offset in range(30):
        gun = date.today() - timedelta(days=29 - gun_offset)
        gunluk_adet = 3 + (gun_offset % 8)
        for n in range(gunluk_adet):
            etiket = f"{TAG}-R-{gun.isoformat()}-{n:03d}"
            if session.exec(select(Randevu).where(Randevu.notlar == etiket)).first():
                continue
            saat = 8 + (n % 9)
            ts = datetime(gun.year, gun.month, gun.day, saat, (n * 15) % 60, tzinfo=timezone.utc)
            hasta = hastalar[idx % len(hastalar)]
            doktor = doktorlar[idx % len(doktorlar)]
            dep_id = _departman_for_doktor(session, doktor) or dep.id
            while _cakisma_var(session, doktor.id, ts):
                ts = ts + timedelta(minutes=20)
                if ts.hour >= 17:
                    break
            if _cakisma_var(session, doktor.id, ts):
                idx += 1
                continue
            durum = RANDEVU_DURUMLARI[idx % len(RANDEVU_DURUMLARI)]
            if gun > date.today():
                durum = "BEKLEMEDE" if durum != "IPTAL" else "IPTAL"
            session.add(
                Randevu(
                    hasta_id=hasta.id,
                    doktor_id=doktor.id,
                    departman_id=dep_id,
                    tarih_saat=as_utc(ts),
                    durum=durum,
                    notlar=etiket,
                )
            )
            created += 1
            idx += 1
            if created % 50 == 0:
                session.flush()

    for n in range(12):
        etiket = f"{TAG}-R-BUGUN-{n:03d}"
        if session.exec(select(Randevu).where(Randevu.notlar == etiket)).first():
            continue
        doktor = doktorlar[n % len(doktorlar)]
        dep_id = _departman_for_doktor(session, doktor) or dep.id
        ts = datetime(
            date.today().year,
            date.today().month,
            date.today().day,
            14 + (n * 20) // 60,
            (n * 20) % 60,
            tzinfo=timezone.utc,
        )
        while _cakisma_var(session, doktor.id, ts):
            ts = ts + timedelta(minutes=20)
            if ts.hour >= 17:
                break
        if _cakisma_var(session, doktor.id, ts):
            continue
        hasta = hastalar[n % len(hastalar)]
        session.add(
            Randevu(
                hasta_id=hasta.id,
                doktor_id=doktor.id,
                departman_id=dep_id,
                tarih_saat=as_utc(ts),
                durum=["BEKLEMEDE", "TAMAMLANDI", "ONAY_BEKLIYOR"][n % 3],
                notlar=etiket,
            )
        )
        created += 1

    session.flush()
    return created


def _seed_yatak_durumlari(session: Session) -> tuple[int, int]:
    """Yatakları çeşitli durumlara getirir ve dolu yataklara yatış bağlar."""
    yataklar = list(session.exec(select(Yatak).order_by(Yatak.id)).all())
    if not yataklar:
        return 0, 0

    durumlar = [
        YatakDurumu.DOLU,
        YatakDurumu.DOLU,
        YatakDurumu.BOS,
        YatakDurumu.DOLU,
        YatakDurumu.TEMIZLIK_BEKLIYOR,
        YatakDurumu.BOS,
        YatakDurumu.ARIZALI,
        YatakDurumu.DOLU,
    ]

    hastalar = _hastalar(session, 50)
    doktor = session.exec(select(Doktor).order_by(Doktor.id)).first()
    updated = 0
    yatis_created = 0

    for i, yatak in enumerate(yataklar):
        hedef = durumlar[i % len(durumlar)]
        if yatak.durum != hedef:
            yatak.durum = hedef
            session.add(yatak)
            updated += 1

        if hedef != YatakDurumu.DOLU or not hastalar:
            continue

        oda = session.get(Oda, yatak.oda_id)
        if oda is None:
            continue
        servis = session.get(Servis, oda.servis_id)
        if servis is None:
            continue

        protokol = f"{TAG}-YATAK-{yatak.id}"
        mevcut = session.exec(
            select(YatisKaydi).where(YatisKaydi.protokol_no == protokol)
        ).first()
        if mevcut:
            continue

        hasta = hastalar[i % len(hastalar)]
        session.add(
            YatisKaydi(
                hasta_id=hasta.id,
                servis_id=servis.id,
                yatak_id=yatak.id,
                protokol_no=protokol,
                yatis_tarihi=as_utc(datetime.now(timezone.utc) - timedelta(days=i % 5 + 1)),
                klinik_durum=[
                    KlinikDurum.NORMAL,
                    KlinikDurum.KRITIK,
                    KlinikDurum.ACIL,
                    KlinikDurum.BEKLEYEN_TETKIK,
                ][i % 4],
                sorumlu_doktor_id=doktor.id if doktor else None,
                aktif_mi=True,
            )
        )
        yatis_created += 1

    session.flush()
    return updated, yatis_created


def seed_demo_veri(
    session: Session,
    *,
    hasta_count: int = 150,
    randevu_per_doktor: int = 15,
) -> dict[str, int]:
    """Tüm demo verilerini oluşturur."""
    _seed_temel(session)
    hasta_created, _ = seed_test_hastalar(session, count=hasta_count)
    session.commit()

    rand_created, rand_skipped = seed_randevular_toplu(
        session, per_doktor=randevu_per_doktor, gun_sayisi=21
    )

    dashboard = seed_admin_dashboard_demo(session)

    ek_sikayet = _seed_ek_sikayetler(session)
    ek_randevu = _seed_ek_randevular(session)
    yatak_upd, yatis_new = _seed_yatak_durumlari(session)
    session.commit()

    return {
        "hasta": hasta_created,
        "randevu_toplu": rand_created,
        "randevu_toplu_skipped": rand_skipped,
        "dashboard": dashboard,
        "ek_sikayet": ek_sikayet,
        "ek_randevu": ek_randevu,
        "yatak_guncelleme": yatak_upd,
        "yatis_yeni": yatis_new,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Sistemi demo verilerle doldur")
    parser.add_argument("--hasta", type=int, default=150, help="Oluşturulacak hasta sayısı")
    parser.add_argument(
        "--randevu-per-doktor",
        type=int,
        default=15,
        help="Her doktor için randevu sayısı",
    )
    args = parser.parse_args()

    with Session(engine) as session:
        ozet = seed_demo_veri(
            session,
            hasta_count=max(10, args.hasta),
            randevu_per_doktor=max(1, args.randevu_per_doktor),
        )

    print("Demo veri seed tamamlandı:")
    print(f"  Hasta: +{ozet['hasta']}")
    print(f"  Randevu (toplu): +{ozet['randevu_toplu']} (atlanan {ozet['randevu_toplu_skipped']})")
    print(f"  Ek randevu: +{ozet['ek_randevu']}")
    print(f"  Ek şikayet/öneri: +{ozet['ek_sikayet']}")
    print(f"  Yatak güncelleme: {ozet['yatak_guncelleme']}")
    print(f"  Yeni yatış: +{ozet['yatis_yeni']}")
    print(f"  Dashboard seed: {ozet['dashboard']}")
    print(f"  Giriş şifresi: {DEMO_SIFRE}")


if __name__ == "__main__":
    main()
