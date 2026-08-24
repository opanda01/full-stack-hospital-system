"""Admin gösterge paneli için zengin demo verisi (idempotent).

Kullanım:
  python -m app.core.seed_admin_dashboard_demo
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import app.core.models_registry  # noqa: F401
from sqlmodel import Session, select

from app.core.db import engine
from app.core.enums import Rol, YatakDurumu
from app.core.seed_hasta_toplu import seed_test_hastalar
from app.core.seed_randevu_toplu import _departman_for_doktor, _test_doktorlar
from app.core.seed_yatak_yonetimi import seed_yatak_yonetimi_demo
from app.core.timezone import as_utc
from app.features.departmanlar.models import Departman
from app.features.doktorlar.models import Doktor
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.nobet_cizelgesi.models import NobetCizelgesi
from app.features.personel.models import Personel
from app.features.randevular.models import Randevu
from app.features.sikayet_oneri.models import SikayetOneri
from app.features.sikayet_oneri.schemas import SikayetDurum
from app.features.temizlik_gorevleri.models import TemizlikGorevi
from app.features.yatak_yonetimi.models import Oda, Servis, Yatak
from app.features.yatis.models import YatisKaydi

TAG = "SEED-ADMIN-DASH"


def _hastalar(session: Session, limit: int = 150) -> list[Hasta]:
    return list(session.exec(select(Hasta).order_by(Hasta.id).limit(limit)).all())


def _gonderen_hasta(session: Session) -> Kullanici | None:
    return session.exec(
        select(Kullanici).where(Kullanici.rol == Rol.HASTA).order_by(Kullanici.id)
    ).first()


def _temizlik_personel(session: Session) -> Personel | None:
    row = session.exec(
        select(Personel)
        .join(Kullanici, Personel.kullanici_id == Kullanici.id)
        .where(Kullanici.rol == Rol.TEMIZLIK_PERSONELI)
        .order_by(Personel.id)
    ).first()
    return row


def _seed_hastalar(session: Session) -> int:
    created, _ = seed_test_hastalar(session, count=120)
    return created


def _seed_randevular(session: Session) -> tuple[int, int]:
    doktorlar = _test_doktorlar(session)
    if not doktorlar:
        doktorlar = list(session.exec(select(Doktor).order_by(Doktor.id).limit(15)).all())
    hastalar = _hastalar(session)
    if not doktorlar or not hastalar:
        return 0, 0

    created = 0
    skipped = 0
    now = datetime.now(timezone.utc)
    doktor = doktorlar[0]
    dep_id = _departman_for_doktor(session, doktor)
    if dep_id is None:
        dep = session.exec(select(Departman).limit(1)).first()
        dep_id = dep.id if dep else None
    if dep_id is None:
        return 0, 0

    # Son 7 gün — trend grafiği (günlük 4–14 randevu)
    gunluk_adet = [6, 9, 11, 8, 14, 10, 12]
    for gun_offset, adet in enumerate(gunluk_adet):
        gun = (date.today() - timedelta(days=6 - gun_offset))
        for n in range(adet):
            etiket = f"{TAG}-R-TREND-{gun.isoformat()}-{n:02d}"
            if session.exec(select(Randevu).where(Randevu.notlar == etiket)).first():
                skipped += 1
                continue
            saat = 9 + (n % 8)
            ts = datetime(gun.year, gun.month, gun.day, saat, 0, tzinfo=timezone.utc)
            hasta = hastalar[(gun_offset * 10 + n) % len(hastalar)]
            d = doktorlar[n % len(doktorlar)]
            d_dep = _departman_for_doktor(session, d) or dep_id
            session.add(
                Randevu(
                    hasta_id=hasta.id,
                    doktor_id=d.id,
                    departman_id=d_dep,
                    tarih_saat=ts,
                    durum="TAMAMLANDI" if gun < date.today() else "BEKLEMEDE",
                    notlar=etiket,
                )
            )
            created += 1

    # Bekleyen / onay bekleyen — operasyonel KPI
    bekleyen_spec = [
        ("BEKLEMEDE", 8),
        ("ONAY_BEKLIYOR", 4),
        ("BEKLEMEDE", 6),
    ]
    base_future = now + timedelta(days=1)
    idx = 0
    for durum, adet in bekleyen_spec:
        for n in range(adet):
            etiket = f"{TAG}-R-PENDING-{durum}-{n:02d}"
            if session.exec(select(Randevu).where(Randevu.notlar == etiket)).first():
                skipped += 1
                continue
            hasta = hastalar[idx % len(hastalar)]
            d = doktorlar[idx % len(doktorlar)]
            d_dep = _departman_for_doktor(session, d) or dep_id
            session.add(
                Randevu(
                    hasta_id=hasta.id,
                    doktor_id=d.id,
                    departman_id=d_dep,
                    tarih_saat=as_utc(base_future + timedelta(hours=idx)),
                    durum=durum,
                    notlar=etiket,
                )
            )
            created += 1
            idx += 1

    session.flush()
    return created, skipped


def _seed_sikayetler(session: Session) -> int:
    gonderen = _gonderen_hasta(session)
    if gonderen is None:
        return 0

    ornekler = [
        ("SIKAYET", "Poliklinik bekleme süresi çok uzun.", SikayetDurum.ACIK.value),
        ("SIKAYET", "Oda temizliği yetersiz.", SikayetDurum.ACIK.value),
        ("ONERI", "Randevu hatırlatma SMS'i önerisi.", SikayetDurum.INCELENIYOR.value),
        ("SIKAYET", "Laboratuvar sonuçları gecikti.", SikayetDurum.INCELENIYOR.value),
        ("SIKAYET", "Acil serviste personel eksikliği.", SikayetDurum.ACIK.value),
        ("ONERI", "Online sıra takibi isteği.", SikayetDurum.ACIK.value),
        ("SIKAYET", "Otopark düzeni hakkında şikayet.", SikayetDurum.COZULDU.value),
        ("ONERI", "Engelli rampası iyileştirmesi.", SikayetDurum.COZULDU.value),
    ]
    created = 0
    for i, (tur, icerik, durum) in enumerate(ornekler):
        etiket = f"{TAG}-SIKAYET-{i:02d}"
        mevcut = session.exec(
            select(SikayetOneri).where(SikayetOneri.icerik.startswith(etiket))
        ).first()
        if mevcut:
            continue
        session.add(
            SikayetOneri(
                gonderen_kullanici_id=gonderen.id,
                tur=tur,
                icerik=f"{etiket}: {icerik}",
                tarih=datetime.now(timezone.utc) - timedelta(days=i % 5),
                durum=durum,
            )
        )
        created += 1
    session.flush()
    return created


def _seed_temizlik(session: Session) -> int:
    personel = _temizlik_personel(session)
    if personel is None:
        return 0

    gorevler = [
        ("Acil servis koridor", "ATANDI"),
        ("Dahiliye 4. kat", "DEVAM_EDIYOR"),
        ("Ameliyathane önü", "ATANDI"),
        ("Poliklinik A giriş", "BEKLEMEDE"),
        ("Radyoloji bekleme", "ATANDI"),
        ("Yoğun bakım önü", "DEVAM_EDIYOR"),
    ]
    created = 0
    for i, (alan, durum) in enumerate(gorevler):
        etiket = f"{TAG}-TEMIZLIK-{i:02d}"
        mevcut = session.exec(
            select(TemizlikGorevi).where(TemizlikGorevi.oda_bolum == etiket)
        ).first()
        if mevcut:
            continue
        session.add(
            TemizlikGorevi(
                personel_id=personel.id,
                oda_bolum=etiket,
                gorev_tarihi=date.today(),
                durum=durum,
            )
        )
        created += 1
    session.flush()
    return created


def _seed_yatak_doluluk(session: Session) -> int:
    yataklar = list(session.exec(select(Yatak).order_by(Yatak.id)).all())
    if not yataklar:
        return 0

    updated = 0
    for i, yatak in enumerate(yataklar):
        hedef = YatakDurumu.DOLU if i % 3 != 0 else YatakDurumu.BOS
        if yatak.durum != hedef:
            yatak.durum = hedef
            session.add(yatak)
            updated += 1
    session.flush()
    return updated


def _seed_yatis_trend(session: Session) -> int:
    """Son 7 gün için ek yatış kayıtları (tamamlanmış)."""
    hastalar = _hastalar(session, 30)
    servis = session.exec(select(Servis).order_by(Servis.id)).first()
    doktor = session.exec(select(Doktor).order_by(Doktor.id)).first()
    if not hastalar or servis is None:
        return 0

    created = 0
    gunluk = [1, 2, 1, 3, 2, 1, 2]
    idx = 0
    for gun_offset, adet in enumerate(gunluk):
        gun = date.today() - timedelta(days=6 - gun_offset)
        for n in range(adet):
            protokol = f"{TAG}-Y-{gun.isoformat()}-{n}"
            if session.exec(
                select(YatisKaydi).where(YatisKaydi.protokol_no == protokol)
            ).first():
                continue
            hasta = hastalar[idx % len(hastalar)]
            idx += 1
            bas = datetime(gun.year, gun.month, gun.day, 10, 0, tzinfo=timezone.utc)
            session.add(
                YatisKaydi(
                    hasta_id=hasta.id,
                    servis_id=servis.id,
                    protokol_no=protokol,
                    yatis_tarihi=bas,
                    cikis_tarihi=bas + timedelta(days=2) if gun_offset < 5 else None,
                    aktif_mi=gun_offset >= 5 and n == 0,
                    sorumlu_doktor_id=doktor.id if doktor else None,
                )
            )
            created += 1
    session.flush()
    return created


def _seed_nobet_bugun(session: Session) -> int:
    personeller = list(
        session.exec(
            select(Personel)
            .join(Kullanici, Personel.kullanici_id == Kullanici.id)
            .where(Kullanici.rol.in_([Rol.HEMSIRE, Rol.DOKTOR]))
            .limit(6)
        ).all()
    )
    dep = session.exec(select(Departman).limit(1)).first()
    if not personeller or dep is None:
        return 0

    created = 0
    for i, p in enumerate(personeller[:4]):
        mevcut = session.exec(
            select(NobetCizelgesi).where(
                NobetCizelgesi.personel_id == p.id,
                NobetCizelgesi.tarih == date.today(),
            )
        ).first()
        if mevcut:
            continue
        session.add(
            NobetCizelgesi(
                personel_id=p.id,
                tarih=date.today(),
                vardiya=["GUNDUZ", "GECE", "GUNDUZ", "AKSAM"][i % 4],
                departman_id=dep.id,
            )
        )
        created += 1
    session.flush()
    return created


def seed_admin_dashboard_demo(session: Session) -> dict[str, int]:
    """Admin dashboard KPI ve grafikleri için demo veri üretir."""
    seed_yatak_yonetimi_demo(session)
    ozet = {
        "hastalar": _seed_hastalar(session),
        "randevu_created": 0,
        "randevu_skipped": 0,
        "sikayet": _seed_sikayetler(session),
        "temizlik": _seed_temizlik(session),
        "yatak": _seed_yatak_doluluk(session),
        "yatis": _seed_yatis_trend(session),
        "nobet": _seed_nobet_bugun(session),
    }
    rc, rs = _seed_randevular(session)
    ozet["randevu_created"] = rc
    ozet["randevu_skipped"] = rs
    session.commit()
    return ozet


def main() -> None:
    with Session(engine) as session:
        ozet = seed_admin_dashboard_demo(session)
    print(
        "Admin dashboard demo seed tamamlandı:",
        f"hasta+{ozet['hastalar']},",
        f"randevu+{ozet['randevu_created']} (atlanan {ozet['randevu_skipped']}),",
        f"şikayet+{ozet['sikayet']},",
        f"temizlik+{ozet['temizlik']},",
        f"yatak güncelleme {ozet['yatak']},",
        f"yatış+{ozet['yatis']},",
        f"nöbet+{ozet['nobet']}.",
    )


if __name__ == "__main__":
    main()
