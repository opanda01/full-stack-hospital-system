"""Birimler tablosu + departmanlar.birim_id.

Revision ID: 005_birimler
Revises: 004_auth_akisi
Create Date: 2026-07-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005_birimler"
down_revision: Union[str, None] = "004_auth_akisi"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "birimler",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ad", sa.String(length=150), nullable=False),
        sa.Column("kod", sa.String(length=50), nullable=True),
        sa.Column("sira", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("aciklama", sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_birimler_ad"), "birimler", ["ad"], unique=True)
    op.create_index(op.f("ix_birimler_kod"), "birimler", ["kod"], unique=True)
    op.create_index(op.f("ix_birimler_sira"), "birimler", ["sira"], unique=False)

    op.add_column(
        "departmanlar",
        sa.Column("birim_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        op.f("ix_departmanlar_birim_id"), "departmanlar", ["birim_id"], unique=False
    )
    op.create_foreign_key(
        "fk_departmanlar_birim_id_birimler",
        "departmanlar",
        "birimler",
        ["birim_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_departmanlar_birim_id_birimler", "departmanlar", type_="foreignkey"
    )
    op.drop_index(op.f("ix_departmanlar_birim_id"), table_name="departmanlar")
    op.drop_column("departmanlar", "birim_id")
    op.drop_index(op.f("ix_birimler_sira"), table_name="birimler")
    op.drop_index(op.f("ix_birimler_kod"), table_name="birimler")
    op.drop_index(op.f("ix_birimler_ad"), table_name="birimler")
    op.drop_table("birimler")
