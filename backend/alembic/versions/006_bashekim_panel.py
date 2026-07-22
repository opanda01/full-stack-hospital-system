"""Bashekim paneli: erisim alanlari + HBYS gozetim tablolari.

Revision ID: 006_bashekim_panel
Revises: 005_birimler
Create Date: 2026-07-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006_bashekim_panel"
down_revision: Union[str, None] = "005_birimler"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "kullanicilar",
        sa.Column(
            "erisim_durumu",
            sa.String(length=20),
            nullable=False,
            server_default="ONAYLANDI",
        ),
    )
    op.add_column(
        "kullanicilar",
        sa.Column(
            "erisim_kaynak_tipi",
            sa.String(length=20),
            nullable=False,
            server_default="KURUM",
        ),
    )
    op.add_column(
        "kullanicilar",
        sa.Column("erisim_firma_adi", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "kullanicilar",
        sa.Column("erisim_red_gerekce", sa.String(length=1000), nullable=True),
    )
    op.add_column(
        "kullanicilar",
        sa.Column("erisim_onaylayan_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "kullanicilar",
        sa.Column("erisim_onay_tarihi", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_kullanicilar_erisim_durumu", "kullanicilar", ["erisim_durumu"])
    op.execute(
        "UPDATE kullanicilar SET erisim_durumu = 'ONAYLANDI' WHERE aktif_mi = true"
    )
    op.execute(
        "UPDATE kullanicilar SET erisim_durumu = 'REDDEDILDI' WHERE aktif_mi = false"
    )

    op.create_table(
        "mhrs_kapasiteler",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("departman_id", sa.Integer(), nullable=False),
        sa.Column("doktor_id", sa.Integer(), nullable=True),
        sa.Column("tarih", sa.Date(), nullable=False),
        sa.Column("slot_sayisi", sa.Integer(), nullable=False, server_default="16"),
        sa.Column("kaynak", sa.String(length=20), nullable=False, server_default="MOCK"),
        sa.Column("son_senkron", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["departman_id"], ["departmanlar.id"]),
        sa.ForeignKeyConstraint(["doktor_id"], ["doktorlar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_mhrs_kapasiteler_departman_id", "mhrs_kapasiteler", ["departman_id"])
    op.create_index("ix_mhrs_kapasiteler_tarih", "mhrs_kapasiteler", ["tarih"])

    op.create_table(
        "entegrasyon_durumlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sistem", sa.String(length=40), nullable=False),
        sa.Column("durum", sa.String(length=20), nullable=False, server_default="BILINMIYOR"),
        sa.Column("son_senkron", sa.DateTime(), nullable=True),
        sa.Column("hata_ozeti", sa.String(length=1000), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sistem"),
    )

    op.create_table(
        "klinik_onay_kayitlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("tur", sa.String(length=20), nullable=False),
        sa.Column("muayene_id", sa.Integer(), nullable=True),
        sa.Column("hasta_id", sa.Integer(), nullable=True),
        sa.Column("icerik", sa.String(length=4000), nullable=False),
        sa.Column("onay_durumu", sa.String(length=20), nullable=False, server_default="BEKLEMEDE"),
        sa.Column("olusturan_id", sa.Integer(), nullable=True),
        sa.Column("onaylayan_id", sa.Integer(), nullable=True),
        sa.Column("onay_tarihi", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["muayene_id"], ["muayene_kayitlari.id"]),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_klinik_onay_durumu", "klinik_onay_kayitlari", ["onay_durumu"])

    op.create_table(
        "ilaclar",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ad", sa.String(length=200), nullable=False),
        sa.Column("barkod", sa.String(length=64), nullable=True),
        sa.Column("stok", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("kritik_stok", sa.Integer(), nullable=False, server_default="10"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "faturalar",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("hasta_id", sa.Integer(), nullable=True),
        sa.Column("tutar", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("durum", sa.String(length=30), nullable=False, server_default="TASLAK"),
        sa.Column("aciklama", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "doner_sermaye_kayitlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("donem", sa.String(length=20), nullable=False),
        sa.Column("gelir", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("gider", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("aciklama", sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "yetki_devri_kayitlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("veren_id", sa.Integer(), nullable=False),
        sa.Column("alan_personel_id", sa.Integer(), nullable=False),
        sa.Column("baslangic", sa.DateTime(), nullable=False),
        sa.Column("bitis", sa.DateTime(), nullable=False),
        sa.Column("izin_kodlari", sa.String(length=2000), nullable=True),
        sa.Column("duyuru_metni", sa.String(length=4000), nullable=False),
        sa.Column("aktif_mi", sa.Boolean(), nullable=False, server_default="true"),
        sa.ForeignKeyConstraint(["veren_id"], ["kullanicilar.id"]),
        sa.ForeignKeyConstraint(["alan_personel_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("yetki_devri_kayitlari")
    op.drop_table("doner_sermaye_kayitlari")
    op.drop_table("faturalar")
    op.drop_table("ilaclar")
    op.drop_table("klinik_onay_kayitlari")
    op.drop_table("entegrasyon_durumlari")
    op.drop_table("mhrs_kapasiteler")
    op.drop_index("ix_kullanicilar_erisim_durumu", table_name="kullanicilar")
    op.drop_column("kullanicilar", "erisim_onay_tarihi")
    op.drop_column("kullanicilar", "erisim_onaylayan_id")
    op.drop_column("kullanicilar", "erisim_red_gerekce")
    op.drop_column("kullanicilar", "erisim_firma_adi")
    op.drop_column("kullanicilar", "erisim_kaynak_tipi")
    op.drop_column("kullanicilar", "erisim_durumu")
