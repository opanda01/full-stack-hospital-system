from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.raporlar import export_csv, export_pdf, service
from app.features.raporlar.schemas import (
    ExportFormat,
    FinansRaporRead,
    KlinikRaporRead,
    RandevuRaporRead,
    YatakRaporRead,
    YatisRaporRead,
)

router = APIRouter()

_RAPOR_AUTH = Depends(require_permission("rapor:goruntule"))
_FINANS_AUTH = Depends(require_permission("fatura:goruntule"))


@router.get("/randevu", response_model=RandevuRaporRead)
def rapor_randevu(
    session: Session = Depends(get_session),
    baslangic: date | None = None,
    bitis: date | None = None,
    departman_id: int | None = None,
    durum: str | None = None,
    _user: Kullanici = _RAPOR_AUTH,
):
    return service.randevu_raporu(
        session,
        baslangic=baslangic,
        bitis=bitis,
        departman_id=departman_id,
        durum=durum,
    )


@router.get("/yatis", response_model=YatisRaporRead)
def rapor_yatis(
    session: Session = Depends(get_session),
    baslangic: date | None = None,
    bitis: date | None = None,
    _user: Kullanici = _RAPOR_AUTH,
):
    return service.yatis_raporu(session, baslangic=baslangic, bitis=bitis)


@router.get("/yatak", response_model=YatakRaporRead)
def rapor_yatak(
    session: Session = Depends(get_session),
    _user: Kullanici = _RAPOR_AUTH,
):
    return service.yatak_raporu(session)


@router.get("/finans", response_model=FinansRaporRead)
def rapor_finans(
    session: Session = Depends(get_session),
    baslangic: date | None = None,
    bitis: date | None = None,
    _user: Kullanici = _FINANS_AUTH,
):
    return service.finans_raporu(session, baslangic=baslangic, bitis=bitis)


@router.get("/klinik", response_model=KlinikRaporRead)
def rapor_klinik(
    session: Session = Depends(get_session),
    _user: Kullanici = _RAPOR_AUTH,
):
    return service.klinik_raporu(session)


def _export_response(
    tur: str,
    fmt: ExportFormat,
    csv_body: str,
    pdf_body: bytes,
) -> Response:
    if fmt == "csv":
        return Response(
            content=csv_body.encode("utf-8-sig"),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="rapor-{tur}.csv"',
            },
        )
    if fmt == "pdf":
        return Response(
            content=pdf_body,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="rapor-{tur}.pdf"',
            },
        )
    raise HTTPException(status_code=400, detail="Desteklenmeyen format")


@router.get("/randevu/export")
def rapor_randevu_export(
    session: Session = Depends(get_session),
    format: ExportFormat = Query(default="csv", alias="format"),
    baslangic: date | None = None,
    bitis: date | None = None,
    departman_id: int | None = None,
    durum: str | None = None,
    _user: Kullanici = _RAPOR_AUTH,
):
    data = service.randevu_raporu(
        session,
        baslangic=baslangic,
        bitis=bitis,
        departman_id=departman_id,
        durum=durum,
    )
    return _export_response(
        "randevu",
        format,
        export_csv.randevu_csv(data),
        export_pdf.randevu_pdf(data),
    )


@router.get("/yatis/export")
def rapor_yatis_export(
    session: Session = Depends(get_session),
    format: ExportFormat = Query(default="csv", alias="format"),
    baslangic: date | None = None,
    bitis: date | None = None,
    _user: Kullanici = _RAPOR_AUTH,
):
    data = service.yatis_raporu(session, baslangic=baslangic, bitis=bitis)
    return _export_response(
        "yatis",
        format,
        export_csv.yatis_csv(data),
        export_pdf.yatis_pdf(data),
    )


@router.get("/yatak/export")
def rapor_yatak_export(
    session: Session = Depends(get_session),
    format: ExportFormat = Query(default="csv", alias="format"),
    _user: Kullanici = _RAPOR_AUTH,
):
    data = service.yatak_raporu(session)
    return _export_response(
        "yatak",
        format,
        export_csv.yatak_csv(data),
        export_pdf.yatak_pdf(data),
    )


@router.get("/finans/export")
def rapor_finans_export(
    session: Session = Depends(get_session),
    format: ExportFormat = Query(default="csv", alias="format"),
    baslangic: date | None = None,
    bitis: date | None = None,
    _user: Kullanici = _FINANS_AUTH,
):
    data = service.finans_raporu(session, baslangic=baslangic, bitis=bitis)
    return _export_response(
        "finans",
        format,
        export_csv.finans_csv(data),
        export_pdf.finans_pdf(data),
    )


@router.get("/klinik/export")
def rapor_klinik_export(
    session: Session = Depends(get_session),
    format: ExportFormat = Query(default="csv", alias="format"),
    _user: Kullanici = _RAPOR_AUTH,
):
    data = service.klinik_raporu(session)
    return _export_response(
        "klinik",
        format,
        export_csv.klinik_csv(data),
        export_pdf.klinik_pdf(data),
    )
