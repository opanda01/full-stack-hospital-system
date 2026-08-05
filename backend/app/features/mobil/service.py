from sqlmodel import Session, select

from app.core.push import get_push
from app.features.mobil.models import HastaMobilCihaz
from app.features.mobil.schemas import MobilCihazKayit, MobilCihazRead


def kaydet_cihaz(
    session: Session,
    kullanici_id: int,
    body: MobilCihazKayit,
) -> MobilCihazRead:
    token = body.push_token.strip()
    existing = session.exec(
        select(HastaMobilCihaz).where(HastaMobilCihaz.expo_push_token == token)
    ).first()
    if existing:
        existing.kullanici_id = kullanici_id
        existing.platform = body.platform
        existing.device_id = body.device_id
        existing.aktif_mi = True
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return MobilCihazRead(
            id=existing.id,  # type: ignore[arg-type]
            platform=existing.platform,
            aktif_mi=existing.aktif_mi,
        )

    row = HastaMobilCihaz(
        kullanici_id=kullanici_id,
        expo_push_token=token,
        platform=body.platform,
        device_id=body.device_id,
        aktif_mi=True,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return MobilCihazRead(
        id=row.id,  # type: ignore[arg-type]
        platform=row.platform,
        aktif_mi=row.aktif_mi,
    )


def sil_cihaz(session: Session, kullanici_id: int, push_token: str) -> None:
    token = push_token.strip()
    row = session.exec(
        select(HastaMobilCihaz).where(
            HastaMobilCihaz.expo_push_token == token,
            HastaMobilCihaz.kullanici_id == kullanici_id,
        )
    ).first()
    if row:
        row.aktif_mi = False
        session.add(row)
        session.commit()


def aktif_tokenlar(session: Session, kullanici_id: int) -> list[str]:
    rows = session.exec(
        select(HastaMobilCihaz).where(
            HastaMobilCihaz.kullanici_id == kullanici_id,
            HastaMobilCihaz.aktif_mi == True,  # noqa: E712
        )
    ).all()
    return [r.expo_push_token for r in rows]


def hasta_push_gonder(
    session: Session,
    kullanici_id: int,
    *,
    baslik: str,
    mesaj: str,
    data: dict | None = None,
) -> None:
    tokens = aktif_tokenlar(session, kullanici_id)
    if not tokens:
        return
    get_push().push_gonder(tokens, baslik=baslik, mesaj=mesaj, data=data)
