# Staj Defteri — Gün 4

**Tarih:** 23 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Hasta mobil Faz D ve Expo SDK 54 yükseltmesi

---

ROADMAP Faz D ile hasta mobil istemcisine geçildi. Mobil e-posta+şifre yerine telefon + TC + OTP akışı backend HASTA RBAC ile hizalandı. Oturum expo-secure-store + Zustand; randevularım, randevu al, tetkikler ve profil ekranları API'ye bağlandı.

Fiziksel cihazda Expo Go ile test için LAN API (`EXPO_PUBLIC_API_URL`), Metro `resolveApiUrl` ve development OTP (`gelistirme_kodu`) eklendi. Expo Go SDK 54 uyumsuzluğu, Metro monorepo çözümleme (`watchFolders`, `disableHierarchicalLookup`) ve `@expo/metro-runtime` sürüm hatası (`getDevServer is not a function`) giderildi. Expo ~54, RN 0.81.5, React 19.1'e yükseltildi.

PR #15 ile Faz D işlevsel kodu tamamlandı; Android bundle Metro'da 200 ile doğrulandı.

**Öğrenilenler:** İstemci–API drift mobil uygulamayı tamamen kırar; Expo Go sabit SDK zorlar; `@expo/metro-runtime` sürümü kritik; Windows + pnpm monorepo'da hoist ve Metro kökü şart.
