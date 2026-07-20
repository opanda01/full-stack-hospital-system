"""add kullanici.rol column

Revision ID: 002_kullanici_rol
Revises: 001_rbac_initial
Create Date: 2026-07-20

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_kullanici_rol"
down_revision: Union[str, None] = "001_rbac_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "kullanicilar",
        sa.Column("rol", sa.String(length=50), nullable=False, server_default="HASTA"),
    )
    op.create_index(op.f("ix_kullanicilar_rol"), "kullanicilar", ["rol"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_kullanicilar_rol"), table_name="kullanicilar")
    op.drop_column("kullanicilar", "rol")
