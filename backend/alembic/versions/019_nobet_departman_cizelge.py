"""Departman nöbet çizelgesi başlığı + hücre sırası.

Revision ID: 019_nobet_departman_cizelge
Revises: 018_hasta_boy_kilo
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "019_nobet_departman_cizelge"
down_revision: Union[str, Sequence[str], None] = "018_hasta_boy_kilo"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "nobet_departman_cizelgeleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("departman_id", sa.Integer(), nullable=False),
        sa.Column("hafta_baslangic", sa.Date(), nullable=False),
        sa.Column("baslik", sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(["departman_id"], ["departmanlar.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "departman_id",
            "hafta_baslangic",
            name="uq_nobet_dep_cizelge_hafta",
        ),
    )
    op.create_index(
        op.f("ix_nobet_departman_cizelgeleri_departman_id"),
        "nobet_departman_cizelgeleri",
        ["departman_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_nobet_departman_cizelgeleri_hafta_baslangic"),
        "nobet_departman_cizelgeleri",
        ["hafta_baslangic"],
        unique=False,
    )

    op.add_column(
        "nobet_cizelgesi",
        sa.Column("cizelge_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "nobet_cizelgesi",
        sa.Column("sira", sa.Integer(), server_default="0", nullable=False),
    )
    op.create_foreign_key(
        "fk_nobet_cizelgesi_cizelge_id",
        "nobet_cizelgesi",
        "nobet_departman_cizelgeleri",
        ["cizelge_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_nobet_cizelgesi_cizelge_id"),
        "nobet_cizelgesi",
        ["cizelge_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_nobet_cizelgesi_cizelge_id"), table_name="nobet_cizelgesi")
    op.drop_constraint("fk_nobet_cizelgesi_cizelge_id", "nobet_cizelgesi", type_="foreignkey")
    op.drop_column("nobet_cizelgesi", "sira")
    op.drop_column("nobet_cizelgesi", "cizelge_id")
    op.drop_index(
        op.f("ix_nobet_departman_cizelgeleri_hafta_baslangic"),
        table_name="nobet_departman_cizelgeleri",
    )
    op.drop_index(
        op.f("ix_nobet_departman_cizelgeleri_departman_id"),
        table_name="nobet_departman_cizelgeleri",
    )
    op.drop_table("nobet_departman_cizelgeleri")
