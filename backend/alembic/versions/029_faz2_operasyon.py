"""Faz 2 migration: randevu provizyon/MHRS, hasta no-show, acil triyaj.

Revision ID: 029_faz2_operasyon
Revises: 028_acil_rizasiz
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "029_faz2_operasyon"
down_revision: Union[str, Sequence[str], None] = "028_acil_rizasiz"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "randevular",
        sa.Column("medula_provizyon_no", sa.String(64), nullable=True),
    )
    op.add_column(
        "randevular",
        sa.Column("medula_takip_no", sa.String(64), nullable=True),
    )
    op.add_column(
        "randevular",
        sa.Column("mhrs_randevu_id", sa.String(64), nullable=True),
    )
    op.create_index(
        "ix_randevular_medula_provizyon_no",
        "randevular",
        ["medula_provizyon_no"],
    )
    op.create_index(
        "ix_randevular_mhrs_randevu_id",
        "randevular",
        ["mhrs_randevu_id"],
    )
    op.add_column(
        "hastalar",
        sa.Column(
            "gelmeyen_randevu_sayisi",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.create_table(
        "acil_triyaj_kayitlari",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("hasta_id", sa.Integer(), sa.ForeignKey("hastalar.id"), nullable=False),
        sa.Column("randevu_id", sa.Integer(), sa.ForeignKey("randevular.id"), nullable=True),
        sa.Column("sikayet_ozet", sa.String(2000), nullable=False),
        sa.Column("ats_skor", sa.Integer(), nullable=True),
        sa.Column("renk", sa.String(20), nullable=False, index=True),
        sa.Column("kaydeden_id", sa.Integer(), sa.ForeignKey("kullanicilar.id"), nullable=False),
        sa.Column("notlar", sa.String(1000), nullable=True),
    )
    op.create_index(
        "ix_acil_triyaj_kayitlari_hasta_id",
        "acil_triyaj_kayitlari",
        ["hasta_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_acil_triyaj_kayitlari_hasta_id", table_name="acil_triyaj_kayitlari")
    op.drop_table("acil_triyaj_kayitlari")
    op.drop_column("hastalar", "gelmeyen_randevu_sayisi")
    op.drop_index("ix_randevular_mhrs_randevu_id", table_name="randevular")
    op.drop_index("ix_randevular_medula_provizyon_no", table_name="randevular")
    op.drop_column("randevular", "mhrs_randevu_id")
    op.drop_column("randevular", "medula_takip_no")
    op.drop_column("randevular", "medula_provizyon_no")
