"""Entegrasyon outbox + fatura MEDULA alanları + ICD-10 + lab kalemleri.

Revision ID: 016_entegrasyon_icd_lab
Revises: 015_kvkk_phi
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "016_entegrasyon_icd_lab"
down_revision: Union[str, Sequence[str], None] = "015_kvkk_phi"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "entegrasyon_gonderimleri",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("sistem", sa.String(40), nullable=False),
        sa.Column("kaynak", sa.String(40), nullable=False),
        sa.Column("kaynak_id", sa.String(64), nullable=False),
        sa.Column("idempotency_key", sa.String(128), nullable=False),
        sa.Column("durum", sa.String(40), nullable=False, server_default="BEKLEMEDE"),
        sa.Column("dis_referans", sa.String(128), nullable=True),
        sa.Column("son_hata", sa.String(1000), nullable=True),
        sa.Column("payload_json", sa.String(8000), nullable=True),
        sa.Column("deneme", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("son_deneme", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "ix_entegrasyon_gonderimleri_idempotency_key",
        "entegrasyon_gonderimleri",
        ["idempotency_key"],
        unique=True,
    )

    op.add_column("faturalar", sa.Column("medula_takip_no", sa.String(64), nullable=True))
    op.add_column("faturalar", sa.Column("provizyon_no", sa.String(64), nullable=True))
    op.add_column(
        "faturalar",
        sa.Column("gonderim_durumu", sa.String(40), nullable=True, server_default="BEKLEMEDE"),
    )

    op.create_table(
        "icd10_kodlari",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("kod", sa.String(16), nullable=False),
        sa.Column("aciklama", sa.String(500), nullable=False),
    )
    op.create_index("ix_icd10_kodlari_kod", "icd10_kodlari", ["kod"], unique=True)

    op.create_table(
        "muayene_tani_kodlari",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column(
            "muayene_id",
            sa.Integer(),
            sa.ForeignKey("muayene_kayitlari.id"),
            nullable=False,
        ),
        sa.Column("icd10_kod", sa.String(16), nullable=False),
        sa.Column("tani_aciklama", sa.String(500), nullable=True),
        sa.Column("sira", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_index(
        "ix_muayene_tani_kodlari_muayene_id", "muayene_tani_kodlari", ["muayene_id"]
    )

    op.create_table(
        "tetkik_sonuc_kalemleri",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("tetkik_id", sa.Integer(), sa.ForeignKey("tetkikler.id"), nullable=False),
        sa.Column("parametre_adi", sa.String(150), nullable=False),
        sa.Column("loinc_kodu", sa.String(32), nullable=True),
        sa.Column("deger_sayisal", sa.Float(), nullable=True),
        sa.Column("deger_metin", sa.String(200), nullable=True),
        sa.Column("birim", sa.String(40), nullable=True),
        sa.Column("ref_min", sa.Float(), nullable=True),
        sa.Column("ref_max", sa.Float(), nullable=True),
        sa.Column("anormal_mi", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index(
        "ix_tetkik_sonuc_kalemleri_tetkik_id", "tetkik_sonuc_kalemleri", ["tetkik_id"]
    )

    op.execute(
        """
        INSERT INTO icd10_kodlari (created_at, updated_at, kod, aciklama) VALUES
        (now(), now(), 'I10', 'Esansiyel (primer) hipertansiyon'),
        (now(), now(), 'E11', 'Tip 2 diabetes mellitus'),
        (now(), now(), 'J06.9', 'Akut üst solunum yolu enfeksiyonu, tanımlanmamış'),
        (now(), now(), 'J18.9', 'Pnömoni, tanımlanmamış'),
        (now(), now(), 'N39.0', 'İdrar yolu enfeksiyonu, yeri belirtilmemiş'),
        (now(), now(), 'M54.5', 'Bel ağrısı'),
        (now(), now(), 'R51', 'Baş ağrısı'),
        (now(), now(), 'K21.0', 'Özofajitli gastro-özofageal reflü hastalığı')
        """
    )


def downgrade() -> None:
    op.drop_table("tetkik_sonuc_kalemleri")
    op.drop_table("muayene_tani_kodlari")
    op.drop_table("icd10_kodlari")
    op.drop_column("faturalar", "gonderim_durumu")
    op.drop_column("faturalar", "provizyon_no")
    op.drop_column("faturalar", "medula_takip_no")
    op.drop_table("entegrasyon_gonderimleri")
