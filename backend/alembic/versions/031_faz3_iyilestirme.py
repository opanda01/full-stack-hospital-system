"""Faz 3: ameliyat onam, kurum hazırlığı.

Revision ID: 031_faz3_iyilestirme
Revises: 030_faz2_devam
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "031_faz3_iyilestirme"
down_revision: Union[str, Sequence[str], None] = "030_faz2_devam"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ameliyat_planlari",
        sa.Column("onam_alindi_mi", sa.Boolean(), nullable=False, server_default="0"),
    )
    op.add_column(
        "ameliyat_planlari",
        sa.Column("onam_zamani", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "ameliyat_planlari",
        sa.Column(
            "onam_kvkk_onay_id",
            sa.Integer(),
            sa.ForeignKey("kvkk_onay_kayitlari.id"),
            nullable=True,
        ),
    )
    op.add_column(
        "ameliyat_planlari",
        sa.Column("e_imza_referans", sa.String(128), nullable=True),
    )
    op.create_index(
        "ix_ameliyat_planlari_onam_alindi_mi",
        "ameliyat_planlari",
        ["onam_alindi_mi"],
    )

    op.add_column(
        "departmanlar",
        sa.Column("kurum_id", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_index("ix_departmanlar_kurum_id", "departmanlar", ["kurum_id"])


def downgrade() -> None:
    op.drop_index("ix_departmanlar_kurum_id", table_name="departmanlar")
    op.drop_column("departmanlar", "kurum_id")
    op.drop_index("ix_ameliyat_planlari_onam_alindi_mi", table_name="ameliyat_planlari")
    op.drop_column("ameliyat_planlari", "e_imza_referans")
    op.drop_column("ameliyat_planlari", "onam_kvkk_onay_id")
    op.drop_column("ameliyat_planlari", "onam_zamani")
    op.drop_column("ameliyat_planlari", "onam_alindi_mi")
