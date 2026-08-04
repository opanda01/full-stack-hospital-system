"""Yatak / oda / servis yönetimi servis katmanı."""

from fastapi import HTTPException
from sqlalchemy import text
from sqlmodel import Session, select

from app.core.base_model import utc_now
from app.core.batch_load import batch_by_ids
from app.core.enums import IzolasyonTipi, YatakDurumu, ServisTipi
from app.core.permissions import Kapsam
from app.core.scope import kullanici_kapsamli_filtre_uygula
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.temizlik_gorevleri.service import otomatik_oda_temizlik_gorevi
from app.features.yatak_yonetimi.models import Oda, Servis, Yatak, YatakGecmisi
from app.features.yatak_yonetimi.schemas import (
    ServisDolulukOzet,
    ServisOku,
    YatakOku,
)
from app.features.yatis.models import YatisKaydi


def _durum_str(d: YatakDurumu | str) -> str:
    return d.value if hasattr(d, "value") else str(d)


def _servis_oku(s: Servis) -> ServisOku:
    tip = s.tip.value if hasattr(s.tip, "value") else str(s.tip)
    return ServisOku(
        id=s.id,
        ad=s.ad,
        kod=s.kod,
        tip=tip,
        kat_no=s.kat_no,
        departman_id=s.departman_id,
    )


def _yatak_oku(
    yatak: Yatak,
    *,
    odalar: dict[int, Oda] | None = None,
    oda: Oda | None = None,
) -> YatakOku:
    o = oda
    if o is None and odalar is not None:
        o = odalar.get(yatak.oda_id)
    return YatakOku(
        id=yatak.id,
        oda_id=yatak.oda_id,
        oda_no=o.oda_no if o else None,
        servis_id=o.servis_id if o else None,
        yatak_no=yatak.yatak_no,
        durum=_durum_str(yatak.durum),
        izolasyon_tipi=_izolasyon_str(yatak.izolasyon_tipi),
    )


def _izolasyon_str(t: IzolasyonTipi | str) -> str:
    return t.value if hasattr(t, "value") else str(t)


def _izolasyon_uyumlu(yatak_tip: IzolasyonTipi | str, gerekli: str | None) -> bool:
    if not gerekli or gerekli == IzolasyonTipi.YOK.value:
        return True
    return _izolasyon_str(yatak_tip) == gerekli


def _personel_departman_id(session: Session, user: Kullanici) -> int | None:
    p = session.exec(
        select(Personel).where(Personel.kullanici_id == user.id)
    ).first()
    return p.departman_id if p else None


def _servis_departman_filtre(session: Session, departman_id: int) -> list[int]:
    return list(
        session.exec(
            select(Servis.id).where(Servis.departman_id == departman_id)
        ).all()
    )


def list_servisler(
    session: Session,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> list[ServisOku]:
    q = select(Servis).order_by(Servis.ad)

    def departman(q_in):
        dep_id = _personel_departman_id(session, current_user)
        if dep_id is None:
            return q_in.where(Servis.id == -1)
        ids = _servis_departman_filtre(session, dep_id)
        if not ids:
            return q_in.where(Servis.id == -1)
        return q_in.where(Servis.id.in_(ids))  # type: ignore[attr-defined]

    q = kullanici_kapsamli_filtre_uygula(
        q, kapsam, kendi_kaydim_filtresi=lambda x: x, departmanim_filtresi=departman
    )
    rows = session.exec(q).all()
    return [_servis_oku(s) for s in rows]


def _servis_erisim(
    session: Session,
    servis_id: int,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> Servis:
    servis = session.get(Servis, servis_id)
    if servis is None:
        raise HTTPException(status_code=404, detail="Servis bulunamadı")
    if kapsam == Kapsam.GLOBAL:
        return servis
    if kapsam == Kapsam.DEPARTMANIM:
        dep_id = _personel_departman_id(session, current_user)
        if dep_id is None or servis.departman_id != dep_id:
            raise HTTPException(status_code=403, detail="Bu servise erişim yok")
        return servis
    raise HTTPException(status_code=403, detail="Bu servise erişim yok")


def list_servis_yataklari(
    session: Session,
    servis_id: int,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> list[YatakOku]:
    _servis_erisim(session, servis_id, kapsam=kapsam, current_user=current_user)
    oda_ids = list(
        session.exec(select(Oda.id).where(Oda.servis_id == servis_id)).all()
    )
    if not oda_ids:
        return []
    yataklar = session.exec(
        select(Yatak)
        .where(Yatak.oda_id.in_(oda_ids))  # type: ignore[attr-defined]
        .order_by(Yatak.oda_id, Yatak.yatak_no)
    ).all()
    odalar = batch_by_ids(session, Oda, (y.oda_id for y in yataklar))
    return [_yatak_oku(y, odalar=odalar) for y in yataklar]


def get_yatak(
    session: Session,
    yatak_id: int,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> YatakOku:
    yatak = session.get(Yatak, yatak_id)
    if yatak is None:
        raise HTTPException(status_code=404, detail="Yatak bulunamadı")
    oda = session.get(Oda, yatak.oda_id)
    if oda is None:
        raise HTTPException(status_code=404, detail="Oda bulunamadı")
    _servis_erisim(
        session, oda.servis_id, kapsam=kapsam, current_user=current_user
    )
    return _yatak_oku(yatak, oda=oda)


def servis_doluluk_ozeti(
    session: Session,
    servis_id: int,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> ServisDolulukOzet:
    _servis_erisim(session, servis_id, kapsam=kapsam, current_user=current_user)
    oda_ids = list(
        session.exec(select(Oda.id).where(Oda.servis_id == servis_id)).all()
    )
    if not oda_ids:
        return ServisDolulukOzet(
            servis_id=servis_id,
            bos=0,
            dolu=0,
            temizlik_bekliyor=0,
            arizali=0,
            toplam=0,
        )
    yataklar = session.exec(
        select(Yatak).where(Yatak.oda_id.in_(oda_ids))  # type: ignore[attr-defined]
    ).all()
    bos, dolu, temizlik, arizali = 0, 0, 0, 0
    for y in yataklar:
        d = _durum_str(y.durum)
        if d == YatakDurumu.BOS.value:
            bos += 1
        elif d == YatakDurumu.DOLU.value:
            dolu += 1
        elif d == YatakDurumu.TEMIZLIK_BEKLIYOR.value:
            temizlik += 1
        elif d == YatakDurumu.ARIZALI.value:
            arizali += 1
    return ServisDolulukOzet(
        servis_id=servis_id,
        bos=bos,
        dolu=dolu,
        temizlik_bekliyor=temizlik,
        arizali=arizali,
        toplam=len(yataklar),
    )


def yatak_dolu_yap_atomik(session: Session, yatak_id: int) -> None:
    """Yatak BOS → DOLU; yarışta 409."""
    result = session.execute(
        text(
            "UPDATE yataklar SET durum = :dolu, updated_at = :now "
            "WHERE id = :id AND durum = :bos RETURNING id"
        ),
        {
            "id": yatak_id,
            "now": utc_now(),
            "dolu": YatakDurumu.DOLU.value,
            "bos": YatakDurumu.BOS.value,
        },
    )
    if result.first() is None:
        raise HTTPException(
            status_code=409, detail="Hedef yatak dolu veya kullanılamıyor"
        )


def yatak_ata(
    session: Session,
    yatak_id: int,
    yatis_id: int,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> YatakOku:
    yatak = session.get(Yatak, yatak_id)
    if yatak is None:
        raise HTTPException(status_code=404, detail="Yatak bulunamadı")
    oda = session.get(Oda, yatak.oda_id)
    if oda is None:
        raise HTTPException(status_code=404, detail="Oda bulunamadı")
    servis = _servis_erisim(
        session, oda.servis_id, kapsam=kapsam, current_user=current_user
    )

    yatis = session.get(YatisKaydi, yatis_id)
    if yatis is None:
        raise HTTPException(status_code=404, detail="Yatış kaydı bulunamadı")
    if not yatis.aktif_mi:
        raise HTTPException(status_code=400, detail="Yatış kaydı aktif değil")
    hasta = session.get(Hasta, yatis.hasta_id)
    if hasta is None:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")

    gerekli = yatis.izolasyon_gerekli
    if gerekli and not _izolasyon_uyumlu(yatak.izolasyon_tipi, gerekli):
        raise HTTPException(
            status_code=400,
            detail="Yatak izolasyon tipi yatış gereksinimi ile uyumlu değil",
        )

    if yatis.yatak_id and yatis.yatak_id != yatak_id:
        eski = session.get(Yatak, yatis.yatak_id)
        if eski is not None:
            eski_oda = session.get(Oda, eski.oda_id)
            eski_servis = (
                session.get(Servis, eski_oda.servis_id) if eski_oda else None
            )
            eski.durum = YatakDurumu.TEMIZLIK_BEKLIYOR
            session.add(eski)
            if eski_oda and eski_servis:
                otomatik_oda_temizlik_gorevi(
                    session, eski_servis.ad, eski_oda.oda_no
                )

    yatak_dolu_yap_atomik(session, yatak_id)
    session.refresh(yatak)

    yatis.yatak_id = yatak_id
    yatis.servis_id = servis.id
    session.add(yatis)

    session.add(
        YatakGecmisi(
            yatak_id=yatak_id,
            hasta_id=hasta.id,
            giris_zamani=utc_now(),
        )
    )
    session.commit()
    session.refresh(yatak)
    return _yatak_oku(yatak, oda=oda)


def _oda_no(session: Session, yatak: Yatak) -> str:
    oda = session.get(Oda, yatak.oda_id)
    return oda.oda_no if oda else str(yatak.oda_id)


def yatak_cikis_hazirligi(session: Session, yatak_id: int) -> None:
    """Taburcu/nakil: yatak DOLU → temizlik bekliyor + görev + geçmiş kapat."""
    yatak = session.get(Yatak, yatak_id)
    if yatak is None:
        return
    if _durum_str(yatak.durum) != YatakDurumu.DOLU.value:
        yatak.durum = YatakDurumu.TEMIZLIK_BEKLIYOR
        session.add(yatak)
        return

    now = utc_now()
    acik = session.exec(
        select(YatakGecmisi)
        .where(
            YatakGecmisi.yatak_id == yatak_id,
            YatakGecmisi.cikis_zamani.is_(None),  # type: ignore[union-attr]
        )
        .order_by(YatakGecmisi.giris_zamani.desc())
    ).first()
    if acik is not None:
        acik.cikis_zamani = now
        session.add(acik)

    yatak.durum = YatakDurumu.TEMIZLIK_BEKLIYOR
    session.add(yatak)

    oda = session.get(Oda, yatak.oda_id)
    if oda is not None:
        servis = session.get(Servis, oda.servis_id)
        if servis is not None:
            otomatik_oda_temizlik_gorevi(session, servis.ad, oda.oda_no)


def yatak_bosalt(
    session: Session,
    yatak_id: int,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> YatakOku:
    yatak = session.get(Yatak, yatak_id)
    if yatak is None:
        raise HTTPException(status_code=404, detail="Yatak bulunamadı")
    oda = session.get(Oda, yatak.oda_id)
    if oda is None:
        raise HTTPException(status_code=404, detail="Oda bulunamadı")
    servis = _servis_erisim(
        session, oda.servis_id, kapsam=kapsam, current_user=current_user
    )

    if _durum_str(yatak.durum) != YatakDurumu.DOLU.value:
        raise HTTPException(
            status_code=400,
            detail="Yalnızca dolu yatak boşaltılabilir",
        )

    now = utc_now()
    acik = session.exec(
        select(YatakGecmisi)
        .where(
            YatakGecmisi.yatak_id == yatak_id,
            YatakGecmisi.cikis_zamani.is_(None),  # type: ignore[union-attr]
        )
        .order_by(YatakGecmisi.giris_zamani.desc())
    ).first()
    if acik is not None:
        acik.cikis_zamani = now
        session.add(acik)

    yatak.durum = YatakDurumu.TEMIZLIK_BEKLIYOR
    session.add(yatak)

    aktif_yatis = session.exec(
        select(YatisKaydi).where(
            YatisKaydi.yatak_id == yatak_id,
            YatisKaydi.aktif_mi == True,  # noqa: E712
        )
    ).first()
    if aktif_yatis is not None:
        aktif_yatis.yatak_id = None
        session.add(aktif_yatis)

    otomatik_oda_temizlik_gorevi(session, servis.ad, oda.oda_no)
    session.commit()
    session.refresh(yatak)
    return _yatak_oku(yatak, oda=oda)


def yatak_oda_bilgi(
    session: Session, yatak: Yatak | None
) -> tuple[str | None, str | None, int | None]:
    """oda_no, yatak_no, servis_id."""
    if yatak is None:
        return None, None, None
    oda = session.get(Oda, yatak.oda_id)
    if oda is None:
        return None, yatak.yatak_no, None
    return oda.oda_no, yatak.yatak_no, oda.servis_id


def bos_yatak_oner(
    session: Session,
    *,
    servis_tip: ServisTipi | None = ServisTipi.CERRAHI,
    limit: int = 5,
) -> list[YatakOku]:
    """Post-op / servis yönlendirmesi için boş yatak önerisi."""
    q = (
        select(Yatak)
        .join(Oda, Yatak.oda_id == Oda.id)
        .join(Servis, Oda.servis_id == Servis.id)
        .where(Yatak.durum == YatakDurumu.BOS)
        .order_by(Servis.ad, Oda.oda_no, Yatak.yatak_no)
    )
    if servis_tip is not None:
        q = q.where(Servis.tip == servis_tip)
    yataklar = session.exec(q.limit(limit)).all()
    odalar = batch_by_ids(session, Oda, (y.oda_id for y in yataklar))
    return [_yatak_oku(y, odalar=odalar) for y in yataklar]
