from enum import Enum


class Rol(str, Enum):
    ADMIN = "ADMIN"
    BASHEKIM = "BASHEKIM"
    MUDUR = "MUDUR"
    DOKTOR = "DOKTOR"
    HEMSIRE = "HEMSIRE"
    EBE = "EBE"
    LABORANT = "LABORANT"
    RADYOLOG = "RADYOLOG"
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
    MEDULA = "MEDULA"
    KPS = "KPS"
    SAGLIK_NET = "SAGLIK_NET"
    ITS = "ITS"


class AllerjenTipi(str, Enum):
    ILAC = "ILAC"
    ETKEN_MADDE = "ETKEN_MADDE"
    GIDA = "GIDA"
    DIGER = "DIGER"


class AlerjiSiddet(str, Enum):
    HAFIF = "HAFIF"
    ORTA = "ORTA"
    SIDDETLI = "SIDDETLI"
    ANAFILAKSI = "ANAFILAKSI"


class IlacEtkilesimSeviye(str, Enum):
    UYARI = "UYARI"
    KONTRANDIKE = "KONTRANDIKE"


class KvkkMetinTur(str, Enum):
    AYDINLATMA = "AYDINLATMA"
    ACIK_RIZA = "ACIK_RIZA"
    PERSONEL = "PERSONEL"


class KvkkOnayKanal(str, Enum):
    WEB = "WEB"
    MOBIL = "MOBIL"
    OTP_KAYIT = "OTP_KAYIT"


class MedulaGonderimDurumu(str, Enum):
    BEKLEMEDE = "BEKLEMEDE"
    GONDERILDI = "GONDERILDI"
    HATA = "HATA"
    IPTAL = "IPTAL"


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
    KRITIK_LAB = "KRITIK_LAB"
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


class ServisTipi(str, Enum):
    DAHILIYE = "DAHILIYE"
    CERRAHI = "CERRAHI"
    YBU = "YBU"
    ACIL = "ACIL"
    KADIN_DOGUM = "KADIN_DOGUM"
    PEDIATRI = "PEDIATRI"
    PSIKIYATRI = "PSIKIYATRI"
    DIGER = "DIGER"


class YatakDurumu(str, Enum):
    BOS = "BOS"
    DOLU = "DOLU"
    TEMIZLIK_BEKLIYOR = "TEMIZLIK_BEKLIYOR"
    ARIZALI = "ARIZALI"


class AmeliyathaneDurumu(str, Enum):
    MUSAIT = "MUSAIT"
    KULLANIMDA = "KULLANIMDA"
    TEMIZLIK = "TEMIZLIK"
    ARIZALI = "ARIZALI"


class AmeliyatPlaniDurumu(str, Enum):
    PLANLANDI = "PLANLANDI"
    HAZIRLIK = "HAZIRLIK"
    DEVAM_EDIYOR = "DEVAM_EDIYOR"
    TAMAMLANDI = "TAMAMLANDI"
    IPTAL = "IPTAL"
    ERTELENDI = "ERTELENDI"


class AmeliyatEkipRolu(str, Enum):
    CERRAH = "CERRAH"
    ASISTAN = "ASISTAN"
    ANESTEZIST = "ANESTEZIST"
    SIRKULE_HEMSIRE = "SIRKULE_HEMSIRE"
    INSTRUMANTATOR = "INSTRUMANTATOR"


class AnesteziTipi(str, Enum):
    GENEL = "GENEL"
    LOKAL = "LOKAL"
    SPINAL = "SPINAL"
    EPIDURAL = "EPIDURAL"
    SEDASYON = "SEDASYON"


class RadyolojiTetkikTuru(str, Enum):
    ROENTGEN = "ROENTGEN"
    BT = "BT"
    MR = "MR"
    USG = "USG"
    MAMOGRAFI = "MAMOGRAFI"


class RadyolojiAciliyet(str, Enum):
    RUTIN = "RUTIN"
    ACIL = "ACIL"


class RadyolojiIstemDurumu(str, Enum):
    ISTENDI = "ISTENDI"
    PLANLANDI = "PLANLANDI"
    CEKILDI = "CEKILDI"
    RAPORLANDI = "RAPORLANDI"
    IPTAL = "IPTAL"
