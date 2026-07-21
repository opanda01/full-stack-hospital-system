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
