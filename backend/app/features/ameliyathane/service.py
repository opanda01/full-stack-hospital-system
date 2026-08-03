"""Ameliyathane yönetimi servis katmanı."""

from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.base_model import utc_now
from app.core.batch_load import batch_by_ids
from app.core.enums import (
    AmeliyathaneDurumu,
    AmeliyatEkipRolu,
    AmeliyatPlaniDurumu,
    AnesteziTipi,
)
from app.core.lookups import doktor_getir
from app.core.pagination import Page, make_page, paginate
from app.core.permissions import Kapsam
from app.core.public_id import hasta_pk_from_public_id, hasta_public_id_from_pk
from app.features.ameliyathane.models import (
    Ameliyathane,
    AmeliyatEkibi,
    AmeliyatPlani,
    AnesteziKaydi,
)
from app.features.ameliyathane.schemas import (
    AmeliyathaneGuncelle,
    AmeliyathaneOku,
    AmeliyathaneTakvim,
    AmeliyathaneTakvimOgesi,
    AmeliyatEkipUyeOku,
    AmeliyatIptal,
    AmeliyatPlaniGuncelle,
    AmeliyatPlaniOku,
    AmeliyatPlaniOlustur,
    AnesteziKaydiOlustur,
    AnesteziKaydiOku,
    PostOpYatakOnerisi,
)
from app.features.epikriz import service as epikriz_service
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.temizlik_gorevleri.service import otomatik_oda_temizlik_gorevi
from app.features.yatak_yonetimi import service as yatak_service
from app.features.yatak_yonetimi.schemas import YatakOku

_CAKISMA_DURUMLARI = (
    AmeliyatPlaniDurumu.PLANLANDI,
    AmeliyatPlaniDurumu.HAZIRLIK,
    AmeliyatPlaniDurumu.DEVAM_EDIYOR,
)


def _enum_val(v) -> str:
    return v.value if hasattr(v, "value") else str(v)


def _plan_bitis(plan: AmeliyatPlani) -> datetime:
    bas = plan.planlanan_baslangic
    if bas.tzinfo is None:
        bas = bas.replace(tzinfo=timezone.utc)
    return bas + timedelta(minutes=plan.planlanan_sure_dk)


def _araliklar_cakisiyor(a_bas: datetime, a_bit: datetime, b_bas: datetime, b_bit: datetime) -> bool:
    for t in (a_bas, a_bit, b_bas, b_bit):
        if t.tzinfo is None:
            raise ValueError("timezone-aware datetime gerekli")
    return a_bas < b_bit and b_bas < a_bit


def _personel_id(session: Session, user: Kullanici) -> int | None:
    p = session.exec(
        select(Personel).where(Personel.kullanici_id == user.id)
    ).first()
    return p.id if p else None


def _ekip_yukle(session: Session, plan_id: int) -> list[AmeliyatEkibi]:
    return list(
        session.exec(
            select(AmeliyatEkibi).where(AmeliyatEkibi.ameliyat_plani_id == plan_id)
        ).all()
    )


def _plan_oku(session: Session, plan: AmeliyatPlani) -> AmeliyatPlaniOku:
    ekip = _ekip_yukle(session, plan.id)
    return AmeliyatPlaniOku(
        id=plan.id,
        hasta_id=hasta_public_id_from_pk(session, plan.hasta_id),
        ameliyathane_id=plan.ameliyathane_id,
        sorumlu_cerrah_id=plan.sorumlu_cerrah_id,
        planlanan_baslangic=plan.planlanan_baslangic,
        planlanan_sure_dk=plan.planlanan_sure_dk,
        gercek_baslangic=plan.gercek_baslangic,
        gercek_bitis=plan.gercek_bitis,
        durum=_enum_val(plan.durum),
        ameliyat_adi=plan.ameliyat_adi,
        iptal_gerekcesi=plan.iptal_gerekcesi,
        ekip=[
            AmeliyatEkipUyeOku(
                id=e.id, personel_id=e.personel_id, rol=_enum_val(e.rol)
            )
            for e in ekip
        ],
    )


def _cerrah_personel_ids(plan: AmeliyatPlani, ekip: list[AmeliyatEkibi]) -> set[int]:
    ids = {plan.sorumlu_cerrah_id}
    for e in ekip:
        rol = _enum_val(e.rol)
        if rol in (AmeliyatEkipRolu.CERRAH.value, AmeliyatEkipRolu.ASISTAN.value):
            ids.add(e.personel_id)
    return ids


def _cakisma_kontrol(
    session: Session,
    *,
    ameliyathane_id: int,
    baslangic: datetime,
    sure_dk: int,
    cerrah_ids: set[int],
    haric_plan_id: int | None = None,
) -> None:
    if baslangic.tzinfo is None:
        baslangic = baslangic.replace(tzinfo=timezone.utc)
    bitis = baslangic + timedelta(minutes=sure_dk)

    durum_vals = [_enum_val(d) for d in _CAKISMA_DURUMLARI]
    q = select(AmeliyatPlani).where(AmeliyatPlani.durum.in_(durum_vals))  # type: ignore[attr-defined]
    if haric_plan_id is not None:
        q = q.where(AmeliyatPlani.id != haric_plan_id)
    adaylar = session.exec(q).all()

    plan_ids = [p.id for p in adaylar]
    ekip_map: dict[int, list[AmeliyatEkibi]] = {}
    if plan_ids:
        ekip_rows = session.exec(
            select(AmeliyatEkibi).where(
                AmeliyatEkibi.ameliyat_plani_id.in_(plan_ids)  # type: ignore[attr-defined]
            )
        ).all()
        for e in ekip_rows:
            ekip_map.setdefault(e.ameliyat_plani_id, []).append(e)

    for p in adaylar:
        p_bit = _plan_bitis(p)
        p_bas = p.planlanan_baslangic
        if p_bas.tzinfo is None:
            p_bas = p_bas.replace(tzinfo=timezone.utc)
        if not _araliklar_cakisiyor(baslangic, bitis, p_bas, p_bit):
            continue
        if p.ameliyathane_id == ameliyathane_id:
            raise HTTPException(
                status_code=409,
                detail="Bu ameliyathane seçilen saatte başka ameliyat için rezerve",
            )
        mevcut_cerrah = _cerrah_personel_ids(p, ekip_map.get(p.id, []))
        if cerrah_ids & mevcut_cerrah:
            raise HTTPException(
                status_code=409,
                detail="Sorumlu cerrah veya asistan aynı saatte başka ameliyatta",
            )


def _kapsam_plan_filtre(
    session: Session,
    q,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
):
    if kapsam == Kapsam.GLOBAL:
        return q
    if kapsam == Kapsam.KENDI_KAYDIM:
        pid = _personel_id(session, current_user)
        if pid is None:
            return q.where(AmeliyatPlani.id == -1)
        return q.where(AmeliyatPlani.sorumlu_cerrah_id == pid)
    if kapsam == Kapsam.DEPARTMANIM:
        pid = _personel_id(session, current_user)
        if pid is None:
            return q.where(AmeliyatPlani.id == -1)
        p = session.get(Personel, pid)
        if p is None or p.departman_id is None:
            return q.where(AmeliyatPlani.id == -1)
        cerrah_ids = session.exec(
            select(Personel.id).where(Personel.departman_id == p.departman_id)
        ).all()
        if not cerrah_ids:
            return q.where(AmeliyatPlani.id == -1)
        return q.where(AmeliyatPlani.sorumlu_cerrah_id.in_(cerrah_ids))  # type: ignore[attr-defined]
    return q.where(AmeliyatPlani.id == -1)


def _plan_erisim(
    session: Session,
    plan_id: int,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> AmeliyatPlani:
    plan = session.get(AmeliyatPlani, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Ameliyat planı bulunamadı")
    q = select(AmeliyatPlani).where(AmeliyatPlani.id == plan_id)
    q = _kapsam_plan_filtre(session, q, kapsam=kapsam, current_user=current_user)
    if session.exec(q).first() is None:
        raise HTTPException(status_code=403, detail="Bu ameliyat planına erişim yok")
    return plan


def list_ameliyathaneler(session: Session) -> list[AmeliyathaneOku]:
    rows = session.exec(select(Ameliyathane).order_by(Ameliyathane.ad)).all()
    return [
        AmeliyathaneOku(
            id=r.id,
            ad=r.ad,
            oda_no=r.oda_no,
            durum=_enum_val(r.durum),
        )
        for r in rows
    ]


def guncelle_ameliyathane(
    session: Session, ameliyathane_id: int, body: AmeliyathaneGuncelle
) -> AmeliyathaneOku:
    row = session.get(Ameliyathane, ameliyathane_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Ameliyathane bulunamadı")
    data = body.model_dump(exclude_unset=True)
    if "durum" in data and data["durum"] is not None:
        data["durum"] = AmeliyathaneDurumu(data["durum"])
    for k, v in data.items():
        setattr(row, k, v)
    session.add(row)
    session.commit()
    session.refresh(row)
    return AmeliyathaneOku(
        id=row.id,
        ad=row.ad,
        oda_no=row.oda_no,
        durum=_enum_val(row.durum),
    )


def list_ameliyat_planlari(
    session: Session,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
    page: int = 1,
    page_size: int = 50,
) -> Page[AmeliyatPlaniOku]:
    q = select(AmeliyatPlani).order_by(AmeliyatPlani.planlanan_baslangic.desc())
    q = _kapsam_plan_filtre(session, q, kapsam=kapsam, current_user=current_user)
    rows, total = paginate(session, q, page=page, page_size=page_size)
    return make_page(
        [_plan_oku(session, r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


def get_ameliyat_plani(
    session: Session,
    plan_id: int,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> AmeliyatPlaniOku:
    plan = _plan_erisim(session, plan_id, kapsam=kapsam, current_user=current_user)
    return _plan_oku(session, plan)


def ameliyat_planla(
    session: Session,
    body: AmeliyatPlaniOlustur,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> AmeliyatPlaniOku:
    if kapsam == Kapsam.KENDI_KAYDIM:
        pid = _personel_id(session, current_user)
        if pid is None or pid != body.sorumlu_cerrah_id:
            raise HTTPException(
                status_code=403,
                detail="Yalnızca kendi cerrahlığınızdaki ameliyatları planlayabilirsiniz",
            )

    ameliyathane = session.get(Ameliyathane, body.ameliyathane_id)
    if ameliyathane is None:
        raise HTTPException(status_code=404, detail="Ameliyathane bulunamadı")
    if _enum_val(ameliyathane.durum) == AmeliyathaneDurumu.ARIZALI.value:
        raise HTTPException(status_code=400, detail="Ameliyathane arızalı")

    hasta_pk = hasta_pk_from_public_id(session, body.hasta_id)
    cerrah_ids = {body.sorumlu_cerrah_id}
    for uye in body.ekip:
        rol = uye.rol
        if rol in (AmeliyatEkipRolu.CERRAH.value, AmeliyatEkipRolu.ASISTAN.value):
            cerrah_ids.add(uye.personel_id)

    _cakisma_kontrol(
        session,
        ameliyathane_id=body.ameliyathane_id,
        baslangic=body.planlanan_baslangic,
        sure_dk=body.planlanan_sure_dk,
        cerrah_ids=cerrah_ids,
    )

    plan = AmeliyatPlani(
        hasta_id=hasta_pk,
        ameliyathane_id=body.ameliyathane_id,
        sorumlu_cerrah_id=body.sorumlu_cerrah_id,
        planlanan_baslangic=body.planlanan_baslangic,
        planlanan_sure_dk=body.planlanan_sure_dk,
        ameliyat_adi=body.ameliyat_adi,
        durum=AmeliyatPlaniDurumu.PLANLANDI,
    )
    session.add(plan)
    session.flush()
    for uye in body.ekip:
        session.add(
            AmeliyatEkibi(
                ameliyat_plani_id=plan.id,
                personel_id=uye.personel_id,
                rol=AmeliyatEkipRolu(uye.rol),
            )
        )
    session.commit()
    session.refresh(plan)
    return _plan_oku(session, plan)


def guncelle_ameliyat_plani(
    session: Session,
    plan_id: int,
    body: AmeliyatPlaniGuncelle,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> AmeliyatPlaniOku:
    plan = _plan_erisim(session, plan_id, kapsam=kapsam, current_user=current_user)
    if _enum_val(plan.durum) in (
        AmeliyatPlaniDurumu.TAMAMLANDI.value,
        AmeliyatPlaniDurumu.IPTAL.value,
    ):
        raise HTTPException(status_code=400, detail="Bu plan güncellenemez")

    data = body.model_dump(exclude_unset=True)
    ameliyathane_id = data.get("ameliyathane_id", plan.ameliyathane_id)
    baslangic = data.get("planlanan_baslangic", plan.planlanan_baslangic)
    sure = data.get("planlanan_sure_dk", plan.planlanan_sure_dk)
    if any(k in data for k in ("ameliyathane_id", "planlanan_baslangic", "planlanan_sure_dk")):
        ekip = _ekip_yukle(session, plan.id)
        cerrah_ids = _cerrah_personel_ids(plan, ekip)
        _cakisma_kontrol(
            session,
            ameliyathane_id=ameliyathane_id,
            baslangic=baslangic,
            sure_dk=sure,
            cerrah_ids=cerrah_ids,
            haric_plan_id=plan.id,
        )
    if "durum" in data and data["durum"] is not None:
        data["durum"] = AmeliyatPlaniDurumu(data["durum"])
    for k, v in data.items():
        setattr(plan, k, v)
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return _plan_oku(session, plan)


def ameliyat_iptal(
    session: Session,
    plan_id: int,
    body: AmeliyatIptal,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> AmeliyatPlaniOku:
    plan = _plan_erisim(session, plan_id, kapsam=kapsam, current_user=current_user)
    d = _enum_val(plan.durum)
    if d in (AmeliyatPlaniDurumu.TAMAMLANDI.value, AmeliyatPlaniDurumu.IPTAL.value):
        raise HTTPException(status_code=400, detail="Ameliyat iptal edilemez")
    plan.durum = AmeliyatPlaniDurumu.IPTAL
    plan.iptal_gerekcesi = body.gerekce
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return _plan_oku(session, plan)


def ameliyat_baslat(
    session: Session,
    plan_id: int,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> AmeliyatPlaniOku:
    plan = _plan_erisim(session, plan_id, kapsam=kapsam, current_user=current_user)
    d = _enum_val(plan.durum)
    if d not in (
        AmeliyatPlaniDurumu.PLANLANDI.value,
        AmeliyatPlaniDurumu.HAZIRLIK.value,
    ):
        raise HTTPException(status_code=400, detail="Ameliyat başlatılamaz")

    ameliyathane = session.get(Ameliyathane, plan.ameliyathane_id)
    if ameliyathane is None:
        raise HTTPException(status_code=404, detail="Ameliyathane bulunamadı")

    now = utc_now()
    plan.durum = AmeliyatPlaniDurumu.DEVAM_EDIYOR
    plan.gercek_baslangic = now
    ameliyathane.durum = AmeliyathaneDurumu.KULLANIMDA
    session.add(plan)
    session.add(ameliyathane)
    session.commit()
    session.refresh(plan)
    return _plan_oku(session, plan)


def ameliyat_tamamla(
    session: Session,
    plan_id: int,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> AmeliyatPlaniOku:
    plan = _plan_erisim(session, plan_id, kapsam=kapsam, current_user=current_user)
    if _enum_val(plan.durum) != AmeliyatPlaniDurumu.DEVAM_EDIYOR.value:
        raise HTTPException(status_code=400, detail="Yalnızca devam eden ameliyat tamamlanır")

    ameliyathane = session.get(Ameliyathane, plan.ameliyathane_id)
    if ameliyathane is None:
        raise HTTPException(status_code=404, detail="Ameliyathane bulunamadı")

    now = utc_now()
    plan.durum = AmeliyatPlaniDurumu.TAMAMLANDI
    plan.gercek_bitis = now
    ameliyathane.durum = AmeliyathaneDurumu.TEMIZLIK
    session.add(plan)
    session.add(ameliyathane)

    otomatik_oda_temizlik_gorevi(
        session, f"Ameliyathane {ameliyathane.ad}", ameliyathane.oda_no
    )

    cerrah_personel = session.get(Personel, plan.sorumlu_cerrah_id)
    yazar_id = current_user.id
    if cerrah_personel is not None:
        yazar_id = cerrah_personel.kullanici_id
    epikriz_service.olustur_taslak_epikriz_ameliyat_sonrasi(
        session,
        hasta_id=plan.hasta_id,
        ameliyat_adi=plan.ameliyat_adi,
        yazar_id=yazar_id,
    )

    session.commit()
    session.refresh(plan)
    return _plan_oku(session, plan)


def kaydet_anestezi(
    session: Session,
    plan_id: int,
    body: AnesteziKaydiOlustur,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> AnesteziKaydiOku:
    _plan_erisim(session, plan_id, kapsam=kapsam, current_user=current_user)
    mevcut = session.exec(
        select(AnesteziKaydi).where(AnesteziKaydi.ameliyat_plani_id == plan_id)
    ).first()
    if mevcut is not None:
        mevcut.anestezi_tipi = AnesteziTipi(body.anestezi_tipi)
        mevcut.asa_skoru = body.asa_skoru
        mevcut.anestezist_id = body.anestezist_id
        mevcut.notlar = body.notlar
        session.add(mevcut)
        session.commit()
        session.refresh(mevcut)
        row = mevcut
    else:
        row = AnesteziKaydi(
            ameliyat_plani_id=plan_id,
            anestezi_tipi=AnesteziTipi(body.anestezi_tipi),
            asa_skoru=body.asa_skoru,
            anestezist_id=body.anestezist_id,
            notlar=body.notlar,
        )
        session.add(row)
        session.commit()
        session.refresh(row)
    return AnesteziKaydiOku(
        id=row.id,
        ameliyat_plani_id=row.ameliyat_plani_id,
        anestezi_tipi=_enum_val(row.anestezi_tipi),
        asa_skoru=row.asa_skoru,
        anestezist_id=row.anestezist_id,
        notlar=row.notlar,
    )


def ameliyathane_takvim(
    session: Session,
    ameliyathane_id: int,
    gun: date,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> AmeliyathaneTakvim:
    ameliyathane = session.get(Ameliyathane, ameliyathane_id)
    if ameliyathane is None:
        raise HTTPException(status_code=404, detail="Ameliyathane bulunamadı")

    gun_bas = datetime.combine(gun, datetime.min.time(), tzinfo=timezone.utc)
    gun_bit = gun_bas + timedelta(days=1)

    q = (
        select(AmeliyatPlani)
        .where(AmeliyatPlani.ameliyathane_id == ameliyathane_id)
        .where(AmeliyatPlani.planlanan_baslangic >= gun_bas)
        .where(AmeliyatPlani.planlanan_baslangic < gun_bit)
        .where(AmeliyatPlani.durum != AmeliyatPlaniDurumu.IPTAL)
        .order_by(AmeliyatPlani.planlanan_baslangic)
    )
    q = _kapsam_plan_filtre(session, q, kapsam=kapsam, current_user=current_user)
    rows = session.exec(q).all()
    ogeler = [
        AmeliyathaneTakvimOgesi(
            ameliyat_plani_id=r.id,
            ameliyat_adi=r.ameliyat_adi,
            hasta_id=hasta_public_id_from_pk(session, r.hasta_id),
            planlanan_baslangic=r.planlanan_baslangic,
            planlanan_sure_dk=r.planlanan_sure_dk,
            durum=_enum_val(r.durum),
            sorumlu_cerrah_id=r.sorumlu_cerrah_id,
        )
        for r in rows
    ]
    return AmeliyathaneTakvim(
        ameliyathane_id=ameliyathane_id, gun=gun, ogeler=ogeler
    )


def post_op_yatak_onerisi(
    session: Session,
    ameliyat_plani_id: int,
    *,
    kapsam: Kapsam,
    current_user: Kullanici,
) -> PostOpYatakOnerisi:
    _plan_erisim(
        session, ameliyat_plani_id, kapsam=kapsam, current_user=current_user
    )
    yataklar: list[YatakOku] = yatak_service.bos_yatak_oner(session)
    return PostOpYatakOnerisi(
        ameliyat_plani_id=ameliyat_plani_id,
        onerilen_yataklar=[y.model_dump() for y in yataklar],
    )
