"""hasta mobil push cihazlari

Revision ID: 032_hasta_mobil_push
Revises: 031_faz3_iyilestirme
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "032_hasta_mobil_push"
down_revision: Union[str, Sequence[str], None] = "031_faz3_iyilestirme"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hasta_mobil_cihazlar",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("kullanici_id", sa.Integer(), nullable=False),
        sa.Column("expo_push_token", sa.String(length=512), nullable=False),
        sa.Column("platform", sa.String(length=32), nullable=False),
        sa.Column("aktif_mi", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("device_id", sa.String(length=128), nullable=True),
        sa.ForeignKeyConstraint(["kullanici_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("expo_push_token"),
    )
    op.create_index(
        "ix_hasta_mobil_cihazlar_kullanici_id",
        "hasta_mobil_cihazlar",
        ["kullanici_id"],
    )
    op.create_index(
        "ix_hasta_mobil_cihazlar_expo_push_token",
        "hasta_mobil_cihazlar",
        ["expo_push_token"],
    )
    op.create_index(
        "ix_hasta_mobil_cihazlar_aktif_mi",
        "hasta_mobil_cihazlar",
        ["aktif_mi"],
    )
    op.create_index(
        "ix_hasta_mobil_cihazlar_device_id",
        "hasta_mobil_cihazlar",
        ["device_id"],
    )


def downgrade() -> None:
    op.drop_table("hasta_mobil_cihazlar")
