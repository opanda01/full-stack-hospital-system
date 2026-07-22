from enum import Enum

from app.core.enums import Rol


class Kapsam(str, Enum):
    GLOBAL = "GLOBAL"
    KENDI_KAYDIM = "KENDI_KAYDIM"
    DEPARTMANIM = "DEPARTMANIM"
    YOK = "YOK"


def _mudur_izinleri() -> dict[str, Kapsam]:
    """Müdür operasyon izinleri — `_yonetim_ortak` envanteri korunur."""
    return {
        "personel:listele": Kapsam.GLOBAL,
        "personel:import": Kapsam.GLOBAL,
        "departman:olustur": Kapsam.GLOBAL,
        "departman:goruntule": Kapsam.GLOBAL,
        "doktor:profil_duzenle": Kapsam.GLOBAL,
        "randevu:olustur": Kapsam.GLOBAL,
        "randevu:goruntule": Kapsam.GLOBAL,
        "randevu:iptal": Kapsam.GLOBAL,
        "hasta:listele": Kapsam.GLOBAL,
        "hasta:goruntule": Kapsam.GLOBAL,
        "muayene:goruntule": Kapsam.GLOBAL,
        "tetkik:goruntule": Kapsam.GLOBAL,
        "nobet:olustur": Kapsam.GLOBAL,
        "nobet:goruntule": Kapsam.GLOBAL,
        "temizlik_gorevi:ata": Kapsam.GLOBAL,
        "temizlik_gorevi:goruntule": Kapsam.GLOBAL,
        "temizlik_gorevi:guncelle": Kapsam.GLOBAL,
        "sikayet_oneri:gonder": Kapsam.GLOBAL,
        "sikayet_oneri:tumunu_goruntule": Kapsam.GLOBAL,
        "yatis:goruntule": Kapsam.GLOBAL,
        "yatis:islem": Kapsam.GLOBAL,
        "ilac_talep:goruntule": Kapsam.GLOBAL,
        "ilac_talep:olustur": Kapsam.GLOBAL,
        "ilac_talep:durum_guncelle": Kapsam.GLOBAL,
        "vital:goruntule": Kapsam.GLOBAL,
        "vital:olustur": Kapsam.GLOBAL,
        "ilac_uygulama:goruntule": Kapsam.GLOBAL,
        "ilac_uygulama:olustur": Kapsam.GLOBAL,
        "ilac_uygulama:guncelle": Kapsam.GLOBAL,
        "hemsire_gorev:goruntule": Kapsam.GLOBAL,
        "hemsire_gorev:olustur": Kapsam.GLOBAL,
        "hemsire_gorev:guncelle": Kapsam.GLOBAL,
        "vardiya_devir:goruntule": Kapsam.GLOBAL,
        "vardiya_devir:olustur": Kapsam.GLOBAL,
        "panel_bildirim:goruntule": Kapsam.GLOBAL,
        "panel_bildirim:guncelle": Kapsam.GLOBAL,
    }


def _bashekim_izinleri() -> dict[str, Kapsam]:
    """Başhekim = Müdür ops + gözetim / onay / HBYS view."""
    izinler = _mudur_izinleri()
    izinler.update(
        {
            "personel:onayla": Kapsam.GLOBAL,
            "denetim:goruntule": Kapsam.GLOBAL,
            "bashekim:ozet": Kapsam.GLOBAL,
            "mhrs:yonet": Kapsam.GLOBAL,
            "entegrasyon:goruntule": Kapsam.GLOBAL,
            "klinik_onay:goruntule": Kapsam.GLOBAL,
            "klinik_onay:olustur": Kapsam.GLOBAL,
            "klinik_onay:onayla": Kapsam.GLOBAL,
            "saglik_kurulu:goruntule": Kapsam.GLOBAL,
            "saglik_kurulu:yonet": Kapsam.GLOBAL,
            "eczane:goruntule": Kapsam.GLOBAL,
            "fatura:goruntule": Kapsam.GLOBAL,
            "doner:goruntule": Kapsam.GLOBAL,
            "yetki:devret": Kapsam.GLOBAL,
            "sistem:gozetim": Kapsam.GLOBAL,
        }
    )
    return izinler


# İzin matrisi: {rol: {kaynak_aksiyon: kapsam}}
# Belge: docs/rbac-yetki-matrisi.md, docs/bashekim-izin-envanteri.md
IZIN_MATRISI: dict[Rol, dict[str, Kapsam]] = {
    Rol.ADMIN: {"*": Kapsam.GLOBAL},
    Rol.BASHEKIM: _bashekim_izinleri(),
    Rol.MUDUR: _mudur_izinleri(),
    Rol.DOKTOR: {
        "departman:goruntule": Kapsam.GLOBAL,
        "doktor:profil_duzenle": Kapsam.KENDI_KAYDIM,
        "randevu:goruntule": Kapsam.KENDI_KAYDIM,
        "randevu:iptal": Kapsam.KENDI_KAYDIM,
        "hasta:goruntule": Kapsam.KENDI_KAYDIM,
        "muayene:olustur": Kapsam.KENDI_KAYDIM,
        "muayene:guncelle": Kapsam.KENDI_KAYDIM,
        "muayene:goruntule": Kapsam.KENDI_KAYDIM,
        "tetkik:iste": Kapsam.KENDI_KAYDIM,
        "tetkik:goruntule": Kapsam.KENDI_KAYDIM,
        "klinik_onay:goruntule": Kapsam.KENDI_KAYDIM,
        "klinik_onay:olustur": Kapsam.KENDI_KAYDIM,
        "konsultasyon:olustur": Kapsam.KENDI_KAYDIM,
        "konsultasyon:goruntule": Kapsam.KENDI_KAYDIM,
        "konsultasyon:yanitla": Kapsam.KENDI_KAYDIM,
        "saglik_kurulu:goruntule": Kapsam.KENDI_KAYDIM,
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
        "yatis:goruntule": Kapsam.GLOBAL,
        "yatis:islem": Kapsam.GLOBAL,
        "ilac_talep:goruntule": Kapsam.GLOBAL,
        "ilac_talep:olustur": Kapsam.GLOBAL,
        "ilac_talep:durum_guncelle": Kapsam.GLOBAL,
        "eczane:goruntule": Kapsam.GLOBAL,
        "vital:goruntule": Kapsam.GLOBAL,
        "vital:olustur": Kapsam.GLOBAL,
        "ilac_uygulama:goruntule": Kapsam.GLOBAL,
        "ilac_uygulama:olustur": Kapsam.GLOBAL,
        "ilac_uygulama:guncelle": Kapsam.GLOBAL,
        "hemsire_gorev:goruntule": Kapsam.GLOBAL,
        "hemsire_gorev:olustur": Kapsam.GLOBAL,
        "hemsire_gorev:guncelle": Kapsam.GLOBAL,
        "vardiya_devir:goruntule": Kapsam.GLOBAL,
        "vardiya_devir:olustur": Kapsam.GLOBAL,
        "panel_bildirim:goruntule": Kapsam.GLOBAL,
        "panel_bildirim:guncelle": Kapsam.GLOBAL,
    },
    Rol.EBE: {
        "departman:goruntule": Kapsam.GLOBAL,
        "randevu:olustur": Kapsam.DEPARTMANIM,
        "randevu:goruntule": Kapsam.DEPARTMANIM,
        "muayene:goruntule": Kapsam.DEPARTMANIM,
        "nobet:goruntule": Kapsam.KENDI_KAYDIM,
        "sikayet_oneri:gonder": Kapsam.GLOBAL,
        "yatis:goruntule": Kapsam.GLOBAL,
        "yatis:islem": Kapsam.GLOBAL,
        "ilac_talep:goruntule": Kapsam.GLOBAL,
        "ilac_talep:olustur": Kapsam.GLOBAL,
        "ilac_talep:durum_guncelle": Kapsam.GLOBAL,
        "eczane:goruntule": Kapsam.GLOBAL,
        "vital:goruntule": Kapsam.GLOBAL,
        "vital:olustur": Kapsam.GLOBAL,
        "ilac_uygulama:goruntule": Kapsam.GLOBAL,
        "ilac_uygulama:olustur": Kapsam.GLOBAL,
        "ilac_uygulama:guncelle": Kapsam.GLOBAL,
        "hemsire_gorev:goruntule": Kapsam.GLOBAL,
        "hemsire_gorev:olustur": Kapsam.GLOBAL,
        "hemsire_gorev:guncelle": Kapsam.GLOBAL,
        "vardiya_devir:goruntule": Kapsam.GLOBAL,
        "vardiya_devir:olustur": Kapsam.GLOBAL,
        "panel_bildirim:goruntule": Kapsam.GLOBAL,
        "panel_bildirim:guncelle": Kapsam.GLOBAL,
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
    # ADMIN wildcard dışında açık bypass izni
    if kaynak_aksiyon == "personel:onay_bypass" and rol == Rol.ADMIN:
        return Kapsam.GLOBAL
    return rol_izinleri.get(kaynak_aksiyon, Kapsam.YOK)


def izin_var_mi(rol: Rol | str, kaynak_aksiyon: str) -> bool:
    return kapsam_getir(rol, kaynak_aksiyon) != Kapsam.YOK


def tum_izin_kodlari() -> list[str]:
    kodlar: set[str] = {
        "personel:onay_bypass",
    }
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
