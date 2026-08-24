# Staj Defteri — Gün 6

**Tarih:** 27 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Mobil OTP/LAN API, web lookup ve PR birleştirme

---

Gün 5'te kalan WIP PR #23 ile main'e alındı. Odak yeni feature değil; mobil OTP geliştirme ergonomisi ve web lookup tutarlılığı. `resolveApiUrl`: boş/localhost ise Metro LAN IP; Android emülatör `10.0.2.2`. Backend OTP yanıtına `gelistirme_kodu` (yalnız development); formlar otomatik doldurur.

SecureStore ile token hydrate; demo hasta seed idempotent. Web randevu/tetkik lookup `LOOKUP_PAGE_SIZE`; admin randevu `ListPager`. Paginated `Page[T]` yanıtlarına web/mobil unwrap.

Aynı Wi-Fi'deki telefonda Expo Go → OTP → hasta paneli zinciri tekrarlanabilir hale geldi.

**Öğrenilenler:** Fiziksel cihazda `localhost` çalışmaz; dev OTP smoke süresini kısaltır; pagination istemci yüzeyi backend ile aynı PR'da kapanmalı; lookup sabit sayfa boyutu tutarlılık sağlar.
