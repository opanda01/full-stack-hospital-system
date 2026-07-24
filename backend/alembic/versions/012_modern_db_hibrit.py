"""Modern hibrit: timestamptz, unique, stok CHECK, audit partition/triggers.

Revision ID: 012_modern_db_hibrit
Revises: 011_guvenlik_paneli
Create Date: 2026-07-24

Cutover notu: denetim_kayitlari rename AccessExclusiveLock alır —
düşük trafikli pencerede çalıştırın (docs/runbooks/db-ops.md).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "012_modern_db_hibrit"
down_revision: Union[str, None] = "011_guvenlik_paneli"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name != "postgresql":
        return

    # --- Randevu timestamptz (sessiz kayma yok: USING sabit TZ) ---
    op.execute("SET LOCAL timezone = 'Europe/Istanbul'")
    op.execute(
        """
        ALTER TABLE randevular
        ALTER COLUMN tarih_saat TYPE TIMESTAMPTZ
        USING tarih_saat AT TIME ZONE 'Europe/Istanbul'
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_randevular_doktor_slot_aktif
        ON randevular (doktor_id, tarih_saat)
        WHERE durum <> 'IPTAL'
        """
    )

    # Doğrulama: en az bir satır varsa yerel saat tutarlılığı smoke
    op.execute(
        """
        DO $$
        DECLARE
            n int;
            sample_local timestamp;
        BEGIN
            SELECT COUNT(*) INTO n FROM randevular;
            IF n > 0 THEN
                SELECT (tarih_saat AT TIME ZONE 'Europe/Istanbul') INTO sample_local
                FROM randevular ORDER BY id LIMIT 1;
                IF sample_local IS NULL THEN
                    RAISE EXCEPTION 'timestamptz migration doğrulama başarısız';
                END IF;
            END IF;
        END $$;
        """
    )

    # --- MHRS unique + idempotency ---
    op.add_column(
        "mhrs_kapasiteler",
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
    )
    op.add_column(
        "mhrs_kapasiteler",
        sa.Column("payload_hash", sa.String(length=64), nullable=True),
    )
    op.execute(
        """
        UPDATE mhrs_kapasiteler
        SET idempotency_key = 'mhrs:' || departman_id || ':' ||
            COALESCE(doktor_id::text, 'none') || ':' || tarih::text || ':create',
            payload_hash = encode(
                sha256(
                    convert_to(
                        json_build_object(
                            'departman_id', departman_id,
                            'doktor_id', doktor_id,
                            'tarih', tarih,
                            'slot_sayisi', slot_sayisi
                        )::text,
                        'UTF8'
                    )
                ),
                'hex'
            )
        WHERE idempotency_key IS NULL
        """
    )
    op.create_index(
        "ix_mhrs_kapasiteler_idempotency_key",
        "mhrs_kapasiteler",
        ["idempotency_key"],
        unique=True,
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_mhrs_kapasite_gun
        ON mhrs_kapasiteler (departman_id, COALESCE(doktor_id, -1), tarih)
        """
    )
    op.execute(
        """
        ALTER TABLE mhrs_kapasiteler
        ALTER COLUMN son_senkron TYPE TIMESTAMPTZ
        USING CASE
            WHEN son_senkron IS NULL THEN NULL
            ELSE son_senkron AT TIME ZONE 'Europe/Istanbul'
        END
        """
    )

    # --- İlaç stok CHECK ---
    op.execute(
        "UPDATE ilaclar SET stok = 0 WHERE stok < 0"
    )
    op.execute(
        """
        ALTER TABLE ilaclar
        ADD CONSTRAINT ck_ilaclar_stok_nonneg CHECK (stok >= 0)
        """
    )

    # --- denetim_kayitlari: timestamptz + partition cutover ---
    op.execute(
        """
        ALTER TABLE denetim_kayitlari
        ALTER COLUMN zaman TYPE TIMESTAMPTZ
        USING zaman AT TIME ZONE 'Europe/Istanbul'
        """
    )

    op.execute(
        """
        CREATE TABLE denetim_kayitlari_new (
            id INTEGER NOT NULL,
            actor_id INTEGER REFERENCES kullanicilar(id),
            aksiyon VARCHAR(100) NOT NULL,
            kaynak VARCHAR(100),
            kaynak_id VARCHAR(100),
            ip_adresi VARCHAR(64),
            detay JSONB,
            zaman TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (id, zaman)
        ) PARTITION BY RANGE (zaman)
        """
    )

    # Aylık partition'lar: 2024-01 .. 2028-12 + default
    for year in range(2024, 2029):
        for month in range(1, 13):
            if month == 12:
                next_y, next_m = year + 1, 1
            else:
                next_y, next_m = year, month + 1
            name = f"denetim_kayitlari_y{year}m{month:02d}"
            op.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {name}
                PARTITION OF denetim_kayitlari_new
                FOR VALUES FROM ('{year}-{month:02d}-01') TO ('{next_y}-{next_m:02d}-01')
                """
            )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS denetim_kayitlari_default
        PARTITION OF denetim_kayitlari_new DEFAULT
        """
    )

    op.execute(
        """
        INSERT INTO denetim_kayitlari_new
            (id, actor_id, aksiyon, kaynak, kaynak_id, ip_adresi, detay, zaman)
        SELECT id, actor_id, aksiyon, kaynak, kaynak_id, ip_adresi,
               CASE WHEN detay IS NULL THEN NULL ELSE detay::jsonb END,
               zaman
        FROM denetim_kayitlari
        """
    )

    op.execute(
        """
        CREATE SEQUENCE IF NOT EXISTS denetim_kayitlari_id_seq
        """
    )
    op.execute(
        """
        SELECT setval(
            'denetim_kayitlari_id_seq',
            COALESCE((SELECT MAX(id) FROM denetim_kayitlari_new), 1),
            true
        )
        """
    )
    op.execute(
        """
        ALTER TABLE denetim_kayitlari_new
        ALTER COLUMN id SET DEFAULT nextval('denetim_kayitlari_id_seq')
        """
    )
    op.execute(
        "ALTER SEQUENCE denetim_kayitlari_id_seq OWNED BY denetim_kayitlari_new.id"
    )

    op.execute("ALTER TABLE denetim_kayitlari RENAME TO denetim_kayitlari_old")
    op.execute("ALTER TABLE denetim_kayitlari_new RENAME TO denetim_kayitlari")

    # Index'ler (parent — her partition'a yayılır)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_denetim_zaman ON denetim_kayitlari (zaman DESC)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_denetim_actor_zaman "
        "ON denetim_kayitlari (actor_id, zaman DESC)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_denetim_kaynak_zaman "
        "ON denetim_kayitlari (kaynak, kaynak_id, zaman DESC)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_denetim_aksiyon_zaman "
        "ON denetim_kayitlari (aksiyon, zaman DESC)"
    )

    # Append-only
    op.execute(
        """
        CREATE OR REPLACE FUNCTION denetim_kayitlari_immutability()
        RETURNS trigger AS $$
        BEGIN
            RAISE EXCEPTION 'denetim_kayitlari append-only: UPDATE/DELETE yasak';
        END;
        $$ LANGUAGE plpgsql
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_denetim_immutability
        BEFORE UPDATE OR DELETE ON denetim_kayitlari
        FOR EACH ROW EXECUTE FUNCTION denetim_kayitlari_immutability()
        """
    )

    # PHI maskeli hasta yazım audit
    op.execute(
        """
        CREATE OR REPLACE FUNCTION mask_tc(tc text)
        RETURNS text AS $$
        BEGIN
            IF tc IS NULL OR length(tc) < 4 THEN
                RETURN '[masked]';
            END IF;
            RETURN '***' || right(tc, 4);
        END;
        $$ LANGUAGE plpgsql IMMUTABLE
        """
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION hastalar_audit_trigger()
        RETURNS trigger AS $$
        DECLARE
            actor text;
            aid int;
            eski jsonb;
            yeni jsonb;
        BEGIN
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
                    'dogum_tarihi', OLD.dogum_tarihi
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
                'dogum_tarihi', OLD.dogum_tarihi
            );
            yeni := jsonb_build_object(
                'tc_kimlik_no', mask_tc(NEW.tc_kimlik_no),
                'adres', '[masked]',
                'kan_grubu', NEW.kan_grubu,
                'cinsiyet', NEW.cinsiyet,
                'dogum_tarihi', NEW.dogum_tarihi
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
    op.execute(
        """
        CREATE TRIGGER trg_hastalar_audit
        AFTER UPDATE OR DELETE ON hastalar
        FOR EACH ROW EXECUTE FUNCTION hastalar_audit_trigger()
        """
    )

    # Eski tabloyu cutover sonrası bırak (doğrulama); drop ayrı manuel/runbook
    # op.execute("DROP TABLE denetim_kayitlari_old")  # runbook


def downgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name != "postgresql":
        return

    op.execute("DROP TRIGGER IF EXISTS trg_hastalar_audit ON hastalar")
    op.execute("DROP FUNCTION IF EXISTS hastalar_audit_trigger()")
    op.execute("DROP FUNCTION IF EXISTS mask_tc(text)")

    op.execute("DROP TRIGGER IF EXISTS trg_denetim_immutability ON denetim_kayitlari")
    op.execute("DROP FUNCTION IF EXISTS denetim_kayitlari_immutability()")

    # Partition geri alma: old varsa swap
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'denetim_kayitlari_old'
            ) THEN
                DROP TABLE IF EXISTS denetim_kayitlari CASCADE;
                ALTER TABLE denetim_kayitlari_old RENAME TO denetim_kayitlari;
            END IF;
        END $$;
        """
    )

    op.execute("ALTER TABLE ilaclar DROP CONSTRAINT IF EXISTS ck_ilaclar_stok_nonneg")
    op.execute("DROP INDEX IF EXISTS uq_mhrs_kapasite_gun")
    op.execute("DROP INDEX IF EXISTS ix_mhrs_kapasiteler_idempotency_key")
    op.drop_column("mhrs_kapasiteler", "payload_hash")
    op.drop_column("mhrs_kapasiteler", "idempotency_key")
    op.execute("DROP INDEX IF EXISTS uq_randevular_doktor_slot_aktif")
