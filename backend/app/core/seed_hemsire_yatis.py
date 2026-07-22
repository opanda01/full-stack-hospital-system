"""Hemşire paneli: servis/yatış/ilaç talep demo verileri (idempotent)."""

from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from app.core.enums import (
    IlacTalepDurumu,
    IlacUygulamaDurumu,
    KlinikDurum,
    KullanimSekli,
    PanelBildirimTipi,
)
from app.features.departmanlar.models import Departman
from app.features.doktorlar.models import Doktor
from app.features.eczane.models import Ilac
from app.features.hastalar.models import Hasta
from app.features.ilac_talep.models import IlacTalebi, IlacTalepKalemi
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.yatis.models import (
    AmeliyatBilgisi,
    HastaIslemLogu,
    HastaNotu,
    HemsireGorevi,
    IlacUygulama,
    IzinHareketi,
    PanelBildirim,
    Refakatci,
    Servis,
    ServisHareketi,
    VardiyaDevirNotu,
    VitalBulgu,
    Yatak,
    YatakHareketi,
    YatisKaydi,
)


def seed_hemsire_yatis(session: Session) -> None:
    if session.exec(select(Servis).where(Servis.kod == "DAHILI-3")).first():
        seed_hemsire_klinik(session)
        seed_hemsire_klinik_moduller(session)
        return

    dep_dahili = session.exec(
        select(Departman).where(Departman.ad == "İç Hastalıkları")
    ).first()
    dep_cerrahi = session.exec(
        select(Departman).where(Departman.ad == "Genel Cerrahi")
    ).first()

    s1 = Servis(
        ad="Dahiliye Servisi 3. Kat",
        kod="DAHILI-3",
        kat_no=3,
        departman_id=dep_dahili.id if dep_dahili else None,
    )
    s2 = Servis(
        ad="Cerrahi Servisi 2. Kat",
        kod="CERRAHI-2",
        kat_no=2,
        departman_id=dep_cerrahi.id if dep_cerrahi else None,
    )
    s3 = Servis(ad="Yoğun Bakım", kod="YB-1", kat_no=1)
    session.add(s1)
    session.add(s2)
    session.add(s3)
    session.flush()

    yataklar: list[Yatak] = []
    for servis, odalar in (
        (s1, [("301", "A"), ("301", "B"), ("302", "A"), ("302", "B")]),
        (s2, [("201", "A"), ("201", "B"), ("202", "A")]),
        (s3, [("YB-01", "1"), ("YB-01", "2")]),
    ):
        for oda, yatak_no in odalar:
            y = Yatak(servis_id=servis.id, oda_no=oda, yatak_no=yatak_no, dolu_mu=False)
            session.add(y)
            yataklar.append(y)
    session.flush()

    hastalar = list(session.exec(select(Hasta)).all())
    doktorlar = list(session.exec(select(Doktor)).all())
    hemsire_user = session.exec(
        select(Kullanici).where(Kullanici.email == "hemsire@hastane.example.com")
    ).first()
    hemsire_p = None
    if hemsire_user:
        hemsire_p = session.exec(
            select(Personel).where(Personel.kullanici_id == hemsire_user.id)
        ).first()

    if not hastalar or not doktorlar:
        session.commit()
        return

    now = datetime.now(timezone.utc)
    durumlar = [
        KlinikDurum.NORMAL,
        KlinikDurum.KRITIK,
        KlinikDurum.ACIL,
        KlinikDurum.BEKLEYEN_TETKIK,
        KlinikDurum.NORMAL,
        KlinikDurum.KRITIK,
    ]
    servisler = [s1, s1, s2, s2, s3, s1]
    yatislar: list[YatisKaydi] = []

    for i, hasta in enumerate(hastalar[:6]):
        servis = servisler[i % len(servisler)]
        uygun = [y for y in yataklar if y.servis_id == servis.id and not y.dolu_mu]
        yatak = uygun[0] if uygun else None
        if yatak:
            yatak.dolu_mu = True
            session.add(yatak)
        doktor = doktorlar[i % len(doktorlar)]
        yatis = YatisKaydi(
            hasta_id=hasta.id,
            servis_id=servis.id,
            yatak_id=yatak.id if yatak else None,
            protokol_no=f"P-2026-{1000 + i}",
            basvuru_no=f"B-2026-{2000 + i}",
            dosya_no=f"D-{3000 + i}",
            muracaat_tarihi=(now - timedelta(days=i + 2)).date(),
            yatis_tarihi=now - timedelta(days=i + 1),
            sigorta_turu="SGK" if i % 2 == 0 else "Özel",
            klinik_durum=durumlar[i % len(durumlar)],
            sorumlu_doktor_id=doktor.id,
            sorumlu_hemsire_id=hemsire_p.id if hemsire_p else None,
            kontrol_edildi_mi=i % 3 == 0,
            aktif_mi=True,
        )
        session.add(yatis)
        yatislar.append(yatis)
    session.flush()

    if yatislar:
        y0 = yatislar[0]
        session.add(
            ServisHareketi(
                yatis_id=y0.id,
                eski_servis_id=s2.id,
                yeni_servis_id=y0.servis_id,
                tarih=now - timedelta(days=1),
                aciklama="SEED: servise kabul",
            )
        )
        if y0.yatak_id:
            session.add(
                YatakHareketi(
                    yatis_id=y0.id,
                    eski_yatak_id=None,
                    yeni_yatak_id=y0.yatak_id,
                    tarih=now - timedelta(days=1),
                    aciklama="SEED: yatak atandı",
                )
            )
        session.add(
            IzinHareketi(
                yatis_id=y0.id,
                baslangic=now - timedelta(hours=6),
                bitis=now - timedelta(hours=2),
                aciklama="SEED: kısa izin",
            )
        )
        session.add(
            AmeliyatBilgisi(
                yatis_id=yatislar[1].id if len(yatislar) > 1 else y0.id,
                tarih=now - timedelta(days=3),
                ameliyat_adi="Apendektomi",
                notlar="SEED ameliyat",
            )
        )
        session.add(
            Refakatci(
                yatis_id=y0.id,
                ad_soyad="Ali Yılmaz",
                yakinlik="Eş",
                telefon="05551234567",
            )
        )
        if hemsire_user:
            session.add(
                HastaIslemLogu(
                    yatis_id=y0.id,
                    yapan_kullanici_id=hemsire_user.id,
                    islem_tipi="KONTROL_TOGGLE",
                    detay="SEED: kontrol edildi",
                )
            )

        ilaclar = list(session.exec(select(Ilac)).all())
        if ilaclar:
            talep = IlacTalebi(
                yatis_id=y0.id,
                hasta_id=y0.hasta_id,
                servis_id=y0.servis_id,
                istek_tarihi=now - timedelta(days=1),
                isteyen_doktor_id=y0.sorumlu_doktor_id,
                isteyen_birim="Dahiliye Servisi",
                isteyen_hemsire_id=hemsire_p.id if hemsire_p else None,
                durum=IlacTalepDurumu.VERILDI,
            )
            session.add(talep)
            session.flush()
            ilac = ilaclar[0]
            session.add(
                IlacTalepKalemi(
                    talep_id=talep.id,
                    ilac_id=ilac.id,
                    urun_kodu=ilac.barkod or "ILAC-01",
                    urun_adi=ilac.ad,
                    istenen_miktar=10,
                    verilen_miktar=10,
                    kullanim_sekli=KullanimSekli.ORAL,
                    periyod="8 saatte bir",
                    doz="500 mg",
                    olcu_birimi="tablet",
                    uygulama_suresi="3 gün",
                )
            )

            talep2 = IlacTalebi(
                yatis_id=y0.id,
                hasta_id=y0.hasta_id,
                servis_id=y0.servis_id,
                istek_tarihi=now,
                isteyen_doktor_id=y0.sorumlu_doktor_id,
                isteyen_birim="Dahiliye Servisi",
                isteyen_hemsire_id=hemsire_p.id if hemsire_p else None,
                durum=IlacTalepDurumu.ONAY_BEKLIYOR,
                acil_mi=True,
            )
            session.add(talep2)
            session.flush()
            ilac2 = ilaclar[1] if len(ilaclar) > 1 else ilaclar[0]
            session.add(
                IlacTalepKalemi(
                    talep_id=talep2.id,
                    ilac_id=ilac2.id,
                    urun_kodu=ilac2.barkod or "ILAC-02",
                    urun_adi=ilac2.ad,
                    istenen_miktar=2,
                    verilen_miktar=0,
                    kullanim_sekli=KullanimSekli.IV,
                    periyod="günde 2",
                    doz="1 g",
                    olcu_birimi="flakon",
                    uygulama_suresi="1 gün",
                )
            )

    session.commit()
    seed_hemsire_klinik(session)
    seed_hemsire_klinik_moduller(session)


def seed_hemsire_klinik(session: Session) -> None:
    """Vital/MAR/görev/devir/bildirim — ayrı idempotent."""
    if session.exec(select(VitalBulgu)).first():
        seed_hemsire_klinik_moduller(session)
        return

    yatis = session.exec(select(YatisKaydi).where(YatisKaydi.aktif_mi == True)).first()  # noqa: E712
    hemsire_user = session.exec(
        select(Kullanici).where(Kullanici.email == "hemsire@hastane.example.com")
    ).first()
    hemsire_p = None
    if hemsire_user:
        hemsire_p = session.exec(
            select(Personel).where(Personel.kullanici_id == hemsire_user.id)
        ).first()
    if yatis is None or hemsire_p is None or hemsire_user is None:
        return

    now = datetime.now(timezone.utc)
    session.add(
        VitalBulgu(
            yatis_id=yatis.id,
            olcum_zamani=now - timedelta(hours=4),
            tansiyon_sistolik=120,
            tansiyon_diastolik=80,
            nabiz=78,
            ates=36.8,
            solunum=16,
            spo2=98,
            agri_skoru=2,
            giren_hemsire_id=hemsire_p.id,
            notlar="SEED vital",
        )
    )
    session.add(
        VitalBulgu(
            yatis_id=yatis.id,
            olcum_zamani=now - timedelta(hours=1),
            tansiyon_sistolik=118,
            tansiyon_diastolik=76,
            nabiz=82,
            ates=37.1,
            solunum=18,
            spo2=97,
            agri_skoru=1,
            giren_hemsire_id=hemsire_p.id,
        )
    )
    session.add(
        IlacUygulama(
            yatis_id=yatis.id,
            ilac_adi="Parol 500 mg",
            doz="1 tablet",
            kullanim_sekli=KullanimSekli.ORAL.value,
            planlanan_saat=now.replace(minute=0, second=0) + timedelta(hours=1),
            durum=IlacUygulamaDurumu.BEKLIYOR.value,
        )
    )
    session.add(
        IlacUygulama(
            yatis_id=yatis.id,
            ilac_adi="Serum fizyolojik",
            doz="500 ml",
            kullanim_sekli=KullanimSekli.IV.value,
            planlanan_saat=now - timedelta(hours=2),
            durum=IlacUygulamaDurumu.VERILDI.value,
            uygulayan_hemsire_id=hemsire_p.id,
            uygulandi_at=now - timedelta(hours=2),
        )
    )
    session.add(
        HastaNotu(
            yatis_id=yatis.id,
            yazar_id=hemsire_user.id,
            metin="SEED: Hasta genel durumu iyi, oral alım devam ediyor.",
        )
    )
    session.add(
        HemsireGorevi(
            baslik="Vital ölçümü tekrarla",
            yatis_id=yatis.id,
            atanan_hemsire_id=hemsire_p.id,
            son_tarih=now + timedelta(hours=2),
            tamamlandi_mi=False,
        )
    )
    session.add(
        HemsireGorevi(
            baslik="Yara pansumanı",
            yatis_id=yatis.id,
            atanan_hemsire_id=hemsire_p.id,
            son_tarih=now - timedelta(hours=1),
            tamamlandi_mi=True,
            tamamlandi_at=now - timedelta(minutes=30),
        )
    )
    session.add(
        VardiyaDevirNotu(
            yazar_id=hemsire_user.id,
            metin=f"SEED: Yatak {yatis.yatak_id} — gece ateşi hafif yükseldi, takip edilsin.",
            yatis_id=yatis.id,
            vardiya_tarihi=now.date(),
        )
    )
    session.add(
        PanelBildirim(
            alici_id=hemsire_user.id,
            baslik="Hoş geldiniz",
            govde="Hemşire paneli klinik bildirimleri aktif.",
            tip=PanelBildirimTipi.GENEL.value,
            okundu_mu=False,
        )
    )
    session.commit()
    seed_hemsire_klinik_moduller(session)


def seed_hemsire_klinik_moduller(session: Session) -> None:
    """Epikriz + tetkik demo — idempotent."""
    from app.core.enums import EpikrizDurumu
    from app.features.epikriz.models import Epikriz
    from app.features.tetkikler.models import Tetkik

    if session.exec(select(Epikriz)).first():
        return

    yatislar = list(
        session.exec(select(YatisKaydi).where(YatisKaydi.aktif_mi == True)).all()  # noqa: E712
    )
    hemsire_user = session.exec(
        select(Kullanici).where(Kullanici.email == "hemsire@hastane.example.com")
    ).first()
    doktorlar = list(session.exec(select(Doktor)).all())
    if not yatislar or hemsire_user is None or not doktorlar:
        return

    y0 = yatislar[0]
    y1 = yatislar[1] if len(yatislar) > 1 else yatislar[0]
    dok = doktorlar[0]

    session.add(
        Epikriz(
            yatis_id=y0.id,
            hasta_id=y0.hasta_id,
            yazar_id=hemsire_user.id,
            durum=EpikrizDurumu.TASLAK.value,
            sikayet_oyku="SEED: Göğüs ağrısı ve halsizlik.",
            fizik_muayene="SEED: Vital stabil.",
            tani="SEED: Takipte.",
            tedavi_ozeti="SEED: Destek tedavi.",
            taburcu_onerileri=None,
        )
    )
    session.add(
        Epikriz(
            yatis_id=y1.id,
            hasta_id=y1.hasta_id,
            yazar_id=hemsire_user.id,
            durum=EpikrizDurumu.ONAYLANDI.value,
            sikayet_oyku="SEED: Post-op takip.",
            tani="SEED: Operasyon sonrası iyileşme.",
            tedavi_ozeti="SEED: Analjezi + antibiyotik.",
            taburcu_onerileri="SEED: Kontrole 1 hafta sonra.",
            onaylayan_doktor_id=dok.id,
            onaylandi_at=datetime.now(timezone.utc),
        )
    )

    existing_tetkik = session.exec(
        select(Tetkik).where(Tetkik.tetkik_turu == "SEED Hemogram")
    ).first()
    if not existing_tetkik:
        session.add(
            Tetkik(
                hasta_id=y0.hasta_id,
                istek_yapan_doktor_id=dok.id,
                tetkik_turu="SEED Hemogram",
                durum="ISTEK_ALINDI",
            )
        )
        session.add(
            Tetkik(
                hasta_id=y0.hasta_id,
                istek_yapan_doktor_id=dok.id,
                tetkik_turu="SEED Biyokimya",
                durum="SONUCLANDI",
                sonuc_dosyasi="/seed/biyokimya.pdf",
            )
        )
        if y1.hasta_id != y0.hasta_id:
            session.add(
                Tetkik(
                    hasta_id=y1.hasta_id,
                    istek_yapan_doktor_id=dok.id,
                    tetkik_turu="SEED Akciğer grafisi",
                    durum="ISTEK_ALINDI",
                )
            )

    session.commit()
