# Operasyon UI envanteri (backend → web)

Backend’de mevcut olup personel paneline bağlanan operasyon ekranları.

| API / iş akışı | Web sayfa | Rotalar (örnek) |
|----------------|-----------|-----------------|
| `GET/POST /acil/triyaj` | [`web/src/pages/ortak/acil-triyaj/`](../web/src/pages/ortak/acil-triyaj/) | `/admin/acil-triyaj`, `/hemsire/acil-triyaj`, `/doktor/acil-triyaj`, … |
| `GET /hastalar/mukerrer-adaylar`, mükerrer istek/onay | [`web/src/pages/ortak/hasta-mukerrer/`](../web/src/pages/ortak/hasta-mukerrer/) | `/admin/hasta-mukerrer`, `/bashekim/…`, `/mudur/…` |
| `POST /hastalar/ozel-kimlik` | [`web/src/pages/ortak/ozel-kimlik-kayit/`](../web/src/pages/ortak/ozel-kimlik-kayit/) | `/admin/ozel-kimlik-kayit`, `/idari/ozel-kimlik-kayit` |
| `POST /randevular/{id}/provizyon`, `/gelmedi`, `/mhrs` | [`web/src/features/randevu-operasyon/`](../web/src/features/randevu-operasyon/) | Admin/müdür/başhekim randevu listesi |
| `PATCH /yatak-yonetimi/yataklar/{id}` (izolasyon) | [`web/src/pages/ortak/yatak-yonetimi/`](../web/src/pages/ortak/yatak-yonetimi/) | Tüm rollerde yatak yönetimi |
| `PATCH /yatis/kayitlar/{id}/izolasyon` | Aynı yatak sayfası | Yatış izolasyon gereksinimi |

İlgili backend: [`backend/app/features/acil/`](../backend/app/features/acil/), [`hastalar/`](../backend/app/features/hastalar/), [`randevular/`](../backend/app/features/randevular/), [`yatak_yonetimi/`](../backend/app/features/yatak_yonetimi/), [`yatis/`](../backend/app/features/yatis/).
