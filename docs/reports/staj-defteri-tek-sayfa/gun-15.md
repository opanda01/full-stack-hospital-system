# Staj Defteri — Gün 15

**Tarih:** 7 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Auth akış analizi ve oturum kapsamı

---

Gün 13–14 sonrası kalan auth/kapsam boşlukları kapatıldı. `erisim_rolu` deseni muayene, epikriz, radyoloji, alerji, klinik onay, randevu erişim kontrolüne yayıldı. JWT: hasta oturumunda claim ve `/auth/me` efektif rol `HASTA`. OTP telefon normalizasyonu (`telefon_normalize`); GIRIS'te kayıt eşleşmesi.

Web: yeni `/hasta` OTP girişi; `authStore` refresh/rehydrate KVKK; `AyarlarRedirect` hasta yönlendirmesi. Mobil: guard `rol === HASTA` + `hydrated`; giriş hedefi `/(hasta)/ozet`. Şifre sıfırlama rate limit. Test: `test_auth_extended` 12 passed. PR #36.

**Öğrenilenler:** Oturum tipi tek kaynak kapsam kuralı olmalı; JWT claim DB rolünden bağımsız düşünülmeli; web/mobil hasta girişi ayrı rotalarla hizalanmalı; telefon normalizasyonu OTP güvenliği için şart.
