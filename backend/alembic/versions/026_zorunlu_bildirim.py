"""Muayene zorunlu bildirim bayrakları.

Revision ID: 026_zorunlu_bildirim
Revises: 025_mpi_mukerrer
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "026_zorunlu_bildirim"
down_revision: Union[str, Sequence[str], None] = "025_mpi_mukerrer"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "muayene_kayitlari",
        sa.Column(
            "bulasici_bildirim_mi",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "muayene_kayitlari",
        sa.Column(
            "adli_vaka_mi",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "muayene_kayitlari",
        sa.Column(
            "olum_bildirim_mi",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("muayene_kayitlari", "olum_bildirim_mi")
    op.drop_column("muayene_kayitlari", "adli_vaka_mi")
    op.drop_column("muayene_kayitlari", "bulasici_bildirim_mi")
