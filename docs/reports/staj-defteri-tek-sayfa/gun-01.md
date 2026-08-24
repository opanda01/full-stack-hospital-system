# Staj Defteri — Gün 1

**Tarih:** 20 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Monorepo iskeleti, teknoloji seçimi ve RBAC tasarımı

---

Bugün kamu devlet hastanesi senaryosu için Hastane Bilgi Yönetim Sistemi (HBYS) monorepo iskeleti kuruldu. Backend FastAPI + SQLModel + Alembic + PostgreSQL + JWT; web React 18 + Vite + TypeScript + TanStack Query + Zustand + shadcn/ui; mobil Expo (~52) + expo-router; monorepo yönetimi pnpm workspaces ve Turborepo ile yapılandırıldı.

Backend'de feature-based (vertical slice) mimari seçildi: her domain kendi model, schema, service ve router dosyalarını taşır. Web tarafında Feature-Sliced Design (FSD) katman hiyerarşisi (app → pages → widgets → features → entities → shared) uygulandı. Ortak altyapı `core/` altında; klinik domain'ler `features/` altında ayrıldı.

Kurulum sürecinde Windows'ta Alembic PATH sorunu (`python -m alembic`), pnpm tanınmama hatası, SQLModel forward reference `KeyError` (çözüm: `models_registry.py`) ve CI pnpm sürüm çakışması giderildi. RBAC için 11 rol tanımlandı; yetki (`require_permission`) ve kapsam (`GLOBAL`, `KENDI_KAYDIM`, `DEPARTMANIM`) iki katmanlı model tasarlandı.

Web panelde rol bazlı sayfa haritası, soft UI ve Açık/Koyu/OLED tema sistemi planlandı. Mock auth (`VITE_USE_MOCK_AUTH`) ile frontend backend beklemeden geliştirilebilir hale getirildi.

**Öğrenilenler:** Backend ve frontend için farklı mimari desenler bilinçli seçilebilir; RBAC'ta yetki ve sahiplik ayrımı KVKK için zorunludur; feature-based yapıda merkezi model registry SQLAlchemy mapper hatalarını önler.
