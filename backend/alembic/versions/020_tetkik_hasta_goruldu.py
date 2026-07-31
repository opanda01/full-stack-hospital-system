"""tetkik hasta_goruldu_at

Revision ID: 020_tetkik_hasta_goruldu
Revises: 019_nobet_departman_cizelge
Create Date: 2026-07-31

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "020_tetkik_hasta_goruldu"
down_revision: Union[str, None] = "019_nobet_departman_cizelge"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tetkikler",
        sa.Column("hasta_goruldu_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("tetkikler", "hasta_goruldu_at")
