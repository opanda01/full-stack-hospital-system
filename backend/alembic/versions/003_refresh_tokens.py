"""refresh_tokens tablosu

Revision ID: 003_refresh_tokens
Revises: 002_kullanici_rol
Create Date: 2026-07-20

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_refresh_tokens"
down_revision: Union[str, None] = "002_kullanici_rol"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("kullanici_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("olusturma_tarihi", sa.DateTime(), nullable=False),
        sa.Column("son_kullanma_tarihi", sa.DateTime(), nullable=False),
        sa.Column("iptal_edildi_mi", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(["kullanici_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_refresh_tokens_kullanici_id"),
        "refresh_tokens",
        ["kullanici_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_refresh_tokens_token_hash"),
        "refresh_tokens",
        ["token_hash"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_refresh_tokens_token_hash"), table_name="refresh_tokens")
    op.drop_index(op.f("ix_refresh_tokens_kullanici_id"), table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
