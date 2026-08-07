from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.base_model import utc_now
from app.core.batch_load import batch_by_ids
from app.core.enums import YatakDurumu, YatisIslemTipi
from app.core.pagination import Page, make_page, paginate
from app.features.doktorlar.models import Doktor
from app.features.faturalandirma.models import Fatura
from app.features.hastalar.models import Hasta
from app.features.konsultasyon.models import KonsultasyonIstegi
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.yatak_yonetimi.models import Oda, Servis, Yatak
from app.features.yatak_yonetimi.service import (
    yatak_cikis_hazirligi,
    yatak_dolu_yap_atomik,
    yatak_oda_bilgi,
)
from app.features.yatis.models import (
    AmeliyatBilgisi,
    HastaIslemLogu,
    IzinHareketi,
    Refakatci,
    ServisHareketi,
    YatakHareketi,
    YatisKaydi,
)
from app.features.yatis.schemas import (
    AmeliyatRead,
    HastaIslemLogRead,
    IzinHareketRead,
    KonsultasyonOzet,
    ServisHareketRead,
    ServisRead,
    YatakHareketRead,
    YatakRead,
    YatisDetay,
    YatisIslemRequest,
    YatisListeItem,
)


def _yas(dogum: date | None) -> int | None:
    if dogum is None:
        return None
    today = date.today()
    return today.year - dogum.year - (
        (today.month, today.day) < (dogum.month, dogum.day)
    )


def _gecen_gun(yatis_tarihi: datetime) -> int:
    yt = yatis_tarihi
    if yt.tzinfo is None:
        yt = yt.replace(tzinfo=timezone.utc)
    delta = utc_now() - yt
    return max(0, delta.days)


def _kullanici_ad(k: Kullanici | None, *, fallback: str) -> str:
    if k is None:
        return fallback
    return f"{k.ad} {k.soyad}".strip() or fallback


def _personel_ad_from_maps(
    personel_id: int | None,
    *,
    personeller: dict[int, Personel],
    kullanicilar: dict[int, Kullanici],
) -> str | None:
    if personel_id is None:
        return None
    p = personeller.get(personel_id)
    if p is None:
        return None
    return _kullanici_ad(kullanicilar.get(p.kullanici_id), fallback="")


def _doktor_ad_from_maps(
    doktor_id: int | None,
    *,
    doktorlar: dict[int, Doktor],
    personeller: dict[int, Personel],
    kullanicilar: dict[int, Kullanici],
) -> str | None:
    if doktor_id is None:
        return None
    d = doktorlar.get(doktor_id)
    if d is None:
        return None
    return _personel_ad_from_maps(
        d.personel_id, personeller=personeller, kullanicilar=kullanicilar
    )


def _personel_ad(session: Session, personel_id: int | None) -> str | None:
    if personel_id is None:
        return None
    p = session.get(Personel, personel_id)
    if p is None:
        return None
    k = session.get(Kullanici, p.kullanici_id)
    return _kullanici_ad(k, fallback="") or None


def _doktor_ad(session: Session, doktor_id: int | None) -> str | None:
    if doktor_id is None:
        return None
    d = session.get(Doktor, doktor_id)
    if d is None:
        return None
    return _personel_ad(session, d.personel_id)


def _hasta_ad(session: Session, hasta: Hasta) -> str:
    k = session.get(Kullanici, hasta.kullanici_id)
    return _kullanici_ad(k, fallback=f"Hasta #{hasta.id}")


def _bakiye(session: Session, hasta_id: int) -> Decimal:
    rows = session.exec(select(Fatura).where(Fatura.hasta_id == hasta_id)).all()
    total = Decimal("0")
    for f in rows:
        total += f.tutar or Decimal("0")
    return total


def _yatak_read(session: Session, yatak: Yatak, oda: Oda | None = None) -> YatakRead:
    if oda is None:
        oda = session.get(Oda, yatak.oda_id)
    durum = (
        yatak.durum.value if hasattr(yatak.durum, "value") else str(yatak.durum)
    )
    return YatakRead(
        id=yatak.id,
        oda_id=yatak.oda_id,
        oda_no=oda.oda_no if oda else None,
        servis_id=oda.servis_id if oda else None,
        yatak_no=yatak.yatak_no,
        durum=durum,
        dolu_mu=durum == YatakDurumu.DOLU.value,
    )


def list_servisler(session: Session) -> list[ServisRead]:
    rows = session.exec(select(Servis).order_by(Servis.ad)).all()
    out: list[ServisRead] = []
    for r in rows:
        tip = r.tip.value if hasattr(r.tip, "value") else str(r.tip)
        out.append(
            ServisRead(
                id=r.id,
                ad=r.ad,
                kod=r.kod,
                tip=tip,
                kat_no=r.kat_no,
                departman_id=r.departman_id,
            )
        )
    return out


def list_yataklar(session: Session, servis_id: int | None = None) -> list[YatakRead]:
    q = (
        select(Yatak, Oda)
        .join(Oda, Yatak.oda_id == Oda.id)
        .order_by(Oda.oda_no, Yatak.yatak_no)
    )
    if servis_id is not None:
        q = q.where(Oda.servis_id == servis_id)
    rows = session.exec(q).all()
    return [_yatak_read(session, yatak, oda) for yatak, oda in rows]


def list_kayitlar(
    session: Session,
    *,
    servis_id: int | None = None,
    doktor_id: int | None = None,
    hemsire_id: int | None = None,
    baslangic: date | None = None,
    bitis: date | None = None,
    aktif: bool | None = True,
    kapsam: str | None = None,
    current_user: Kullanici | None = None,
    page: int = 1,
    page_size: int = 50,
) -> Page[YatisListeItem]:
    q = select(YatisKaydi).order_by(
        YatisKaydi.yatis_tarihi.desc(), YatisKaydi.id.desc()
    )
    if aktif is not None:
        q = q.where(YatisKaydi.aktif_mi == aktif)
    if servis_id is not None:
        q = q.where(YatisKaydi.servis_id == servis_id)
    if doktor_id is not None:
        q = q.where(YatisKaydi.sorumlu_doktor_id == doktor_id)
    if hemsire_id is not None:
        q = q.where(YatisKaydi.sorumlu_hemsire_id == hemsire_id)
    if baslangic is not None:
        q = q.where(YatisKaydi.yatis_tarihi >= datetime.combine(baslangic, datetime.min.time()))
    if bitis is not None:
        q = q.where(YatisKaydi.yatis_tarihi <= datetime.combine(bitis, datetime.max.time()))

    if kapsam == "benim" and current_user is not None:
        personel = session.exec(
            select(Personel).where(Personel.kullanici_id == current_user.id)
        ).first()
        if personel is None:
            return make_page([], total=0, page=page, page_size=page_size)
        servis_idler: list[int] = []
        if personel.departman_id is not None:
            servis_idler = list(
                session.exec(
                    select(Servis.id).where(Servis.departman_id == personel.departman_id)
                ).all()
            )
        from sqlalchemy import or_

        if servis_idler:
            q = q.where(
                or_(
                    YatisKaydi.sorumlu_hemsire_id == personel.id,
                    YatisKaydi.servis_id.in_(servis_idler),
                )
            )
        else:
            q = q.where(YatisKaydi.sorumlu_hemsire_id == personel.id)

    rows, total = paginate(session, q, page=page, page_size=page_size)
    hastalar = batch_by_ids(session, Hasta, (y.hasta_id for y in rows))
    yataklar = batch_by_ids(session, Yatak, (y.yatak_id for y in rows))
    odalar = batch_by_ids(
        session, Oda, (yt.oda_id for yt in yataklar.values())
    )
    servisler = batch_by_ids(session, Servis, (y.servis_id for y in rows))
    doktorlar = batch_by_ids(session, Doktor, (y.sorumlu_doktor_id for y in rows))
    hemsire_ids = {y.sorumlu_hemsire_id for y in rows}
    hemsire_ids.update(d.personel_id for d in doktorlar.values() if d.personel_id)
    personeller = batch_by_ids(session, Personel, hemsire_ids)
    kullanici_ids = {h.kullanici_id for h in hastalar.values()}
    kullanici_ids.update(p.kullanici_id for p in personeller.values())
    kullanicilar = batch_by_ids(session, Kullanici, kullanici_ids)

    items: list[YatisListeItem] = []
    for y in rows:
        hasta = hastalar.get(y.hasta_id)
        if hasta is None:
            continue
        yatak = yataklar.get(y.yatak_id) if y.yatak_id else None
        oda = odalar.get(yatak.oda_id) if yatak else None
        servis = servisler.get(y.servis_id)
        durum = y.klinik_durum.value if hasattr(y.klinik_durum, "value") else str(y.klinik_durum)
        items.append(
            YatisListeItem(
                id=y.id,
                protokol_no=y.protokol_no,
                hasta_id=hasta.public_id,
                hasta_ad_soyad=_kullanici_ad(
                    kullanicilar.get(hasta.kullanici_id),
                    fallback=f"Hasta #{hasta.id}",
                ),
                yas=_yas(hasta.dogum_tarihi),
                cinsiyet=hasta.cinsiyet,
                yatak_no=yatak.yatak_no if yatak else None,
                oda_no=oda.oda_no if oda else None,
                yatis_tarihi=y.yatis_tarihi,
                gecen_gun=_gecen_gun(y.yatis_tarihi),
                sorumlu_doktor_id=y.sorumlu_doktor_id,
                sorumlu_doktor_ad=_doktor_ad_from_maps(
                    y.sorumlu_doktor_id,
                    doktorlar=doktorlar,
                    personeller=personeller,
                    kullanicilar=kullanicilar,
                ),
                sorumlu_hemsire_id=y.sorumlu_hemsire_id,
                sorumlu_hemsire_ad=_personel_ad_from_maps(
                    y.sorumlu_hemsire_id,
                    personeller=personeller,
                    kullanicilar=kullanicilar,
                ),
                klinik_durum=durum,
                kontrol_edildi_mi=y.kontrol_edildi_mi,
                servis_id=y.servis_id,
                servis_ad=servis.ad if servis else None,
            )
        )
    return make_page(items, total=total, page=page, page_size=page_size)


def get_detay(session: Session, yatis_id: int) -> YatisDetay:
    y = session.get(YatisKaydi, yatis_id)
    if y is None:
        raise HTTPException(status_code=404, detail="Yatış kaydı bulunamadı")
    hasta = session.get(Hasta, y.hasta_id)
    if hasta is None:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")
    yatak = session.get(Yatak, y.yatak_id) if y.yatak_id else None
    oda_no, yatak_no, _ = yatak_oda_bilgi(session, yatak)
    servis = session.get(Servis, y.servis_id)
    ref = session.exec(select(Refakatci).where(Refakatci.yatis_id == yatis_id)).first()
    durum = y.klinik_durum.value if hasattr(y.klinik_durum, "value") else str(y.klinik_durum)
    return YatisDetay(
        id=y.id,
        hasta_id=hasta.public_id,
        protokol_no=y.protokol_no,
        basvuru_no=y.basvuru_no,
        dosya_no=y.dosya_no,
        muracaat_tarihi=y.muracaat_tarihi,
        yatis_tarihi=y.yatis_tarihi,
        cikis_tarihi=y.cikis_tarihi,
        sigorta_turu=y.sigorta_turu,
        klinik_durum=durum,
        kontrol_edildi_mi=y.kontrol_edildi_mi,
        aktif_mi=y.aktif_mi,
        servis_id=y.servis_id,
        servis_ad=servis.ad if servis else None,
        yatak_id=y.yatak_id,
        yatak_no=yatak_no or (yatak.yatak_no if yatak else None),
        oda_no=oda_no,
        sorumlu_doktor_id=y.sorumlu_doktor_id,
        sorumlu_doktor_ad=_doktor_ad(session, y.sorumlu_doktor_id),
        sorumlu_hemsire_id=y.sorumlu_hemsire_id,
        sorumlu_hemsire_ad=_personel_ad(session, y.sorumlu_hemsire_id),
        hasta_ad_soyad=_hasta_ad(session, hasta) if hasta else f"#{y.hasta_id}",
        adres=hasta.adres if hasta else None,
        kan_grubu=hasta.kan_grubu if hasta else None,
        dogum_tarihi=hasta.dogum_tarihi if hasta else None,
        yas=_yas(hasta.dogum_tarihi) if hasta else None,
        cinsiyet=hasta.cinsiyet if hasta else None,
        bakiye=_bakiye(session, y.hasta_id),
        refakatci_ad_soyad=ref.ad_soyad if ref else None,
        refakatci_yakinlik=ref.yakinlik if ref else None,
        refakatci_telefon=ref.telefon if ref else None,
        izolasyon_gerekli=y.izolasyon_gerekli,
    )


def patch_izolasyon_gerekli(
    session: Session,
    yatis_id: int,
    *,
    izolasyon_gerekli: str | None,
    yapan: Kullanici,
) -> YatisDetay:
    y = session.get(YatisKaydi, yatis_id)
    if y is None:
        raise HTTPException(status_code=404, detail="Yatış kaydı bulunamadı")
    if not y.aktif_mi:
        raise HTTPException(status_code=400, detail="Yalnızca aktif yatış güncellenebilir")
    y.izolasyon_gerekli = izolasyon_gerekli or None
    session.add(y)
    _log(
        session,
        yatis_id,
        yapan.id,  # type: ignore[arg-type]
        "IZOLASYON_GUNCELLE",
        izolasyon_gerekli or "YOK",
    )
    session.commit()
    return get_detay(session, yatis_id)


def list_servis_hareketleri(session: Session, yatis_id: int) -> list[ServisHareketRead]:
    rows = session.exec(
        select(ServisHareketi)
        .where(ServisHareketi.yatis_id == yatis_id)
        .order_by(ServisHareketi.tarih.desc())
    ).all()
    return [ServisHareketRead.model_validate(r) for r in rows]


def list_yatak_hareketleri(session: Session, yatis_id: int) -> list[YatakHareketRead]:
    rows = session.exec(
        select(YatakHareketi)
        .where(YatakHareketi.yatis_id == yatis_id)
        .order_by(YatakHareketi.tarih.desc())
    ).all()
    return [YatakHareketRead.model_validate(r) for r in rows]


def list_izin_hareketleri(session: Session, yatis_id: int) -> list[IzinHareketRead]:
    rows = session.exec(
        select(IzinHareketi)
        .where(IzinHareketi.yatis_id == yatis_id)
        .order_by(IzinHareketi.baslangic.desc())
    ).all()
    return [IzinHareketRead.model_validate(r) for r in rows]


def list_ameliyatlar(session: Session, yatis_id: int) -> list[AmeliyatRead]:
    rows = session.exec(
        select(AmeliyatBilgisi)
        .where(AmeliyatBilgisi.yatis_id == yatis_id)
        .order_by(AmeliyatBilgisi.tarih.desc())
    ).all()
    return [AmeliyatRead.model_validate(r) for r in rows]


def list_konsultasyonlar(session: Session, yatis_id: int) -> list[KonsultasyonOzet]:
    y = session.get(YatisKaydi, yatis_id)
    if y is None:
        raise HTTPException(status_code=404, detail="Yatış kaydı bulunamadı")
    rows = session.exec(
        select(KonsultasyonIstegi)
        .where(KonsultasyonIstegi.hasta_id == y.hasta_id)
        .order_by(KonsultasyonIstegi.id.desc())
    ).all()
    return [
        KonsultasyonOzet(
            id=r.id,
            isteyen_doktor_id=r.isteyen_doktor_id,
            hedef_doktor_id=r.hedef_doktor_id,
            durum=r.durum.value if hasattr(r.durum, "value") else str(r.durum),
            notlar=r.notlar,
            yanit_tarihi=r.yanit_tarihi,
        )
        for r in rows
    ]


def list_islem_loglari(session: Session, yatis_id: int) -> list[HastaIslemLogRead]:
    rows = session.exec(
        select(HastaIslemLogu)
        .where(HastaIslemLogu.yatis_id == yatis_id)
        .order_by(HastaIslemLogu.created_at.desc())
    ).all()
    return [HastaIslemLogRead.model_validate(r) for r in rows]


def _log(
    session: Session,
    yatis_id: int,
    user_id: int,
    tip: str,
    detay: str | None,
) -> None:
    session.add(
        HastaIslemLogu(
            yatis_id=yatis_id,
            yapan_kullanici_id=user_id,
            islem_tipi=tip,
            detay=detay,
        )
    )


def uygula_islem(
    session: Session,
    yatis_id: int,
    body: YatisIslemRequest,
    yapan: Kullanici,
) -> YatisDetay:
    y = session.get(YatisKaydi, yatis_id)
    if y is None:
        raise HTTPException(status_code=404, detail="Yatış kaydı bulunamadı")

    tip = body.tip
    now = utc_now()

    if tip == YatisIslemTipi.TABURCU:
        if not y.aktif_mi:
            raise HTTPException(status_code=400, detail="Kayıt zaten taburcu")
        y.aktif_mi = False
        y.cikis_tarihi = now
        if y.yatak_id:
            yatak_cikis_hazirligi(session, y.yatak_id)
        _log(session, yatis_id, yapan.id, tip.value, body.aciklama or "Taburcu edildi")

    elif tip == YatisIslemTipi.NAKIL:
        if body.yeni_servis_id is None and body.yeni_yatak_id is None:
            raise HTTPException(
                status_code=400, detail="Nakil için yeni servis veya yatak gerekli"
            )
        eski_servis = y.servis_id
        eski_yatak = y.yatak_id
        if body.yeni_servis_id is not None:
            yeni_s = session.get(Servis, body.yeni_servis_id)
            if yeni_s is None:
                raise HTTPException(status_code=404, detail="Hedef servis bulunamadı")
            session.add(
                ServisHareketi(
                    yatis_id=yatis_id,
                    eski_servis_id=eski_servis,
                    yeni_servis_id=body.yeni_servis_id,
                    tarih=now,
                    aciklama=body.aciklama,
                )
            )
            y.servis_id = body.yeni_servis_id
        if body.yeni_yatak_id is not None:
            yeni_y = session.get(Yatak, body.yeni_yatak_id)
            if yeni_y is None:
                raise HTTPException(status_code=404, detail="Hedef yatak bulunamadı")
            yeni_oda = session.get(Oda, yeni_y.oda_id)
            if body.yeni_servis_id is None and yeni_oda is not None:
                if yeni_oda.servis_id != y.servis_id:
                    y.servis_id = yeni_oda.servis_id
            if body.yeni_yatak_id != eski_yatak:
                yatak_dolu_yap_atomik(session, body.yeni_yatak_id)
                if eski_yatak:
                    yatak_cikis_hazirligi(session, eski_yatak)
            session.add(
                YatakHareketi(
                    yatis_id=yatis_id,
                    eski_yatak_id=eski_yatak,
                    yeni_yatak_id=body.yeni_yatak_id,
                    tarih=now,
                    aciklama=body.aciklama,
                )
            )
            y.yatak_id = body.yeni_yatak_id
        _log(
            session,
            yatis_id,
            yapan.id,
            tip.value,
            body.aciklama
            or f"Nakil: servis {eski_servis}->{y.servis_id}, yatak {eski_yatak}->{y.yatak_id}",
        )

    elif tip == YatisIslemTipi.IZIN:
        bas = body.izin_baslangic or now
        session.add(
            IzinHareketi(
                yatis_id=yatis_id,
                baslangic=bas,
                bitis=body.izin_bitis,
                aciklama=body.aciklama,
            )
        )
        _log(session, yatis_id, yapan.id, tip.value, body.aciklama or "İzinli gönderildi")

    elif tip == YatisIslemTipi.DOKTOR_DEGISTIR:
        if body.sorumlu_doktor_id is None:
            raise HTTPException(status_code=400, detail="Yeni doktor gerekli")
        if session.get(Doktor, body.sorumlu_doktor_id) is None:
            raise HTTPException(status_code=404, detail="Doktor bulunamadı")
        eski = y.sorumlu_doktor_id
        y.sorumlu_doktor_id = body.sorumlu_doktor_id
        _log(
            session,
            yatis_id,
            yapan.id,
            tip.value,
            f"Doktor {eski} -> {body.sorumlu_doktor_id}",
        )

    elif tip == YatisIslemTipi.HEMSIRE_DEGISTIR:
        if body.sorumlu_hemsire_id is None:
            raise HTTPException(status_code=400, detail="Yeni hemşire gerekli")
        if session.get(Personel, body.sorumlu_hemsire_id) is None:
            raise HTTPException(status_code=404, detail="Hemşire (personel) bulunamadı")
        eski = y.sorumlu_hemsire_id
        y.sorumlu_hemsire_id = body.sorumlu_hemsire_id
        _log(
            session,
            yatis_id,
            yapan.id,
            tip.value,
            f"Hemşire {eski} -> {body.sorumlu_hemsire_id}",
        )

    elif tip == YatisIslemTipi.KONTROL_TOGGLE:
        y.kontrol_edildi_mi = not y.kontrol_edildi_mi
        _log(
            session,
            yatis_id,
            yapan.id,
            tip.value,
            f"kontrol_edildi_mi={y.kontrol_edildi_mi}",
        )

    elif tip == YatisIslemTipi.REFAKATCI_KAYDET:
        if not body.refakatci_ad_soyad:
            raise HTTPException(status_code=400, detail="Refakatçi adı gerekli")
        ref = session.exec(select(Refakatci).where(Refakatci.yatis_id == yatis_id)).first()
        if ref is None:
            ref = Refakatci(
                yatis_id=yatis_id,
                ad_soyad=body.refakatci_ad_soyad,
                yakinlik=body.refakatci_yakinlik,
                telefon=body.refakatci_telefon,
            )
        else:
            ref.ad_soyad = body.refakatci_ad_soyad
            ref.yakinlik = body.refakatci_yakinlik
            ref.telefon = body.refakatci_telefon
        session.add(ref)
        _log(
            session,
            yatis_id,
            yapan.id,
            tip.value,
            f"Refakatçi: {body.refakatci_ad_soyad}",
        )

    else:
        raise HTTPException(status_code=400, detail="Geçersiz işlem tipi")

    session.add(y)
    session.commit()
    return get_detay(session, yatis_id)
