"""CSV export — streaming text/csv yanıtı için satır üretici."""

import csv
import io
from typing import Any

from app.features.raporlar.schemas import (
    FinansRaporRead,
    KlinikRaporRead,
    RandevuRaporRead,
    YatakRaporRead,
    YatisRaporRead,
)


def _dagilim_rows(baslik: str, items: list[Any]) -> list[list[str]]:
    rows = [[baslik, "etiket", "deger"]]
    for item in items:
        rows.append(["", item.etiket, str(item.deger)])
    return rows


def randevu_csv(data: RandevuRaporRead) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["metrik", "deger"])
    writer.writerow(["baslangic", data.baslangic.isoformat()])
    writer.writerow(["bitis", data.bitis.isoformat()])
    writer.writerow(["toplam", data.toplam])
    writer.writerow(["no_show", data.no_show])
    writer.writerow([])
    for row in _dagilim_rows("durum", data.durum_dagilimi):
        writer.writerow(row)
    writer.writerow([])
    writer.writerow(["gun", "adet"])
    for g in data.gunluk_adet:
        writer.writerow([g.tarih, g.adet])
    writer.writerow([])
    for row in _dagilim_rows("departman", data.departman_dagilimi):
        writer.writerow(row)
    return buf.getvalue()


def yatis_csv(data: YatisRaporRead) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["metrik", "deger"])
    writer.writerow(["aktif_yatis", data.aktif_yatis])
    writer.writerow(["ortalama_los_gun", data.ortalama_los_gun])
    writer.writerow([])
    writer.writerow(["servis", "dolu", "toplam", "oran"])
    for s in data.servis_doluluk:
        writer.writerow([s.servis_adi, s.dolu, s.toplam, s.oran])
    writer.writerow([])
    writer.writerow(["gun", "adet"])
    for g in data.gunluk_yatis:
        writer.writerow([g.tarih, g.adet])
    return buf.getvalue()


def yatak_csv(data: YatakRaporRead) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["metrik", "deger"])
    writer.writerow(["dolu", data.dolu])
    writer.writerow(["bos", data.bos])
    writer.writerow(["temizlik_bekleyen", data.temizlik_bekleyen])
    writer.writerow(["arizali", data.arizali])
    writer.writerow([])
    for row in _dagilim_rows("izolasyon", data.izolasyon_dagilimi):
        writer.writerow(row)
    return buf.getvalue()


def finans_csv(data: FinansRaporRead) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["metrik", "deger"])
    writer.writerow(["fatura_toplam", data.fatura_toplam])
    writer.writerow(["toplam_tutar", str(data.toplam_tutar)])
    writer.writerow(["doner_gelir", str(data.doner_gelir)])
    writer.writerow(["doner_gider", str(data.doner_gider)])
    writer.writerow([])
    for row in _dagilim_rows("fatura_durum", data.fatura_durum_dagilimi):
        writer.writerow(row)
    return buf.getvalue()


def klinik_csv(data: KlinikRaporRead) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["metrik", "deger"])
    writer.writerow(["sikayet_bekleyen", data.sikayet_bekleyen])
    writer.writerow(["epikriz_onay_bekleyen", data.epikriz_onay_bekleyen])
    writer.writerow(["no_show_hasta", data.no_show_hasta])
    writer.writerow([])
    for row in _dagilim_rows("tetkik_durum", data.tetkik_durum_dagilimi):
        writer.writerow(row)
    writer.writerow([])
    for row in _dagilim_rows("triyaj_renk", data.triyaj_renk_dagilimi):
        writer.writerow(row)
    return buf.getvalue()
