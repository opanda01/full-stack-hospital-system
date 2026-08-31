"""Basit tablo PDF — reportlab ile."""

import io
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.features.raporlar.schemas import (
    FinansRaporRead,
    KlinikRaporRead,
    RandevuRaporRead,
    YatakRaporRead,
    YatisRaporRead,
)


def _dagilim_table(baslik: str, items: list[Any]) -> list:
    elements = [Paragraph(baslik, getSampleStyleSheet()["Heading3"]), Spacer(1, 6)]
    data = [["Etiket", "Değer"]] + [[i.etiket, str(i.deger)] for i in items]
    table = Table(data, colWidths=[280, 80])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
            ]
        )
    )
    elements.append(table)
    elements.append(Spacer(1, 12))
    return elements


def _pdf_bytes(title: str, elements: list) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    story = [Paragraph(title, getSampleStyleSheet()["Title"]), Spacer(1, 12)]
    story.extend(elements)
    doc.build(story)
    return buf.getvalue()


def randevu_pdf(data: RandevuRaporRead) -> bytes:
    ozet = Table(
        [
            ["Başlangıç", data.baslangic.isoformat()],
            ["Bitiş", data.bitis.isoformat()],
            ["Toplam", str(data.toplam)],
            ["No-show", str(data.no_show)],
        ],
        colWidths=[120, 200],
    )
    ozet.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.grey)]))
    elements = [ozet, Spacer(1, 12)]
    elements.extend(_dagilim_table("Durum dağılımı", data.durum_dagilimi))
    elements.extend(_dagilim_table("Departman dağılımı", data.departman_dagilimi))
    return _pdf_bytes("Randevu Raporu", elements)


def yatis_pdf(data: YatisRaporRead) -> bytes:
    ozet = Table(
        [
            ["Aktif yatış", str(data.aktif_yatis)],
            ["Ortalama LOS (gün)", str(data.ortalama_los_gun)],
        ],
        colWidths=[160, 160],
    )
    ozet.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.grey)]))
    elements = [ozet, Spacer(1, 12)]
    servis_data = [["Servis", "Dolu", "Toplam", "Oran"]] + [
        [s.servis_adi, str(s.dolu), str(s.toplam), f"{s.oran:.0%}"] for s in data.servis_doluluk
    ]
    t = Table(servis_data, colWidths=[180, 60, 60, 60])
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.grey)]))
    elements.extend([Paragraph("Servis doluluk", getSampleStyleSheet()["Heading3"]), t])
    return _pdf_bytes("Yatış Raporu", elements)


def yatak_pdf(data: YatakRaporRead) -> bytes:
    ozet = Table(
        [
            ["Dolu", str(data.dolu)],
            ["Boş", str(data.bos)],
            ["Temizlik bekleyen", str(data.temizlik_bekleyen)],
            ["Arızalı", str(data.arizali)],
        ],
        colWidths=[160, 160],
    )
    ozet.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.grey)]))
    elements = [ozet, Spacer(1, 12)]
    elements.extend(_dagilim_table("İzolasyon dağılımı", data.izolasyon_dagilimi))
    return _pdf_bytes("Yatak Raporu", elements)


def finans_pdf(data: FinansRaporRead) -> bytes:
    ozet = Table(
        [
            ["Fatura sayısı", str(data.fatura_toplam)],
            ["Toplam tutar", str(data.toplam_tutar)],
            ["Döner gelir", str(data.doner_gelir)],
            ["Döner gider", str(data.doner_gider)],
        ],
        colWidths=[160, 160],
    )
    ozet.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.grey)]))
    elements = [ozet, Spacer(1, 12)]
    elements.extend(_dagilim_table("Fatura durum", data.fatura_durum_dagilimi))
    return _pdf_bytes("Finans Raporu", elements)


def klinik_pdf(data: KlinikRaporRead) -> bytes:
    ozet = Table(
        [
            ["Şikayet bekleyen", str(data.sikayet_bekleyen)],
            ["Epikriz onay bekleyen", str(data.epikriz_onay_bekleyen)],
            ["No-show hasta", str(data.no_show_hasta)],
        ],
        colWidths=[180, 140],
    )
    ozet.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.grey)]))
    elements = [ozet, Spacer(1, 12)]
    elements.extend(_dagilim_table("Tetkik durum", data.tetkik_durum_dagilimi))
    elements.extend(_dagilim_table("Triyaj renk", data.triyaj_renk_dagilimi))
    return _pdf_bytes("Klinik KPI Raporu", elements)
