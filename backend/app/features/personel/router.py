from fastapi import APIRouter, Depends, File, Request, UploadFile, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.request_ip import istemci_ip_al
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.personel import import_service
from app.features.personel import service as personel_service
from app.features.personel.schemas import (
    PersonelCreate,
    PersonelImportBaslatResponse,
    PersonelImportDurumResponse,
    PersonelRead,
    PersonelUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[PersonelRead])
def list_personel(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("personel:listele")),
):
    return personel_service.list_personel(session)


@router.post("/", response_model=PersonelRead, status_code=status.HTTP_201_CREATED)
def create_personel(
    body: PersonelCreate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("personel:listele")),
):
    return personel_service.create_personel(session, body)


@router.patch("/{personel_id}", response_model=PersonelRead)
def update_personel(
    personel_id: int,
    body: PersonelUpdate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("personel:listele")),
):
    return personel_service.update_personel(session, personel_id, body)


@router.post(
    "/import",
    response_model=PersonelImportBaslatResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def import_personel(
    request: Request,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("personel:import")),
):
    filename, content = await import_service.read_upload(file)
    rows = import_service.parse_import_file(filename, content)
    isi = import_service.create_import_isi(
        session,
        actor_id=current_user.id,
        rows=rows,
        ip_adresi=istemci_ip_al(request),
    )
    from app.features.personel.tasks import personel_import_isle

    async_result = personel_import_isle.delay(isi.id, rows)
    isi.celery_task_id = async_result.id
    session.add(isi)
    session.commit()
    session.refresh(isi)
    return PersonelImportBaslatResponse(
        isi_id=isi.id,
        celery_task_id=isi.celery_task_id,
        toplam=isi.toplam,
    )


@router.get("/import/{isi_id}", response_model=PersonelImportDurumResponse)
def import_durum(
    isi_id: int,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("personel:import")),
):
    return import_service.get_import_isi(session, isi_id)
