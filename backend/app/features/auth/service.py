"""Auth servis: personel login, OTP, şifre/KVKK, token yönetimi."""

from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.base_model import utc_now
from app.core.config import get_settings
from app.core.enums import OtpAmac, OturumTipi, Rol
from app.core.notifications import get_bildirim
from app.core.permissions import rol_izin_kodlari
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.features.auth.models import OtpKodu, RefreshToken
from app.features.auth.schemas import OtpGonderResponse, TokenResponse
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel

settings = get_settings()


def _rol_value(kullanici: Kullanici) -> Rol:
    return kullanici.rol if isinstance(kullanici.rol, Rol) else Rol(kullanici.rol)


def _issue_tokens(
    session: Session,
    kullanici: Kullanici,
    *,
    oturum_tipi: OturumTipi,
) -> TokenResponse:
    rol = _rol_value(kullanici)
    izin_rol = Rol.HASTA if oturum_tipi == OturumTipi.HASTA else rol
    access = create_access_token(
        kullanici.id, rol, oturum_tipi=oturum_tipi
    )
    raw_refresh = create_refresh_token()
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    session.add(
        RefreshToken(
            kullanici_id=kullanici.id,
            token_hash=hash_token(raw_refresh),
            olusturma_tarihi=now,
            son_kullanma_tarihi=expires,
            iptal_edildi_mi=False,
            oturum_tipi=oturum_tipi.value,
        )
    )
    session.commit()
    return TokenResponse(
        access_token=access,
        refresh_token=raw_refresh,
        rol=izin_rol if oturum_tipi == OturumTipi.HASTA else rol,
        permissions=rol_izin_kodlari(izin_rol),
        oturum_tipi=oturum_tipi,
        sifre_degistirmeli_mi=bool(kullanici.sifre_degistirmeli_mi),
        kvkk_onaylandi_mi=bool(kullanici.kvkk_onaylandi_mi),
    )


def _resolve_kullanici_by_kimlik(session: Session, kimlik: str) -> Kullanici | None:
    personel = session.exec(
        select(Personel).where(Personel.sicil_no == kimlik)
    ).first()
    if personel is not None:
        return session.get(Kullanici, personel.kullanici_id)

    kullanici = session.exec(
        select(Kullanici).where(Kullanici.kullanici_adi == kimlik)
    ).first()
    if kullanici is not None:
        return kullanici

    return session.exec(select(Kullanici).where(Kullanici.email == kimlik)).first()


def login(
    session: Session,
    *,
    sifre: str,
    kimlik: str | None = None,
    email: str | None = None,
    ip_adresi: str | None = None,
) -> TokenResponse:
    identifier = (kimlik or email or "").strip()
    kullanici = _resolve_kullanici_by_kimlik(session, identifier) if identifier else None

    if kullanici is None or not verify_password(sifre, kullanici.sifre_hash):
        denetim_kaydi_yaz(
            session,
            aksiyon="LOGIN_BASARISIZ",
            kaynak="auth",
            ip_adresi=ip_adresi,
            detay={"kimlik": identifier},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kimlik veya şifre hatalı",
        )

    if not kullanici.aktif_mi:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız pasif durumda",
        )

    rol = _rol_value(kullanici)
    personel = session.exec(
        select(Personel).where(Personel.kullanici_id == kullanici.id)
    ).first()

    # Salt hasta hesapları personel (şifre) login kullanamaz
    if rol == Rol.HASTA and personel is None:
        denetim_kaydi_yaz(
            session,
            aksiyon="LOGIN_BASARISIZ",
            actor_id=kullanici.id,
            kaynak="auth",
            ip_adresi=ip_adresi,
            detay={"neden": "hasta_sifre_login"},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hasta girişi için OTP akışını kullanın (/auth/otp/gonder).",
        )

    denetim_kaydi_yaz(
        session,
        aksiyon="LOGIN_BASARILI",
        actor_id=kullanici.id,
        kaynak="auth",
        ip_adresi=ip_adresi,
        detay={"oturum_tipi": OturumTipi.PERSONEL.value},
        commit=False,
    )
    return _issue_tokens(session, kullanici, oturum_tipi=OturumTipi.PERSONEL)


def refresh(session: Session, refresh_token: str) -> TokenResponse:
    token_row = session.exec(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_token(refresh_token)
        )
    ).first()
    if token_row is None or token_row.iptal_edildi_mi:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya iptal edilmiş refresh token",
        )

    now = datetime.now(timezone.utc)
    expires = token_row.son_kullanma_tarihi
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        token_row.iptal_edildi_mi = True
        session.add(token_row)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token süresi dolmuş",
        )

    kullanici = session.get(Kullanici, token_row.kullanici_id)
    if kullanici is None or not kullanici.aktif_mi:
        token_row.iptal_edildi_mi = True
        session.add(token_row)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı veya pasif",
        )

    # Rotate: eskiyi iptal et, aynı oturum tipi ile yenile
    try:
        oturum = OturumTipi(token_row.oturum_tipi)
    except ValueError:
        oturum = OturumTipi.PERSONEL

    token_row.iptal_edildi_mi = True
    session.add(token_row)
    session.flush()
    return _issue_tokens(session, kullanici, oturum_tipi=oturum)


def logout(session: Session, refresh_token: str) -> None:
    token_row = session.exec(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_token(refresh_token)
        )
    ).first()
    if token_row is None:
        return
    token_row.iptal_edildi_mi = True
    session.add(token_row)
    session.commit()


def sifre_degistir(
    session: Session,
    kullanici: Kullanici,
    eski_sifre: str,
    yeni_sifre: str,
    *,
    ip_adresi: str | None = None,
) -> None:
    if not verify_password(eski_sifre, kullanici.sifre_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eski şifre hatalı",
        )
    kullanici.sifre_hash = hash_password(yeni_sifre)
    kullanici.sifre_degistirmeli_mi = False
    session.add(kullanici)

    tokens = session.exec(
        select(RefreshToken).where(
            RefreshToken.kullanici_id == kullanici.id,
            RefreshToken.iptal_edildi_mi == False,  # noqa: E712
        )
    ).all()
    for row in tokens:
        row.iptal_edildi_mi = True
        session.add(row)

    denetim_kaydi_yaz(
        session,
        aksiyon="SIFRE_DEGISTIR",
        actor_id=kullanici.id,
        kaynak="auth",
        ip_adresi=ip_adresi,
        commit=False,
    )
    session.commit()


def kvkk_onayla(
    session: Session,
    kullanici: Kullanici,
    *,
    onay: bool,
    ip_adresi: str | None = None,
) -> Kullanici:
    if not onay:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="KVKK onayı zorunludur",
        )
    kullanici.kvkk_onaylandi_mi = True
    kullanici.kvkk_onay_tarihi = utc_now()
    session.add(kullanici)
    denetim_kaydi_yaz(
        session,
        aksiyon="KVKK_ONAY",
        actor_id=kullanici.id,
        kaynak="auth",
        ip_adresi=ip_adresi,
        commit=False,
    )
    session.commit()
    session.refresh(kullanici)
    return kullanici


def _otp_rate_limit_check(session: Session, telefon: str) -> None:
    now = datetime.now(timezone.utc)
    dakika_once = now - timedelta(minutes=settings.OTP_RATE_LIMIT_DAKIKA)
    gun_once = now - timedelta(days=1)

    son_dakika = session.exec(
        select(OtpKodu).where(
            OtpKodu.telefon == telefon,
            OtpKodu.created_at >= dakika_once,
        )
    ).all()
    if len(son_dakika) >= 1:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Aynı numaraya dakikada en fazla 1 kod gönderilebilir",
        )

    son_gun = session.exec(
        select(OtpKodu).where(
            OtpKodu.telefon == telefon,
            OtpKodu.created_at >= gun_once,
        )
    ).all()
    if len(son_gun) >= settings.OTP_GUNLUK_MAX:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Aynı numaraya günde en fazla 5 kod gönderilebilir",
        )


def otp_gonder(
    session: Session,
    *,
    telefon: str,
    tc_kimlik_no: str,
    amac: OtpAmac,
    ip_adresi: str | None = None,
) -> OtpGonderResponse:
    _otp_rate_limit_check(session, telefon)

    if amac == OtpAmac.GIRIS:
        kullanici = session.exec(
            select(Kullanici).where(Kullanici.tc_kimlik_no == tc_kimlik_no)
        ).first()
        if kullanici is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bu TC ile kayıtlı kullanıcı bulunamadı",
            )
        hasta = session.exec(
            select(Hasta).where(Hasta.kullanici_id == kullanici.id)
        ).first()
        if hasta is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hasta profili yok; önce kayıt (OTP KAYIT) yapın",
            )
        if kullanici.telefon and kullanici.telefon != telefon:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Telefon numarası kayıtlı bilgilere uymuyor",
            )

    kod = "".join(secrets.choice(string.digits) for _ in range(6))
    now = datetime.now(timezone.utc)
    son_kullanma = now + timedelta(seconds=settings.OTP_TTL_SECONDS)
    session.add(
        OtpKodu(
            telefon=telefon,
            tc_kimlik_no=tc_kimlik_no,
            kod_hash=hash_token(kod),
            amac=amac,
            deneme_sayisi=0,
            son_kullanma=son_kullanma,
            kullanildi_mi=False,
            created_at=now,
        )
    )
    denetim_kaydi_yaz(
        session,
        aksiyon="OTP_GONDER",
        kaynak="auth",
        ip_adresi=ip_adresi,
        detay={"telefon": telefon, "amac": amac.value},
        commit=False,
    )
    session.commit()

    get_bildirim().sms_gonder(
        telefon, f"Doğrulama kodunuz: {kod}. {settings.OTP_TTL_SECONDS // 60} dk geçerlidir."
    )
    return OtpGonderResponse(son_kullanma_saniye=settings.OTP_TTL_SECONDS)


def otp_dogrula(
    session: Session,
    *,
    telefon: str,
    tc_kimlik_no: str,
    kod: str,
    amac: OtpAmac,
    ad: str | None = None,
    soyad: str | None = None,
    kvkk_onay: bool | None = None,
    ip_adresi: str | None = None,
) -> TokenResponse:
    now = datetime.now(timezone.utc)
    otps = list(
        session.exec(
            select(OtpKodu).where(
                OtpKodu.telefon == telefon,
                OtpKodu.tc_kimlik_no == tc_kimlik_no,
                OtpKodu.amac == amac,
                OtpKodu.kullanildi_mi == False,  # noqa: E712
            )
        ).all()
    )
    otp = max(otps, key=lambda o: o.id or 0) if otps else None

    if otp is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçerli OTP bulunamadı",
        )

    son = otp.son_kullanma
    if son.tzinfo is None:
        son = son.replace(tzinfo=timezone.utc)
    if son < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP süresi dolmuş",
        )

    if otp.deneme_sayisi >= settings.OTP_MAX_DENEME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP deneme limiti aşıldı",
        )

    if hash_token(kod) != otp.kod_hash:
        otp.deneme_sayisi += 1
        session.add(otp)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP kodu hatalı",
        )

    otp.kullanildi_mi = True
    session.add(otp)

    kullanici = session.exec(
        select(Kullanici).where(Kullanici.tc_kimlik_no == tc_kimlik_no)
    ).first()

    if amac == OtpAmac.KAYIT:
        if kvkk_onay is not True:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kayıt için KVKK onayı zorunludur",
            )
        if kullanici is None:
            if not ad or not soyad:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Yeni kayıt için ad ve soyad zorunludur",
                )
            kullanici = Kullanici(
                tc_kimlik_no=tc_kimlik_no,
                ad=ad,
                soyad=soyad,
                email=None,
                telefon=telefon,
                sifre_hash=None,
                rol=Rol.HASTA,
                aktif_mi=True,
                sifre_degistirmeli_mi=False,
                kvkk_onaylandi_mi=True,
                kvkk_onay_tarihi=utc_now(),
            )
            session.add(kullanici)
            session.flush()
        else:
            # Mevcut personel: rol demote edilmez; Hasta profili eklenir
            if not kullanici.telefon:
                kullanici.telefon = telefon
            kullanici.kvkk_onaylandi_mi = True
            kullanici.kvkk_onay_tarihi = utc_now()
            session.add(kullanici)

        hasta = session.exec(
            select(Hasta).where(Hasta.kullanici_id == kullanici.id)
        ).first()
        if hasta is None:
            session.add(
                Hasta(
                    kullanici_id=kullanici.id,
                    tc_kimlik_no=tc_kimlik_no,
                )
            )
    else:
        # GIRIS
        if kullanici is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcı bulunamadı",
            )
        hasta = session.exec(
            select(Hasta).where(Hasta.kullanici_id == kullanici.id)
        ).first()
        if hasta is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hasta profili bulunamadı",
            )

    denetim_kaydi_yaz(
        session,
        aksiyon="OTP_DOGRULA",
        actor_id=kullanici.id if kullanici else None,
        kaynak="auth",
        ip_adresi=ip_adresi,
        detay={"amac": amac.value},
        commit=False,
    )
    session.flush()
    assert kullanici is not None
    return _issue_tokens(session, kullanici, oturum_tipi=OturumTipi.HASTA)


def gecici_sifre_uret(uzunluk: int | None = None) -> str:
    n = uzunluk or settings.TEMP_SIFRE_UZUNLUK
    alfabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alfabet) for _ in range(n))
