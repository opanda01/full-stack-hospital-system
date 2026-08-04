"""MPI merge iskeleti: mükerrer aday + kontrollü birleştirme isteği.

Revision ID: 025_mpi_mukerrer
Revises: 024_lab_panic
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "025_mpi_mukerrer"
down_revision: Union[str, Sequence[str], None] = "024_lab_panic"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "hastalar",
        sa.Column("merged_into_hasta_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        "ix_hastalar_merged_into_hasta_id",
        "hastalar",
        ["merged_into_hasta_id"],
    )
    op.create_foreign_key(
        "fk_hastalar_merged_into",
        "hastalar",
        "hastalar",
        ["merged_into_hasta_id"],
        ["id"],
    )
    op.create_table(
        "hasta_mukerrer_istekleri",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("kaynak_hasta_id", sa.Integer(), nullable=False),
        sa.Column("hedef_hasta_id", sa.Integer(), nullable=False),
        sa.Column("durum", sa.String(30), nullable=False, server_default="BEKLEMEDE"),
        sa.Column("gerekce", sa.String(1000), nullable=False),
        sa.Column("olusturan_id", sa.Integer(), nullable=False),
        sa.Column("onaylayan_id", sa.Integer(), nullable=True),
        sa.Column("karar_tarihi", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["kaynak_hasta_id"], ["hastalar.id"]),
        sa.ForeignKeyConstraint(["hedef_hasta_id"], ["hastalar.id"]),
        sa.ForeignKeyConstraint(["olusturan_id"], ["kullanicilar.id"]),
        sa.ForeignKeyConstraint(["onaylayan_id"], ["kullanicilar.id"]),
    )
    op.create_index(
        "ix_hasta_mukerrer_istekleri_kaynak",
        "hasta_mukerrer_istekleri",
        ["kaynak_hasta_id"],
    )
    op.create_index(
        "ix_hasta_mukerrer_istekleri_hedef",
        "hasta_mukerrer_istekleri",
        ["hedef_hasta_id"],
    )
    op.create_index(
        "ix_hasta_mukerrer_istekleri_durum",
        "hasta_mukerrer_istekleri",
        ["durum"],
    )


def downgrade() -> None:
    op.drop_table("hasta_mukerrer_istekleri")
    op.drop_constraint("fk_hastalar_merged_into", "hastalar", type_="foreignkey")
    op.drop_index("ix_hastalar_merged_into_hasta_id", table_name="hastalar")
    op.drop_column("hastalar", "merged_into_hasta_id")
