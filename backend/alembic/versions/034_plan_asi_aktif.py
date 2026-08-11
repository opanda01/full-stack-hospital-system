"""Plan: hasta aşı kayıtları.

Revision ID: 034_plan_asi_aktif
Revises: 033_faz_plan
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "034_plan_asi_aktif"
down_revision: Union[str, Sequence[str], None] = "033_faz_plan"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hasta_asi_kayitlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("hasta_id", sa.Integer(), nullable=False),
        sa.Column("asi_adi", sa.String(length=200), nullable=False),
        sa.Column("uygulama_tarihi", sa.Date(), nullable=False),
        sa.Column("sonraki_tarih", sa.Date(), nullable=True),
        sa.Column("notlar", sa.String(length=500), nullable=True),
        sa.Column("uygulayan", sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_hasta_asi_kayitlari_hasta_id"),
        "hasta_asi_kayitlari",
        ["hasta_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_hasta_asi_kayitlari_hasta_id"), table_name="hasta_asi_kayitlari")
    op.drop_table("hasta_asi_kayitlari")
