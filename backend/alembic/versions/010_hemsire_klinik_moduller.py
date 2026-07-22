"""Hemşire klinik modüller: epikriz.

Revision ID: 010_hemsire_klinik_moduller
Revises: 009_hemsire_klinik
Create Date: 2026-07-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "010_hemsire_klinik_moduller"
down_revision: Union[str, None] = "009_hemsire_klinik"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "epikrizler",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yatis_id", sa.Integer(), nullable=False),
        sa.Column("hasta_id", sa.Integer(), nullable=False),
        sa.Column("yazar_id", sa.Integer(), nullable=False),
        sa.Column("durum", sa.String(length=30), nullable=False),
        sa.Column("sikayet_oyku", sa.String(length=4000), nullable=True),
        sa.Column("fizik_muayene", sa.String(length=4000), nullable=True),
        sa.Column("tani", sa.String(length=2000), nullable=True),
        sa.Column("tedavi_ozeti", sa.String(length=4000), nullable=True),
        sa.Column("taburcu_onerileri", sa.String(length=2000), nullable=True),
        sa.Column("onaylayan_doktor_id", sa.Integer(), nullable=True),
        sa.Column("onaylandi_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["yatis_id"], ["yatis_kayitlari.id"]),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.ForeignKeyConstraint(["yazar_id"], ["kullanicilar.id"]),
        sa.ForeignKeyConstraint(["onaylayan_doktor_id"], ["doktorlar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_epikrizler_yatis_id", "epikrizler", ["yatis_id"])
    op.create_index("ix_epikrizler_hasta_id", "epikrizler", ["hasta_id"])
    op.create_index("ix_epikrizler_yazar_id", "epikrizler", ["yazar_id"])
    op.create_index("ix_epikrizler_durum", "epikrizler", ["durum"])
    op.create_index(
        "ix_epikrizler_onaylayan_doktor_id", "epikrizler", ["onaylayan_doktor_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_epikrizler_onaylayan_doktor_id", table_name="epikrizler")
    op.drop_index("ix_epikrizler_durum", table_name="epikrizler")
    op.drop_index("ix_epikrizler_yazar_id", table_name="epikrizler")
    op.drop_index("ix_epikrizler_hasta_id", table_name="epikrizler")
    op.drop_index("ix_epikrizler_yatis_id", table_name="epikrizler")
    op.drop_table("epikrizler")
