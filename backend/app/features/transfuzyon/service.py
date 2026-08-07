"""Kan grubu uyumluluk — basit ABO/Rh kuralları."""

from fastapi import HTTPException
from sqlmodel import Session

from app.core.base_model import utc_now
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.transfuzyon.models import TransfuzyonKaydi
from app.features.transfuzyon.schemas import TransfuzyonCreate, TransfuzyonRead
from app.features.yatis.models import YatisKaydi

_UYUMLU: dict[str, set[str]] = {
    "0RH+": {"0RH+", "0RH-"},
    "0RH-": {"0RH-"},
    "ARH+": {"0RH+", "0RH-", "ARH+", "ARH-"},
    "ARH-": {"0RH-", "ARH-"},
    "BRH+": {"0RH+", "0RH-", "BRH+", "BRH-"},
    "BRH-": {"0RH-", "BRH-"},
    "ABRH+": {"0RH+", "0RH-", "ARH+", "ARH-", "BRH+", "BRH-", "ABRH+", "ABRH-"},
    "ABRH-": {"0RH-", "ARH-", "BRH-", "ABRH-"},
}


def _norm(g: str) -> str:
    return g.strip().upper().replace(" ", "")


def kan_uyumlu(hasta: str, verilen: str) -> bool:
    h = _norm(hasta)
    v = _norm(verilen)
    return v in _UYUMLU.get(h, set())


def kayit_olustur(
    session: Session,
    *,
    actor: Kullanici,
    body: TransfuzyonCreate,
) -> TransfuzyonRead:
    yatis = session.get(YatisKaydi, body.yatis_id)
    if yatis is None:
        raise HTTPException(status_code=404, detail="Yatış kaydı bulunamadı")
    hasta = session.get(Hasta, yatis.hasta_id)
    if hasta is None or not hasta.kan_grubu:
        raise HTTPException(status_code=400, detail="Hasta kan grubu tanımlı değil")
    if body.ikinci_imza_kullanici_id is None:
        raise HTTPException(status_code=400, detail="Çift imza zorunlu (ikinci onaylayan)")
    if body.ikinci_imza_kullanici_id == actor.id:
        raise HTTPException(status_code=400, detail="İkinci imza farklı personel olmalı")

    uyumlu = kan_uyumlu(hasta.kan_grubu, body.verilen_kan_grubu)
    if not uyumlu:
        raise HTTPException(
            status_code=400,
            detail="Kan grubu uyumsuz — transfüzyon kaydı oluşturulamaz",
        )

    row = TransfuzyonKaydi(
        yatis_id=body.yatis_id,
        hasta_id=yatis.hasta_id,
        verilen_kan_grubu=_norm(body.verilen_kan_grubu),
        hasta_kan_grubu=_norm(hasta.kan_grubu),
        uyumlu_mi=True,
        birinci_imza_kullanici_id=actor.id,  # type: ignore[arg-type]
        ikinci_imza_kullanici_id=body.ikinci_imza_kullanici_id,
        uygulama_zamani=body.uygulama_zamani or utc_now(),
        notlar=body.notlar,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return TransfuzyonRead.model_validate(row)
