from collections import defaultdict
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.enums import Rol
from app.core.lookups import doktor_getir, hasta_getir, personel_getir
from app.core.pagination import Page, make_page, paginate
from app.core.permissions import Kapsam
from app.core.public_id import hasta_public_id_from_pk
from app.core.scope import kullanici_kapsamli_filtre_uygula
from app.features.kullanicilar.models import Kullanici
from app.features.muayeneler.models import MuayeneKaydi
from app.features.muayeneler.recete_guvenlik import (
    ReceteKalemGirdi,
    uygula_veya_engelle,
)
from app.features.muayeneler.recete_models import ReceteKalemi
from app.features.muayeneler.schemas import (
    MuayeneCreate,
    MuayeneRead,
    MuayeneUpdate,
    ReceteKalemRead,
)
from app.core.config import get_settings
from app.features.randevular.models import Randevu


def _kalemleri_metne(kalemler: list) -> str | None:
    if not kalemler:
        return None
    parts = []
    for k in kalemler:
        bit = k.urun_adi
        if k.doz:
            bit += f" {k.doz}"
        if k.periyod:
            bit += f" / {k.periyod}"
        parts.append(bit)
    return "; ".join(parts)[:2000]


def _kalem_oku(session: Session, muayene_id: int) -> list[ReceteKalemRead]:
    rows = list(
        session.exec(
            select(ReceteKalemi)
            .where(ReceteKalemi.muayene_id == muayene_id)
            .order_by(ReceteKalemi.sira, ReceteKalemi.id)
        ).all()
    )
    return [ReceteKalemRead.model_validate(r) for r in rows]


def muayene_to_read(session: Session, kayit: MuayeneKaydi) -> MuayeneRead:
    kalemler = _kalem_oku(session, kayit.id)  # type: ignore[arg-type]
    recete_text = kayit.receteler
    if kalemler and not recete_text:
        recete_text = _kalemleri_metne(kalemler)
    return MuayeneRead(
        id=kayit.id,  # type: ignore[arg-type]
        randevu_id=kayit.randevu_id,
        tani=kayit.tani,
        tedavi_plani=kayit.tedavi_plani,
        receteler=recete_text,
        recete_kalemleri=kalemler,
        bulasici_bildirim_mi=bool(kayit.bulasici_bildirim_mi),
        adli_vaka_mi=bool(kayit.adli_vaka_mi),
        olum_bildirim_mi=bool(kayit.olum_bildirim_mi),
    )


def _zorunlu_bildirim_audit(
    session: Session,
    *,
    muayene: MuayeneKaydi,
    actor_id: int | None,
    ip_adresi: str | None,
    onceki: dict[str, bool] | None = None,
) -> None:
    bayraklar = {
        "bulasici_bildirim_mi": bool(muayene.bulasici_bildirim_mi),
        "adli_vaka_mi": bool(muayene.adli_vaka_mi),
        "olum_bildirim_mi": bool(muayene.olum_bildirim_mi),
    }
    if not any(bayraklar.values()):
        return
    if onceki is not None and bayraklar == onceki:
        return
    denetim_kaydi_yaz(
        session,
        aksiyon="ZORUNLU_BILDIRIM_ISARET",
        actor_id=actor_id,
        kaynak="muayene",
        kaynak_id=muayene.id,
        detay=bayraklar,
        ip_adresi=ip_adresi,
        commit=False,
    )


def _kaydet_kalemler(
    session: Session,
    *,
    muayene: MuayeneKaydi,
    randevu: Randevu,
    current_user: Kullanici,
    kalem_data: list,
    uyari_onay,
    ip_adresi: str | None = None,
) -> None:
    girdiler = [
        ReceteKalemGirdi(
            urun_adi=k.urun_adi, barkod=k.barkod, ilac_id=k.ilac_id
        )
        for k in kalem_data
    ]
    soft = uygula_veya_engelle(
        session,
        hasta_id=randevu.hasta_id,
        kalemler=girdiler,
        uyari_kodlari=uyari_onay.uyari_kodlari if uyari_onay else None,
        gerekce=uyari_onay.gerekce if uyari_onay else None,
    )

    # Eski kalemleri sil
    for old in session.exec(
        select(ReceteKalemi).where(ReceteKalemi.muayene_id == muayene.id)
    ).all():
        session.delete(old)

    for k in kalem_data:
        session.add(
            ReceteKalemi(
                muayene_id=muayene.id,  # type: ignore[arg-type]
                ilac_id=k.ilac_id,
                urun_adi=k.urun_adi,
                barkod=k.barkod,
                doz=k.doz,
                periyod=k.periyod,
                kullanim_sekli=k.kullanim_sekli,
                adet=k.adet,
                sira=k.sira,
            )
        )

    muayene.receteler = _kalemleri_metne(kalem_data)

    if soft and uyari_onay:
        denetim_kaydi_yaz(
            session,
            aksiyon="RECETE_UYARI_OVERRIDE",
            actor_id=current_user.id,
            kaynak="muayene",
            kaynak_id=muayene.id,
            ip_adresi=ip_adresi,
            detay={
                "muayene_id": muayene.id,
                "kalem_ozet": [k.urun_adi for k in kalem_data],
                "uyari_kodlari": uyari_onay.uyari_kodlari,
                "gerekce": uyari_onay.gerekce,
                "hasta_public_id": str(
                    hasta_public_id_from_pk(session, randevu.hasta_id)
                ),
            },
            commit=False,
        )


def create_muayene(
    session: Session,
    current_user: Kullanici,
    data: MuayeneCreate,
    kapsam: Kapsam,
    *,
    ip_adresi: str | None = None,
) -> MuayeneKaydi:
    randevu = session.get(Randevu, data.randevu_id)
    if randevu is None:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    if kapsam == Kapsam.KENDI_KAYDIM:
        doktor = doktor_getir(session, current_user.id)
        if randevu.doktor_id != doktor.id:
            raise HTTPException(
                status_code=403,
                detail="Sadece kendi randevunuza muayene kaydı açabilirsiniz",
            )
    existing = session.exec(
        select(MuayeneKaydi).where(MuayeneKaydi.randevu_id == data.randevu_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu randevu için muayene zaten var")

    if get_settings().MEDULA_PROVIZYON_ZORUNLU and not randevu.medula_provizyon_no:
        raise HTTPException(
            status_code=400,
            detail="Muayene öncesi MEDULA provizyonu zorunludur",
        )

    dump = data.model_dump(
        exclude={"recete_kalemleri", "uyari_onay"},
    )

    if data.recete_kalemleri:
        # Güvenlik kontrolü kayıt oluşturmadan önce (422'de yarım satır kalmasın)
        girdiler = [
            ReceteKalemGirdi(
                urun_adi=k.urun_adi, barkod=k.barkod, ilac_id=k.ilac_id
            )
            for k in data.recete_kalemleri
        ]
        uygula_veya_engelle(
            session,
            hasta_id=randevu.hasta_id,
            kalemler=girdiler,
            uyari_kodlari=data.uyari_onay.uyari_kodlari if data.uyari_onay else None,
            gerekce=data.uyari_onay.gerekce if data.uyari_onay else None,
        )

    kayit = MuayeneKaydi(**dump)
    session.add(kayit)
    session.flush()

    if data.recete_kalemleri:
        _kaydet_kalemler(
            session,
            muayene=kayit,
            randevu=randevu,
            current_user=current_user,
            kalem_data=data.recete_kalemleri,
            uyari_onay=data.uyari_onay,
            ip_adresi=ip_adresi,
        )
    elif data.receteler:
        kayit.receteler = data.receteler

    _zorunlu_bildirim_audit(
        session,
        muayene=kayit,
        actor_id=current_user.id,
        ip_adresi=ip_adresi,
    )

    randevu.durum = "TAMAMLANDI"
    randevu.updated_at = datetime.now(timezone.utc)
    session.add(randevu)
    session.commit()
    session.refresh(kayit)
    return kayit


def update_muayene(
    session: Session,
    current_user: Kullanici,
    muayene_id: int,
    data: MuayeneUpdate,
    kapsam: Kapsam,
    *,
    ip_adresi: str | None = None,
) -> MuayeneKaydi:
    kayit = session.get(MuayeneKaydi, muayene_id)
    if kayit is None:
        raise HTTPException(status_code=404, detail="Muayene bulunamadı")
    randevu = session.get(Randevu, kayit.randevu_id)
    if randevu is None:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    if kapsam == Kapsam.KENDI_KAYDIM:
        doktor = doktor_getir(session, current_user.id)
        if randevu.doktor_id != doktor.id:
            raise HTTPException(
                status_code=403, detail="Sadece kendi muayenenizi düzenleyebilirsiniz"
            )
    elif kapsam != Kapsam.GLOBAL:
        raise HTTPException(status_code=403, detail="Muayene güncelleme yetkiniz yok")

    onceki_bildirim = {
        "bulasici_bildirim_mi": bool(kayit.bulasici_bildirim_mi),
        "adli_vaka_mi": bool(kayit.adli_vaka_mi),
        "olum_bildirim_mi": bool(kayit.olum_bildirim_mi),
    }
    payload = data.model_dump(
        exclude_unset=True, exclude={"recete_kalemleri", "uyari_onay"}
    )
    for k, v in payload.items():
        setattr(kayit, k, v)

    if data.recete_kalemleri is not None:
        _kaydet_kalemler(
            session,
            muayene=kayit,
            randevu=randevu,
            current_user=current_user,
            kalem_data=data.recete_kalemleri,
            uyari_onay=data.uyari_onay,
            ip_adresi=ip_adresi,
        )

    _zorunlu_bildirim_audit(
        session,
        muayene=kayit,
        actor_id=current_user.id,
        ip_adresi=ip_adresi,
        onceki=onceki_bildirim,
    )

    kayit.updated_at = datetime.now(timezone.utc)
    session.add(kayit)
    session.commit()
    session.refresh(kayit)
    return kayit


def list_muayeneler(
    session: Session,
    current_user: Kullanici,
    kapsam: Kapsam,
    *,
    page: int = 1,
    page_size: int = 50,
) -> Page[MuayeneRead]:
    query = select(MuayeneKaydi).join(Randevu, MuayeneKaydi.randevu_id == Randevu.id)

    def kendi(q):
        if current_user.rol == Rol.DOKTOR:
            doktor = doktor_getir(session, current_user.id)
            return q.where(Randevu.doktor_id == doktor.id)
        if current_user.rol == Rol.HASTA:
            hasta = hasta_getir(session, current_user.id)
            return q.where(Randevu.hasta_id == hasta.id)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kendi kaydı kapsamı bu rol için tanımlı değil",
        )

    def departman(q):
        personel = personel_getir(session, current_user.id)
        if personel.departman_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Departman atanmamış",
            )
        return q.where(Randevu.departman_id == personel.departman_id)

    query = kullanici_kapsamli_filtre_uygula(
        query,
        kapsam,
        kendi_kaydim_filtresi=kendi,
        departmanim_filtresi=departman,
    )
    query = query.order_by(MuayeneKaydi.id.desc())
    rows, total = paginate(session, query, page=page, page_size=page_size)

    muayene_ids = [r.id for r in rows if r.id is not None]
    kalem_map: dict[int, list[ReceteKalemRead]] = defaultdict(list)
    if muayene_ids:
        for k in session.exec(
            select(ReceteKalemi).where(ReceteKalemi.muayene_id.in_(muayene_ids))
        ).all():
            kalem_map[k.muayene_id].append(ReceteKalemRead.model_validate(k))

    items: list[MuayeneRead] = []
    for kayit in rows:
        kalemler = kalem_map.get(kayit.id, []) if kayit.id else []
        recete_text = kayit.receteler
        if kalemler and not recete_text:
            recete_text = _kalemleri_metne(kalemler)
        items.append(
            MuayeneRead(
                id=kayit.id,  # type: ignore[arg-type]
                randevu_id=kayit.randevu_id,
                tani=kayit.tani,
                tedavi_plani=kayit.tedavi_plani,
                receteler=recete_text,
                recete_kalemleri=kalemler,
            )
        )
    return make_page(items, total=total, page=page, page_size=page_size)


def get_muayene(
    session: Session,
    current_user: Kullanici,
    muayene_id: int,
    kapsam: Kapsam,
) -> MuayeneKaydi:
    kayit = session.get(MuayeneKaydi, muayene_id)
    if kayit is None:
        raise HTTPException(status_code=404, detail="Muayene bulunamadı")
    randevu = session.get(Randevu, kayit.randevu_id)
    if randevu is None:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    if kapsam == Kapsam.KENDI_KAYDIM:
        if current_user.rol == Rol.DOKTOR:
            doktor = doktor_getir(session, current_user.id)
            if randevu.doktor_id != doktor.id:
                raise HTTPException(status_code=403, detail="Bu muayeneye erişim yetkiniz yok")
        elif current_user.rol == Rol.HASTA:
            hasta = hasta_getir(session, current_user.id)
            if randevu.hasta_id != hasta.id:
                raise HTTPException(status_code=403, detail="Bu muayeneye erişim yetkiniz yok")
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Kendi kaydı kapsamı bu rol için tanımlı değil",
            )
    elif kapsam == Kapsam.DEPARTMANIM:
        personel = personel_getir(session, current_user.id)
        if personel.departman_id != randevu.departman_id:
            raise HTTPException(status_code=403, detail="Bu muayeneye erişim yetkiniz yok")
    return kayit
