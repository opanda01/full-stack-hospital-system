"""Hemşire klinik: vital, MAR, not, görev, vardiya devir, panel bildirim.

Revision ID: 009_hemsire_klinik
Revises: 008_hemsire_yatis
Create Date: 2026-07-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009_hemsire_klinik"
down_revision: Union[str, None] = "008_hemsire_yatis"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ilac_talepleri",
        sa.Column("acil_mi", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_ilac_talepleri_acil_mi", "ilac_talepleri", ["acil_mi"])

    op.create_table(
        "vital_bulgular",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=False),
        sa.Column("olcum_zamani", sa.DateTime(), nullable=False),
        sa.Column("tansiyon_sistolik", sa.Integer(), nullable=True),
        sa.Column("tansiyon_diastolik", sa.Integer(), nullable=True),
        sa.Column("nabiz", sa.Integer(), nullable=True),
        sa.Column("ates", sa.Float(), nullable=True),
        sa.Column("solunum", sa.Integer(), nullable=True),
        sa.Column("spo2", sa.Integer(), nullable=True),
        sa.Column("agri_skoru", sa.Integer(), nullable=True),
        sa.Column("giren_hemsire_id", sa.Integer(), nullable=True),
        sa.Column("notlar", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.ForeignKeyConstraint(["giren_hemsire_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_vital_bulgular_yatis_id", "vital_bulgular", ["yatis_id"])
    op.create_index("ix_vital_bulgular_olcum_zamani", "vital_bulgular", ["olcum_zamani"])

    op.create_table(
        "ilac_uygulamalari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=False),
        sa.Column("ilac_adi", sa.String(length=200), nullable=False),
        sa.Column("doz", sa.String(length=100), nullable=True),
        sa.Column("kullanim_sekli", sa.String(length=30), nullable=False),
        sa.Column("planlanan_saat", sa.DateTime(), nullable=False),
        sa.Column("durum", sa.String(length=30), nullable=False),
        sa.Column("uygulayan_hemsire_id", sa.Integer(), nullable=True),
        sa.Column("uygulandi_at", sa.DateTime(), nullable=True),
        sa.Column("notlar", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.ForeignKeyConstraint(["uygulayan_hemsire_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ilac_uygulamalari_yatis_id", "ilac_uygulamalari", ["yatis_id"])
    op.create_index(
        "ix_ilac_uygulamalari_planlanan_saat", "ilac_uygulamalari", ["planlanan_saat"]
    )
    op.create_index("ix_ilac_uygulamalari_durum", "ilac_uygulamalari", ["durum"])

    op.create_table(
        "hasta_notlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=False),
        sa.Column("yazar_id", sa.Integer(), nullable=False),
        sa.Column("metin", sa.String(length=2000), nullable=False),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.ForeignKeyConstraint(["yazar_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_hasta_notlari_yatis_id", "hasta_notlari", ["yatis_id"])

    op.create_table(
        "hemsire_gorevleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("baslik", sa.String(length=255), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=True),
        sa.Column("atanan_hemsire_id", sa.Integer(), nullable=False),
        sa.Column("son_tarih", sa.DateTime(), nullable=False),
        sa.Column("tamamlandi_mi", sa.Boolean(), nullable=False),
        sa.Column("tamamlandi_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.ForeignKeyConstraint(["atanan_hemsire_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_hemsire_gorevleri_atanan_hemsire_id",
        "hemsire_gorevleri",
        ["atanan_hemsire_id"],
    )
    op.create_index(
        "ix_hemsire_gorevleri_tamamlandi_mi", "hemsire_gorevleri", ["tamamlandi_mi"]
    )

    op.create_table(
        "vardiya_devir_notlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yazar_id", sa.Integer(), nullable=False),
        sa.Column("metin", sa.String(length=4000), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=True),
        sa.Column("vardiya_tarihi", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["yazar_id"], ["kullanicilar.id"]),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_vardiya_devir_notlari_vardiya_tarihi",
        "vardiya_devir_notlari",
        ["vardiya_tarihi"],
    )

    op.create_table(
        "panel_bildirimleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("alici_id", sa.Integer(), nullable=False),
        sa.Column("baslik", sa.String(length=255), nullable=False),
        sa.Column("govde", sa.String(length=2000), nullable=False),
        sa.Column("tip", sa.String(length=30), nullable=False),
        sa.Column("okundu_mu", sa.Boolean(), nullable=False),
        sa.Column("kaynak_tip", sa.String(length=50), nullable=True),
        sa.Column("kaynak_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["alici_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_panel_bildirimleri_alici_id", "panel_bildirimleri", ["alici_id"])
    op.create_index("ix_panel_bildirimleri_okundu_mu", "panel_bildirimleri", ["okundu_mu"])
    op.create_index("ix_panel_bildirimleri_tip", "panel_bildirimleri", ["tip"])


def downgrade() -> None:
    op.drop_table("panel_bildirimleri")
    op.drop_table("vardiya_devir_notlari")
    op.drop_table("hemsire_gorevleri")
    op.drop_table("hasta_notlari")
    op.drop_table("ilac_uygulamalari")
    op.drop_table("vital_bulgular")
    op.drop_index("ix_ilac_talepleri_acil_mi", table_name="ilac_talepleri")
    op.drop_column("ilac_talepleri", "acil_mi")
