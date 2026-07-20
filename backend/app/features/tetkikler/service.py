from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.lookups import doktor_getir, hasta_getir, personel_getir
from app.core.permissions import Kapsam
from app.core.scope import kullanici_kapsamli_filtre_uygula
from app.features.kullanicilar.models import Kullanici
from app.features.tetkikler.models import Tetkik
from app.features.tetkikler.schemas import TetkikCreate


def listele(
    session: Session, current_user: Kullanici, kapsam: Kapsam
) -> list[Tetkik]:
    query = select(Tetkik)

    def kendi(q):
        if current_user.rol == Rol.DOKTOR:
            doktor = doktor_getir(session, current_user.id)
            return q.where(Tetkik.istek_yapan_doktor_id == doktor.id)
        if current_user.rol == Rol.HASTA:
            hasta = hasta_getir(session, current_user.id)
            return q.where(Tetkik.hasta_id == hasta.id)
        if current_user.rol == Rol.LABORANT:
            # Laborant bekleyen istekleri ve sonuçlandırdıklarını görür
            return q
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kendi kaydı kapsamı bu rol için tanımlı değil",
        )

    query = kullanici_kapsamli_filtre_uygula(
        query, kapsam, kendi_kaydim_filtresi=kendi
    )
    return list(session.exec(query).all())


def tetkik_erisim_kontrolu(
    session: Session, tetkik: Tetkik, current_user: Kullanici
) -> None:
    if current_user.rol == Rol.ADMIN:
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
        return  # sonuç girme yetkisi ayrı endpoint'te
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Bu tetkike erişiminiz yok.",
    )


def getir(session: Session, current_user: Kullanici, tetkik_id: int) -> Tetkik:
    tetkik = session.get(Tetkik, tetkik_id)
    if tetkik is None:
        raise HTTPException(status_code=404, detail="Tetkik bulunamadı")
    tetkik_erisim_kontrolu(session, tetkik, current_user)
    return tetkik


def olustur(
    session: Session, current_user: Kullanici, veri: TetkikCreate, kapsam: Kapsam
) -> Tetkik:
    if current_user.rol == Rol.DOKTOR:
        doktor = doktor_getir(session, current_user.id)
        if veri.istek_yapan_doktor_id != doktor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sadece kendi adınıza tetkik isteyebilirsiniz.",
            )
    tetkik = Tetkik(
        hasta_id=veri.hasta_id,
        istek_yapan_doktor_id=veri.istek_yapan_doktor_id,
        tetkik_turu=veri.tetkik_turu,
        durum="ISTEK_ALINDI",
    )
    session.add(tetkik)
    session.commit()
    session.refresh(tetkik)
    return tetkik


def sonuc_gir(
    session: Session, current_user: Kullanici, tetkik_id: int, sonuc_dosyasi: str, durum: str
) -> Tetkik:
    tetkik = session.get(Tetkik, tetkik_id)
    if tetkik is None:
        raise HTTPException(status_code=404, detail="Tetkik bulunamadı")
    if current_user.rol not in (Rol.ADMIN, Rol.LABORANT):
        raise HTTPException(status_code=403, detail="Sonuç girme yetkiniz yok")
    tetkik.sonuc_dosyasi = sonuc_dosyasi
    tetkik.durum = durum
    session.add(tetkik)
    session.commit()
    session.refresh(tetkik)
    return tetkik
