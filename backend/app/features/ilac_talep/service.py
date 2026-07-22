from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.base_model import utc_now
from app.core.enums import IlacTalepDurumu, PanelBildirimTipi
from app.features.eczane.models import Ilac
from app.features.hastalar.models import Hasta
from app.features.ilac_talep.models import IlacTalebi, IlacTalepKalemi
from app.features.ilac_talep.schemas import (
    IlacTalepCreate,
    IlacTalepDurumPatch,
    IlacTalepKalemRead,
    IlacTalepRead,
    IlacTalepSatirRead,
    StokDurumRead,
    VerilenIlacRead,
)
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.yatis.klinik_service import panel_bildirim_olustur
from app.features.yatis.models import Servis, YatisKaydi


def _enum_val(v) -> str:
    return v.value if hasattr(v, "value") else str(v)


def _hasta_ad(session: Session, hasta_id: int) -> str | None:
    hasta = session.get(Hasta, hasta_id)
    if hasta is None:
        return None
    k = session.get(Kullanici, hasta.kullanici_id)
    if k is None:
        return f"Hasta #{hasta_id}"
    return f"{k.ad} {k.soyad}".strip()


def _hemsire_personel_id(session: Session, user: Kullanici) -> int | None:
    p = session.exec(select(Personel).where(Personel.kullanici_id == user.id)).first()
    return p.id if p else None


def _to_read(session: Session, talep: IlacTalebi) -> IlacTalepRead:
    kalemler = session.exec(
        select(IlacTalepKalemi).where(IlacTalepKalemi.talep_id == talep.id)
    ).all()
    yatis = session.get(YatisKaydi, talep.yatis_id)
    servis = session.get(Servis, talep.servis_id)
    return IlacTalepRead(
        id=talep.id,
        yatis_id=talep.yatis_id,
        hasta_id=talep.hasta_id,
        hasta_ad_soyad=_hasta_ad(session, talep.hasta_id),
        protokol_no=yatis.protokol_no if yatis else None,
        servis_id=talep.servis_id,
        servis_ad=servis.ad if servis else None,
        istek_tarihi=talep.istek_tarihi,
        isteyen_doktor_id=talep.isteyen_doktor_id,
        isteyen_birim=talep.isteyen_birim,
        isteyen_hemsire_id=talep.isteyen_hemsire_id,
        durum=_enum_val(talep.durum),
        acil_mi=bool(getattr(talep, "acil_mi", False)),
        kalemler=[
            IlacTalepKalemRead(
                id=k.id,
                talep_id=k.talep_id,
                ilac_id=k.ilac_id,
                urun_kodu=k.urun_kodu,
                urun_adi=k.urun_adi,
                istenen_miktar=k.istenen_miktar,
                verilen_miktar=k.verilen_miktar,
                kullanim_sekli=_enum_val(k.kullanim_sekli),
                periyod=k.periyod,
                doz=k.doz,
                olcu_birimi=k.olcu_birimi,
                uygulama_suresi=k.uygulama_suresi,
            )
            for k in kalemler
        ],
    )


def list_talepler(
    session: Session,
    *,
    hasta_id: int | None = None,
    yatis_id: int | None = None,
) -> list[IlacTalepRead]:
    q = select(IlacTalebi).order_by(IlacTalebi.istek_tarihi.desc())
    if hasta_id is not None:
        q = q.where(IlacTalebi.hasta_id == hasta_id)
    if yatis_id is not None:
        q = q.where(IlacTalebi.yatis_id == yatis_id)
    return [_to_read(session, t) for t in session.exec(q).all()]


def list_talepler_satir(
    session: Session,
    *,
    hasta_id: int | None = None,
    yatis_id: int | None = None,
) -> list[IlacTalepSatirRead]:
    talepler = list_talepler(session, hasta_id=hasta_id, yatis_id=yatis_id)
    out: list[IlacTalepSatirRead] = []
    for t in talepler:
        for k in t.kalemler:
            out.append(
                IlacTalepSatirRead(
                    talep_id=t.id,
                    kalem_id=k.id,
                    istek_tarihi=t.istek_tarihi,
                    hasta_ad_soyad=t.hasta_ad_soyad,
                    protokol_no=t.protokol_no,
                    urun_kodu=k.urun_kodu,
                    urun_adi=k.urun_adi,
                    istenen_miktar=k.istenen_miktar,
                    verilen_miktar=k.verilen_miktar,
                    durum=t.durum,
                    acil_mi=t.acil_mi,
                )
            )
    return out


def get_talep(session: Session, talep_id: int) -> IlacTalepRead:
    t = session.get(IlacTalebi, talep_id)
    if t is None:
        raise HTTPException(status_code=404, detail="İlaç talebi bulunamadı")
    return _to_read(session, t)


def create_talep(
    session: Session,
    body: IlacTalepCreate,
    yapan: Kullanici,
) -> IlacTalepRead:
    yatis = session.get(YatisKaydi, body.yatis_id)
    if yatis is None:
        raise HTTPException(status_code=404, detail="Yatış kaydı bulunamadı")
    if not yatis.aktif_mi:
        raise HTTPException(status_code=400, detail="Aktif olmayan yatış için talep açılamaz")

    durum = IlacTalepDurumu.ONAY_BEKLIYOR if body.gonder else IlacTalepDurumu.YENI
    talep = IlacTalebi(
        yatis_id=yatis.id,
        hasta_id=yatis.hasta_id,
        servis_id=yatis.servis_id,
        istek_tarihi=utc_now(),
        isteyen_doktor_id=body.isteyen_doktor_id or yatis.sorumlu_doktor_id,
        isteyen_birim=body.isteyen_birim,
        isteyen_hemsire_id=_hemsire_personel_id(session, yapan),
        durum=durum,
        acil_mi=body.acil_mi,
    )
    session.add(talep)
    session.flush()

    for k in body.kalemler:
        if k.ilac_id is not None and session.get(Ilac, k.ilac_id) is None:
            raise HTTPException(status_code=404, detail=f"İlaç bulunamadı: {k.ilac_id}")
        session.add(
            IlacTalepKalemi(
                talep_id=talep.id,
                ilac_id=k.ilac_id,
                urun_kodu=k.urun_kodu,
                urun_adi=k.urun_adi,
                istenen_miktar=k.istenen_miktar,
                verilen_miktar=k.verilen_miktar,
                kullanim_sekli=k.kullanim_sekli,
                periyod=k.periyod,
                doz=k.doz,
                olcu_birimi=k.olcu_birimi,
                uygulama_suresi=k.uygulama_suresi,
            )
        )

    session.commit()
    session.refresh(talep)
    return _to_read(session, talep)


def patch_durum(
    session: Session,
    talep_id: int,
    body: IlacTalepDurumPatch,
) -> IlacTalepRead:
    t = session.get(IlacTalebi, talep_id)
    if t is None:
        raise HTTPException(status_code=404, detail="İlaç talebi bulunamadı")
    t.durum = body.durum
    if body.durum == IlacTalepDurumu.VERILDI:
        kalemler = session.exec(
            select(IlacTalepKalemi).where(IlacTalepKalemi.talep_id == talep_id)
        ).all()
        for k in kalemler:
            if k.verilen_miktar <= 0:
                k.verilen_miktar = k.istenen_miktar
                session.add(k)
    if body.durum == IlacTalepDurumu.ONAYLANDI and t.isteyen_hemsire_id:
        p = session.get(Personel, t.isteyen_hemsire_id)
        if p:
            panel_bildirim_olustur(
                session,
                alici_id=p.kullanici_id,
                baslik="İlaç talebi onaylandı",
                govde=f"Talep #{t.id} onaylandı",
                tip=PanelBildirimTipi.ILAC_TALEP.value,
                kaynak_tip="ilac_talep",
                kaynak_id=t.id,
            )
    session.add(t)
    session.commit()
    session.refresh(t)
    return _to_read(session, t)


def stok_durumu(
    session: Session,
    *,
    ilac_id: int | None = None,
    urun_kodu: str | None = None,
) -> StokDurumRead:
    ilac: Ilac | None = None
    if ilac_id is not None:
        ilac = session.get(Ilac, ilac_id)
    elif urun_kodu:
        ilac = session.exec(select(Ilac).where(Ilac.barkod == urun_kodu)).first()
    if ilac is None:
        raise HTTPException(status_code=404, detail="İlaç/stok kaydı bulunamadı")
    return StokDurumRead(
        ilac_id=ilac.id,
        ad=ilac.ad,
        barkod=ilac.barkod,
        stok=ilac.stok,
        kritik_stok=ilac.kritik_stok,
        kritik_mi=ilac.stok <= ilac.kritik_stok,
    )


def verilen_ilaclar(session: Session, hasta_id: int) -> list[VerilenIlacRead]:
    talepler = session.exec(
        select(IlacTalebi).where(
            IlacTalebi.hasta_id == hasta_id,
            IlacTalebi.durum == IlacTalepDurumu.VERILDI,
        )
    ).all()
    out: list[VerilenIlacRead] = []
    for t in talepler:
        kalemler = session.exec(
            select(IlacTalepKalemi).where(IlacTalepKalemi.talep_id == t.id)
        ).all()
        for k in kalemler:
            out.append(
                VerilenIlacRead(
                    talep_id=t.id,
                    istek_tarihi=t.istek_tarihi,
                    urun_kodu=k.urun_kodu,
                    urun_adi=k.urun_adi,
                    verilen_miktar=k.verilen_miktar,
                    kullanim_sekli=_enum_val(k.kullanim_sekli),
                    doz=k.doz,
                    olcu_birimi=k.olcu_birimi,
                )
            )
    out.sort(key=lambda x: x.istek_tarihi, reverse=True)
    return out
