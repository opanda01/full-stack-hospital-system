from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import text
from sqlmodel import Session, select

from app.core.base_model import utc_now
from app.core.enums import YatisIslemTipi
from app.features.doktorlar.models import Doktor
from app.features.faturalandirma.models import Fatura
from app.features.hastalar.models import Hasta
from app.features.konsultasyon.models import KonsultasyonIstegi
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.yatis.models import (
    AmeliyatBilgisi,
    HastaIslemLogu,
    IzinHareketi,
    Refakatci,
    Servis,
    ServisHareketi,
    Yatak,
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


def _personel_ad(session: Session, personel_id: int | None) -> str | None:
    if personel_id is None:
        return None
    p = session.get(Personel, personel_id)
    if p is None:
        return None
    k = session.get(Kullanici, p.kullanici_id)
    if k is None:
        return None
    return f"{k.ad} {k.soyad}".strip()


def _doktor_ad(session: Session, doktor_id: int | None) -> str | None:
    if doktor_id is None:
        return None
    d = session.get(Doktor, doktor_id)
    if d is None:
        return None
    return _personel_ad(session, d.personel_id)


def _hasta_ad(session: Session, hasta: Hasta) -> str:
    k = session.get(Kullanici, hasta.kullanici_id)
    if k is None:
        return f"Hasta #{hasta.id}"
    return f"{k.ad} {k.soyad}".strip() or f"Hasta #{hasta.id}"


def _bakiye(session: Session, hasta_id: int) -> Decimal:
    rows = session.exec(select(Fatura).where(Fatura.hasta_id == hasta_id)).all()
    total = Decimal("0")
    for f in rows:
        total += f.tutar or Decimal("0")
    return total


def _yatak_dolu_yap(session: Session, yatak_id: int) -> None:
    """Atomik dolu işaretleme; yarışta 409."""
    result = session.execute(
        text(
            "UPDATE yataklar SET dolu_mu = true, updated_at = :now "
            "WHERE id = :id AND dolu_mu = false "
            "RETURNING id"
        ),
        {"id": yatak_id, "now": utc_now()},
    )
    if result.first() is None:
        raise HTTPException(status_code=409, detail="Hedef yatak dolu veya bulunamadı")


def _yatak_bosalt(session: Session, yatak_id: int) -> None:
    session.execute(
        text(
            "UPDATE yataklar SET dolu_mu = false, updated_at = :now WHERE id = :id"
        ),
        {"id": yatak_id, "now": utc_now()},
    )


def list_servisler(session: Session) -> list[ServisRead]:
    rows = session.exec(select(Servis).order_by(Servis.ad)).all()
    return [ServisRead.model_validate(r) for r in rows]


def list_yataklar(session: Session, servis_id: int | None = None) -> list[YatakRead]:
    q = select(Yatak).order_by(Yatak.oda_no, Yatak.yatak_no)
    if servis_id is not None:
        q = q.where(Yatak.servis_id == servis_id)
    return [YatakRead.model_validate(r) for r in session.exec(q).all()]


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
) -> list[YatisListeItem]:
    q = select(YatisKaydi).order_by(YatisKaydi.yatis_tarihi.desc())
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
            return []
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
    items: list[YatisListeItem] = []
    for y in session.exec(q).all():
        hasta = session.get(Hasta, y.hasta_id)
        yatak = session.get(Yatak, y.yatak_id) if y.yatak_id else None
        servis = session.get(Servis, y.servis_id)
        durum = y.klinik_durum.value if hasattr(y.klinik_durum, "value") else str(y.klinik_durum)
        items.append(
            YatisListeItem(
                id=y.id,
                protokol_no=y.protokol_no,
                hasta_id=y.hasta_id,
                hasta_ad_soyad=_hasta_ad(session, hasta) if hasta else f"#{y.hasta_id}",
                yas=_yas(hasta.dogum_tarihi) if hasta else None,
                cinsiyet=hasta.cinsiyet if hasta else None,
                yatak_no=yatak.yatak_no if yatak else None,
                oda_no=yatak.oda_no if yatak else None,
                yatis_tarihi=y.yatis_tarihi,
                gecen_gun=_gecen_gun(y.yatis_tarihi),
                sorumlu_doktor_id=y.sorumlu_doktor_id,
                sorumlu_doktor_ad=_doktor_ad(session, y.sorumlu_doktor_id),
                sorumlu_hemsire_id=y.sorumlu_hemsire_id,
                sorumlu_hemsire_ad=_personel_ad(session, y.sorumlu_hemsire_id),
                klinik_durum=durum,
                kontrol_edildi_mi=y.kontrol_edildi_mi,
                servis_id=y.servis_id,
                servis_ad=servis.ad if servis else None,
            )
        )
    return items


def get_detay(session: Session, yatis_id: int) -> YatisDetay:
    y = session.get(YatisKaydi, yatis_id)
    if y is None:
        raise HTTPException(status_code=404, detail="Yatış kaydı bulunamadı")
    hasta = session.get(Hasta, y.hasta_id)
    yatak = session.get(Yatak, y.yatak_id) if y.yatak_id else None
    servis = session.get(Servis, y.servis_id)
    ref = session.exec(select(Refakatci).where(Refakatci.yatis_id == yatis_id)).first()
    durum = y.klinik_durum.value if hasattr(y.klinik_durum, "value") else str(y.klinik_durum)
    return YatisDetay(
        id=y.id,
        hasta_id=y.hasta_id,
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
        yatak_no=yatak.yatak_no if yatak else None,
        oda_no=yatak.oda_no if yatak else None,
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
    )


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
            _yatak_bosalt(session, y.yatak_id)
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
            if body.yeni_servis_id is None and yeni_y.servis_id != y.servis_id:
                y.servis_id = yeni_y.servis_id
            if body.yeni_yatak_id != eski_yatak:
                _yatak_dolu_yap(session, body.yeni_yatak_id)
                if eski_yatak:
                    _yatak_bosalt(session, eski_yatak)
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
