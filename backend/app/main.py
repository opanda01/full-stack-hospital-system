from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.core.models_registry  # noqa: F401
from app.core.errors import register_exception_handlers

from app.features.auth.router import router as auth_router
from app.features.departmanlar.router import router as departmanlar_router
from app.features.doktorlar.router import router as doktorlar_router
from app.features.hastalar.router import router as hastalar_router
from app.features.kullanicilar.router import router as kullanicilar_router
from app.features.muayeneler.router import router as muayeneler_router
from app.features.nobet_cizelgesi.router import router as nobet_cizelgesi_router
from app.features.personel.router import router as personel_router
from app.features.randevular.router import router as randevular_router
from app.features.rbac.router import router as rbac_router
from app.features.sikayet_oneri.router import router as sikayet_oneri_router
from app.features.temizlik_gorevleri.router import router as temizlik_gorevleri_router
from app.features.tetkikler.router import router as tetkikler_router

app = FastAPI(
    title="Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS",
    version="0.1.0",
    description="Hastane Bilgi Yönetim Sistemi API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "hastane-backend"}


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(rbac_router, prefix="/rbac", tags=["rbac"])
app.include_router(kullanicilar_router, prefix="/kullanicilar", tags=["kullanicilar"])
app.include_router(departmanlar_router, prefix="/departmanlar", tags=["departmanlar"])
app.include_router(personel_router, prefix="/personel", tags=["personel"])
app.include_router(doktorlar_router, prefix="/doktorlar", tags=["doktorlar"])
app.include_router(hastalar_router, prefix="/hastalar", tags=["hastalar"])
app.include_router(randevular_router, prefix="/randevular", tags=["randevular"])
app.include_router(muayeneler_router, prefix="/muayeneler", tags=["muayeneler"])
app.include_router(tetkikler_router, prefix="/tetkikler", tags=["tetkikler"])
app.include_router(nobet_cizelgesi_router, prefix="/nobet-cizelgesi", tags=["nobet_cizelgesi"])
app.include_router(
    temizlik_gorevleri_router, prefix="/temizlik-gorevleri", tags=["temizlik_gorevleri"]
)
app.include_router(sikayet_oneri_router, prefix="/sikayet-oneri", tags=["sikayet_oneri"])
