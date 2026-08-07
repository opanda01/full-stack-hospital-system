from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.db import get_session
from app.core.enums import EntegrasyonDurumKod, EntegrasyonSistem
from app.core.request_ip import istemci_ip_al
from app.core.security import require_permission
from app.features.entegrasyonlar import outbox_service
from app.features.entegrasyonlar.models import EntegrasyonDurum
from app.features.kullanicilar.models import Kullanici
from app.integrations.factory import get_enabiz, get_kps, get_medula

router = APIRouter()


class EntegrasyonDurumRead(BaseModel):
    id: int
    sistem: str
    durum: str
    son_senkron: datetime | None
    hata_ozeti: str | None

    model_config = {"from_attributes": True}


class OutboxRead(BaseModel):
    id: int
    sistem: str
    kaynak: str
    kaynak_id: str
    durum: str
    dis_referans: str | None
    son_hata: str | None
    deneme: int
    son_deneme: datetime | None

    model_config = {"from_attributes": True}


def _ensure_defaults(session: Session) -> None:
    for sistem in EntegrasyonSistem:
        existing = session.exec(
            select(EntegrasyonDurum).where(EntegrasyonDurum.sistem == sistem)
        ).first()
        if existing is None:
            session.add(
                EntegrasyonDurum(
                    sistem=sistem, durum=EntegrasyonDurumKod.BILINMIYOR
                )
            )
    session.commit()


def _to_read(r: EntegrasyonDurum) -> EntegrasyonDurumRead:
    return EntegrasyonDurumRead(
        id=r.id,  # type: ignore[arg-type]
        sistem=r.sistem.value if hasattr(r.sistem, "value") else str(r.sistem),
        durum=r.durum.value if hasattr(r.durum, "value") else str(r.durum),
        son_senkron=r.son_senkron,
        hata_ozeti=r.hata_ozeti,
    )


@router.get("/", response_model=list[EntegrasyonDurumRead])
def list_entegrasyonlar(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("entegrasyon:goruntule")),
):
    _ensure_defaults(session)
    return [_to_read(r) for r in session.exec(select(EntegrasyonDurum)).all()]


@router.get("/outbox", response_model=list[OutboxRead])
def list_outbox(
    durum: str | None = None,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("entegrasyon:goruntule")),
):
    rows = outbox_service.list_outbox(session, durum=durum)
    return [
        OutboxRead(
            id=r.id,  # type: ignore[arg-type]
            sistem=r.sistem,
            kaynak=r.kaynak,
            kaynak_id=r.kaynak_id,
            durum=r.durum,
            dis_referans=r.dis_referans,
            son_hata=r.son_hata,
            deneme=r.deneme,
            son_deneme=r.son_deneme,
        )
        for r in rows
    ]


@router.post("/outbox/{gonderim_id}/retry", response_model=OutboxRead)
def retry_outbox(
    gonderim_id: int,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("entegrasyon:goruntule")),
):
    row = outbox_service.retry_gonderim(session, gonderim_id)
    return OutboxRead(
        id=row.id,  # type: ignore[arg-type]
        sistem=row.sistem,
        kaynak=row.kaynak,
        kaynak_id=row.kaynak_id,
        durum=row.durum,
        dis_referans=row.dis_referans,
        son_hata=row.son_hata,
        deneme=row.deneme,
        son_deneme=row.son_deneme,
    )


@router.post("/{sistem}/senkron", response_model=EntegrasyonDurumRead)
def senkron_entegrasyon(
    sistem: EntegrasyonSistem,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("entegrasyon:goruntule")),
):
    _ensure_defaults(session)
    row = session.exec(
        select(EntegrasyonDurum).where(EntegrasyonDurum.sistem == sistem)
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Entegrasyon bulunamadı")

    hata: str | None = None
    durum = EntegrasyonDurumKod.SAGLIKLI
    try:
        if sistem == EntegrasyonSistem.ENABIZ:
            res = get_enabiz().durum_sorgula("health")
            if not res.basarili:
                durum = EntegrasyonDurumKod.HATA
                hata = res.mesaj
        elif sistem in (EntegrasyonSistem.SGK_PROVIZYON, EntegrasyonSistem.MEDULA):
            res = get_medula().sonuc_sorgula("health")
            if not res.basarili:
                durum = EntegrasyonDurumKod.HATA
                hata = res.mesaj
        elif sistem == EntegrasyonSistem.KPS:
            res = get_kps().dogrula("10000000146")
            if not res.dogrulandi:
                durum = EntegrasyonDurumKod.HATA
                hata = res.mesaj
        else:
            # SAGLIK_NET / ITS — iskelet ping
            durum = EntegrasyonDurumKod.UYARI
            hata = "Port henüz uygulanmadı (iskelet)"
    except NotImplementedError as exc:
        durum = EntegrasyonDurumKod.HATA
        hata = str(exc)
    except Exception as exc:  # noqa: BLE001
        durum = EntegrasyonDurumKod.HATA
        hata = str(exc)

    row.durum = durum
    row.son_senkron = datetime.now(timezone.utc)
    row.hata_ozeti = hata
    session.add(row)
    denetim_kaydi_yaz(
        session,
        aksiyon="ENTEGRASYON_SENKRON",
        actor_id=current_user.id,
        kaynak="entegrasyon",
        kaynak_id=sistem.value,
        ip_adresi=istemci_ip_al(request),
        detay={"durum": durum.value, "hata": hata},
        commit=False,
    )
    session.commit()
    session.refresh(row)
    return _to_read(row)
