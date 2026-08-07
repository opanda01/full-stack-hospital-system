# Staj Defteri — Gün 16: HBYS operasyon UI (Faz C), bildirim DLQ ve klinik modülleri

**Tarih:** 7 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Dal / commit:** `feature/hbys-operasyon-ui-faz-c` — `ce213b1`, `617eebe`  
**Kapsam:** Operasyonel web ekranları (triyaj, mükerrer hasta, özel kimlik, randevu/yatak aksiyonları); backend Faz C (transfüzyon, sterilizasyon, entegrasyon outbox, bildirim DLQ); CI gitleaks

---

### 1. Günün Amacı

Backend’de hazır operasyon API’lerinin personel paneline bağlanması ve Faz C kapsamında eksik klinik/operasyon modüllerinin tamamlanması. Web tarafında admin ve paylaşılan rotalarda **acil triyaj**, **mükerrer hasta**, **özel kimlik kayıt**, **randevu provizyon/MHRS/gelmedi** ve **yatak/yatış izolasyon** akışlarının kullanılabilir hale getirilmesi.

| Alan | Çıktı |
|------|--------|
| Web operasyon | Yeni/ genişletilmiş ortak sayfalar + `RandevuOperasyonActions` |
| Backend | Transfüzyon, sterilizasyon, entegrasyon outbox, yatak/yatış izolasyon API |
| Bildirim | DLQ, Celery görevleri, config |
| Dokümantasyon | `hbys-operasyon-ui-envanter.md`, entegrasyon checklist güncellemeleri |
| CI | `.gitleaks.toml` allowlist, push env dedupe (`617eebe`) |

---

### 2. Web — operasyon ekranları

- **Acil triyaj:** `web/src/pages/ortak/acil-triyaj/` — admin, hemşire, doktor vb. rotalar (`router.tsx`).
- **Mükerrer hasta:** `web/src/pages/ortak/hasta-mukerrer/` — aday listesi, istek/onay akışı.
- **Özel kimlik:** `web/src/pages/ortak/ozel-kimlik-kayit/` — admin ve idari rotalar.
- **Randevu operasyon:** `web/src/features/randevu-operasyon/ui/RandevuOperasyonActions.tsx` — provizyon, gelmedi, MHRS; admin randevu listesine entegre.
- **Yatak yönetimi:** izolasyon ve yatış izolasyon gereksinimi PATCH’leri UI’da.
- **Nav:** `nav-items.ts` — acil triyaj, mükerrer, özel kimlik menü girdileri.
- **Başhekim entegrasyonlar:** outbox durumu görünürlüğü (`bashekim/entegrasyonlar`).

Envanter tablosu: [`docs/hbys-operasyon-ui-envanter.md`](../../hbys-operasyon-ui-envanter.md).

---

### 3. Backend — Faz C ve bildirim

- **Alembic:** `033_faz_plan.py`
- **Transfüzyon:** models, router, service, test (`test_transfuzyon.py`)
- **Sterilizasyon:** models, router, schemas
- **Entegrasyon:** `outbox_service.py`, router genişlemesi
- **Yatak / yatış:** izolasyon endpoint’leri (`yatak_yonetimi`, `yatis`)
- **Randevular:** operasyon servis genişlemesi
- **Bildirim:** `bildirim_dlq.py`, `bildirim_tasks.py`, `notifications.py`; Celery ve config güncellemeleri
- **Personel import:** task/import_service uyumu

---

### 4. CI ve güvenlik (`617eebe`)

- Gitleaks: `.env.example` için allowlist (`.gitleaks.toml`)
- Push workflow ortam değişkeni tekrarlarının giderilmesi

---

### 5. İlgili dosyalar (özet)

| Katman | Öne çıkanlar |
|--------|----------------|
| Web | `ortak/acil-triyaj`, `hasta-mukerrer`, `ozel-kimlik-kayit`, `yatak-yonetimi`, `features/randevu-operasyon`, `admin/randevular`, `bashekim/entegrasyonlar` |
| Backend | `transfuzyon`, `sterilizasyon`, `entegrasyonlar/outbox_service`, `yatak_yonetimi`, `yatis`, `core/bildirim_*` |
| Docs | `hbys-operasyon-ui-envanter.md`, `integrations/LIVE-CHECKLIST.md`, `ROADMAP.md` |

---

### 6. Test önerisi

- Web: triyaj kaydı, mükerrer aday listesi, randevu provizyon/gelmedi (yetkili rol).
- API: transfüzyon test suite; yatak/yatış izolasyon PATCH.
- CI: gitleaks ve mevcut backend/web pipeline.

---

*Bu rapor, `feature/hbys-operasyon-ui-faz-c` dalındaki `ce213b1` ve `617eebe` commit’leri için hazırlanmıştır. Gösterge paneli / navigasyon redesign için ayrı rapor: `gun-17-web-dashboard-nav-redesign.md`.*
