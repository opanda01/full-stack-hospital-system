"""Auth genişletmesi: Kullanici alanları, OTP, import işleri, denetim.

Revision ID: 004_auth_akisi
Revises: 003_refresh_tokens
Create Date: 2026-07-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_auth_akisi"
down_revision: Union[str, None] = "003_refresh_tokens"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "refresh_tokens",
        sa.Column(
            "oturum_tipi",
            sa.String(length=20),
            nullable=False,
            server_default="personel",
        ),
    )
    op.add_column(
        "kullanicilar",
        sa.Column("kullanici_adi", sa.String(length=100), nullable=True),
    )
    op.create_index(
        op.f("ix_kullanicilar_kullanici_adi"),
        "kullanicilar",
        ["kullanici_adi"],
        unique=True,
    )
    op.add_column(
        "kullanicilar",
        sa.Column(
            "sifre_degistirmeli_mi",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "kullanicilar",
        sa.Column(
            "kvkk_onaylandi_mi",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )
    op.add_column(
        "kullanicilar",
        sa.Column("kvkk_onay_tarihi", sa.DateTime(), nullable=True),
    )
    op.alter_column(
        "kullanicilar",
        "sifre_hash",
        existing_type=sa.String(),
        nullable=True,
    )
    op.alter_column(
        "kullanicilar",
        "email",
        existing_type=sa.String(length=255),
        nullable=True,
    )

    op.create_table(
        "otp_kodlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("telefon", sa.String(length=20), nullable=False),
        sa.Column("tc_kimlik_no", sa.String(length=11), nullable=False),
        sa.Column("kod_hash", sa.String(length=64), nullable=False),
        sa.Column("amac", sa.String(length=20), nullable=False),
        sa.Column("deneme_sayisi", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("son_kullanma", sa.DateTime(), nullable=False),
        sa.Column(
            "kullanildi_mi", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_otp_kodlari_telefon"), "otp_kodlari", ["telefon"])
    op.create_index(op.f("ix_otp_kodlari_tc_kimlik_no"), "otp_kodlari", ["tc_kimlik_no"])
    op.create_index(op.f("ix_otp_kodlari_amac"), "otp_kodlari", ["amac"])

    op.create_table(
        "personel_import_isleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("actor_id", sa.Integer(), nullable=False),
        sa.Column("durum", sa.String(length=20), nullable=False),
        sa.Column("toplam", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("basarili", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("basarisiz", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("hata_detay", sa.JSON(), nullable=True),
        sa.Column("celery_task_id", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["actor_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_personel_import_isleri_actor_id"),
        "personel_import_isleri",
        ["actor_id"],
    )
    op.create_index(
        op.f("ix_personel_import_isleri_durum"),
        "personel_import_isleri",
        ["durum"],
    )

    op.create_table(
        "denetim_kayitlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.Column("aksiyon", sa.String(length=100), nullable=False),
        sa.Column("kaynak", sa.String(length=100), nullable=True),
        sa.Column("kaynak_id", sa.String(length=100), nullable=True),
        sa.Column("ip_adresi", sa.String(length=64), nullable=True),
        sa.Column("detay", sa.JSON(), nullable=True),
        sa.Column("zaman", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_denetim_kayitlari_actor_id"), "denetim_kayitlari", ["actor_id"]
    )
    op.create_index(
        op.f("ix_denetim_kayitlari_aksiyon"), "denetim_kayitlari", ["aksiyon"]
    )
    op.create_index(op.f("ix_denetim_kayitlari_zaman"), "denetim_kayitlari", ["zaman"])


def downgrade() -> None:
    op.drop_index(op.f("ix_denetim_kayitlari_zaman"), table_name="denetim_kayitlari")
    op.drop_index(op.f("ix_denetim_kayitlari_aksiyon"), table_name="denetim_kayitlari")
    op.drop_index(op.f("ix_denetim_kayitlari_actor_id"), table_name="denetim_kayitlari")
    op.drop_table("denetim_kayitlari")

    op.drop_index(
        op.f("ix_personel_import_isleri_durum"), table_name="personel_import_isleri"
    )
    op.drop_index(
        op.f("ix_personel_import_isleri_actor_id"), table_name="personel_import_isleri"
    )
    op.drop_table("personel_import_isleri")

    op.drop_index(op.f("ix_otp_kodlari_amac"), table_name="otp_kodlari")
    op.drop_index(op.f("ix_otp_kodlari_tc_kimlik_no"), table_name="otp_kodlari")
    op.drop_index(op.f("ix_otp_kodlari_telefon"), table_name="otp_kodlari")
    op.drop_table("otp_kodlari")

    op.alter_column(
        "kullanicilar",
        "email",
        existing_type=sa.String(length=255),
        nullable=False,
    )
    op.alter_column(
        "kullanicilar",
        "sifre_hash",
        existing_type=sa.String(),
        nullable=False,
    )
    op.drop_column("kullanicilar", "kvkk_onay_tarihi")
    op.drop_column("kullanicilar", "kvkk_onaylandi_mi")
    op.drop_column("kullanicilar", "sifre_degistirmeli_mi")
    op.drop_index(op.f("ix_kullanicilar_kullanici_adi"), table_name="kullanicilar")
    op.drop_column("kullanicilar", "kullanici_adi")
    op.drop_column("refresh_tokens", "oturum_tipi")
