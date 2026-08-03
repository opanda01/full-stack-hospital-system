"""Ameliyathane tabloları.

Revision ID: 022_ameliyathane
Revises: 021_yatak_yonetimi
Create Date: 2026-08-03
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "022_ameliyathane"
down_revision: Union[str, None] = "021_yatak_yonetimi"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ameliyathaneler",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ad", sa.String(length=150), nullable=False),
        sa.Column("oda_no", sa.String(length=30), nullable=False),
        sa.Column("durum", sa.String(length=30), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ameliyathaneler_ad", "ameliyathaneler", ["ad"])
    op.create_index("ix_ameliyathaneler_oda_no", "ameliyathaneler", ["oda_no"])
    op.create_index("ix_ameliyathaneler_durum", "ameliyathaneler", ["durum"])

    op.create_table(
        "ameliyat_planlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("hasta_id", sa.Integer(), nullable=False),
        sa.Column("ameliyathane_id", sa.Integer(), nullable=False),
        sa.Column("sorumlu_cerrah_id", sa.Integer(), nullable=False),
        sa.Column("planlanan_baslangic", sa.DateTime(timezone=True), nullable=False),
        sa.Column("planlanan_sure_dk", sa.Integer(), nullable=False),
        sa.Column("gercek_baslangic", sa.DateTime(timezone=True), nullable=True),
        sa.Column("gercek_bitis", sa.DateTime(timezone=True), nullable=True),
        sa.Column("durum", sa.String(length=30), nullable=False),
        sa.Column("ameliyat_adi", sa.String(length=300), nullable=False),
        sa.Column("iptal_gerekcesi", sa.String(length=1000), nullable=True),
        sa.ForeignKeyConstraint(["ameliyathane_id"], ["ameliyathaneler.id"]),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.ForeignKeyConstraint(["sorumlu_cerrah_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ameliyat_planlari_hasta_id", "ameliyat_planlari", ["hasta_id"])
    op.create_index(
        "ix_ameliyat_planlari_ameliyathane_id", "ameliyat_planlari", ["ameliyathane_id"]
    )
    op.create_index(
        "ix_ameliyat_planlari_sorumlu_cerrah_id",
        "ameliyat_planlari",
        ["sorumlu_cerrah_id"],
    )
    op.create_index(
        "ix_ameliyat_planlari_planlanan_baslangic",
        "ameliyat_planlari",
        ["planlanan_baslangic"],
    )
    op.create_index("ix_ameliyat_planlari_durum", "ameliyat_planlari", ["durum"])

    op.create_table(
        "ameliyat_ekibi",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ameliyat_plani_id", sa.Integer(), nullable=False),
        sa.Column("personel_id", sa.Integer(), nullable=False),
        sa.Column("rol", sa.String(length=30), nullable=False),
        sa.ForeignKeyConstraint(["ameliyat_plani_id"], ["ameliyat_planlari.id"]),
        sa.ForeignKeyConstraint(["personel_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_ameliyat_ekibi_ameliyat_plani_id", "ameliyat_ekibi", ["ameliyat_plani_id"]
    )
    op.create_index("ix_ameliyat_ekibi_personel_id", "ameliyat_ekibi", ["personel_id"])
    op.create_index("ix_ameliyat_ekibi_rol", "ameliyat_ekibi", ["rol"])

    op.create_table(
        "anestezi_kayitlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ameliyat_plani_id", sa.Integer(), nullable=False),
        sa.Column("anestezi_tipi", sa.String(length=30), nullable=False),
        sa.Column("asa_skoru", sa.Integer(), nullable=False),
        sa.Column("anestezist_id", sa.Integer(), nullable=False),
        sa.Column("notlar", sa.String(length=2000), nullable=True),
        sa.ForeignKeyConstraint(["ameliyat_plani_id"], ["ameliyat_planlari.id"]),
        sa.ForeignKeyConstraint(["anestezist_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("ameliyat_plani_id"),
    )
    op.create_index(
        "ix_anestezi_kayitlari_ameliyat_plani_id",
        "anestezi_kayitlari",
        ["ameliyat_plani_id"],
    )
    op.create_index(
        "ix_anestezi_kayitlari_anestezist_id", "anestezi_kayitlari", ["anestezist_id"]
    )


def downgrade() -> None:
    op.drop_table("anestezi_kayitlari")
    op.drop_table("ameliyat_ekibi")
    op.drop_table("ameliyat_planlari")
    op.drop_table("ameliyathaneler")
