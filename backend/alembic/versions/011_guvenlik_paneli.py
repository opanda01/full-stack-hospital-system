"""Güvenlik paneli tabloları.

Revision ID: 011_guvenlik_paneli
Revises: 010_hemsire_klinik_moduller
Create Date: 2026-07-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "011_guvenlik_paneli"
down_revision: Union[str, None] = "010_hemsire_klinik_moduller"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "guvenlik_olaylari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("tip", sa.String(length=30), nullable=False),
        sa.Column("durum", sa.String(length=30), nullable=False),
        sa.Column("yer", sa.String(length=200), nullable=False),
        sa.Column("ozet", sa.String(length=2000), nullable=False),
        sa.Column("mudahale_notu", sa.String(length=2000), nullable=True),
        sa.Column("olay_zamani", sa.DateTime(timezone=True), nullable=False),
        sa.Column("olusturan_id", sa.Integer(), nullable=False),
        sa.Column("beyaz_kod_referans", sa.String(length=100), nullable=True),
        sa.Column("kolluk_bilgilendirildi", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["olusturan_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_guvenlik_olaylari_tip", "guvenlik_olaylari", ["tip"])
    op.create_index("ix_guvenlik_olaylari_durum", "guvenlik_olaylari", ["durum"])
    op.create_index(
        "ix_guvenlik_olaylari_olay_zamani", "guvenlik_olaylari", ["olay_zamani"]
    )
    op.create_index(
        "ix_guvenlik_olaylari_olusturan_id", "guvenlik_olaylari", ["olusturan_id"]
    )

    op.create_table(
        "guvenlik_ziyaretciler",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ad_soyad", sa.String(length=150), nullable=False),
        sa.Column("tc_kimlik", sa.String(length=11), nullable=True),
        sa.Column("ziyaret_edilen", sa.String(length=150), nullable=False),
        sa.Column("servis", sa.String(length=100), nullable=True),
        sa.Column("yatis_id", sa.Integer(), nullable=True),
        sa.Column("giris_zamani", sa.DateTime(timezone=True), nullable=False),
        sa.Column("cikis_zamani", sa.DateTime(timezone=True), nullable=True),
        sa.Column("kaydeden_id", sa.Integer(), nullable=False),
        sa.Column("notlar", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.ForeignKeyConstraint(["kaydeden_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_guvenlik_ziyaretciler_tc_kimlik", "guvenlik_ziyaretciler", ["tc_kimlik"]
    )
    op.create_index(
        "ix_guvenlik_ziyaretciler_yatis_id", "guvenlik_ziyaretciler", ["yatis_id"]
    )
    op.create_index(
        "ix_guvenlik_ziyaretciler_giris_zamani",
        "guvenlik_ziyaretciler",
        ["giris_zamani"],
    )
    op.create_index(
        "ix_guvenlik_ziyaretciler_kaydeden_id",
        "guvenlik_ziyaretciler",
        ["kaydeden_id"],
    )

    op.create_table(
        "kayip_esyalar",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("tanim", sa.String(length=300), nullable=False),
        sa.Column("bulunan_yer", sa.String(length=200), nullable=False),
        sa.Column("bulunan_tarih", sa.DateTime(timezone=True), nullable=False),
        sa.Column("durum", sa.String(length=30), nullable=False),
        sa.Column("teslim_alan", sa.String(length=150), nullable=True),
        sa.Column("kaydeden_id", sa.Integer(), nullable=False),
        sa.Column("notlar", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["kaydeden_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_kayip_esyalar_bulunan_tarih", "kayip_esyalar", ["bulunan_tarih"])
    op.create_index("ix_kayip_esyalar_durum", "kayip_esyalar", ["durum"])
    op.create_index("ix_kayip_esyalar_kaydeden_id", "kayip_esyalar", ["kaydeden_id"])

    op.create_table(
        "guvenlik_devriyeler",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bolge", sa.String(length=150), nullable=False),
        sa.Column("baslangic", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bitis", sa.DateTime(timezone=True), nullable=True),
        sa.Column("bulgu", sa.String(length=2000), nullable=True),
        sa.Column("personel_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["personel_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_guvenlik_devriyeler_baslangic", "guvenlik_devriyeler", ["baslangic"]
    )
    op.create_index(
        "ix_guvenlik_devriyeler_personel_id", "guvenlik_devriyeler", ["personel_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_guvenlik_devriyeler_personel_id", table_name="guvenlik_devriyeler")
    op.drop_index("ix_guvenlik_devriyeler_baslangic", table_name="guvenlik_devriyeler")
    op.drop_table("guvenlik_devriyeler")

    op.drop_index("ix_kayip_esyalar_kaydeden_id", table_name="kayip_esyalar")
    op.drop_index("ix_kayip_esyalar_durum", table_name="kayip_esyalar")
    op.drop_index("ix_kayip_esyalar_bulunan_tarih", table_name="kayip_esyalar")
    op.drop_table("kayip_esyalar")

    op.drop_index(
        "ix_guvenlik_ziyaretciler_kaydeden_id", table_name="guvenlik_ziyaretciler"
    )
    op.drop_index(
        "ix_guvenlik_ziyaretciler_giris_zamani", table_name="guvenlik_ziyaretciler"
    )
    op.drop_index("ix_guvenlik_ziyaretciler_yatis_id", table_name="guvenlik_ziyaretciler")
    op.drop_index(
        "ix_guvenlik_ziyaretciler_tc_kimlik", table_name="guvenlik_ziyaretciler"
    )
    op.drop_table("guvenlik_ziyaretciler")

    op.drop_index("ix_guvenlik_olaylari_olusturan_id", table_name="guvenlik_olaylari")
    op.drop_index("ix_guvenlik_olaylari_olay_zamani", table_name="guvenlik_olaylari")
    op.drop_index("ix_guvenlik_olaylari_durum", table_name="guvenlik_olaylari")
    op.drop_index("ix_guvenlik_olaylari_tip", table_name="guvenlik_olaylari")
    op.drop_table("guvenlik_olaylari")
