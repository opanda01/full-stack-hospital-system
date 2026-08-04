from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import or_
from sqlmodel import Session, select

from app.core.enums import ErisimDurumu, KonsultasyonDurumu, Rol
from app.core.lookups import doktor_getir, personel_getir
from app.core.pagination import Page, make_page, paginate
from app.core.permissions import Kapsam
from app.core.public_id import hasta_from_public_id
from app.core.security import hash_password
from app.features.hastalar.models import Hasta
from app.features.hastalar.schemas import (
    HastaCreate,
    HastaCreateWithUser,
    HastaProfilUpdate,
    HastaRead,
    HastaUpdate,
)
from app.features.kullanicilar.models import Kullanici
from app.features.muayeneler.models import MuayeneKaydi
from app.features.personel.erisim_service import apply_erisim_durumu
from app.features.randevular.models import Randevu
from app.features.tetkikler.models import Tetkik


def list_hastalar(
    session: Session,
    *,
    page: int = 1,
    page_size: int = 50,
) -> Page[HastaRead]:
    q = select(Hasta).order_by(Hasta.id.desc())
    rows, total = paginate(session, q, page=page, page_size=page_size)
    return make_page(
        [_hasta_to_read(session, h) for h in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


def hemsire_erisebilir_hasta_idler(
    session: Session, current_user: Kullanici, *, sadece_yatan: bool = False
) -> set[int]:
    """Departman kapsamı: aktif yatış (servis departmanı / sorumlu hemşire) ∪ randevu."""
    personel = personel_getir(session, current_user.id)
    ids: set[int] = set()

    from app.features.yatis.models import Servis, YatisKaydi

    yatis_q = select(YatisKaydi).where(YatisKaydi.aktif_mi == True)  # noqa: E712
    for y in session.exec(yatis_q).all():
        if y.sorumlu_hemsire_id == personel.id:
            ids.add(y.hasta_id)
            continue
        if personel.departman_id is None:
            continue
        servis = session.get(Servis, y.servis_id)
        if servis and servis.departman_id == personel.departman_id:
            ids.add(y.hasta_id)

    if not sadece_yatan and personel.departman_id is not None:
        for hid in session.exec(
            select(Randevu.hasta_id).where(
                Randevu.departman_id == personel.departman_id
            )
        ).all():
            if hid is not None:
                ids.add(hid)

    return ids


def search_hastalar(
    session: Session,
    current_user: Kullanici,
    *,
    q: str | None = None,
    kapsam_filtre: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> Page[HastaRead]:
    """q: TC / ad / soyad / protokol; kapsam_filtre: yatan | tumu."""
    sadece_yatan = (kapsam_filtre or "").lower() == "yatan"
    rol = current_user.rol

    if rol in (Rol.ADMIN, Rol.BASHEKIM, Rol.MUDUR, Rol.IDARI_PERSONEL):
        allowed: set[int] | None = None
        if sadece_yatan:
            from app.features.yatis.models import YatisKaydi

            allowed = {
                hid
                for hid in session.exec(
                    select(YatisKaydi.hasta_id).where(YatisKaydi.aktif_mi == True)  # noqa: E712
                ).all()
                if hid is not None
            }
    elif rol in (Rol.HEMSIRE, Rol.EBE):
        allowed = hemsire_erisebilir_hasta_idler(
            session, current_user, sadece_yatan=sadece_yatan
        )
    else:
        raise HTTPException(status_code=403, detail="Hasta arama yetkiniz yok")

    query = select(Hasta).join(Kullanici, Kullanici.id == Hasta.kullanici_id)
    if allowed is not None:
        if not allowed:
            return make_page([], total=0, page=page, page_size=page_size)
        query = query.where(Hasta.id.in_(allowed))

    qn = (q or "").strip()
    if qn:
        like = f"%{qn}%"
        protokol_ids: set[int] = set()
        try:
            from app.features.yatis.models import YatisKaydi

            for hid in session.exec(
                select(YatisKaydi.hasta_id).where(YatisKaydi.protokol_no.ilike(like))
            ).all():
                if hid is not None:
                    protokol_ids.add(hid)
        except Exception:
            pass
        from app.core.crypto import hmac_lookup_values

        hash_vals = hmac_lookup_values(qn) if qn.isdigit() and len(qn) == 11 else []
        conds = [
            Hasta.tc_kimlik_no.ilike(like),
            Kullanici.ad.ilike(like),
            Kullanici.soyad.ilike(like),
        ]
        if hash_vals:
            conds.append(Hasta.tc_kimlik_no_hash.in_(hash_vals))
            conds.append(Hasta.tc_kimlik_no_hash_prev.in_(hash_vals))
        if protokol_ids:
            conds.append(Hasta.id.in_(protokol_ids))
        query = query.where(or_(*conds))

    query = query.order_by(Hasta.id.desc())
    rows, total = paginate(session, query, page=page, page_size=page_size)
    return make_page(
        [_hasta_to_read(session, h) for h in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


def get_hasta(session: Session, hasta_id: int) -> Hasta:
    h = session.get(Hasta, hasta_id)
    if h is None:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")
    return h


def get_hasta_by_public_id(session: Session, public_id: UUID) -> Hasta:
    return hasta_from_public_id(session, public_id)


def _hasta_to_read(session: Session, h: Hasta) -> HastaRead:
    from app.core.crypto import decrypt_phi

    k = session.get(Kullanici, h.kullanici_id)
    return HastaRead(
        id=h.public_id,
        kullanici_id=h.kullanici_id,
        tc_kimlik_no=decrypt_phi(h.tc_kimlik_no) or h.tc_kimlik_no,
        dogum_tarihi=h.dogum_tarihi,
        cinsiyet=h.cinsiyet,
        kan_grubu=h.kan_grubu,
        adres=decrypt_phi(h.adres) if h.adres else None,
        boy_cm=h.boy_cm,
        kilo_kg=h.kilo_kg,
        ad=k.ad if k else None,
        soyad=k.soyad if k else None,
        email=k.email if k else None,
        telefon=k.telefon if k else None,
        aktif_mi=k.aktif_mi if k else None,
    )


def doktor_erisebilir_hasta_idler(
    session: Session, current_user: Kullanici
) -> set[int]:
    """Türevsel hasta kapsamı: randevu ∪ muayene ∪ tetkik ∪ klinik_onay ∪ konsültasyon ∪ kurul."""
    doktor = doktor_getir(session, current_user.id)
    ids: set[int] = set()

    for hid in session.exec(
        select(Randevu.hasta_id).where(Randevu.doktor_id == doktor.id)
    ).all():
        if hid is not None:
            ids.add(hid)

    for hid in session.exec(
        select(Randevu.hasta_id)
        .join(MuayeneKaydi, MuayeneKaydi.randevu_id == Randevu.id)
        .where(Randevu.doktor_id == doktor.id)
    ).all():
        if hid is not None:
            ids.add(hid)

    for hid in session.exec(
        select(Tetkik.hasta_id).where(Tetkik.istek_yapan_doktor_id == doktor.id)
    ).all():
        if hid is not None:
            ids.add(hid)

    try:
        from app.features.klinik_onay.models import KlinikOnayKaydi

        for hid in session.exec(
            select(KlinikOnayKaydi.hasta_id).where(
                KlinikOnayKaydi.olusturan_id == current_user.id
            )
        ).all():
            if hid is not None:
                ids.add(hid)
    except Exception:
        pass

    try:
        from app.features.konsultasyon.models import KonsultasyonIstegi

        aktif = [
            KonsultasyonDurumu.BEKLEMEDE,
            KonsultasyonDurumu.KABUL,
            KonsultasyonDurumu.TAMAMLANDI,
        ]
        for hid in session.exec(
            select(KonsultasyonIstegi.hasta_id).where(
                or_(
                    KonsultasyonIstegi.isteyen_doktor_id == doktor.id,
                    KonsultasyonIstegi.hedef_doktor_id == doktor.id,
                ),
                KonsultasyonIstegi.durum.in_(aktif),
            )
        ).all():
            if hid is not None:
                ids.add(hid)
    except Exception:
        pass

    try:
        from app.features.saglik_kurulu.models import (
            SaglikKuruluKaydi,
            SaglikKuruluUye,
        )

        for hid in session.exec(
            select(SaglikKuruluKaydi.hasta_id)
            .join(
                SaglikKuruluUye,
                SaglikKuruluUye.kurul_id == SaglikKuruluKaydi.id,
            )
            .where(SaglikKuruluUye.doktor_id == doktor.id)
        ).all():
            if hid is not None:
                ids.add(hid)
    except Exception:
        pass

    return ids


def doktor_hasta_erisim_var_mi(
    session: Session, current_user: Kullanici, hasta_id: int
) -> bool:
    return hasta_id in doktor_erisebilir_hasta_idler(session, current_user)


def list_benim_hastalar(
    session: Session,
    current_user: Kullanici,
    kapsam: Kapsam,
    *,
    page: int = 1,
    page_size: int = 50,
) -> Page[HastaRead]:
    if kapsam == Kapsam.GLOBAL:
        return list_hastalar(session, page=page, page_size=page_size)
    if kapsam == Kapsam.DEPARTMANIM:
        ids = hemsire_erisebilir_hasta_idler(session, current_user)
        if not ids:
            return make_page([], total=0, page=page, page_size=page_size)
        q = select(Hasta).where(Hasta.id.in_(ids)).order_by(Hasta.id.desc())
        rows, total = paginate(session, q, page=page, page_size=page_size)
        return make_page(
            [_hasta_to_read(session, h) for h in rows],
            total=total,
            page=page,
            page_size=page_size,
        )
    if kapsam != Kapsam.KENDI_KAYDIM:
        raise HTTPException(status_code=403, detail="Hasta listesi için yetkiniz yok")
    if current_user.rol != Rol.DOKTOR:
        raise HTTPException(
            status_code=403, detail="Kendi hasta kapsamı yalnızca doktor içindir"
        )
    ids = doktor_erisebilir_hasta_idler(session, current_user)
    if not ids:
        return make_page([], total=0, page=page, page_size=page_size)
    q = select(Hasta).where(Hasta.id.in_(ids)).order_by(Hasta.id.desc())
    rows, total = paginate(session, q, page=page, page_size=page_size)
    return make_page(
        [_hasta_to_read(session, h) for h in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


def get_hasta_scoped(
    session: Session,
    current_user: Kullanici,
    public_id: UUID,
    kapsam: Kapsam,
) -> HastaRead:
    h = get_hasta_by_public_id(session, public_id)
    assert h.id is not None
    if kapsam == Kapsam.GLOBAL:
        return _hasta_to_read(session, h)
    if kapsam == Kapsam.KENDI_KAYDIM:
        if not doktor_hasta_erisim_var_mi(session, current_user, h.id):
            raise HTTPException(
                status_code=403, detail="Bu hastaya erişim yetkiniz yok"
            )
        return _hasta_to_read(session, h)
    if kapsam == Kapsam.DEPARTMANIM:
        if h.id not in hemsire_erisebilir_hasta_idler(session, current_user):
            raise HTTPException(
                status_code=403, detail="Bu hastaya erişim yetkiniz yok"
            )
        return _hasta_to_read(session, h)
    raise HTTPException(status_code=403, detail="Hasta görüntüleme yetkiniz yok")


def create_hasta(session: Session, data: HastaCreate) -> Hasta:
    existing = session.exec(
        select(Hasta).where(
            (Hasta.kullanici_id == data.kullanici_id)
            | (Hasta.tc_kimlik_no == data.tc_kimlik_no)
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Hasta kaydı zaten var")
    payload = data.model_dump(exclude_none=True)
    if data.public_id is not None:
        clash = session.exec(
            select(Hasta).where(Hasta.public_id == data.public_id)
        ).first()
        if clash:
            raise HTTPException(status_code=409, detail="public_id zaten kullanılıyor")
    h = Hasta(**payload)
    session.add(h)
    session.commit()
    session.refresh(h)
    return h


def create_hasta_with_user(session: Session, data: HastaCreateWithUser) -> Hasta:
    from app.core.kps_dogrulama import kps_dogrula_gerekirse

    kps_dogrula_gerekirse(data.tc_kimlik_no)
    existing_user = session.exec(
        select(Kullanici).where(
            (Kullanici.email == data.email)
            | (Kullanici.tc_kimlik_no == data.tc_kimlik_no)
        )
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=400, detail="Bu e-posta veya TC ile kayıt zaten var"
        )
    if data.public_id is not None:
        clash = session.exec(
            select(Hasta).where(Hasta.public_id == data.public_id)
        ).first()
        if clash:
            raise HTTPException(status_code=409, detail="public_id zaten kullanılıyor")
    kullanici = Kullanici(
        tc_kimlik_no=data.tc_kimlik_no,
        ad=data.ad,
        soyad=data.soyad,
        email=data.email,
        telefon=data.telefon,
        sifre_hash=hash_password(data.sifre),
        rol=Rol.HASTA,
    )
    apply_erisim_durumu(kullanici, ErisimDurumu.ONAYLANDI)
    session.add(kullanici)
    session.flush()
    from app.core.crypto import encrypt_phi, hmac_tc, phi_encrypt_enabled

    store_tc = data.tc_kimlik_no
    store_adres = data.adres
    tc_hash = hmac_tc(data.tc_kimlik_no)
    if phi_encrypt_enabled():
        store_tc = encrypt_phi(data.tc_kimlik_no) or data.tc_kimlik_no
        store_adres = encrypt_phi(data.adres) if data.adres else None
        kullanici.tc_kimlik_no = store_tc
        kullanici.tc_kimlik_no_hash = tc_hash
        session.add(kullanici)
    h = Hasta(
        kullanici_id=kullanici.id,
        tc_kimlik_no=store_tc,
        tc_kimlik_no_hash=tc_hash,
        dogum_tarihi=data.dogum_tarihi,
        cinsiyet=data.cinsiyet,
        kan_grubu=data.kan_grubu,
        adres=store_adres,
        boy_cm=data.boy_cm,
        kilo_kg=data.kilo_kg,
        **({"public_id": data.public_id} if data.public_id is not None else {}),
    )
    session.add(h)
    session.commit()
    session.refresh(h)
    return h


def update_hasta(session: Session, public_id: UUID, data: HastaUpdate) -> Hasta:
    from app.core.crypto import encrypt_phi, phi_encrypt_enabled

    h = get_hasta_by_public_id(session, public_id)
    payload = data.model_dump(exclude_unset=True)
    if "adres" in payload and payload["adres"] is not None and phi_encrypt_enabled():
        payload["adres"] = encrypt_phi(payload["adres"])
    for k, v in payload.items():
        setattr(h, k, v)
    session.add(h)
    session.commit()
    session.refresh(h)
    return h


def update_benim_profil(
    session: Session, kullanici: Kullanici, data: HastaProfilUpdate
) -> Hasta:
    """Hasta kendi kaydını günceller (kimlik TC değiştirilemez)."""
    from app.core.crypto import encrypt_phi, phi_encrypt_enabled
    from app.core.lookups import hasta_getir

    h = hasta_getir(session, kullanici.id)
    payload = data.model_dump(exclude_unset=True)
    telefon = payload.pop("telefon", None)

    if "adres" in payload and payload["adres"] is not None and phi_encrypt_enabled():
        payload["adres"] = encrypt_phi(payload["adres"])
    for k, v in payload.items():
        setattr(h, k, v)
    session.add(h)

    if telefon is not None:
        kullanici.telefon = telefon
        session.add(kullanici)

    session.commit()
    session.refresh(h)
    return h
