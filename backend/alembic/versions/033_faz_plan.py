"""Faz plan: DLQ, sterilizasyon, transfüzyon.

Revision ID: 033_faz_plan
Revises: 032_hasta_mobil_push
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "033_faz_plan"
down_revision: Union[str, Sequence[str], None] = "032_hasta_mobil_push"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "bildirim_dlq_kayitlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("kanal", sa.String(16), nullable=False),
        sa.Column("hedef", sa.String(256), nullable=False),
        sa.Column("konu", sa.String(200), nullable=True),
        sa.Column("govde", sa.String(2000), nullable=False),
        sa.Column("durum", sa.String(32), nullable=False, server_default="BEKLEMEDE"),
        sa.Column("deneme", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("son_hata", sa.String(1000), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bildirim_dlq_durum", "bildirim_dlq_kayitlari", ["durum"])

    op.create_table(
        "sterilizasyon_cihazlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("ad", sa.String(150), nullable=False),
        sa.Column("envanter_no", sa.String(64), nullable=False),
        sa.Column("son_sterilizasyon", sa.Date(), nullable=True),
        sa.Column("sonraki_kalibrasyon", sa.Date(), nullable=True),
        sa.Column("durum", sa.String(32), nullable=False, server_default="AKTIF"),
        sa.Column("notlar", sa.String(500), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_sterilizasyon_cihaz_envanter",
        "sterilizasyon_cihazlari",
        ["envanter_no"],
    )

    op.create_table(
        "transfuzyon_kayitlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=False),
        sa.Column("hasta_id", sa.Integer(), nullable=False),
        sa.Column("verilen_kan_grubu", sa.String(8), nullable=False),
        sa.Column("hasta_kan_grubu", sa.String(8), nullable=False),
        sa.Column("uyumlu_mi", sa.Boolean(), nullable=False),
        sa.Column("birinci_imza_kullanici_id", sa.Integer(), nullable=False),
        sa.Column("ikinci_imza_kullanici_id", sa.Integer(), nullable=True),
        sa.Column("uygulama_zamani", sa.DateTime(), nullable=False),
        sa.Column("notlar", sa.String(500), nullable=True),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.ForeignKeyConstraint(["birinci_imza_kullanici_id"], ["kullanicilar.id"]),
        sa.ForeignKeyConstraint(["ikinci_imza_kullanici_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transfuzyon_yatis", "transfuzyon_kayitlari", ["yatis_id"])


def downgrade() -> None:
    op.drop_table("transfuzyon_kayitlari")
    op.drop_table("sterilizasyon_cihazlari")
    op.drop_table("bildirim_dlq_kayitlari")
