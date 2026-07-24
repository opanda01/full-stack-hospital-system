"""Pilot list pagination için composite index'ler.

Revision ID: 017_list_pagination_indexes
Revises: 016_entegrasyon_icd_lab
"""

from typing import Sequence, Union

from alembic import op

revision: str = "017_list_pagination_indexes"
down_revision: Union[str, Sequence[str], None] = "016_entegrasyon_icd_lab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_faturalar_durum", "faturalar", ["durum"])
    op.create_index(
        "ix_randevular_doktor_tarih_id",
        "randevular",
        ["doktor_id", "tarih_saat", "id"],
    )
    op.create_index(
        "ix_randevular_hasta_tarih_id",
        "randevular",
        ["hasta_id", "tarih_saat", "id"],
    )
    op.create_index(
        "ix_randevular_departman_tarih_id",
        "randevular",
        ["departman_id", "tarih_saat", "id"],
    )
    op.create_index(
        "ix_tetkikler_doktor_id_desc",
        "tetkikler",
        ["istek_yapan_doktor_id", "id"],
    )
    op.create_index(
        "ix_tetkikler_hasta_id_desc",
        "tetkikler",
        ["hasta_id", "id"],
    )
    op.create_index(
        "ix_tetkikler_durum_id",
        "tetkikler",
        ["durum", "id"],
    )
    op.create_index(
        "ix_yatis_aktif_tarih_id",
        "yatis_kayitlari",
        ["aktif_mi", "yatis_tarihi", "id"],
    )
    op.create_index(
        "ix_yatis_servis_aktif_tarih_id",
        "yatis_kayitlari",
        ["servis_id", "aktif_mi", "yatis_tarihi", "id"],
    )


def downgrade() -> None:
    op.drop_index("ix_yatis_servis_aktif_tarih_id", table_name="yatis_kayitlari")
    op.drop_index("ix_yatis_aktif_tarih_id", table_name="yatis_kayitlari")
    op.drop_index("ix_tetkikler_durum_id", table_name="tetkikler")
    op.drop_index("ix_tetkikler_hasta_id_desc", table_name="tetkikler")
    op.drop_index("ix_tetkikler_doktor_id_desc", table_name="tetkikler")
    op.drop_index("ix_randevular_departman_tarih_id", table_name="randevular")
    op.drop_index("ix_randevular_hasta_tarih_id", table_name="randevular")
    op.drop_index("ix_randevular_doktor_tarih_id", table_name="randevular")
    op.drop_index("ix_faturalar_durum", table_name="faturalar")
