# Staj Defteri — Gün 2

**Tarih:** 21 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Auth/RBAC entegrasyonu, web panel düzeni ve tema

---

Gün 1 iskeleti üzerine sistemin giriş yapılabilir ve rolüne göre yönlendirilebilir hale getirilmesi hedeflendi. JWT access + refresh token yaşam döngüsü tamamlandı; `require_permission` / `require_role` guard'ları `IZIN_MATRISI` ile endpoint'lere bağlandı. Personel toplu import için Celery + Redis worker hattı eklendi.

Web `pages/` klasörü rol bazlı yeniden düzenlendi (`pages/admin/`, `pages/doktor/`, `pages/hemsire/`, …). `router.tsx` ve `RoleLayoutRoute` yeni yapıya uyarlandı. Tema sistemi (Açık / Koyu / OLED) `shared/theme` altında token'lar, Zustand store ve CSS değişkenleriyle kuruldu; ayarlar ekranında `TemaSecici` eklendi.

Mock auth (`VITE_USE_MOCK_AUTH`) ile backend olmadan rol bazlı UI geliştirme mümkün kılındı. Aynı gün doktor/randevu panelleri API'ye bağlandı ve seed örnek verisi eklendi. CI: web typecheck ve backend pytest yeşil tutuldu.

**Öğrenilenler:** Rol klasörleri keşfedilebilirliği artırır; onboarding (şifre/KVKK) auth'un parçasıdır ve guard ile bağlanmalıdır; uzun işler Celery'ye alınmalıdır; tema token'ları bileşen bazlı `if (dark)` yazmaktan sürdürülebilir.
