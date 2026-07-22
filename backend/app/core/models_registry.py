"""Tüm SQLModel tablolarını registry'ye kaydet (forward-ref çözümlemesi)."""

from app.features.rbac.models import Izin, KullaniciRol, Rol, RolIzin  # noqa: F401
from app.features.kullanicilar.models import Kullanici  # noqa: F401
from app.features.auth.models import RefreshToken  # noqa: F401
from app.features.departmanlar.models import Birim, Departman  # noqa: F401
from app.features.personel.models import Personel  # noqa: F401
from app.features.doktorlar.models import Doktor  # noqa: F401
from app.features.hastalar.models import Hasta  # noqa: F401
from app.features.randevular.models import Randevu  # noqa: F401
from app.features.muayeneler.models import MuayeneKaydi  # noqa: F401
from app.features.tetkikler.models import Tetkik  # noqa: F401
from app.features.nobet_cizelgesi.models import NobetCizelgesi  # noqa: F401
from app.features.temizlik_gorevleri.models import TemizlikGorevi  # noqa: F401
from app.features.sikayet_oneri.models import SikayetOneri  # noqa: F401
from app.features.mhrs.models import MhrsKapasite  # noqa: F401
from app.features.entegrasyonlar.models import EntegrasyonDurum  # noqa: F401
from app.features.klinik_onay.models import KlinikOnayKaydi  # noqa: F401
from app.features.eczane.models import Ilac  # noqa: F401
from app.features.faturalandirma.models import Fatura  # noqa: F401
from app.features.doner_sermaye.models import DonerSermayeKayit  # noqa: F401
from app.features.yetki_devri.models import YetkiDevriKaydi  # noqa: F401
from app.features.konsultasyon.models import KonsultasyonIstegi  # noqa: F401
from app.features.saglik_kurulu.models import (  # noqa: F401
    SaglikKuruluKaydi,
    SaglikKuruluUye,
)
from app.features.yatis.models import (  # noqa: F401
    AmeliyatBilgisi,
    HastaIslemLogu,
    HastaNotu,
    HemsireGorevi,
    IlacUygulama,
    IzinHareketi,
    PanelBildirim,
    Refakatci,
    Servis,
    ServisHareketi,
    VardiyaDevirNotu,
    VitalBulgu,
    Yatak,
    YatakHareketi,
    YatisKaydi,
)
from app.features.ilac_talep.models import IlacTalebi, IlacTalepKalemi  # noqa: F401
from app.features.epikriz.models import Epikriz  # noqa: F401
