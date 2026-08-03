"""Radyoloji istemleri ve Orthanc sonuçları.

Revision ID: 023_radyoloji
Revises: 022_ameliyathane
Create Date: 2026-08-03
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "023_radyoloji"
down_revision: Union[str, None] = "022_ameliyathane"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "radyoloji_istemleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("hasta_id", sa.Integer(), nullable=False),
        sa.Column("isteyen_doktor_id", sa.Integer(), nullable=False),
        sa.Column("muayene_id", sa.Integer(), nullable=True),
        sa.Column("tetkik_turu", sa.String(length=30), nullable=False),
        sa.Column("vucut_bolgesi", sa.String(length=150), nullable=False),
        sa.Column("aciliyet", sa.String(length=20), nullable=False),
        sa.Column("durum", sa.String(length=30), nullable=False),
        sa.Column("istem_zamani", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.ForeignKeyConstraint(["isteyen_doktor_id"], ["doktorlar.id"]),
        sa.ForeignKeyConstraint(["muayene_id"], ["muayene_kayitlari.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_radyoloji_istemleri_hasta_id", "radyoloji_istemleri", ["hasta_id"])
    op.create_index(
        "ix_radyoloji_istemleri_isteyen_doktor_id",
        "radyoloji_istemleri",
        ["isteyen_doktor_id"],
    )
    op.create_index(
        "ix_radyoloji_istemleri_durum", "radyoloji_istemleri", ["durum"]
    )

    op.create_table(
        "radyoloji_sonuclari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("istem_id", sa.Integer(), nullable=False),
        sa.Column("orthanc_study_instance_uid", sa.String(length=128), nullable=False),
        sa.Column("orthanc_series_instance_uid", sa.String(length=128), nullable=True),
        sa.Column("raporlayan_radyolog_id", sa.Integer(), nullable=False),
        sa.Column("rapor_metni", sa.String(length=8000), nullable=False),
        sa.Column("rapor_zamani", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["istem_id"], ["radyoloji_istemleri.id"]),
        sa.ForeignKeyConstraint(["raporlayan_radyolog_id"], ["doktorlar.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("istem_id"),
    )
    op.create_index(
        "ix_radyoloji_sonuclari_istem_id", "radyoloji_sonuclari", ["istem_id"]
    )


def downgrade() -> None:
    op.drop_table("radyoloji_sonuclari")
    op.drop_table("radyoloji_istemleri")
