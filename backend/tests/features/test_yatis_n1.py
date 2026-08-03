"""N+1 regression: list_kayitlar query count stays O(1) w.r.t. row count."""

from datetime import datetime, timezone

from sqlalchemy import event
from sqlmodel import Session, select

from app.core.enums import KlinikDurum
from app.core.security import create_access_token
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.yatis import service as yatis_service
from app.core.enums import KlinikDurum, YatakDurumu
from app.features.yatak_yonetimi.models import Oda, Servis, Yatak
from app.features.yatis.models import YatisKaydi


def auth_header(user: Kullanici) -> dict[str, str]:
    token = create_access_token(user.id, user.rol)
    return {"Authorization": f"Bearer {token}"}


def _seed_many_yatis(session: Session, seeded: dict, n: int = 25) -> None:
    hemsire_personel = session.exec(
        select(Personel).where(Personel.kullanici_id == seeded["hemsire"].id)
    ).one()
    servis = Servis(
        ad="N1 Servis",
        kod="N1-S1",
        kat_no=1,
        departman_id=seeded["dep_a"].id,
    )
    session.add(servis)
    session.commit()
    session.refresh(servis)

    for i in range(n):
        oda = Oda(servis_id=servis.id, oda_no=str(100 + i))
        session.add(oda)
        session.commit()
        session.refresh(oda)
        yatak = Yatak(oda_id=oda.id, yatak_no="A", durum=YatakDurumu.DOLU)
        session.add(yatak)
        session.commit()
        session.refresh(yatak)
        yatis = YatisKaydi(
            hasta_id=seeded["hasta_a_entity"].id if i % 2 == 0 else seeded["hasta_b_entity"].id,
            servis_id=servis.id,
            yatak_id=yatak.id,
            protokol_no=f"PR-N1-{i:03d}",
            yatis_tarihi=datetime.now(timezone.utc),
            klinik_durum=KlinikDurum.NORMAL,
            sorumlu_doktor_id=seeded["doktor_a_entity"].id,
            sorumlu_hemsire_id=hemsire_personel.id,
            aktif_mi=True,
        )
        session.add(yatis)
    session.commit()


def test_list_kayitlar_query_count_bounded(session, seeded):
    _seed_many_yatis(session, seeded, n=25)

    engine = session.get_bind()
    counter = {"n": 0}

    def _on_execute(conn, cursor, statement, parameters, context, executemany):
        counter["n"] += 1

    event.listen(engine, "before_cursor_execute", _on_execute)
    try:
        page = yatis_service.list_kayitlar(
            session, aktif=True, page=1, page_size=50
        )
    finally:
        event.remove(engine, "before_cursor_execute", _on_execute)

    assert len(page.items) >= 25
    assert page.total >= 25
    # 1 count + 1 main + ~6 batch loads (hasta/yatak/servis/doktor/personel/kullanici)
    assert counter["n"] <= 15, f"too many queries: {counter['n']}"


def test_hemsire_yatis_liste_page_envelope(client, session, seeded):
    from tests.features.test_yatis import _seed_yatis

    yatis = _seed_yatis(session, seeded)
    r = client.get(
        "/yatis/kayitlar",
        params={"kapsam": "benim", "page_size": 50},
        headers=auth_header(seeded["hemsire"]),
    )
    assert r.status_code == 200
    body = r.json()
    assert "items" in body and "total" in body
    ids = [row["id"] for row in body["items"]]
    assert yatis.id in ids
