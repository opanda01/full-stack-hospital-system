"""Yatak yönetimi: odalar, yatak durumu, yatak geçmişi.

Revision ID: 021_yatak_yonetimi
Revises: 020_tetkik_hasta_goruldu
Create Date: 2026-08-03
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "021_yatak_yonetimi"
down_revision: Union[str, None] = "020_tetkik_hasta_goruldu"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "servisler",
        sa.Column("tip", sa.String(length=30), nullable=True),
    )
    op.execute(sa.text("UPDATE servisler SET tip = 'DAHILIYE' WHERE tip IS NULL"))
    op.alter_column("servisler", "tip", nullable=False)
    op.create_index("ix_servisler_tip", "servisler", ["tip"])

    op.create_table(
        "odalar",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("servis_id", sa.Integer(), nullable=False),
        sa.Column("oda_no", sa.String(length=30), nullable=False),
        sa.ForeignKeyConstraint(["servis_id"], ["servisler.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_odalar_servis_id", "odalar", ["servis_id"])
    op.create_index("ix_odalar_oda_no", "odalar", ["oda_no"])

    op.execute(
        sa.text(
            """
            INSERT INTO odalar (created_at, updated_at, servis_id, oda_no)
            SELECT DISTINCT created_at, updated_at, servis_id, oda_no FROM yataklar
            """
        )
    )

    op.add_column("yataklar", sa.Column("oda_id", sa.Integer(), nullable=True))
    op.add_column("yataklar", sa.Column("durum", sa.String(length=30), nullable=True))

    op.execute(
        sa.text(
            """
            UPDATE yataklar AS y
            SET oda_id = o.id
            FROM odalar AS o
            WHERE o.servis_id = y.servis_id AND o.oda_no = y.oda_no
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE yataklar
            SET durum = CASE WHEN dolu_mu THEN 'DOLU' ELSE 'BOS' END
            """
        )
    )

    op.create_table(
        "yatak_gecmisi",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yatak_id", sa.Integer(), nullable=False),
        sa.Column("hasta_id", sa.Integer(), nullable=False),
        sa.Column("giris_zamani", sa.DateTime(timezone=True), nullable=False),
        sa.Column("cikis_zamani", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["yatak_id"], ["yataklar.id"]),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_yatak_gecmisi_yatak_id", "yatak_gecmisi", ["yatak_id"])
    op.create_index("ix_yatak_gecmisi_hasta_id", "yatak_gecmisi", ["hasta_id"])
    op.create_index(
        "ix_yatak_gecmisi_giris_zamani", "yatak_gecmisi", ["giris_zamani"]
    )
    op.create_index(
        "ix_yatak_gecmisi_cikis_zamani", "yatak_gecmisi", ["cikis_zamani"]
    )

    op.drop_index("ix_yataklar_dolu_mu", table_name="yataklar")
    op.drop_index("ix_yataklar_servis_id", table_name="yataklar")
    op.drop_constraint("yataklar_servis_id_fkey", "yataklar", type_="foreignkey")
    op.drop_column("yataklar", "servis_id")
    op.drop_column("yataklar", "oda_no")
    op.drop_column("yataklar", "dolu_mu")

    op.alter_column("yataklar", "oda_id", nullable=False)
    op.alter_column("yataklar", "durum", nullable=False)
    op.create_foreign_key(
        "yataklar_oda_id_fkey", "yataklar", "odalar", ["oda_id"], ["id"]
    )
    op.create_index("ix_yataklar_oda_id", "yataklar", ["oda_id"])
    op.create_index("ix_yataklar_durum", "yataklar", ["durum"])


def downgrade() -> None:
    op.add_column(
        "yataklar",
        sa.Column("dolu_mu", sa.Boolean(), nullable=True),
    )
    op.add_column(
        "yataklar",
        sa.Column("oda_no", sa.String(length=30), nullable=True),
    )
    op.add_column(
        "yataklar",
        sa.Column("servis_id", sa.Integer(), nullable=True),
    )

    op.execute(
        sa.text(
            """
            UPDATE yataklar AS y
            SET servis_id = o.servis_id,
                oda_no = o.oda_no,
                dolu_mu = CASE WHEN y.durum = 'DOLU' THEN true ELSE false END
            FROM odalar AS o
            WHERE y.oda_id = o.id
            """
        )
    )

    op.drop_constraint("yataklar_oda_id_fkey", "yataklar", type_="foreignkey")
    op.drop_index("ix_yataklar_durum", table_name="yataklar")
    op.drop_index("ix_yataklar_oda_id", table_name="yataklar")
    op.drop_column("yataklar", "durum")
    op.drop_column("yataklar", "oda_id")

    op.drop_table("yatak_gecmisi")
    op.drop_table("odalar")

    op.drop_index("ix_servisler_tip", table_name="servisler")
    op.drop_column("servisler", "tip")

    op.alter_column("yataklar", "servis_id", nullable=False)
    op.alter_column("yataklar", "oda_no", nullable=False)
    op.alter_column("yataklar", "dolu_mu", nullable=False)
    op.create_foreign_key(
        "yataklar_servis_id_fkey", "yataklar", "servisler", ["servis_id"], ["id"]
    )
    op.create_index("ix_yataklar_servis_id", "yataklar", ["servis_id"])
    op.create_index("ix_yataklar_dolu_mu", "yataklar", ["dolu_mu"])
