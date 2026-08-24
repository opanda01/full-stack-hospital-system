# Staj Defteri — Gün 5

**Tarih:** 24 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Modern DB, yasal uyum ve liste pagination

---

Altyapı sertleştirme günü: modern hibrit DB (atomik yazım, MHRS idempotency, denetim partition, İstanbul TZ), PHI `public_id` UUID (dış API tahmin edilemez kimlik), yasal/klinik uyum Faz L–P ve liste pagination aynı günde main'e alındı.

Faz L: alerji–reçete hard-stop, DDI. Faz M: KVKK metinleri, AES-GCM PHI şifreleme. Faz N: Enabız/Medula/KPS mock portları. Faz O: güvenlik header'ları, postgres-backup, restore-smoke CI. Faz P: ICD-10, lab kalemleri. Migration 012–017.

Ortak `Page[T]` pagination; yatış N+1 azaltma (`batch_load`); web `ListPager` UI. Vite `/api` proxy varsayılan. Alembic 012 MHRS SQL bind escape hotfix.

**Öğrenilenler:** Hibrit DB'de yalnız yarış noktaları atomik yapılır; iç/dış kimlik ayrımı (`public_id`) migration'ı sade tutar; uyum paketi dikey slice olarak gitmeli; `Page[T]` erken standart olunca onlarca liste aynı desende güncellenir.
