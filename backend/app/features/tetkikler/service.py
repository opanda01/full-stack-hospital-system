from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.lookups import doktor_getir, hasta_getir
from app.core.permissions import Kapsam
from app.core.public_id import get_by_public_id, hasta_from_public_id, hasta_pk_from_public_id
from app.core.scope import kullanici_kapsamli_filtre_uygula
from app.features.hastalar import service as hasta_service
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.tetkikler.models import Tetkik
from app.features.tetkikler.schemas import TetkikCreate, TetkikRead


def _to_read(session: Session, t: Tetkik) -> TetkikRead:
    hasta = session.get(Hasta, t.hasta_id)
    if hasta is None:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")
    return TetkikRead(
        id=t.public_id,
        hasta_id=hasta.public_id,
        istek_yapan_doktor_id=t.istek_yapan_doktor_id,
        tetkik_turu=t.tetkik_turu,
        sonuc_dosyasi=t.sonuc_dosyasi,
        durum=t.durum,
    )


def listele(
    session: Session,
    current_user: Kullanici,
    kapsam: Kapsam,
    *,
    hasta_public_id: UUID | None = None,
) -> list[TetkikRead]:
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
    rows = list(session.exec(query).all())
    return [_to_read(session, t) for t in rows]


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


def sonuc_gir(
    session: Session,
    current_user: Kullanici,
    public_id: UUID,
    sonuc_dosyasi: str,
    durum: str,
) -> TetkikRead:
    tetkik = get_by_public_id(session, Tetkik, public_id)
    if current_user.rol not in (Rol.ADMIN, Rol.LABORANT):
        raise HTTPException(status_code=403, detail="Sonuç girme yetkiniz yok")
    tetkik.sonuc_dosyasi = sonuc_dosyasi
    tetkik.durum = durum
    session.add(tetkik)
    session.commit()
    session.refresh(tetkik)
    return _to_read(session, tetkik)
