# Staj Defteri — Gün 13

**Tarih:** 5 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Hasta OTP kapsam düzeltmesi ve mobil UX

---

Fiziksel cihazda Özet "Kendi kaydı kapsamı tanımlı değil", Randevu/Tahlil "Sunucuya bağlanılamadı" hataları giderildi. Kök neden: `require_permission` HASTA matrisi uygular; liste filtresi DB `rol` kullanıyordu. Çift profil (personel + hasta) kullanıcıda izin HASTA, filtre DOKTOR dalına düşüyordu.

`erisim_rolu(current_user, oturum_tipi)` eklendi; randevu, tetkik, PHR özet servislerine `oturum_tipi` aktarıldı. Mobil: `fetchRandevular`, `parseError` ile gerçek API mesajı; alt sekme FAB hizası (56px, tab bar padding). Test: `test_hasta_oturumunda_personel_rolu_ile_ozet`. PR #34.

**Öğrenilenler:** Hasta OTP oturumunda filtre rolü her zaman HASTA olmalı; 403 genel "bağlanılamadı" yerine `detail` gösterilmeli; çift profil senaryosu erken test edilmeli.
