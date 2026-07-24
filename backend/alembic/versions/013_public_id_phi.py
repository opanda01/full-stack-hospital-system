"""PHI tablolarına dışa açık public_id (UUID) ekler.

hastalar / randevular / tetkikler: integer PK kalır; public_id unique.
hastalar_audit_trigger: kaynak_id int::text kalır; detay'a hasta_public_id eklenir.

Revision ID: 013_public_id_phi
Revises: 012_modern_db_hibrit
"""

from typing import Sequence, Union

from alembic import op

revision: str = "013_public_id_phi"
down_revision: Union[str, Sequence[str], None] = "012_modern_db_hibrit"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLES = ("hastalar", "randevular", "tetkikler")


def upgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name != "postgresql":
        return

    # --- public_id kolonları (önce nullable) ---
    for table in _TABLES:
        op.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS public_id UUID")

    # --- Backfill ---
    for table in _TABLES:
        op.execute(
            f"UPDATE {table} SET public_id = gen_random_uuid() WHERE public_id IS NULL"
        )

    # --- Doğrulama ---
    op.execute(
        """
        DO $$
        DECLARE
            t text;
            null_cnt bigint;
            total_cnt bigint;
            distinct_cnt bigint;
        BEGIN
            FOREACH t IN ARRAY ARRAY['hastalar', 'randevular', 'tetkikler']
            LOOP
                EXECUTE format(
                    'SELECT COUNT(*) FILTER (WHERE public_id IS NULL), COUNT(*), COUNT(DISTINCT public_id) FROM %I',
                    t
                ) INTO null_cnt, total_cnt, distinct_cnt;
                IF null_cnt > 0 THEN
                    RAISE EXCEPTION '% public_id backfill incomplete: % null rows', t, null_cnt;
                END IF;
                IF total_cnt <> distinct_cnt THEN
                    RAISE EXCEPTION '% public_id not unique: total=% distinct=%', t, total_cnt, distinct_cnt;
                END IF;
            END LOOP;
        END;
        $$;
        """
    )

    # --- NOT NULL + DEFAULT + unique index ---
    for table in _TABLES:
        op.execute(
            f"ALTER TABLE {table} ALTER COLUMN public_id SET DEFAULT gen_random_uuid()"
        )
        op.execute(f"ALTER TABLE {table} ALTER COLUMN public_id SET NOT NULL")
        op.execute(
            f"CREATE UNIQUE INDEX IF NOT EXISTS ix_{table}_public_id ON {table} (public_id)"
        )

    # --- Hasta audit trigger: detay'a hasta_public_id ---
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
                    'hasta_public_id', OLD.public_id,
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
                    jsonb_build_object(
                        'eski', eski,
                        'hasta_public_id', OLD.public_id,
                        'kaynak_tip',
                        CASE WHEN aid IS NULL THEN 'db_direct' ELSE 'app' END
                    ),
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
                    'hasta_public_id', NEW.public_id,
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
    conn = op.get_bind()
    if conn.dialect.name != "postgresql":
        return

    # Trigger'ı 012 imzasına (public_id olmadan) geri al
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

    for table in _TABLES:
        op.execute(f"DROP INDEX IF EXISTS ix_{table}_public_id")
        op.execute(f"ALTER TABLE {table} DROP COLUMN IF EXISTS public_id")
