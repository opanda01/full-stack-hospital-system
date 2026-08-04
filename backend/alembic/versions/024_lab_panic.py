"""Lab panic eşikleri: tetkik_sonuc_kalemleri.

Revision ID: 024_lab_panic
Revises: 023_radyoloji
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "024_lab_panic"
down_revision: Union[str, Sequence[str], None] = "023_radyoloji"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tetkik_sonuc_kalemleri",
        sa.Column("panic_min", sa.Float(), nullable=True),
    )
    op.add_column(
        "tetkik_sonuc_kalemleri",
        sa.Column("panic_max", sa.Float(), nullable=True),
    )
    op.add_column(
        "tetkik_sonuc_kalemleri",
        sa.Column(
            "panic_mi",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("tetkik_sonuc_kalemleri", "panic_mi")
    op.drop_column("tetkik_sonuc_kalemleri", "panic_max")
    op.drop_column("tetkik_sonuc_kalemleri", "panic_min")
