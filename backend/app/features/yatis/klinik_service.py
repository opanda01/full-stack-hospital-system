"""Vital, MAR, not, görev, vardiya devir, panel bildirim servisleri."""

from datetime import date, datetime

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.base_model import utc_now
from app.core.batch_load import batch_by_ids
from app.core.enums import IlacUygulamaDurumu, KlinikDurum, PanelBildirimTipi
from app.core.pagination import Page, make_page, paginate
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.yatis.models import (
    HastaNotu,
    HemsireGorevi,
    IlacUygulama,
    PanelBildirim,
    Servis,
    VardiyaDevirNotu,
    VitalBulgu,
    YatisKaydi,
)


def personel_id_of(session: Session, user: Kullanici) -> int | None:
    p = session.exec(select(Personel).where(Personel.kullanici_id == user.id)).first()
    return p.id if p else None


def _yatis_or_404(session: Session, yatis_id: int) -> YatisKaydi:
    y = session.get(YatisKaydi, yatis_id)
    if y is None:
        raise HTTPException(status_code=404, detail="Yatış kaydı bulunamadı")
    return y


def panel_bildirim_olustur(
    session: Session,
    *,
    alici_id: int,
    baslik: str,
    govde: str,
    tip: str,
    kaynak_tip: str | None = None,
    kaynak_id: int | None = None,
) -> PanelBildirim:
    b = PanelBildirim(
        alici_id=alici_id,
        baslik=baslik,
        govde=govde,
        tip=tip,
        okundu_mu=False,
        kaynak_tip=kaynak_tip,
        kaynak_id=kaynak_id,
    )
    session.add(b)
    return b


def _kritiklik_kontrol(
    session: Session,
    yatis: YatisKaydi,
    vital: VitalBulgu,
) -> None:
    kritik = False
    nedenler: list[str] = []
    if vital.ates is not None and vital.ates >= 38.5:
        kritik = True
        nedenler.append(f"ateş={vital.ates}")
    if vital.spo2 is not None and vital.spo2 < 92:
        kritik = True
        nedenler.append(f"SpO2={vital.spo2}")
    if vital.tansiyon_sistolik is not None and (
        vital.tansiyon_sistolik >= 180 or vital.tansiyon_sistolik <= 90
    ):
        kritik = True
        nedenler.append(f"sistolik={vital.tansiyon_sistolik}")
    if not kritik:
        return
    yatis.klinik_durum = KlinikDurum.KRITIK
    session.add(yatis)
    alicilar: set[int] = set()
    if yatis.sorumlu_hemsire_id:
        p = session.get(Personel, yatis.sorumlu_hemsire_id)
        if p:
            alicilar.add(p.kullanici_id)
    if vital.giren_hemsire_id:
        p = session.get(Personel, vital.giren_hemsire_id)
        if p:
            alicilar.add(p.kullanici_id)
    for alici in alicilar:
        panel_bildirim_olustur(
            session,
            alici_id=alici,
            baslik="Kritik vital değer",
            govde=f"Protokol yatış #{yatis.id}: {', '.join(nedenler)}",
            tip=PanelBildirimTipi.KRITIK_VITAL.value,
            kaynak_tip="vital",
            kaynak_id=vital.id,
        )


# --- Vital ---

def list_vitaller(session: Session, yatis_id: int) -> list[VitalBulgu]:
    _yatis_or_404(session, yatis_id)
    return list(
        session.exec(
            select(VitalBulgu)
            .where(VitalBulgu.yatis_id == yatis_id)
            .order_by(VitalBulgu.olcum_zamani.desc())
        ).all()
    )


def create_vital(
    session: Session,
    yatis_id: int,
    data: dict,
    yapan: Kullanici,
) -> VitalBulgu:
    yatis = _yatis_or_404(session, yatis_id)
    hemsire_id = personel_id_of(session, yapan)
    row = VitalBulgu(
        yatis_id=yatis_id,
        olcum_zamani=data.get("olcum_zamani") or utc_now(),
        tansiyon_sistolik=data.get("tansiyon_sistolik"),
        tansiyon_diastolik=data.get("tansiyon_diastolik"),
        nabiz=data.get("nabiz"),
        ates=data.get("ates"),
        solunum=data.get("solunum"),
        spo2=data.get("spo2"),
        agri_skoru=data.get("agri_skoru"),
        giren_hemsire_id=hemsire_id,
        notlar=data.get("notlar"),
    )
    session.add(row)
    session.flush()
    _kritiklik_kontrol(session, yatis, row)
    session.commit()
    session.refresh(row)
    return row


# --- MAR ---

def list_ilac_uygulamalari(session: Session, yatis_id: int) -> list[IlacUygulama]:
    _yatis_or_404(session, yatis_id)
    return list(
        session.exec(
            select(IlacUygulama)
            .where(IlacUygulama.yatis_id == yatis_id)
            .order_by(IlacUygulama.planlanan_saat)
        ).all()
    )


def list_ilac_uygulamalari_toplu(
    session: Session,
    current_user: Kullanici,
    *,
    durum: str | None = None,
    kapsam: str | None = "benim",
    page: int = 1,
    page_size: int = 50,
) -> Page[dict]:
    """Aktif yatışlara ait MAR satırları (order kuyruğu için)."""
    from sqlalchemy import or_

    q = (
        select(IlacUygulama, YatisKaydi)
        .join(YatisKaydi, YatisKaydi.id == IlacUygulama.yatis_id)
        .where(YatisKaydi.aktif_mi == True)  # noqa: E712
    )
    if durum:
        q = q.where(IlacUygulama.durum == durum)

    if kapsam == "benim":
        pid = personel_id_of(session, current_user)
        p = session.exec(
            select(Personel).where(Personel.kullanici_id == current_user.id)
        ).first()
        if pid is None or p is None:
            return make_page([], total=0, page=page, page_size=page_size)
        servis_ids: list[int] = []
        if p.departman_id is not None:
            servis_ids = list(
                session.exec(
                    select(Servis.id).where(Servis.departman_id == p.departman_id)
                ).all()
            )
        conds = [YatisKaydi.sorumlu_hemsire_id == pid]
        if servis_ids:
            conds.append(YatisKaydi.servis_id.in_(servis_ids))
        q = q.where(or_(*conds))

    q = q.order_by(IlacUygulama.planlanan_saat.asc(), IlacUygulama.id.asc())
    rows, total = paginate(session, q, page=page, page_size=page_size)
    hastalar = batch_by_ids(session, Hasta, (yatis.hasta_id for _, yatis in rows))
    kullanicilar = batch_by_ids(
        session, Kullanici, (h.kullanici_id for h in hastalar.values())
    )
    out: list[dict] = []
    for uygulama, yatis in rows:
        hasta = hastalar.get(yatis.hasta_id)
        if hasta is None:
            continue
        k = kullanicilar.get(hasta.kullanici_id)
        ad = f"{k.ad} {k.soyad}".strip() if k else ""
        out.append(
            {
                "id": uygulama.id,
                "yatis_id": uygulama.yatis_id,
                "hasta_id": hasta.public_id,
                "hasta_ad_soyad": ad or f"Hasta #{yatis.hasta_id}",
                "protokol_no": yatis.protokol_no,
                "ilac_adi": uygulama.ilac_adi,
                "doz": uygulama.doz,
                "kullanim_sekli": uygulama.kullanim_sekli,
                "planlanan_saat": uygulama.planlanan_saat,
                "durum": uygulama.durum,
                "uygulayan_hemsire_id": uygulama.uygulayan_hemsire_id,
                "uygulandi_at": uygulama.uygulandi_at,
                "notlar": uygulama.notlar,
            }
        )
    return make_page(out, total=total, page=page, page_size=page_size)


def create_ilac_uygulama(session: Session, yatis_id: int, data: dict) -> IlacUygulama:
    _yatis_or_404(session, yatis_id)
    row = IlacUygulama(
        yatis_id=yatis_id,
        ilac_adi=data["ilac_adi"],
        doz=data.get("doz"),
        kullanim_sekli=data.get("kullanim_sekli") or "ORAL",
        planlanan_saat=data["planlanan_saat"],
        durum=data.get("durum") or IlacUygulamaDurumu.BEKLIYOR.value,
        notlar=data.get("notlar"),
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def patch_ilac_uygulama_durum(
    session: Session,
    uygulama_id: int,
    durum: str,
    yapan: Kullanici,
) -> IlacUygulama:
    row = session.get(IlacUygulama, uygulama_id)
    if row is None:
        raise HTTPException(status_code=404, detail="İlaç uygulama kaydı bulunamadı")
    row.durum = durum
    if durum == IlacUygulamaDurumu.VERILDI.value:
        row.uygulandi_at = utc_now()
        row.uygulayan_hemsire_id = personel_id_of(session, yapan)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


# --- Notlar ---

def list_notlar(session: Session, yatis_id: int) -> list[HastaNotu]:
    _yatis_or_404(session, yatis_id)
    return list(
        session.exec(
            select(HastaNotu)
            .where(HastaNotu.yatis_id == yatis_id)
            .order_by(HastaNotu.created_at.desc())
        ).all()
    )


def create_not(
    session: Session, yatis_id: int, metin: str, yapan: Kullanici
) -> HastaNotu:
    _yatis_or_404(session, yatis_id)
    row = HastaNotu(yatis_id=yatis_id, yazar_id=yapan.id, metin=metin)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


# --- Görevler ---

def list_gorevler(
    session: Session,
    *,
    hemsire_id: int | None = None,
    tamamlandi: bool | None = None,
    page: int = 1,
    page_size: int = 50,
) -> Page[HemsireGorevi]:
    q = select(HemsireGorevi).order_by(
        HemsireGorevi.son_tarih.asc(), HemsireGorevi.id.asc()
    )
    if hemsire_id is not None:
        q = q.where(HemsireGorevi.atanan_hemsire_id == hemsire_id)
    if tamamlandi is not None:
        q = q.where(HemsireGorevi.tamamlandi_mi == tamamlandi)
    rows, total = paginate(session, q, page=page, page_size=page_size)
    return make_page(rows, total=total, page=page, page_size=page_size)


def create_gorev(session: Session, data: dict, yapan: Kullanici | None = None) -> HemsireGorevi:
    atanan = data.get("atanan_hemsire_id")
    if atanan is None and yapan is not None:
        atanan = personel_id_of(session, yapan)
    if atanan is None:
        raise HTTPException(status_code=400, detail="Atanan hemşire gerekli")
    row = HemsireGorevi(
        baslik=data["baslik"],
        yatis_id=data.get("yatis_id"),
        atanan_hemsire_id=atanan,
        son_tarih=data["son_tarih"],
        tamamlandi_mi=False,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def toggle_gorev(session: Session, gorev_id: int) -> HemsireGorevi:
    row = session.get(HemsireGorevi, gorev_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    row.tamamlandi_mi = not row.tamamlandi_mi
    row.tamamlandi_at = utc_now() if row.tamamlandi_mi else None
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


# --- Vardiya devir ---

def list_devir_notlari(
    session: Session,
    *,
    vardiya_tarihi: date | None = None,
    page: int = 1,
    page_size: int = 50,
) -> Page[VardiyaDevirNotu]:
    q = select(VardiyaDevirNotu).order_by(
        VardiyaDevirNotu.created_at.desc(), VardiyaDevirNotu.id.desc()
    )
    if vardiya_tarihi is not None:
        q = q.where(VardiyaDevirNotu.vardiya_tarihi == vardiya_tarihi)
    rows, total = paginate(session, q, page=page, page_size=page_size)
    return make_page(rows, total=total, page=page, page_size=page_size)


def create_devir_notu(
    session: Session, data: dict, yapan: Kullanici
) -> VardiyaDevirNotu:
    row = VardiyaDevirNotu(
        yazar_id=yapan.id,
        metin=data["metin"],
        yatis_id=data.get("yatis_id"),
        vardiya_tarihi=data.get("vardiya_tarihi") or date.today(),
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


# --- Bildirimler ---

def list_bildirimler(
    session: Session,
    alici_id: int,
    *,
    okunmamis: bool | None = None,
    page: int = 1,
    page_size: int = 50,
) -> Page[PanelBildirim]:
    q = (
        select(PanelBildirim)
        .where(PanelBildirim.alici_id == alici_id)
        .order_by(PanelBildirim.created_at.desc(), PanelBildirim.id.desc())
    )
    if okunmamis is True:
        q = q.where(PanelBildirim.okundu_mu == False)  # noqa: E712
    rows, total = paginate(session, q, page=page, page_size=page_size)
    return make_page(rows, total=total, page=page, page_size=page_size)


def mark_okundu(session: Session, bildirim_id: int, alici_id: int) -> PanelBildirim:
    row = session.get(PanelBildirim, bildirim_id)
    if row is None or row.alici_id != alici_id:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
    row.okundu_mu = True
    session.add(row)
    session.commit()
    session.refresh(row)
    return row
