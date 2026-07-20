# Çanakkale Mehmet Akif Ersoy Devlet Hastanesi — Hastane Bilgi Yönetim Sistemi

Monorepo: **pnpm workspaces** + **Turborepo**. Backend FastAPI (feature-based), web React+Vite (FSD), mobile Expo (sadeleştirilmiş FSD).

## Klasör yapısı

| Klasör | Amaç |
|--------|------|
| `backend/` | FastAPI API — vertical slice (feature) mimari, SQLModel, Alembic, JWT |
| `web/` | Personel / yönetim paneli — React + Vite + TypeScript, Feature-Sliced Design |
| `mobile/` | Hasta odaklı mobil uygulama — React Native (Expo Router) |
| `packages/shared-types/` | Backend OpenAPI şemasından üretilen paylaşılan TypeScript tipleri |

## Önkoşullar

- Node.js 20+
- [pnpm](https://pnpm.io) 9+
- Python 3.12+
- Docker Desktop (PostgreSQL + backend için)

## Geliştirme ortamını ayağa kaldırma

### 1. Bağımlılıklar

```bash
pnpm install
```

Backend için ayrı Python ortamı:

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 2. Veritabanı ve backend (Docker)

```bash
docker compose up -d
```

- PostgreSQL: `localhost:5432`
- Backend API: `http://localhost:8000`
- Health check: `http://localhost:8000/health`
- OpenAPI docs: `http://localhost:8000/docs`

### 3. Veritabanı migrasyonları

Backend konteyneri ayaktayken veya lokal venv ile:

```bash
cd backend
alembic upgrade head
python -m app.core.seed_cli
```

### 4. Web (host)

```bash
pnpm --filter web dev
```

Tarayıcı: `http://localhost:5173`

### 5. Mobile (host)

```bash
pnpm --filter mobile dev
```

Expo Dev Tools açılır; emülatör veya Expo Go ile çalıştırın.

## Shared types üretimi

Backend ayaktayken:

```bash
cd packages/shared-types
npx openapi-typescript http://localhost:8000/openapi.json -o src/index.ts
```

## Mimari kurallar (özet)

**Backend:** Her feature kendi `models` / `schemas` / `service` / `router` dosyalarını taşır. Feature’lar birbirinin **service** fonksiyonunu import edebilir; **router**’lar birbirini çağırmaz. Yetkilendirme `core/security.py` içindeki `require_permission(...)` ile yapılır (izin kodları DB’deki `izinler` tablosundan gelir).

**Web (FSD):** Bağımlılık yönü yalnızca `app → pages → widgets → features → entities → shared`. Her feature/entity public API için `index.ts` dışa aktarır.

**Mobile:** Sadece hasta rolü; sadeleştirilmiş FSD (`entities` / `features` / `shared`) + Expo Router.

## RBAC (rol / izin / kapsam)

Yetkilendirme **kod tabanlı**dır:

| Parça | Dosya |
|-------|--------|
| Roller | `app/core/enums.py` → `Rol` |
| İzin matrisi + kapsam | `app/core/permissions.py` → `IZIN_MATRISI`, `Kapsam` |
| Guard | `app/core/security.py` → `require_permission` / `require_role` |
| Query filtre | `app/core/scope.py` |
| Lookup | `app/core/lookups.py` |
| Model registry | `app/core/models_registry.py` |

- `Kullanici.rol` tek birincil roldür.
- `require_permission("randevu:goruntule")` → `request.state.kapsam` (`GLOBAL` / `KENDI_KAYDIM` / `DEPARTMANIM`).
- Belge: [`docs/rbac-yetki-matrisi.md`](docs/rbac-yetki-matrisi.md)

### Seed

```bash
cd backend
alembic upgrade head
python -m app.core.seed_cli
```

Demo şifre: `Test1234!` — `admin@hastane.test`, `doktor@hastane.test`, `hasta@hastane.test`, …
