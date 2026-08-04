"""Yabancı pasaport / yenidoğan geçici protokol hasta kaydı."""

from __future__ import annotations

import secrets
import uuid
from hashlib import sha256

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.security import hash_password
from app.core.enums import ErisimDurumu, HastaKimlikTipi, Rol
from app.features.personel.erisim_service import apply_erisim_durumu
from app.core.tc_kimlik import tc_ilk_dokuz_haneden
from app.features.hastalar.models import Hasta
from app.features.hastalar.schemas import OzelKimlikHastaCreate
from app.features.kullanicilar.models import Kullanici


def _sentetik_tc(kaynak: str) -> str:
    digest = sha256(kaynak.encode("utf-8")).hexdigest()
    nine = str(int(digest[:12], 16) % 900_000_000 + 100_000_000)
    return tc_ilk_dokuz_haneden(nine)


def create_ozel_kimlik_hasta(session: Session, data: OzelKimlikHastaCreate) -> Hasta:
    tip = data.kimlik_tipi
    if tip == HastaKimlikTipi.TC:
        raise HTTPException(
            status_code=400,
            detail="TC kimlikli kayıt için standart hasta kayıt akışını kullanın",
        )

    if tip == HastaKimlikTipi.YABANCI_PASAPORT:
        pasaport = (data.yabanci_kimlik_no or "").strip()
        if len(pasaport) < 5:
            raise HTTPException(
                status_code=400,
                detail="Yabancı kimlik / pasaport numarası zorunludur",
            )
        clash = session.exec(
            select(Hasta).where(Hasta.yabanci_kimlik_no == pasaport)
        ).first()
        if clash:
            raise HTTPException(status_code=409, detail="Pasaport numarası kayıtlı")
        sentetik = _sentetik_tc(f"pasaport:{pasaport}")
        kimlik_extra = {
            "kimlik_tipi": tip.value,
            "yabanci_kimlik_no": pasaport,
        }
        kaynak_anahtar = pasaport
    else:
        protokol = (data.gecici_protokol_no or "").strip()
        if len(protokol) < 3:
            raise HTTPException(
                status_code=400,
                detail="Yenidoğan geçici protokol numarası zorunludur",
            )
        if data.anne_hasta_id is None:
            raise HTTPException(status_code=400, detail="Yenidoğan için anne_hasta_id zorunlu")
        anne = session.get(Hasta, data.anne_hasta_id)
        if anne is None:
            raise HTTPException(status_code=404, detail="Anne hasta kaydı bulunamadı")
        clash = session.exec(
            select(Hasta).where(Hasta.gecici_protokol_no == protokol)
        ).first()
        if clash:
            raise HTTPException(status_code=409, detail="Geçici protokol zaten kullanılıyor")
        sentetik = _sentetik_tc(f"protokol:{protokol}")
        kimlik_extra = {
            "kimlik_tipi": tip.value,
            "gecici_protokol_no": protokol,
            "anne_hasta_id": data.anne_hasta_id,
        }
        kaynak_anahtar = protokol

    tc_kullan = sentetik
    while session.exec(
        select(Kullanici).where(Kullanici.tc_kimlik_no == tc_kullan)
    ).first():
        tc_kullan = _sentetik_tc(f"{kaynak_anahtar}:{secrets.token_hex(4)}")

    email = data.email or f"gecici+{uuid.uuid4().hex[:12]}@kayit.hbys.local"
    sifre = data.sifre or secrets.token_urlsafe(16)

    kullanici = Kullanici(
        tc_kimlik_no=tc_kullan,
        ad=data.ad,
        soyad=data.soyad,
        email=email,
        telefon=data.telefon,
        sifre_hash=hash_password(sifre),
        rol=Rol.HASTA,
    )
    apply_erisim_durumu(kullanici, ErisimDurumu.ONAYLANDI)
    session.add(kullanici)
    session.flush()

    h = Hasta(
        kullanici_id=kullanici.id,
        tc_kimlik_no=tc_kullan,
        dogum_tarihi=data.dogum_tarihi,
        cinsiyet=data.cinsiyet,
        kan_grubu=data.kan_grubu,
        adres=data.adres,
        **kimlik_extra,
    )
    session.add(h)
    session.commit()
    session.refresh(h)
    return h
