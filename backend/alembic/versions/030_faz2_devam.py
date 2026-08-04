"""Faz 2 devam: kimlik tipleri, izolasyon, fatura kalemi, sevk alanı.

Revision ID: 030_faz2_devam
Revises: 029_faz2_operasyon
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "030_faz2_devam"
down_revision: Union[str, Sequence[str], None] = "029_faz2_operasyon"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "hastalar",
        sa.Column("kimlik_tipi", sa.String(30), nullable=False, server_default="TC"),
    )
    op.add_column(
        "hastalar",
        sa.Column("yabanci_kimlik_no", sa.String(64), nullable=True),
    )
    op.add_column(
        "hastalar",
        sa.Column("gecici_protokol_no", sa.String(50), nullable=True),
    )
    op.add_column(
        "hastalar",
        sa.Column("anne_hasta_id", sa.Integer(), sa.ForeignKey("hastalar.id"), nullable=True),
    )
    op.create_index("ix_hastalar_kimlik_tipi", "hastalar", ["kimlik_tipi"])
    op.create_index("ix_hastalar_yabanci_kimlik_no", "hastalar", ["yabanci_kimlik_no"])
    op.create_index("ix_hastalar_gecici_protokol_no", "hastalar", ["gecici_protokol_no"])
    op.create_index("ix_hastalar_anne_hasta_id", "hastalar", ["anne_hasta_id"])

    op.add_column(
        "yataklar",
        sa.Column("izolasyon_tipi", sa.String(20), nullable=False, server_default="YOK"),
    )
    op.create_index("ix_yataklar_izolasyon_tipi", "yataklar", ["izolasyon_tipi"])

    op.add_column(
        "yatis_kayitlari",
        sa.Column("izolasyon_gerekli", sa.String(20), nullable=True),
    )
    op.create_index(
        "ix_yatis_kayitlari_izolasyon_gerekli",
        "yatis_kayitlari",
        ["izolasyon_gerekli"],
    )

    op.add_column(
        "klinik_onay_kayitlari",
        sa.Column("aile_hekimi_sevk_no", sa.String(64), nullable=True),
    )

    op.create_table(
        "fatura_kalemleri",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("fatura_id", sa.Integer(), sa.ForeignKey("faturalar.id"), nullable=False),
        sa.Column("kod", sa.String(40), nullable=False),
        sa.Column("aciklama", sa.String(500), nullable=False),
        sa.Column("tutar", sa.Numeric(12, 2), nullable=False),
    )
    op.create_index("ix_fatura_kalemleri_fatura_id", "fatura_kalemleri", ["fatura_id"])


def downgrade() -> None:
    op.drop_index("ix_fatura_kalemleri_fatura_id", table_name="fatura_kalemleri")
    op.drop_table("fatura_kalemleri")
    op.drop_column("klinik_onay_kayitlari", "aile_hekimi_sevk_no")
    op.drop_index("ix_yatis_kayitlari_izolasyon_gerekli", table_name="yatis_kayitlari")
    op.drop_column("yatis_kayitlari", "izolasyon_gerekli")
    op.drop_index("ix_yataklar_izolasyon_tipi", table_name="yataklar")
    op.drop_column("yataklar", "izolasyon_tipi")
    op.drop_index("ix_hastalar_anne_hasta_id", table_name="hastalar")
    op.drop_index("ix_hastalar_gecici_protokol_no", table_name="hastalar")
    op.drop_index("ix_hastalar_yabanci_kimlik_no", table_name="hastalar")
    op.drop_index("ix_hastalar_kimlik_tipi", table_name="hastalar")
    op.drop_column("hastalar", "anne_hasta_id")
    op.drop_column("hastalar", "gecici_protokol_no")
    op.drop_column("hastalar", "yabanci_kimlik_no")
    op.drop_column("hastalar", "kimlik_tipi")
