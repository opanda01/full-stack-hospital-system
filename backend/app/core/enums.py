from enum import Enum


class Rol(str, Enum):
    ADMIN = "ADMIN"
    BASHEKIM = "BASHEKIM"
    MUDUR = "MUDUR"
    DOKTOR = "DOKTOR"
    HEMSIRE = "HEMSIRE"
    EBE = "EBE"
    LABORANT = "LABORANT"
    TEMIZLIK_PERSONELI = "TEMIZLIK_PERSONELI"
    GUVENLIK = "GUVENLIK"
    IDARI_PERSONEL = "IDARI_PERSONEL"
    HASTA = "HASTA"


# Geriye uyum alias
RolKod = Rol


class YonetimGorevi(str, Enum):
    """Personel üzerindeki organizasyonel yönetim görevi (opsiyonel metadata)."""

    YOK = "YOK"
    BIRIM_SORUMLUSU = "BIRIM_SORUMLUSU"
    MUDUR = "MUDUR"
    BASHEKIM = "BASHEKIM"


YONETIM_GOREVI_TO_ROL: dict[YonetimGorevi, Rol | None] = {
    YonetimGorevi.YOK: None,
    YonetimGorevi.BIRIM_SORUMLUSU: None,
    YonetimGorevi.MUDUR: Rol.MUDUR,
    YonetimGorevi.BASHEKIM: Rol.BASHEKIM,
}


YONETIM_ROL_KODLARI: frozenset[str] = frozenset(
    {Rol.BASHEKIM.value, Rol.MUDUR.value}
)


class OturumTipi(str, Enum):
    PERSONEL = "personel"
    HASTA = "hasta"


class OtpAmac(str, Enum):
    KAYIT = "KAYIT"
    GIRIS = "GIRIS"


class ImportDurum(str, Enum):
    BEKLEMEDE = "BEKLEMEDE"
    ISLENIYOR = "ISLENIYOR"
    TAMAMLANDI = "TAMAMLANDI"
    HATA = "HATA"
