"""Pytest fixtures — SQLite in-memory test DB."""

import app.core.models_registry  # noqa: F401

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.core.db import get_session
from app.core.enums import Rol
from app.core.security import create_access_token, hash_password
from app.features.departmanlar.models import Departman
from app.features.doktorlar.models import Doktor
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.randevular.models import Randevu
from app.features.temizlik_gorevleri.models import TemizlikGorevi
from app.features.tetkikler.models import Tetkik
from app.main import app
from datetime import date, datetime, timedelta


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def _get_session():
        yield session

    app.dependency_overrides[get_session] = _get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _user(
    session: Session,
    *,
    email: str,
    rol: Rol,
    tc: str,
    ad: str = "Test",
    soyad: str = "User",
) -> Kullanici:
    u = Kullanici(
        tc_kimlik_no=tc,
        ad=ad,
        soyad=soyad,
        email=email,
        sifre_hash=hash_password("Test1234!"),
        rol=rol,
        aktif_mi=True,
    )
    session.add(u)
    session.commit()
    session.refresh(u)
    return u


def auth_header(user: Kullanici) -> dict[str, str]:
    token = create_access_token(str(user.id), {"rol": user.rol.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def seeded(session: Session):
    """İki doktor, iki hasta, iki departman, hemşire, temizlik personelleri."""
    dep_a = Departman(ad="Kardiyoloji", kategori="Dahili")
    dep_b = Departman(ad="Ortopedi", kategori="Cerrahi")
    session.add(dep_a)
    session.add(dep_b)
    session.commit()
    session.refresh(dep_a)
    session.refresh(dep_b)

    admin = _user(session, email="admin@t.test", rol=Rol.ADMIN, tc="11111111111")
    doktor_a_u = _user(
        session, email="doktora@t.test", rol=Rol.DOKTOR, tc="22222222221", soyad="DoktorA"
    )
    doktor_b_u = _user(
        session, email="doktorb@t.test", rol=Rol.DOKTOR, tc="22222222222", soyad="DoktorB"
    )
    hemsire_u = _user(
        session, email="hemsire@t.test", rol=Rol.HEMSIRE, tc="33333333331", soyad="Hemsire"
    )
    hasta_a_u = _user(
        session, email="hastaa@t.test", rol=Rol.HASTA, tc="44444444441", soyad="HastaA"
    )
    hasta_b_u = _user(
        session, email="hastab@t.test", rol=Rol.HASTA, tc="44444444442", soyad="HastaB"
    )
    temizlik_a_u = _user(
        session,
        email="temizlika@t.test",
        rol=Rol.TEMIZLIK_PERSONELI,
        tc="55555555551",
        soyad="TemizlikA",
    )
    temizlik_b_u = _user(
        session,
        email="temizlikb@t.test",
        rol=Rol.TEMIZLIK_PERSONELI,
        tc="55555555552",
        soyad="TemizlikB",
    )
    laborant_u = _user(
        session, email="lab@t.test", rol=Rol.LABORANT, tc="66666666661", soyad="Lab"
    )
    bashekim_u = _user(
        session, email="bashekim@t.test", rol=Rol.BASHEKIM, tc="77777777771", soyad="Bashekim"
    )

    pa = Personel(
        kullanici_id=doktor_a_u.id, sicil_no="D-A", departman_id=dep_a.id, unvan="Uzman"
    )
    pb = Personel(
        kullanici_id=doktor_b_u.id, sicil_no="D-B", departman_id=dep_b.id, unvan="Uzman"
    )
    ph = Personel(
        kullanici_id=hemsire_u.id, sicil_no="H-A", departman_id=dep_a.id, unvan="Hemşire"
    )
    pta = Personel(
        kullanici_id=temizlik_a_u.id, sicil_no="T-A", departman_id=dep_a.id, unvan="Temizlik"
    )
    ptb = Personel(
        kullanici_id=temizlik_b_u.id, sicil_no="T-B", departman_id=dep_b.id, unvan="Temizlik"
    )
    session.add_all([pa, pb, ph, pta, ptb])
    session.commit()
    for p in (pa, pb, ph, pta, ptb):
        session.refresh(p)

    da = Doktor(personel_id=pa.id, uzmanlik_alani="Kardiyoloji", diploma_no="DIP-A")
    db = Doktor(personel_id=pb.id, uzmanlik_alani="Ortopedi", diploma_no="DIP-B")
    session.add_all([da, db])
    session.commit()
    session.refresh(da)
    session.refresh(db)

    ha = Hasta(kullanici_id=hasta_a_u.id, tc_kimlik_no="44444444441")
    hb = Hasta(kullanici_id=hasta_b_u.id, tc_kimlik_no="44444444442")
    session.add_all([ha, hb])
    session.commit()
    session.refresh(ha)
    session.refresh(hb)

    randevu_a = Randevu(
        hasta_id=ha.id,
        doktor_id=da.id,
        departman_id=dep_a.id,
        tarih_saat=datetime.utcnow() + timedelta(days=1),
        durum="BEKLEMEDE",
    )
    randevu_b = Randevu(
        hasta_id=hb.id,
        doktor_id=db.id,
        departman_id=dep_b.id,
        tarih_saat=datetime.utcnow() + timedelta(days=2),
        durum="BEKLEMEDE",
    )
    session.add_all([randevu_a, randevu_b])
    session.commit()
    session.refresh(randevu_a)
    session.refresh(randevu_b)

    tetkik_a = Tetkik(
        hasta_id=ha.id,
        istek_yapan_doktor_id=da.id,
        tetkik_turu="Kan",
        durum="SONUCLANDI",
        sonuc_dosyasi="a.pdf",
    )
    tetkik_b = Tetkik(
        hasta_id=hb.id,
        istek_yapan_doktor_id=db.id,
        tetkik_turu="MR",
        durum="SONUCLANDI",
        sonuc_dosyasi="b.pdf",
    )
    session.add_all([tetkik_a, tetkik_b])
    session.commit()
    session.refresh(tetkik_a)
    session.refresh(tetkik_b)

    gorev_a = TemizlikGorevi(
        personel_id=pta.id, oda_bolum="101", gorev_tarihi=date.today(), durum="ATANDI"
    )
    gorev_b = TemizlikGorevi(
        personel_id=ptb.id, oda_bolum="202", gorev_tarihi=date.today(), durum="ATANDI"
    )
    session.add_all([gorev_a, gorev_b])
    session.commit()
    session.refresh(gorev_a)
    session.refresh(gorev_b)

    return {
        "admin": admin,
        "doktor_a": doktor_a_u,
        "doktor_b": doktor_b_u,
        "hemsire": hemsire_u,
        "hasta_a": hasta_a_u,
        "hasta_b": hasta_b_u,
        "temizlik_a": temizlik_a_u,
        "temizlik_b": temizlik_b_u,
        "laborant": laborant_u,
        "bashekim": bashekim_u,
        "dep_a": dep_a,
        "dep_b": dep_b,
        "randevu_a": randevu_a,
        "randevu_b": randevu_b,
        "tetkik_a": tetkik_a,
        "tetkik_b": tetkik_b,
        "gorev_a": gorev_a,
        "gorev_b": gorev_b,
        "doktor_a_entity": da,
        "hasta_a_entity": ha,
    }
