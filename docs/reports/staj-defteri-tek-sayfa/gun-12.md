# Staj Defteri — Gün 12

**Tarih:** 4 Ağustos 2026  
**Proje:** Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS  
**Konu:** TC kimlik doğrulama ve Devlet HBYS Faz 1

---

Kimlik ve hasta güvenliği odaklı gün. TC kimlik algoritmik checksum (`tc_kimlik.py`): Pydantic tipleri, auth/hasta/personel şemaları; web `tc-kimlik.ts`, mobil `tcKimlik.ts`. NVI/KPS olmadan sahte 11 haneli numara engellendi.

ROADMAP Devlet HBYS Faz 1: MAR güvenlik, lab panic, MPI iskeleti, KPS kayıt, zorunlu bildirim bayrakları, OTP IP rate limit, veli/vasi onam, acil rızasız iki hekim. Migration 024–028; ilgili test suite'leri. PR #30; main merge çakışması ve CI düzeltmesi. GitHub repo About topic'leri güncellendi.

**Öğrenilenler:** TC checksum API kapısı KPS öncesi zorunlu; Faz 1 maddeleri gap analizine dayanmalı; veli/vasi ve acil rıza mevzuat yakın minimum backend kapıları gerektirir.
