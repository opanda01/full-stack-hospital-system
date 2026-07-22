"""Doktor paneli: konsültasyon + sağlık kurulu tabloları.

Revision ID: 007_doktor_panel
Revises: 006_bashekim_panel
Create Date: 2026-07-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007_doktor_panel"
down_revision: Union[str, None] = "006_bashekim_panel"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "konsultasyon_istekleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("isteyen_doktor_id", sa.Integer(), nullable=False),
        sa.Column("hedef_doktor_id", sa.Integer(), nullable=False),
        sa.Column("hasta_id", sa.Integer(), nullable=False),
        sa.Column("notlar", sa.String(length=2000), nullable=True),
        sa.Column("durum", sa.String(length=20), nullable=False),
        sa.Column("yanit_notu", sa.String(length=2000), nullable=True),
        sa.Column("yanit_tarihi", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["isteyen_doktor_id"], ["doktorlar.id"]),
        sa.ForeignKeyConstraint(["hedef_doktor_id"], ["doktorlar.id"]),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_konsultasyon_istekleri_isteyen_doktor_id",
        "konsultasyon_istekleri",
        ["isteyen_doktor_id"],
    )
    op.create_index(
        "ix_konsultasyon_istekleri_hedef_doktor_id",
        "konsultasyon_istekleri",
        ["hedef_doktor_id"],
    )
    op.create_index(
        "ix_konsultasyon_istekleri_hasta_id",
        "konsultasyon_istekleri",
        ["hasta_id"],
    )
    op.create_index(
        "ix_konsultasyon_istekleri_durum",
        "konsultasyon_istekleri",
        ["durum"],
    )

    op.create_table(
        "saglik_kurulu_kayitlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("baslik", sa.String(length=255), nullable=False),
        sa.Column("hasta_id", sa.Integer(), nullable=True),
        sa.Column("karar_ozeti", sa.String(length=4000), nullable=True),
        sa.Column("durum", sa.String(length=30), nullable=False),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_saglik_kurulu_kayitlari_hasta_id",
        "saglik_kurulu_kayitlari",
        ["hasta_id"],
    )
    op.create_index(
        "ix_saglik_kurulu_kayitlari_durum",
        "saglik_kurulu_kayitlari",
        ["durum"],
    )

    op.create_table(
        "saglik_kurulu_uyeleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("kurul_id", sa.Integer(), nullable=False),
        sa.Column("doktor_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["kurul_id"], ["saglik_kurulu_kayitlari.id"]),
        sa.ForeignKeyConstraint(["doktor_id"], ["doktorlar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_saglik_kurulu_uyeleri_kurul_id",
        "saglik_kurulu_uyeleri",
        ["kurul_id"],
    )
    op.create_index(
        "ix_saglik_kurulu_uyeleri_doktor_id",
        "saglik_kurulu_uyeleri",
        ["doktor_id"],
    )


def downgrade() -> None:
    op.drop_table("saglik_kurulu_uyeleri")
    op.drop_table("saglik_kurulu_kayitlari")
    op.drop_table("konsultasyon_istekleri")
