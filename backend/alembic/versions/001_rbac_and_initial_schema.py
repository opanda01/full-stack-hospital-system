"""rbac and initial schema

Revision ID: 001_rbac_initial
Revises:
Create Date: 2026-07-20

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001_rbac_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "roller",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("kod", sa.String(length=50), nullable=False),
        sa.Column("ad", sa.String(length=100), nullable=False),
        sa.Column("aciklama", sa.String(length=255), nullable=True),
        sa.Column("sistem_mi", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_roller_kod"), "roller", ["kod"], unique=True)

    op.create_table(
        "izinler",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("kod", sa.String(length=100), nullable=False),
        sa.Column("ad", sa.String(length=100), nullable=False),
        sa.Column("kaynak", sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_izinler_kod"), "izinler", ["kod"], unique=True)
    op.create_index(op.f("ix_izinler_kaynak"), "izinler", ["kaynak"], unique=False)

    op.create_table(
        "kullanicilar",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("tc_kimlik_no", sa.String(length=11), nullable=False),
        sa.Column("ad", sa.String(length=100), nullable=False),
        sa.Column("soyad", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("telefon", sa.String(length=20), nullable=True),
        sa.Column("sifre_hash", sa.String(), nullable=False),
        sa.Column("aktif_mi", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_kullanicilar_tc_kimlik_no"), "kullanicilar", ["tc_kimlik_no"], unique=True
    )
    op.create_index(op.f("ix_kullanicilar_email"), "kullanicilar", ["email"], unique=True)

    op.create_table(
        "rol_izinler",
        sa.Column("rol_id", sa.Integer(), nullable=False),
        sa.Column("izin_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["izin_id"], ["izinler.id"]),
        sa.ForeignKeyConstraint(["rol_id"], ["roller.id"]),
        sa.PrimaryKeyConstraint("rol_id", "izin_id"),
    )

    op.create_table(
        "kullanici_roller",
        sa.Column("kullanici_id", sa.Integer(), nullable=False),
        sa.Column("rol_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["kullanici_id"], ["kullanicilar.id"]),
        sa.ForeignKeyConstraint(["rol_id"], ["roller.id"]),
        sa.PrimaryKeyConstraint("kullanici_id", "rol_id"),
    )

    op.create_table(
        "departmanlar",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("ad", sa.String(length=150), nullable=False),
        sa.Column("kategori", sa.String(length=100), nullable=True),
        sa.Column("aciklama", sa.String(length=1000), nullable=True),
        sa.Column("kat_no", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_departmanlar_ad"), "departmanlar", ["ad"], unique=True)

    op.create_table(
        "personel",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("kullanici_id", sa.Integer(), nullable=False),
        sa.Column("sicil_no", sa.String(length=50), nullable=False),
        sa.Column("departman_id", sa.Integer(), nullable=True),
        sa.Column("unvan", sa.String(length=100), nullable=True),
        sa.Column("amir_id", sa.Integer(), nullable=True),
        sa.Column("yonetim_gorevi", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(["amir_id"], ["personel.id"]),
        sa.ForeignKeyConstraint(["departman_id"], ["departmanlar.id"]),
        sa.ForeignKeyConstraint(["kullanici_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_personel_kullanici_id"), "personel", ["kullanici_id"], unique=True)
    op.create_index(op.f("ix_personel_sicil_no"), "personel", ["sicil_no"], unique=True)
    op.create_index(op.f("ix_personel_departman_id"), "personel", ["departman_id"], unique=False)
    op.create_index(op.f("ix_personel_amir_id"), "personel", ["amir_id"], unique=False)
    op.create_index(
        op.f("ix_personel_yonetim_gorevi"), "personel", ["yonetim_gorevi"], unique=False
    )

    op.create_table(
        "doktorlar",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("personel_id", sa.Integer(), nullable=False),
        sa.Column("uzmanlik_alani", sa.String(length=150), nullable=False),
        sa.Column("diploma_no", sa.String(length=50), nullable=False),
        sa.Column("online_randevu_acik_mi", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["personel_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("diploma_no"),
    )
    op.create_index(op.f("ix_doktorlar_personel_id"), "doktorlar", ["personel_id"], unique=True)

    op.create_table(
        "hastalar",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("kullanici_id", sa.Integer(), nullable=False),
        sa.Column("tc_kimlik_no", sa.String(length=11), nullable=False),
        sa.Column("dogum_tarihi", sa.Date(), nullable=True),
        sa.Column("cinsiyet", sa.String(length=20), nullable=True),
        sa.Column("kan_grubu", sa.String(length=10), nullable=True),
        sa.Column("adres", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["kullanici_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_hastalar_kullanici_id"), "hastalar", ["kullanici_id"], unique=True)
    op.create_index(
        op.f("ix_hastalar_tc_kimlik_no"), "hastalar", ["tc_kimlik_no"], unique=True
    )

    op.create_table(
        "randevular",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("hasta_id", sa.Integer(), nullable=False),
        sa.Column("doktor_id", sa.Integer(), nullable=False),
        sa.Column("departman_id", sa.Integer(), nullable=False),
        sa.Column("tarih_saat", sa.DateTime(), nullable=False),
        sa.Column("durum", sa.String(length=50), nullable=False),
        sa.Column("notlar", sa.String(length=1000), nullable=True),
        sa.ForeignKeyConstraint(["departman_id"], ["departmanlar.id"]),
        sa.ForeignKeyConstraint(["doktor_id"], ["doktorlar.id"]),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_randevular_hasta_id"), "randevular", ["hasta_id"], unique=False)
    op.create_index(op.f("ix_randevular_doktor_id"), "randevular", ["doktor_id"], unique=False)
    op.create_index(
        op.f("ix_randevular_departman_id"), "randevular", ["departman_id"], unique=False
    )
    op.create_index(op.f("ix_randevular_tarih_saat"), "randevular", ["tarih_saat"], unique=False)
    op.create_index(op.f("ix_randevular_durum"), "randevular", ["durum"], unique=False)

    op.create_table(
        "muayene_kayitlari",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("randevu_id", sa.Integer(), nullable=False),
        sa.Column("tani", sa.String(length=2000), nullable=True),
        sa.Column("tedavi_plani", sa.String(length=2000), nullable=True),
        sa.Column("receteler", sa.String(length=2000), nullable=True),
        sa.ForeignKeyConstraint(["randevu_id"], ["randevular.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_muayene_kayitlari_randevu_id"), "muayene_kayitlari", ["randevu_id"], unique=True
    )

    op.create_table(
        "tetkikler",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("hasta_id", sa.Integer(), nullable=False),
        sa.Column("istek_yapan_doktor_id", sa.Integer(), nullable=False),
        sa.Column("tetkik_turu", sa.String(length=150), nullable=False),
        sa.Column("sonuc_dosyasi", sa.String(length=500), nullable=True),
        sa.Column("durum", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(["hasta_id"], ["hastalar.id"]),
        sa.ForeignKeyConstraint(["istek_yapan_doktor_id"], ["doktorlar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tetkikler_hasta_id"), "tetkikler", ["hasta_id"], unique=False)
    op.create_index(
        op.f("ix_tetkikler_istek_yapan_doktor_id"),
        "tetkikler",
        ["istek_yapan_doktor_id"],
        unique=False,
    )
    op.create_index(op.f("ix_tetkikler_durum"), "tetkikler", ["durum"], unique=False)

    op.create_table(
        "nobet_cizelgesi",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("personel_id", sa.Integer(), nullable=False),
        sa.Column("tarih", sa.Date(), nullable=False),
        sa.Column("vardiya", sa.String(length=50), nullable=False),
        sa.Column("departman_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["departman_id"], ["departmanlar.id"]),
        sa.ForeignKeyConstraint(["personel_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_nobet_cizelgesi_personel_id"), "nobet_cizelgesi", ["personel_id"], unique=False
    )
    op.create_index(op.f("ix_nobet_cizelgesi_tarih"), "nobet_cizelgesi", ["tarih"], unique=False)
    op.create_index(
        op.f("ix_nobet_cizelgesi_departman_id"),
        "nobet_cizelgesi",
        ["departman_id"],
        unique=False,
    )

    op.create_table(
        "temizlik_gorevleri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("personel_id", sa.Integer(), nullable=False),
        sa.Column("oda_bolum", sa.String(length=150), nullable=False),
        sa.Column("gorev_tarihi", sa.Date(), nullable=False),
        sa.Column("durum", sa.String(length=50), nullable=False),
        sa.Column("onay_veren_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["onay_veren_id"], ["personel.id"]),
        sa.ForeignKeyConstraint(["personel_id"], ["personel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_temizlik_gorevleri_personel_id"),
        "temizlik_gorevleri",
        ["personel_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_temizlik_gorevleri_gorev_tarihi"),
        "temizlik_gorevleri",
        ["gorev_tarihi"],
        unique=False,
    )
    op.create_index(
        op.f("ix_temizlik_gorevleri_durum"), "temizlik_gorevleri", ["durum"], unique=False
    )
    op.create_index(
        op.f("ix_temizlik_gorevleri_onay_veren_id"),
        "temizlik_gorevleri",
        ["onay_veren_id"],
        unique=False,
    )

    op.create_table(
        "sikayet_oneri",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("gonderen_kullanici_id", sa.Integer(), nullable=False),
        sa.Column("tur", sa.String(length=50), nullable=False),
        sa.Column("icerik", sa.String(length=5000), nullable=False),
        sa.Column("tarih", sa.DateTime(), nullable=False),
        sa.Column("durum", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(["gonderen_kullanici_id"], ["kullanicilar.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_sikayet_oneri_gonderen_kullanici_id"),
        "sikayet_oneri",
        ["gonderen_kullanici_id"],
        unique=False,
    )
    op.create_index(op.f("ix_sikayet_oneri_tarih"), "sikayet_oneri", ["tarih"], unique=False)
    op.create_index(op.f("ix_sikayet_oneri_durum"), "sikayet_oneri", ["durum"], unique=False)


def downgrade() -> None:
    op.drop_table("sikayet_oneri")
    op.drop_table("temizlik_gorevleri")
    op.drop_table("nobet_cizelgesi")
    op.drop_table("tetkikler")
    op.drop_table("muayene_kayitlari")
    op.drop_table("randevular")
    op.drop_table("hastalar")
    op.drop_table("doktorlar")
    op.drop_table("personel")
    op.drop_table("departmanlar")
    op.drop_table("kullanici_roller")
    op.drop_table("rol_izinler")
    op.drop_table("kullanicilar")
    op.drop_table("izinler")
    op.drop_table("roller")
