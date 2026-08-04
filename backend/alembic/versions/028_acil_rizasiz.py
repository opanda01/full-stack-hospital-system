"""Acil rızasız müdahale: ikinci hekim + bilgilendirme alanları.

Revision ID: 028_acil_rizasiz
Revises: 027_veli_vasi_onam
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "028_acil_rizasiz"
down_revision: Union[str, Sequence[str], None] = "027_veli_vasi_onam"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "klinik_onay_kayitlari",
        sa.Column("ikinci_onaylayan_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        "ix_klinik_onay_kayitlari_ikinci_onaylayan_id",
        "klinik_onay_kayitlari",
        ["ikinci_onaylayan_id"],
    )
    op.add_column(
        "klinik_onay_kayitlari",
        sa.Column(
            "bilgilendirme_yapildi_mi",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "klinik_onay_kayitlari",
        sa.Column("bilgilendirme_tarihi", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "klinik_onay_kayitlari",
        sa.Column("bilgilendirme_notu", sa.String(length=2000), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("klinik_onay_kayitlari", "bilgilendirme_notu")
    op.drop_column("klinik_onay_kayitlari", "bilgilendirme_tarihi")
    op.drop_column("klinik_onay_kayitlari", "bilgilendirme_yapildi_mi")
    op.drop_index(
        "ix_klinik_onay_kayitlari_ikinci_onaylayan_id",
        table_name="klinik_onay_kayitlari",
    )
    op.drop_column("klinik_onay_kayitlari", "ikinci_onaylayan_id")
