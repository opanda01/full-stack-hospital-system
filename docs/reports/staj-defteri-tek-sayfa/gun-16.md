# Staj Defteri — Gün 16

**Tarih:** 7 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** HBYS operasyon UI (Faz C) ve bildirim DLQ

---

Hazır operasyon API'lerinin personel paneline bağlanması ve Faz C klinik modülleri. Web: acil triyaj, mükerrer hasta, özel kimlik kayıt, randevu provizyon/MHRS/gelmedi (`RandevuOperasyonActions`), yatak izolasyon PATCH'leri. Nav menü girdileri; başhekim entegrasyon outbox görünürlüğü.

Backend: transfüzyon, sterilizasyon, entegrasyon outbox; yatak/yatış izolasyon API; bildirim DLQ, Celery görevleri. Migration 033. CI: `.gitleaks.toml` allowlist. Envanter: `hbys-operasyon-ui-envanter.md`.

**Öğrenilenler:** Operasyon ekranları backend hazır API'ye bağlanarak hızlanır; DLQ bildirim güvenilirliği için gerekli; triyaj/mükerrer/özel kimlik HBYS operasyonunun temel yüzleri.
