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
    SIFRE_SIFIRLAMA = "SIFRE_SIFIRLAMA"


class ImportDurum(str, Enum):
    BEKLEMEDE = "BEKLEMEDE"
    ISLENIYOR = "ISLENIYOR"
    TAMAMLANDI = "TAMAMLANDI"
    HATA = "HATA"


class ErisimDurumu(str, Enum):
    """Personel sistem erişimi — tek kaynak; aktif_mi bundan türetilir."""

    BEKLEMEDE = "BEKLEMEDE"
    ONAYLANDI = "ONAYLANDI"
    REDDEDILDI = "REDDEDILDI"


class PersonelKaynakTipi(str, Enum):
    KURUM = "KURUM"
    DIS_FIRMA = "DIS_FIRMA"


class KlinikOnayDurumu(str, Enum):
    BEKLEMEDE = "BEKLEMEDE"
    ONAYLANDI = "ONAYLANDI"
    REDDEDILDI = "REDDEDILDI"


class EntegrasyonSistem(str, Enum):
    ENABIZ = "ENABIZ"
    SGK_PROVIZYON = "SGK_PROVIZYON"


class EntegrasyonDurumKod(str, Enum):
    SAGLIKLI = "SAGLIKLI"
    UYARI = "UYARI"
    HATA = "HATA"
    BILINMIYOR = "BILINMIYOR"


class KonsultasyonDurumu(str, Enum):
    BEKLEMEDE = "BEKLEMEDE"
    KABUL = "KABUL"
    RED = "RED"
    TAMAMLANDI = "TAMAMLANDI"


class KlinikDurum(str, Enum):
    NORMAL = "NORMAL"
    KRITIK = "KRITIK"
    ACIL = "ACIL"
    BEKLEYEN_TETKIK = "BEKLEYEN_TETKIK"


class YatisIslemTipi(str, Enum):
    TABURCU = "TABURCU"
    NAKIL = "NAKIL"
    IZIN = "IZIN"
    DOKTOR_DEGISTIR = "DOKTOR_DEGISTIR"
    HEMSIRE_DEGISTIR = "HEMSIRE_DEGISTIR"
    KONTROL_TOGGLE = "KONTROL_TOGGLE"
    REFAKATCI_KAYDET = "REFAKATCI_KAYDET"


class IlacTalepDurumu(str, Enum):
    YENI = "YENI"
    ONAY_BEKLIYOR = "ONAY_BEKLIYOR"
    ONAYLANDI = "ONAYLANDI"
    VERILDI = "VERILDI"


class KullanimSekli(str, Enum):
    ORAL = "ORAL"
    IV = "IV"
    IM = "IM"
    SUBKUTAN = "SUBKUTAN"


class IlacUygulamaDurumu(str, Enum):
    BEKLIYOR = "BEKLIYOR"
    VERILDI = "VERILDI"
    ATLANDI = "ATLANDI"
    REDDEDILDI = "REDDEDILDI"


class PanelBildirimTipi(str, Enum):
    KRITIK_VITAL = "KRITIK_VITAL"
    ILAC_TALEP = "ILAC_TALEP"
    KONSULTASYON = "KONSULTASYON"
    GOREV = "GOREV"
    GENEL = "GENEL"


class EpikrizDurumu(str, Enum):
    TASLAK = "TASLAK"
    ONAYLANDI = "ONAYLANDI"


class GuvenlikOlayTipi(str, Enum):
    BEYAZ_KOD = "BEYAZ_KOD"
    MAVI_KOD = "MAVI_KOD"
    PEMBE_KOD = "PEMBE_KOD"
    KIRMIZI_KOD = "KIRMIZI_KOD"
    GRI_KOD = "GRI_KOD"
    GENEL = "GENEL"


class GuvenlikOlayDurumu(str, Enum):
    ACIK = "ACIK"
    MUDAHALE = "MUDAHALE"
    COZULDU = "COZULDU"
    IPTAL = "IPTAL"


class KayipEsyaDurumu(str, Enum):
    BEKLIYOR = "BEKLIYOR"
    TESLIM = "TESLIM"
    POLISE = "POLISE"
