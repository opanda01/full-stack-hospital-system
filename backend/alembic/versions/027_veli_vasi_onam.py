"""Veli/vasi + KVKK yasal temsilci sütunları + hasta ehliyet bayrağı.

Revision ID: 027_veli_vasi_onam
Revises: 026_zorunlu_bildirim
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "027_veli_vasi_onam"
down_revision: Union[str, Sequence[str], None] = "026_zorunlu_bildirim"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "hastalar",
        sa.Column(
            "ehliyet_kisitli_mi",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.create_table(
        "hasta_yasal_temsilciler",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column(
            "hasta_id",
            sa.Integer(),
            sa.ForeignKey("hastalar.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("tur", sa.String(length=30), nullable=False, server_default="VELI"),
        sa.Column("ad_soyad", sa.String(length=200), nullable=False),
        sa.Column("tc_kimlik_no", sa.String(length=11), nullable=True),
        sa.Column("telefon", sa.String(length=20), nullable=True),
        sa.Column("yakinlik", sa.String(length=80), nullable=True),
        sa.Column(
            "aktif_mi",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )
    op.create_index(
        "ix_hasta_yasal_temsilciler_tur", "hasta_yasal_temsilciler", ["tur"]
    )
    op.create_index(
        "ix_hasta_yasal_temsilciler_aktif_mi",
        "hasta_yasal_temsilciler",
        ["aktif_mi"],
    )
    op.add_column(
        "kvkk_onay_kayitlari",
        sa.Column(
            "yasal_temsilci_id",
            sa.Integer(),
            sa.ForeignKey("hasta_yasal_temsilciler.id"),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_kvkk_onay_kayitlari_yasal_temsilci_id",
        "kvkk_onay_kayitlari",
        ["yasal_temsilci_id"],
    )
    op.add_column(
        "kvkk_onay_kayitlari",
        sa.Column("temsilci_ad_soyad", sa.String(length=200), nullable=True),
    )
    op.add_column(
        "kvkk_onay_kayitlari",
        sa.Column("temsilci_tc_kimlik_no", sa.String(length=11), nullable=True),
    )
    op.add_column(
        "kvkk_onay_kayitlari",
        sa.Column("temsilci_tur", sa.String(length=30), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("kvkk_onay_kayitlari", "temsilci_tur")
    op.drop_column("kvkk_onay_kayitlari", "temsilci_tc_kimlik_no")
    op.drop_column("kvkk_onay_kayitlari", "temsilci_ad_soyad")
    op.drop_index(
        "ix_kvkk_onay_kayitlari_yasal_temsilci_id", table_name="kvkk_onay_kayitlari"
    )
    op.drop_column("kvkk_onay_kayitlari", "yasal_temsilci_id")
    op.drop_index(
        "ix_hasta_yasal_temsilciler_aktif_mi", table_name="hasta_yasal_temsilciler"
    )
    op.drop_index("ix_hasta_yasal_temsilciler_tur", table_name="hasta_yasal_temsilciler")
    op.drop_table("hasta_yasal_temsilciler")
    op.drop_column("hastalar", "ehliyet_kisitli_mi")
