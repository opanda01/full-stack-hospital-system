from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.core.models_registry  # noqa: F401
from app.core.config import get_settings
from app.core.enums import Rol
from app.core.errors import register_exception_handlers
from app.core.login_rate_limit import LoginRateLimitMiddleware
from app.core.security import require_role

from app.features.auth.denetim_router import router as denetim_router
from app.features.auth.router import router as auth_router
from app.features.bashekim.router import router as bashekim_router
from app.features.departmanlar.router import router as departmanlar_router
from app.features.doktorlar.router import router as doktorlar_router
from app.features.doner_sermaye.router import router as doner_router
from app.features.eczane.router import router as eczane_router
from app.features.entegrasyonlar.router import router as entegrasyon_router
from app.features.faturalandirma.router import router as fatura_router
from app.features.hastalar.router import router as hastalar_router
from app.features.klinik_onay.router import router as klinik_onay_router
from app.features.kullanicilar.router import router as kullanicilar_router
from app.features.mhrs.router import router as mhrs_router
from app.features.muayeneler.router import router as muayeneler_router
from app.features.nobet_cizelgesi.router import router as nobet_cizelgesi_router
from app.features.personel.router import router as personel_router
from app.features.randevular.router import router as randevular_router
from app.features.rbac.router import router as rbac_router
from app.features.sikayet_oneri.router import router as sikayet_oneri_router
from app.features.temizlik_gorevleri.router import router as temizlik_gorevleri_router
from app.features.tetkikler.router import router as tetkikler_router
from app.features.yetki_devri.router import router as yetki_devri_router
from app.features.konsultasyon.router import router as konsultasyon_router
from app.features.saglik_kurulu.router import router as saglik_kurulu_router
from app.features.yatis.router import router as yatis_router
from app.features.ilac_talep.router import router as ilac_talep_router

settings = get_settings()

app = FastAPI(
    title="Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS",
    version="0.1.0",
    description="Hastane Bilgi Yönetim Sistemi API",
)

_cors = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoginRateLimitMiddleware)

register_exception_handlers(app)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "hastane-backend"}


@app.get("/sistem/bilgi")
def sistem_bilgi(_user=Depends(require_role(Rol.ADMIN))) -> dict[str, str | int]:
    """Salt-okunur sistem özeti (admin ayarlar UI)."""
    return {
        "bildirim_backend": settings.BILDIRIM_BACKEND,
        "cors_origins": settings.CORS_ORIGINS,
        "login_rate_limit_per_minute": settings.LOGIN_RATE_LIMIT_PER_MINUTE,
        "audit_retention_days": settings.AUDIT_RETENTION_DAYS,
        "otp_ttl_seconds": settings.OTP_TTL_SECONDS,
        "access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    }


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(denetim_router, prefix="/denetim", tags=["denetim"])
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
app.include_router(bashekim_router, prefix="/bashekim", tags=["bashekim"])
app.include_router(mhrs_router, prefix="/mhrs", tags=["mhrs"])
app.include_router(entegrasyon_router, prefix="/entegrasyonlar", tags=["entegrasyonlar"])
app.include_router(klinik_onay_router, prefix="/klinik-onay", tags=["klinik_onay"])
app.include_router(eczane_router, prefix="/eczane", tags=["eczane"])
app.include_router(fatura_router, prefix="/faturalar", tags=["faturalandirma"])
app.include_router(doner_router, prefix="/doner-sermaye", tags=["doner_sermaye"])
app.include_router(yetki_devri_router, prefix="/yetki-devri", tags=["yetki_devri"])
app.include_router(konsultasyon_router, prefix="/konsultasyonlar", tags=["konsultasyon"])
app.include_router(saglik_kurulu_router, prefix="/saglik-kurulu", tags=["saglik_kurulu"])
app.include_router(yatis_router, prefix="/yatis", tags=["yatis"])
app.include_router(ilac_talep_router, prefix="/ilac-talepleri", tags=["ilac_talep"])
