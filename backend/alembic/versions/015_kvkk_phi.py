"""KVKK metin/onay + PHI hash kolonları + skip_hasta_audit trigger.

Revision ID: 015_kvkk_phi
Revises: 014_klinik_guvenlik
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "015_kvkk_phi"
down_revision: Union[str, Sequence[str], None] = "014_klinik_guvenlik"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "kvkk_metinleri",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("tur", sa.String(40), nullable=False),
        sa.Column("versiyon", sa.String(40), nullable=False),
        sa.Column("baslik", sa.String(200), nullable=False),
        sa.Column("govde", sa.String(20000), nullable=False),
        sa.Column("yururluk_tarihi", sa.DateTime(), nullable=False),
        sa.Column("aktif_mi", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_kvkk_metinleri_tur", "kvkk_metinleri", ["tur"])
    op.create_index("ix_kvkk_metinleri_aktif_mi", "kvkk_metinleri", ["aktif_mi"])

    op.create_table(
        "kvkk_onay_kayitlari",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column(
            "kullanici_id", sa.Integer(), sa.ForeignKey("kullanicilar.id"), nullable=False
        ),
        sa.Column(
            "metin_id", sa.Integer(), sa.ForeignKey("kvkk_metinleri.id"), nullable=False
        ),
        sa.Column("onay_tarihi", sa.DateTime(), nullable=False),
        sa.Column("ip", sa.String(64), nullable=True),
        sa.Column("kanal", sa.String(40), nullable=False, server_default="WEB"),
    )
    op.create_index(
        "ix_kvkk_onay_kayitlari_kullanici_id", "kvkk_onay_kayitlari", ["kullanici_id"]
    )
    op.create_index(
        "ix_kvkk_onay_kayitlari_metin_id", "kvkk_onay_kayitlari", ["metin_id"]
    )

    op.execute(
        """
        INSERT INTO kvkk_metinleri
            (created_at, updated_at, tur, versiyon, baslik, govde, yururluk_tarihi, aktif_mi)
        VALUES
            (now(), now(), 'PERSONEL', '1.0', 'Personel KVKK Aydınlatma',
             'Kişisel verileriniz HBYS kapsamında işlenmektedir. Detaylar için kurum KVKK politikasına bakınız.',
             now(), true),
            (now(), now(), 'ACIK_RIZA', '1.0', 'Hasta Açık Rıza',
             'Sağlık verilerimin işlenmesine ve bakanlık bildirimlerine açık rıza veriyorum.',
             now(), true),
            (now(), now(), 'AYDINLATMA', '1.0', 'Hasta Aydınlatma Metni',
             '6698 sayılı KVKK m.10 kapsamında aydınlatma metnidir.',
             now(), true)
        """
    )

    op.add_column(
        "hastalar",
        sa.Column("tc_kimlik_no_hash", sa.String(128), nullable=True),
    )
    op.add_column(
        "hastalar",
        sa.Column("tc_kimlik_no_hash_prev", sa.String(128), nullable=True),
    )
    op.add_column(
        "hastalar",
        sa.Column("anonymized_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_hastalar_tc_kimlik_no_hash", "hastalar", ["tc_kimlik_no_hash"], unique=True)
    op.create_index(
        "ix_hastalar_tc_kimlik_no_hash_prev", "hastalar", ["tc_kimlik_no_hash_prev"]
    )
    op.execute("ALTER TABLE hastalar ALTER COLUMN tc_kimlik_no TYPE VARCHAR(512)")
    op.execute("ALTER TABLE hastalar ALTER COLUMN adres TYPE VARCHAR(2000)")

    op.add_column(
        "kullanicilar",
        sa.Column("tc_kimlik_no_hash", sa.String(128), nullable=True),
    )
    op.create_index(
        "ix_kullanicilar_tc_kimlik_no_hash",
        "kullanicilar",
        ["tc_kimlik_no_hash"],
        unique=True,
    )
    op.execute("ALTER TABLE kullanicilar ALTER COLUMN tc_kimlik_no TYPE VARCHAR(512)")

    # skip_hasta_audit support in trigger
    op.execute(
        """
        CREATE OR REPLACE FUNCTION hastalar_audit_trigger()
        RETURNS trigger AS $$
        DECLARE
            actor text;
            aid int;
            eski jsonb;
            yeni jsonb;
            skip text;
        BEGIN
            skip := current_setting('app.skip_hasta_audit', true);
            IF skip = '1' THEN
                IF TG_OP = 'DELETE' THEN
                    RETURN OLD;
                END IF;
                RETURN NEW;
            END IF;

            actor := current_setting('app.actor_id', true);
            IF actor IS NULL OR actor = '' THEN
                aid := NULL;
            ELSE
                aid := actor::int;
            END IF;

            IF TG_OP = 'DELETE' THEN
                eski := jsonb_build_object(
                    'id', OLD.id,
                    'tc_kimlik_no', mask_tc(OLD.tc_kimlik_no),
                    'adres', '[masked]',
                    'kan_grubu', OLD.kan_grubu,
                    'cinsiyet', OLD.cinsiyet,
                    'dogum_tarihi', OLD.dogum_tarihi,
                    'hasta_public_id', OLD.public_id
                );
                INSERT INTO denetim_kayitlari
                    (actor_id, aksiyon, kaynak, kaynak_id, detay, zaman)
                VALUES (
                    aid,
                    'HASTA_DELETE',
                    'hastalar',
                    OLD.id::text,
                    jsonb_build_object('eski', eski, 'kaynak_tip',
                        CASE WHEN aid IS NULL THEN 'db_direct' ELSE 'app' END),
                    now()
                );
                RETURN OLD;
            END IF;

            eski := jsonb_build_object(
                'tc_kimlik_no', mask_tc(OLD.tc_kimlik_no),
                'adres', '[masked]',
                'kan_grubu', OLD.kan_grubu,
                'cinsiyet', OLD.cinsiyet,
                'dogum_tarihi', OLD.dogum_tarihi,
                'hasta_public_id', OLD.public_id
            );
            yeni := jsonb_build_object(
                'tc_kimlik_no', mask_tc(NEW.tc_kimlik_no),
                'adres', '[masked]',
                'kan_grubu', NEW.kan_grubu,
                'cinsiyet', NEW.cinsiyet,
                'dogum_tarihi', NEW.dogum_tarihi,
                'hasta_public_id', NEW.public_id
            );
            INSERT INTO denetim_kayitlari
                (actor_id, aksiyon, kaynak, kaynak_id, detay, zaman)
            VALUES (
                aid,
                'HASTA_UPDATE',
                'hastalar',
                NEW.id::text,
                jsonb_build_object(
                    'eski', eski,
                    'yeni', yeni,
                    'kaynak_tip',
                    CASE WHEN aid IS NULL THEN 'db_direct' ELSE 'app' END
                ),
                now()
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
        """
    )


def downgrade() -> None:
    op.drop_index("ix_kullanicilar_tc_kimlik_no_hash", table_name="kullanicilar")
    op.drop_column("kullanicilar", "tc_kimlik_no_hash")
    op.drop_index("ix_hastalar_tc_kimlik_no_hash_prev", table_name="hastalar")
    op.drop_index("ix_hastalar_tc_kimlik_no_hash", table_name="hastalar")
    op.drop_column("hastalar", "anonymized_at")
    op.drop_column("hastalar", "tc_kimlik_no_hash_prev")
    op.drop_column("hastalar", "tc_kimlik_no_hash")
    op.drop_table("kvkk_onay_kayitlari")
    op.drop_table("kvkk_metinleri")
