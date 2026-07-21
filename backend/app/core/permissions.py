from enum import Enum

from app.core.enums import Rol


class Kapsam(str, Enum):
    GLOBAL = "GLOBAL"
    KENDI_KAYDIM = "KENDI_KAYDIM"
    DEPARTMANIM = "DEPARTMANIM"
    YOK = "YOK"


def _yonetim_ortak() -> dict[str, Kapsam]:
    return {
        "personel:listele": Kapsam.GLOBAL,
        "personel:import": Kapsam.GLOBAL,
        "departman:olustur": Kapsam.GLOBAL,
        "departman:goruntule": Kapsam.GLOBAL,
        "doktor:profil_duzenle": Kapsam.GLOBAL,
        "randevu:olustur": Kapsam.GLOBAL,
        "randevu:goruntule": Kapsam.GLOBAL,
        "randevu:iptal": Kapsam.GLOBAL,
        "muayene:goruntule": Kapsam.GLOBAL,
        "nobet:olustur": Kapsam.GLOBAL,
        "nobet:goruntule": Kapsam.GLOBAL,
        "temizlik_gorevi:ata": Kapsam.GLOBAL,
        "temizlik_gorevi:goruntule": Kapsam.GLOBAL,
        "sikayet_oneri:gonder": Kapsam.GLOBAL,
        "sikayet_oneri:tumunu_goruntule": Kapsam.GLOBAL,
    }


# İzin matrisi: {rol: {kaynak_aksiyon: kapsam}}
# Belge: docs/rbac-yetki-matrisi.md
IZIN_MATRISI: dict[Rol, dict[str, Kapsam]] = {
    Rol.ADMIN: {"*": Kapsam.GLOBAL},
    Rol.BASHEKIM: _yonetim_ortak(),
    Rol.MUDUR: _yonetim_ortak(),
    Rol.DOKTOR: {
        "departman:goruntule": Kapsam.GLOBAL,
        "doktor:profil_duzenle": Kapsam.KENDI_KAYDIM,
        "randevu:goruntule": Kapsam.KENDI_KAYDIM,
        "randevu:iptal": Kapsam.KENDI_KAYDIM,
        "muayene:olustur": Kapsam.KENDI_KAYDIM,
        "muayene:goruntule": Kapsam.KENDI_KAYDIM,
        "tetkik:iste": Kapsam.KENDI_KAYDIM,
        "tetkik:goruntule": Kapsam.KENDI_KAYDIM,
        "nobet:goruntule": Kapsam.KENDI_KAYDIM,
        "sikayet_oneri:gonder": Kapsam.GLOBAL,
    },
    Rol.HEMSIRE: {
        "departman:goruntule": Kapsam.GLOBAL,
        "randevu:olustur": Kapsam.DEPARTMANIM,
        "randevu:goruntule": Kapsam.DEPARTMANIM,
        "muayene:goruntule": Kapsam.DEPARTMANIM,
        "nobet:goruntule": Kapsam.KENDI_KAYDIM,
        "sikayet_oneri:gonder": Kapsam.GLOBAL,
    },
    Rol.EBE: {
        "departman:goruntule": Kapsam.GLOBAL,
        "randevu:olustur": Kapsam.DEPARTMANIM,
        "randevu:goruntule": Kapsam.DEPARTMANIM,
        "muayene:goruntule": Kapsam.DEPARTMANIM,
        "nobet:goruntule": Kapsam.KENDI_KAYDIM,
        "sikayet_oneri:gonder": Kapsam.GLOBAL,
    },
    Rol.LABORANT: {
        "departman:goruntule": Kapsam.GLOBAL,
        "tetkik:sonuc_gir": Kapsam.KENDI_KAYDIM,
        "tetkik:goruntule": Kapsam.KENDI_KAYDIM,
        "nobet:goruntule": Kapsam.KENDI_KAYDIM,
        "sikayet_oneri:gonder": Kapsam.GLOBAL,
    },
    Rol.TEMIZLIK_PERSONELI: {
        "departman:goruntule": Kapsam.GLOBAL,
        "nobet:goruntule": Kapsam.KENDI_KAYDIM,
        "temizlik_gorevi:goruntule": Kapsam.KENDI_KAYDIM,
        "temizlik_gorevi:guncelle": Kapsam.KENDI_KAYDIM,
        "sikayet_oneri:gonder": Kapsam.GLOBAL,
    },
    Rol.GUVENLIK: {
        "sikayet_oneri:gonder": Kapsam.GLOBAL,
    },
    Rol.IDARI_PERSONEL: {
        "sikayet_oneri:gonder": Kapsam.GLOBAL,
    },
    Rol.HASTA: {
        "departman:goruntule": Kapsam.GLOBAL,
        "randevu:olustur": Kapsam.KENDI_KAYDIM,
        "randevu:goruntule": Kapsam.KENDI_KAYDIM,
        "randevu:iptal": Kapsam.KENDI_KAYDIM,
        "muayene:goruntule": Kapsam.KENDI_KAYDIM,
        "tetkik:goruntule": Kapsam.KENDI_KAYDIM,
        "sikayet_oneri:gonder": Kapsam.GLOBAL,
    },
}


def kapsam_getir(rol: Rol | str, kaynak_aksiyon: str) -> Kapsam:
    if isinstance(rol, str):
        try:
            rol = Rol(rol)
        except ValueError:
            return Kapsam.YOK
    rol_izinleri = IZIN_MATRISI.get(rol, {})
    if "*" in rol_izinleri:
        return rol_izinleri["*"]
    return rol_izinleri.get(kaynak_aksiyon, Kapsam.YOK)


def izin_var_mi(rol: Rol | str, kaynak_aksiyon: str) -> bool:
    return kapsam_getir(rol, kaynak_aksiyon) != Kapsam.YOK


def tum_izin_kodlari() -> list[str]:
    kodlar: set[str] = set()
    for matris in IZIN_MATRISI.values():
        for kod in matris:
            if kod != "*":
                kodlar.add(kod)
    return sorted(kodlar)


def rol_izin_kodlari(rol: Rol | str) -> list[str]:
    if isinstance(rol, str):
        try:
            rol = Rol(rol)
        except ValueError:
            return []
    matris = IZIN_MATRISI.get(rol, {})
    if "*" in matris:
        return ["*"]
    return sorted(matris.keys())


def rol_izin_detaylari(rol: Rol | str) -> list[dict[str, str]]:
    if isinstance(rol, str):
        try:
            rol = Rol(rol)
        except ValueError:
            return []
    matris = IZIN_MATRISI.get(rol, {})
    if "*" in matris:
        return [{"kod": "*", "kapsam": Kapsam.GLOBAL.value}]
    return [
        {"kod": kod, "kapsam": kapsam.value}
        for kod, kapsam in sorted(matris.items(), key=lambda x: x[0])
    ]
