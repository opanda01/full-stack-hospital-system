"""Hasta boy / kilo alanları (e-Nabız tarzı profil).

Revision ID: 018_hasta_boy_kilo
Revises: 017_list_pagination_indexes
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "018_hasta_boy_kilo"
down_revision: Union[str, Sequence[str], None] = "017_list_pagination_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("hastalar", sa.Column("boy_cm", sa.Float(), nullable=True))
    op.add_column("hastalar", sa.Column("kilo_kg", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("hastalar", "kilo_kg")
    op.drop_column("hastalar", "boy_cm")
