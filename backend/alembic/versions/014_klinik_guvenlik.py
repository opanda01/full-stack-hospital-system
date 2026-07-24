"""Klinik güvenlik: alerji, reçete kalemleri, etken/etkileşim referansları.

Revision ID: 014_klinik_guvenlik
Revises: 013_public_id_phi
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "014_klinik_guvenlik"
down_revision: Union[str, Sequence[str], None] = "013_public_id_phi"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hasta_alerjileri",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("hasta_id", sa.Integer(), sa.ForeignKey("hastalar.id"), nullable=False),
        sa.Column("allerjen_tipi", sa.String(40), nullable=False),
        sa.Column("allerjen_kodu", sa.String(64), nullable=True),
        sa.Column("allerjen_adi", sa.String(200), nullable=False),
        sa.Column("siddet", sa.String(40), nullable=False, server_default="HAFIF"),
        sa.Column("notlar", sa.String(1000), nullable=True),
        sa.Column("silindi_mi", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_hasta_alerjileri_hasta_id", "hasta_alerjileri", ["hasta_id"])
    op.create_index("ix_hasta_alerjileri_silindi_mi", "hasta_alerjileri", ["silindi_mi"])

    op.create_table(
        "recete_kalemleri",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column(
            "muayene_id",
            sa.Integer(),
            sa.ForeignKey("muayene_kayitlari.id"),
            nullable=False,
        ),
        sa.Column("ilac_id", sa.Integer(), sa.ForeignKey("ilaclar.id"), nullable=True),
        sa.Column("urun_adi", sa.String(200), nullable=False),
        sa.Column("barkod", sa.String(64), nullable=True),
        sa.Column("doz", sa.String(100), nullable=True),
        sa.Column("periyod", sa.String(100), nullable=True),
        sa.Column("kullanim_sekli", sa.String(40), nullable=True),
        sa.Column("adet", sa.Integer(), nullable=True),
        sa.Column("sira", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_index("ix_recete_kalemleri_muayene_id", "recete_kalemleri", ["muayene_id"])
    op.create_index("ix_recete_kalemleri_ilac_id", "recete_kalemleri", ["ilac_id"])

    op.create_table(
        "ilac_etken_maddeleri",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("ilac_id", sa.Integer(), sa.ForeignKey("ilaclar.id"), nullable=True),
        sa.Column("etken_kodu", sa.String(64), nullable=False),
        sa.Column("etken_adi", sa.String(200), nullable=False),
        sa.Column("urun_adi_eslesme", sa.String(200), nullable=True),
    )
    op.create_index(
        "ix_ilac_etken_maddeleri_ilac_id", "ilac_etken_maddeleri", ["ilac_id"]
    )
    op.create_index(
        "ix_ilac_etken_maddeleri_etken_kodu", "ilac_etken_maddeleri", ["etken_kodu"]
    )

    op.create_table(
        "ilac_etkilesimleri",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("etken_a", sa.String(64), nullable=False),
        sa.Column("etken_b", sa.String(64), nullable=False),
        sa.Column("seviye", sa.String(40), nullable=False),
        sa.Column("aciklama", sa.String(1000), nullable=False),
    )
    op.create_index("ix_ilac_etkilesimleri_etken_a", "ilac_etkilesimleri", ["etken_a"])
    op.create_index("ix_ilac_etkilesimleri_etken_b", "ilac_etkilesimleri", ["etken_b"])

    # Demo seed data
    op.execute(
        """
        INSERT INTO ilac_etken_maddeleri
            (created_at, updated_at, etken_kodu, etken_adi, urun_adi_eslesme)
        VALUES
            (now(), now(), 'PENICILLIN', 'Penisilin', 'amoksisilin'),
            (now(), now(), 'WARFARIN', 'Warfarin', 'warfarin'),
            (now(), now(), 'NSAID', 'NSAID', 'ibuprofen'),
            (now(), now(), 'NSAID', 'NSAID', 'aspirin')
        """
    )
    op.execute(
        """
        INSERT INTO ilac_etkilesimleri
            (created_at, updated_at, etken_a, etken_b, seviye, aciklama)
        VALUES
            (now(), now(), 'WARFARIN', 'NSAID', 'UYARI',
             'Warfarin + NSAID kanama riskini artırır'),
            (now(), now(), 'PENICILLIN', 'WARFARIN', 'KONTRANDIKE',
             'Demo kontrendike çift (penisilin-warfarin)')
        """
    )


def downgrade() -> None:
    op.drop_table("ilac_etkilesimleri")
    op.drop_table("ilac_etken_maddeleri")
    op.drop_table("recete_kalemleri")
    op.drop_table("hasta_alerjileri")
