"""Hemşire paneli: servis yatış + ilaç talep tabloları.

Revision ID: 008_hemsire_yatis
Revises: 007_doktor_panel
Create Date: 2026-07-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008_hemsire_yatis"
down_revision: Union[str, None] = "007_doktor_panel"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "servisler",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ad", sa.String(length=150), nullable=False),
        sa.Column("kod", sa.String(length=50), nullable=False),
        sa.Column("kat_no", sa.Integer(), nullable=True),
        sa.Column("departman_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["departman_id"], ["departmanlar.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("kod"),
    )
    op.create_index("ix_servisler_ad", "servisler", ["ad"])
    op.create_index("ix_servisler_kod", "servisler", ["kod"])
    op.create_index("ix_servisler_departman_id", "servisler", ["departman_id"])

    op.create_table(
        "yataklar",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("servis_id", sa.Integer(), nullable=False),
        sa.Column("oda_no", sa.String(length=30), nullable=False),
        sa.Column("yatak_no", sa.String(length=30), nullable=False),
        sa.Column("dolu_mu", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["servis_id"], ["servisler.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_yataklar_servis_id", "yataklar", ["servis_id"])
    op.create_index("ix_yataklar_dolu_mu", "yataklar", ["dolu_mu"])

    op.create_table(
        "yatis_kayitlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("hasta_id", sa.Integer(), nullable=False),
        sa.Column("servis_id", sa.Integer(), nullable=False),
        sa.Column("yatak_id", sa.Integer(), nullable=True),
        sa.Column("protokol_no", sa.String(length=50), nullable=False),
        sa.Column("basvuru_no", sa.String(length=50), nullable=True),
        sa.Column("dosya_no", sa.String(length=50), nullable=True),
        sa.Column("muracaat_tarihi", sa.Date(), nullable=True),
        sa.Column("yatis_tarihi", sa.DateTime(), nullable=False),
        sa.Column("cikis_tarihi", sa.DateTime(), nullable=True),
        sa.Column("sigorta_turu", sa.String(length=100), nullable=True),
        sa.Column("klinik_durum", sa.String(length=30), nullable=False),
        sa.Column("sorumlu_doktor_id", sa.Integer(), nullable=True),
        sa.Column("sorumlu_hemsire_id", sa.Integer(), nullable=True),
        sa.Column("kontrol_edildi_mi", sa.Boolean(), nullable=False),
        sa.Column("aktif_mi", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.ForeignKeyConstraint(["servis_id"], ["servisler.id"]),
        sa.ForeignKeyConstraint(["yatak_id"], ["yataklar.id"]),
        sa.ForeignKeyConstraint(["sorumlu_doktor_id"], ["doktorlar.id"]),
        sa.ForeignKeyConstraint(["sorumlu_hemsire_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_yatis_kayitlari_hasta_id", "yatis_kayitlari", ["hasta_id"])
    op.create_index("ix_yatis_kayitlari_servis_id", "yatis_kayitlari", ["servis_id"])
    op.create_index("ix_yatis_kayitlari_yatak_id", "yatis_kayitlari", ["yatak_id"])
    op.create_index("ix_yatis_kayitlari_protokol_no", "yatis_kayitlari", ["protokol_no"])
    op.create_index("ix_yatis_kayitlari_yatis_tarihi", "yatis_kayitlari", ["yatis_tarihi"])
    op.create_index("ix_yatis_kayitlari_klinik_durum", "yatis_kayitlari", ["klinik_durum"])
    op.create_index(
        "ix_yatis_kayitlari_sorumlu_doktor_id", "yatis_kayitlari", ["sorumlu_doktor_id"]
    )
    op.create_index(
        "ix_yatis_kayitlari_sorumlu_hemsire_id",
        "yatis_kayitlari",
        ["sorumlu_hemsire_id"],
    )
    op.create_index("ix_yatis_kayitlari_aktif_mi", "yatis_kayitlari", ["aktif_mi"])

    op.create_table(
        "servis_hareketleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=False),
        sa.Column("eski_servis_id", sa.Integer(), nullable=True),
        sa.Column("yeni_servis_id", sa.Integer(), nullable=False),
        sa.Column("tarih", sa.DateTime(), nullable=False),
        sa.Column("aciklama", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.ForeignKeyConstraint(["eski_servis_id"], ["servisler.id"]),
        sa.ForeignKeyConstraint(["yeni_servis_id"], ["servisler.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_servis_hareketleri_yatis_id", "servis_hareketleri", ["yatis_id"])

    op.create_table(
        "yatak_hareketleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=False),
        sa.Column("eski_yatak_id", sa.Integer(), nullable=True),
        sa.Column("yeni_yatak_id", sa.Integer(), nullable=False),
        sa.Column("tarih", sa.DateTime(), nullable=False),
        sa.Column("aciklama", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.ForeignKeyConstraint(["eski_yatak_id"], ["yataklar.id"]),
        sa.ForeignKeyConstraint(["yeni_yatak_id"], ["yataklar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_yatak_hareketleri_yatis_id", "yatak_hareketleri", ["yatis_id"])

    op.create_table(
        "izin_hareketleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=False),
        sa.Column("baslangic", sa.DateTime(), nullable=False),
        sa.Column("bitis", sa.DateTime(), nullable=True),
        sa.Column("aciklama", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_izin_hareketleri_yatis_id", "izin_hareketleri", ["yatis_id"])

    op.create_table(
        "ameliyat_bilgileri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=False),
        sa.Column("tarih", sa.DateTime(), nullable=False),
        sa.Column("ameliyat_adi", sa.String(length=255), nullable=False),
        sa.Column("notlar", sa.String(length=2000), nullable=True),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ameliyat_bilgileri_yatis_id", "ameliyat_bilgileri", ["yatis_id"])

    op.create_table(
        "refakatciler",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=False),
        sa.Column("ad_soyad", sa.String(length=150), nullable=False),
        sa.Column("yakinlik", sa.String(length=100), nullable=True),
        sa.Column("telefon", sa.String(length=30), nullable=True),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("yatis_id"),
    )
    op.create_index("ix_refakatciler_yatis_id", "refakatciler", ["yatis_id"])

    op.create_table(
        "hasta_islem_loglari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=False),
        sa.Column("yapan_kullanici_id", sa.Integer(), nullable=False),
        sa.Column("islem_tipi", sa.String(length=50), nullable=False),
        sa.Column("detay", sa.String(length=2000), nullable=True),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.ForeignKeyConstraint(["yapan_kullanici_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_hasta_islem_loglari_yatis_id", "hasta_islem_loglari", ["yatis_id"]
    )
    op.create_index(
        "ix_hasta_islem_loglari_yapan_kullanici_id",
        "hasta_islem_loglari",
        ["yapan_kullanici_id"],
    )
    op.create_index(
        "ix_hasta_islem_loglari_islem_tipi", "hasta_islem_loglari", ["islem_tipi"]
    )

    op.create_table(
        "ilac_talepleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=False),
        sa.Column("hasta_id", sa.Integer(), nullable=False),
        sa.Column("servis_id", sa.Integer(), nullable=False),
        sa.Column("istek_tarihi", sa.DateTime(), nullable=False),
        sa.Column("isteyen_doktor_id", sa.Integer(), nullable=True),
        sa.Column("isteyen_birim", sa.String(length=150), nullable=True),
        sa.Column("isteyen_hemsire_id", sa.Integer(), nullable=True),
        sa.Column("durum", sa.String(length=30), nullable=False),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.ForeignKeyConstraint(["servis_id"], ["servisler.id"]),
        sa.ForeignKeyConstraint(["isteyen_doktor_id"], ["doktorlar.id"]),
        sa.ForeignKeyConstraint(["isteyen_hemsire_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ilac_talepleri_yatis_id", "ilac_talepleri", ["yatis_id"])
    op.create_index("ix_ilac_talepleri_hasta_id", "ilac_talepleri", ["hasta_id"])
    op.create_index("ix_ilac_talepleri_servis_id", "ilac_talepleri", ["servis_id"])
    op.create_index("ix_ilac_talepleri_istek_tarihi", "ilac_talepleri", ["istek_tarihi"])
    op.create_index("ix_ilac_talepleri_durum", "ilac_talepleri", ["durum"])

    op.create_table(
        "ilac_talep_kalemleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("talep_id", sa.Integer(), nullable=False),
        sa.Column("ilac_id", sa.Integer(), nullable=True),
        sa.Column("urun_kodu", sa.String(length=64), nullable=False),
        sa.Column("urun_adi", sa.String(length=200), nullable=False),
        sa.Column("istenen_miktar", sa.Float(), nullable=False),
        sa.Column("verilen_miktar", sa.Float(), nullable=False),
        sa.Column("kullanim_sekli", sa.String(length=30), nullable=False),
        sa.Column("periyod", sa.String(length=100), nullable=True),
        sa.Column("doz", sa.String(length=100), nullable=True),
        sa.Column("olcu_birimi", sa.String(length=50), nullable=True),
        sa.Column("uygulama_suresi", sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(["talep_id"], ["ilac_talepleri.id"]),
        sa.ForeignKeyConstraint(["ilac_id"], ["ilaclar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_ilac_talep_kalemleri_talep_id", "ilac_talep_kalemleri", ["talep_id"]
    )
    op.create_index(
        "ix_ilac_talep_kalemleri_ilac_id", "ilac_talep_kalemleri", ["ilac_id"]
    )


def downgrade() -> None:
    op.drop_table("ilac_talep_kalemleri")
    op.drop_table("ilac_talepleri")
    op.drop_table("hasta_islem_loglari")
    op.drop_table("refakatciler")
    op.drop_table("ameliyat_bilgileri")
    op.drop_table("izin_hareketleri")
    op.drop_table("yatak_hareketleri")
    op.drop_table("servis_hareketleri")
    op.drop_table("yatis_kayitlari")
    op.drop_table("yataklar")
    op.drop_table("servisler")
