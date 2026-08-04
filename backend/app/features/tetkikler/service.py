from collections import defaultdict
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.batch_load import batch_by_ids
from app.core.enums import Rol
from app.core.lookups import doktor_getir, hasta_getir
from app.core.pagination import Page, make_page, paginate
from app.core.permissions import Kapsam
from app.core.public_id import get_by_public_id, hasta_from_public_id, hasta_pk_from_public_id
from app.core.scope import kullanici_kapsamli_filtre_uygula
from app.features.doktorlar.models import Doktor
from app.features.hastalar import service as hasta_service
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.klinik_kodlar.models import TetkikSonucKalemi
from app.features.personel.models import Personel
from app.features.tetkikler.models import Tetkik
from app.features.tetkikler.schemas import (
    TetkikCreate,
    TetkikRead,
    TetkikSonucKalemCreate,
    TetkikSonucKalemRead,
    TetkikTrendNokta,
)


def _kullanici_ad_soyad(k: Kullanici | None, *, fallback: str) -> str:
    if k is None:
        return fallback
    ad = f"{k.ad} {k.soyad}".strip()
    return ad or fallback


def _hasta_ad_soyad(
    hasta: Hasta | None, kullanicilar: dict[int, Kullanici]
) -> str | None:
    if hasta is None:
        return None
    return _kullanici_ad_soyad(
        kullanicilar.get(hasta.kullanici_id), fallback=f"Hasta #{hasta.id}"
    )


def _doktor_ad_soyad(
    doktor_id: int,
    *,
    doktorlar: dict[int, Doktor],
    personeller: dict[int, Personel],
    kullanicilar: dict[int, Kullanici],
) -> str | None:
    doktor = doktorlar.get(doktor_id)
    if doktor is None:
        return f"Doktor #{doktor_id}"
    personel = personeller.get(doktor.personel_id)
    if personel is None:
        return f"Doktor #{doktor_id}"
    return _kullanici_ad_soyad(
        kullanicilar.get(personel.kullanici_id), fallback=f"Doktor #{doktor_id}"
    )


def _lookup_labels(
    session: Session, rows: list[Tetkik]
) -> tuple[dict[int, Kullanici], dict[int, Doktor], dict[int, Personel]]:
    hastalar = batch_by_ids(session, Hasta, (t.hasta_id for t in rows))
    doktorlar = batch_by_ids(
        session, Doktor, (t.istek_yapan_doktor_id for t in rows)
    )
    personeller = batch_by_ids(
        session, Personel, (d.personel_id for d in doktorlar.values())
    )
    kullanici_ids: set[int] = set()
    for h in hastalar.values():
        kullanici_ids.add(h.kullanici_id)
    for p in personeller.values():
        kullanici_ids.add(p.kullanici_id)
    kullanicilar = batch_by_ids(session, Kullanici, kullanici_ids)
    return kullanicilar, doktorlar, personeller


def _kalemler(session: Session, tetkik_id: int) -> list[TetkikSonucKalemRead]:
    rows = session.exec(
        select(TetkikSonucKalemi).where(TetkikSonucKalemi.tetkik_id == tetkik_id)
    ).all()
    return [TetkikSonucKalemRead.model_validate(r) for r in rows]


def _to_read(session: Session, t: Tetkik) -> TetkikRead:
    hasta = session.get(Hasta, t.hasta_id)
    if hasta is None:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")
    kullanicilar, doktorlar, personeller = _lookup_labels(session, [t])
    return TetkikRead(
        id=t.public_id,
        hasta_id=hasta.public_id,
        hasta_ad_soyad=_hasta_ad_soyad(hasta, kullanicilar),
        istek_yapan_doktor_id=t.istek_yapan_doktor_id,
        istek_yapan_doktor_ad_soyad=_doktor_ad_soyad(
            t.istek_yapan_doktor_id,
            doktorlar=doktorlar,
            personeller=personeller,
            kullanicilar=kullanicilar,
        ),
        tetkik_turu=t.tetkik_turu,
        sonuc_dosyasi=t.sonuc_dosyasi,
        durum=t.durum,
        created_at=t.created_at,
        hasta_goruldu_at=t.hasta_goruldu_at,
        sonuc_kalemleri=_kalemler(session, t.id) if t.id else [],
    )


def _liste_sorgu(
    session: Session,
    current_user: Kullanici,
    kapsam: Kapsam,
    *,
    hasta_public_id: UUID | None = None,
):
    query = select(Tetkik)
    if hasta_public_id is not None:
        hasta_pk = hasta_pk_from_public_id(session, hasta_public_id)
        query = query.where(Tetkik.hasta_id == hasta_pk)

    def kendi(q):
        if current_user.rol == Rol.DOKTOR:
            doktor = doktor_getir(session, current_user.id)
            return q.where(Tetkik.istek_yapan_doktor_id == doktor.id)
        if current_user.rol == Rol.HASTA:
            hasta = hasta_getir(session, current_user.id)
            return q.where(Tetkik.hasta_id == hasta.id)
        if current_user.rol == Rol.LABORANT:
            return q
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kendi kaydı kapsamı bu rol için tanımlı değil",
        )

    def departman(q):
        ids = hasta_service.hemsire_erisebilir_hasta_idler(
            session, current_user, sadece_yatan=False
        )
        if not ids:
            return q.where(Tetkik.id == -1)
        return q.where(Tetkik.hasta_id.in_(ids))

    query = kullanici_kapsamli_filtre_uygula(
        query,
        kapsam,
        kendi_kaydim_filtresi=kendi,
        departmanim_filtresi=departman,
    )
    return query.order_by(Tetkik.id.desc())


def listele(
    session: Session,
    current_user: Kullanici,
    kapsam: Kapsam,
    *,
    hasta_public_id: UUID | None = None,
    page: int = 1,
    page_size: int = 50,
) -> Page[TetkikRead]:
    query = _liste_sorgu(
        session, current_user, kapsam, hasta_public_id=hasta_public_id
    )
    rows, total = paginate(session, query, page=page, page_size=page_size)
    hastalar = batch_by_ids(session, Hasta, (t.hasta_id for t in rows))
    kullanicilar, doktorlar, personeller = _lookup_labels(session, rows)
    tetkik_ids = [t.id for t in rows if t.id is not None]
    kalem_map: dict[int, list[TetkikSonucKalemRead]] = defaultdict(list)
    if tetkik_ids:
        for k in session.exec(
            select(TetkikSonucKalemi).where(TetkikSonucKalemi.tetkik_id.in_(tetkik_ids))
        ).all():
            kalem_map[k.tetkik_id].append(TetkikSonucKalemRead.model_validate(k))

    items: list[TetkikRead] = []
    for t in rows:
        hasta = hastalar.get(t.hasta_id)
        if hasta is None:
            continue
        items.append(
            TetkikRead(
                id=t.public_id,
                hasta_id=hasta.public_id,
                hasta_ad_soyad=_hasta_ad_soyad(hasta, kullanicilar),
                istek_yapan_doktor_id=t.istek_yapan_doktor_id,
                istek_yapan_doktor_ad_soyad=_doktor_ad_soyad(
                    t.istek_yapan_doktor_id,
                    doktorlar=doktorlar,
                    personeller=personeller,
                    kullanicilar=kullanicilar,
                ),
                tetkik_turu=t.tetkik_turu,
                sonuc_dosyasi=t.sonuc_dosyasi,
                durum=t.durum,
                created_at=t.created_at,
                hasta_goruldu_at=t.hasta_goruldu_at,
                sonuc_kalemleri=kalem_map.get(t.id, []) if t.id else [],
            )
        )
    return make_page(items, total=total, page=page, page_size=page_size)


def tetkik_erisim_kontrolu(
    session: Session, tetkik: Tetkik, current_user: Kullanici
) -> None:
    if current_user.rol == Rol.ADMIN:
        return
    if current_user.rol in (Rol.BASHEKIM, Rol.MUDUR):
        return
    if current_user.rol == Rol.DOKTOR:
        doktor = doktor_getir(session, current_user.id)
        if tetkik.istek_yapan_doktor_id == doktor.id:
            return
    elif current_user.rol == Rol.HASTA:
        hasta = hasta_getir(session, current_user.id)
        if tetkik.hasta_id == hasta.id:
            return
    elif current_user.rol == Rol.LABORANT:
        return
    elif current_user.rol in (Rol.HEMSIRE, Rol.EBE):
        ids = hasta_service.hemsire_erisebilir_hasta_idler(session, current_user)
        if tetkik.hasta_id in ids:
            return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Bu tetkike erişiminiz yok.",
    )


def getir(session: Session, current_user: Kullanici, public_id: UUID) -> Tetkik:
    tetkik = get_by_public_id(session, Tetkik, public_id)
    tetkik_erisim_kontrolu(session, tetkik, current_user)
    return tetkik


def hasta_goruldu_isaretle(
    session: Session, current_user: Kullanici, tetkik: Tetkik
) -> None:
    if current_user.rol != Rol.HASTA:
        return
    if tetkik.durum != "SONUCLANDI":
        return
    if tetkik.hasta_goruldu_at is not None:
        return
    tetkik.hasta_goruldu_at = datetime.now(timezone.utc)
    session.add(tetkik)
    session.commit()
    session.refresh(tetkik)


def okunmamis_sonuclanmis_sayisi(session: Session, hasta_pk: int) -> int:
    rows = session.exec(
        select(Tetkik).where(
            Tetkik.hasta_id == hasta_pk,
            Tetkik.durum == "SONUCLANDI",
            Tetkik.hasta_goruldu_at == None,  # noqa: E711
        )
    ).all()
    return len(rows)


def olustur(
    session: Session, current_user: Kullanici, veri: TetkikCreate, kapsam: Kapsam
) -> TetkikRead:
    if current_user.rol == Rol.DOKTOR:
        doktor = doktor_getir(session, current_user.id)
        if veri.istek_yapan_doktor_id != doktor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sadece kendi adınıza tetkik isteyebilirsiniz.",
            )
    hasta = hasta_from_public_id(session, veri.hasta_id)
    assert hasta.id is not None
    if veri.public_id is not None:
        clash = session.exec(
            select(Tetkik).where(Tetkik.public_id == veri.public_id)
        ).first()
        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="public_id zaten kullanılıyor",
            )
    kwargs: dict = {
        "hasta_id": hasta.id,
        "istek_yapan_doktor_id": veri.istek_yapan_doktor_id,
        "tetkik_turu": veri.tetkik_turu,
        "durum": "ISTEK_ALINDI",
    }
    if veri.public_id is not None:
        kwargs["public_id"] = veri.public_id
    tetkik = Tetkik(**kwargs)
    session.add(tetkik)
    session.commit()
    session.refresh(tetkik)
    return _to_read(session, tetkik)


def _panic_mi(k: TetkikSonucKalemCreate) -> bool:
    if k.panic_mi:
        return True
    if k.deger_sayisal is None:
        return False
    if k.panic_min is not None and k.deger_sayisal < k.panic_min:
        return True
    if k.panic_max is not None and k.deger_sayisal > k.panic_max:
        return True
    return False


def _bildir_kritik_lab(
    session: Session,
    tetkik: Tetkik,
    panic_kalemler: list[TetkikSonucKalemCreate],
) -> None:
    from app.core.enums import PanelBildirimTipi
    from app.features.yatis.klinik_service import panel_bildirim_olustur

    doktor = session.get(Doktor, tetkik.istek_yapan_doktor_id)
    if doktor is None:
        return
    personel = session.get(Personel, doktor.personel_id)
    if personel is None:
        return
    ozet = "; ".join(
        f"{k.parametre_adi}={k.deger_sayisal if k.deger_sayisal is not None else k.deger_metin}"
        for k in panic_kalemler[:5]
    )
    panel_bildirim_olustur(
        session,
        alici_id=personel.kullanici_id,
        baslik="Kritik laboratuvar değeri",
        govde=f"{tetkik.tetkik_turu}: {ozet}",
        tip=PanelBildirimTipi.KRITIK_LAB.value,
        kaynak_tip="tetkik",
        kaynak_id=tetkik.id,
    )


def sonuc_gir(
    session: Session,
    current_user: Kullanici,
    public_id: UUID,
    sonuc_dosyasi: str | None,
    durum: str,
    sonuc_kalemleri: list[TetkikSonucKalemCreate] | None = None,
) -> TetkikRead:
    tetkik = get_by_public_id(session, Tetkik, public_id)
    if current_user.rol not in (Rol.ADMIN, Rol.LABORANT):
        raise HTTPException(status_code=403, detail="Sonuç girme yetkiniz yok")
    if sonuc_dosyasi is not None:
        tetkik.sonuc_dosyasi = sonuc_dosyasi
    tetkik.durum = durum
    session.add(tetkik)
    session.flush()

    panic_list: list[TetkikSonucKalemCreate] = []
    if sonuc_kalemleri is not None:
        for old in session.exec(
            select(TetkikSonucKalemi).where(TetkikSonucKalemi.tetkik_id == tetkik.id)
        ).all():
            session.delete(old)
        for k in sonuc_kalemleri:
            anormal = k.anormal_mi
            if (
                not anormal
                and k.deger_sayisal is not None
                and (k.ref_min is not None or k.ref_max is not None)
            ):
                if k.ref_min is not None and k.deger_sayisal < k.ref_min:
                    anormal = True
                if k.ref_max is not None and k.deger_sayisal > k.ref_max:
                    anormal = True
            panic = _panic_mi(k)
            if panic:
                panic_list.append(k)
            session.add(
                TetkikSonucKalemi(
                    tetkik_id=tetkik.id,  # type: ignore[arg-type]
                    parametre_adi=k.parametre_adi,
                    loinc_kodu=k.loinc_kodu,
                    deger_sayisal=k.deger_sayisal,
                    deger_metin=k.deger_metin,
                    birim=k.birim,
                    ref_min=k.ref_min,
                    ref_max=k.ref_max,
                    anormal_mi=anormal or panic,
                    panic_min=k.panic_min,
                    panic_max=k.panic_max,
                    panic_mi=panic,
                )
            )

    if panic_list and durum == "SONUCLANDI":
        _bildir_kritik_lab(session, tetkik, panic_list)

    session.commit()
    session.refresh(tetkik)
    if durum == "SONUCLANDI":
        _bildir_hasta_sonuc_hazir(session, tetkik)
    return _to_read(session, tetkik)


def _bildir_hasta_sonuc_hazir(session: Session, tetkik: Tetkik) -> None:
    from app.core.notifications import get_bildirim

    hasta = session.get(Hasta, tetkik.hasta_id)
    if hasta is None:
        return
    k = session.get(Kullanici, hasta.kullanici_id)
    if k is None:
        return
    tel = k.telefon
    if not tel:
        return
    get_bildirim().sms_gonder(
        tel,
        f"{tetkik.tetkik_turu} sonucunuz hazır. Mobil uygulamadan görüntüleyebilirsiniz.",
    )


def trend(
    session: Session,
    current_user: Kullanici,
    *,
    hasta_public_id: UUID,
    parametre: str,
    limit: int = 20,
) -> list[TetkikTrendNokta]:
    hasta_pk = hasta_pk_from_public_id(session, hasta_public_id)
    # basit erişim: hasta:goruntule kapsamı çağıran router'da
    rows = session.exec(
        select(TetkikSonucKalemi, Tetkik)
        .join(Tetkik, Tetkik.id == TetkikSonucKalemi.tetkik_id)
        .where(
            Tetkik.hasta_id == hasta_pk,
            TetkikSonucKalemi.parametre_adi.ilike(parametre),
        )
        .order_by(TetkikSonucKalemi.id.desc())
        .limit(limit)
    ).all()
    out: list[TetkikTrendNokta] = []
    for kalem, tetkik in rows:
        out.append(
            TetkikTrendNokta(
                tetkik_id=tetkik.public_id,
                tarih=tetkik.updated_at.isoformat() if tetkik.updated_at else None,
                deger_sayisal=kalem.deger_sayisal,
                deger_metin=kalem.deger_metin,
                birim=kalem.birim,
                anormal_mi=kalem.anormal_mi,
            )
        )
    return list(reversed(out))
