# Staj Defteri — Gün 1: İskelet Kurulumu ve Teknoloji Seçimi

**Tarih:** 20 Temmuz 2026  
**Proje:** Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS (Hastane Bilgi Yönetim Sistemi)  
**Kapsam:** Monorepo iskeleti, tech stack kararları, mimari temeller, RBAC tasarımı, web panel iskeleti

---

### 1. Proje Tanımı

Bu proje, Çanakkale Mehmet Akif Ersoy Devlet Hastanesi için geliştirilen bir **Hastane Bilgi Yönetim Sistemi (HBYS)**dir. Sistem; web paneli (personel/yönetim) ve mobil istemci (hasta odaklı) üzerinden çalışacak şekilde monorepo olarak kurgulanmıştır. Doktor, hemşire, laborant, temizlik personeli, başhekim/müdür, idari personel ve hasta gibi **çok rollü** bir erişim modeli hedeflenmektedir. İlk günde uçtan uca klinik iş kurallarının tamamı değil; güvenli ve ölçeklenebilir bir kod iskeleti, teknoloji seçimleri ve yetkilendirme çerçevesi oturtulmuştur.

---

### 2. Teknoloji Yığını (Tech Stack) ve Seçim Gerekçeleri

#### Backend — FastAPI + SQLModel + Alembic + PostgreSQL + JWT

| Bileşen | Seçim | Gerekçe |
|---------|--------|---------|
| API | **FastAPI** | Async destek, otomatik OpenAPI/Swagger dokümantasyonu, Pydantic ile istek/yanıt tip güvenliği; Python ekosisteminin veri işleme ve test araçlarıyla uyum |
| ORM / modeller | **SQLModel** | Pydantic + SQLAlchemy birleşimi; tek model tanımı hem validasyon hem tablo şeması için kullanılabiliyor |
| Migrasyon | **Alembic** | Şema değişimlerinin versiyonlanması; takım çalışmasında “kim hangi tabloyu değiştirdi” izlenebilirliği |
| Kimlik doğrulama | **JWT** (`python-jose`) + **passlib/bcrypt** | Stateless API erişimi; mobil + web istemcilerde ortak token modeli |
| Çalıştırma | **Uvicorn** | ASGI sunucu; FastAPI ile doğal uyum |

`backend/requirements.txt` içindeki sabitlenmiş sürümler (ör. `fastapi==0.115.6`, `sqlmodel==0.0.22`, `alembic==1.14.0`, `psycopg[binary]==3.2.3`) tekrarlanabilir kurulum için kilitlenmiştir.

#### Web — React + Vite + TypeScript + TanStack Query + Zustand + shadcn/ui + Tailwind

| Bileşen | Seçim | Gerekçe |
|---------|--------|---------|
| UI framework | **React 18** + **TypeScript** | Bileşen modeli, tip güvenliği, geniş ekosistem |
| Bundler | **Vite 6** | Çok hızlı HMR; geliştirme deneyimini kısaltır |
| Server state | **TanStack Query** | API önbelleği, yeniden deneme, loading/error durumları; form/UI local state’ten ayrılır |
| Client state | **Zustand** | Auth oturumu / tema gibi ince client state; Redux’a göre daha az boilerplate |
| Stil / UI | **Tailwind** + **shadcn/ui** (Radix tabanlı) | Tutarlı tasarım token’ları, erişilebilir primitive’ler, soft UI’ye uygun |

#### Mobil — React Native + Expo

Hasta tarafı için **Expo (~52)** + **expo-router** seçildi. Tek kod tabanından iOS ve Android hedeflenir; web ile `@hastane/shared-types` üzerinden tip paylaşımı mümkün kılınır. İlk günde mobil iskelet (workspace paketi) kuruldu; klinik ekranların yoğunluğu sonraki fazlara bırakıldı.

#### Veritabanı — PostgreSQL 16

Hasta–randevu–doktor–departman gibi varlıklar **güçlü foreign-key ilişkileri** gerektirir. PostgreSQL ilişkisel bütünlük, indeksleme ve gerektiğinde JSON alan desteği sunar. Yerel geliştirmede `docker-compose.yml` ile `postgres:16-alpine` ayağa kaldırılır.

#### Monorepo — pnpm workspaces + Turborepo

Kök `pnpm-workspace.yaml` şu paketleri kapsar: `web`, `mobile`, `packages/*`. `turbo.json` ile `dev` / `build` / `typecheck` görevleri orkestre edilir. Amaç: tek repoda web + mobil + paylaşılan tipler; bağımlılık ve CI yönetimini merkezileştirmek.

---

### 3. Mimari Kararlar

#### Backend: Feature-based (vertical slice)

Her klinik/operasyonel domain kendi klasöründe **model + schema + service + router** taşır (ör. `backend/app/features/randevular/`). Gerekçe:

- Domain sayısı fazla (randevu, personel, tetkik, nöbet, …); yatay “controllers / models” klasörleri hızla karmaşıklaşır.
- Bir feature’ı tek başına anlamak, test etmek ve PR’da incelemek kolaylaşır.
- Ekip halinde paralel çalışma için sınırlar nettir.

Ortak altyapı (`db`, `security`, `permissions`, `scope`) `backend/app/core/` altında tutulur; feature’lar buraya bağımlıdır, tersi değil.

#### Web: Feature-Sliced Design (FSD)

Katman hiyerarşisi (üst → alt, **tek yönlü bağımlılık**):

```
app → pages → widgets → features → entities → shared
```

- **app:** router, providers, global stiller  
- **pages:** rota seviyesinde kompozisyon (rol bazlı ekranlar)  
- **widgets:** birden fazla entity/feature’ı birleştiren bloklar  
- **features:** kullanıcı aksiyonu (giriş yap, randevu oluştur, iptal et)  
- **entities:** iş nesneleri (hasta, doktor, randevu)  
- **shared:** api client, UI kit, auth yardımcıları, tema  

Alt katman üst katmanı import etmez; bu kural döngüsel bağımlılığı ve “her yerden her yere” sızıntıyı engeller.

#### Neden backend ve frontend mimarileri farklı?

- Backend ağırlıklı olarak **CRUD + iş kuralı + yetki** üretir; vertical slice yeterince net sınır verir, FSD kadar ince katmanlara bölmek over-engineering olurdu.
- Frontend **çok sayfalı, rol bazlı, bileşen kompozisyonlu** bir yüzeydir; FSD tam burada sayfa/özellik/entity ayrımını disipline eder.

---

### 4. Kurulan Klasör Yapısı

Monorepo kökü (özet):

```
hastane-sistemi/
├── backend/
├── web/
├── mobile/
├── packages/
│   └── shared-types/
├── docs/
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

#### Backend (`backend/app/`)

```
backend/app/
├── main.py
├── core/                 # db, security, permissions, scope, models_registry, config
├── features/
│   ├── auth/
│   ├── kullanicilar/
│   ├── rbac/
│   ├── departmanlar/
│   ├── personel/
│   ├── doktorlar/
│   ├── hastalar/
│   ├── randevular/       # models.py, schemas.py, service.py, router.py
│   ├── muayeneler/
│   ├── tetkikler/
│   ├── nobet_cizelgesi/
│   ├── temizlik_gorevleri/
│   └── ...
└── tests/
```

Örnek feature dilimi (`randevular/`):

```
randevular/
├── __init__.py
├── models.py
├── schemas.py
├── service.py
└── router.py
```

#### Web (`web/src/`)

```
web/src/
├── app/                  # router, providers, styles
├── pages/                # rol bazlı sayfalar (admin, doktor, hemsire, …)
├── widgets/
│   ├── departman-listesi/
│   ├── personel-tablosu/
│   └── randevu-takvimi/
├── features/
│   ├── giris-yap/
│   ├── randevu-olustur/
│   └── ...
├── entities/
│   ├── hasta/
│   ├── doktor/
│   ├── personel/
│   └── randevu/
├── shared/
│   ├── api/
│   ├── auth/
│   ├── theme/
│   ├── ui/
│   └── config/
└── main.tsx
```

---

### 5. Kurulum Sürecinde Karşılaşılan Teknik Sorunlar ve Çözümleri

#### 1) Windows’ta Alembic PATH sorunu

**Sorun:** Alembic global `pip install` ile kurulduğunda Windows’ta `Scripts` klasörü PATH’te olmayabiliyor; terminalde `alembic` komutu “tanınmıyor” hatası veriyor.  
**Çözüm:** Proje için sanal ortam (`venv`) kullanmak ve komutu modül olarak çalıştırmak: `python -m alembic upgrade head`. Böylece PATH’e bağımlılık azalır; doğru interpreter / paket seti garanti edilir. `alembic.ini` içinde `script_location = alembic` ve PostgreSQL URL tanımı iskeletin parçasıdır.

#### 2) `'pnpm' tanınmıyor` hatası

**Sorun:** Monorepo `packageManager: "pnpm@9.15.0"` bekler; pnpm yalnızca local `node_modules` bağımlılığı olarak kalırsa kabukta `pnpm` bulunamayabilir.  
**Çözüm:** `npm install -g pnpm` (veya Corepack ile packageManager etkinleştirme). Ardından kökten `pnpm install` ile workspace paketleri kurulur.

#### 3) SQLModel/SQLAlchemy forward reference → `KeyError: 'Personel'`

**Sorun:** Feature-based yapıda modeller ayrı paketlerde tanımlanır. İlişkilerde `"Personel"` gibi **string forward reference** kullanıldığında, ilgili sınıf runtime’da import edilmemişse SQLAlchemy mapper yapılandırması sınıfı registry’de bulamaz.  
**Çözüm:** `backend/app/core/models_registry.py` tüm tablo sınıflarını tek noktadan import eder (`# noqa: F401`). Uygulama açılışında (`main.py`) bu modül yüklenir; mapper configure aşamasında tüm hedefler hazır olur. Bu, dikey dilim mimarisinin “lazy import” ile çakışmasını bilinçli olarak çözen bir registry desenidir.

#### 4) CI’da pnpm sürüm çakışması

**Sorun:** `pnpm/action-setup` hem workflow’da hem `package.json` içindeki `packageManager` alanında sürüm görünce çakışma uyarısı / hata üretebiliyor.  
**Çözüm:** Workflow’dan (`ci.yml`) action üzerindeki sabit `version` alanı kaldırıldı; sürüm tek kaynak olarak kök `package.json` → `"packageManager": "pnpm@9.15.0"` kaldı. Güncel CI adımı yalnızca `pnpm/action-setup@v4` kullanıyor.

---

### 6. RBAC (Rol Bazlı Erişim Kontrolü) Tasarımı

#### Roller (11)

Kod enum’u (`Rol`) ile hizalı roller:

1. ADMIN  
2. BASHEKIM (Başhekim)  
3. MUDUR (Müdür)  
4. DOKTOR  
5. HEMSIRE (Hemşire)  
6. EBE  
7. LABORANT  
8. TEMIZLIK_PERSONELI  
9. GUVENLIK  
10. IDARI_PERSONEL  
11. HASTA  

#### İki katmanlı yetkilendirme

1. **Rol / izin katmanı** — `require_permission("kaynak:aksiyon")` / `require_role(...)`  
   Kullanıcının o endpoint’e hiç girip giremeyeceğini belirler. Matris: `IZIN_MATRISI` (`permissions.py`).

2. **Kapsam (scope) katmanı** — `GLOBAL` | `KENDI_KAYDIM` | `DEPARTMANIM` | `YOK`  
   Endpoint’e girdikten sonra **hangi kayıt satırlarının** döneceğini filtreler (`scope.py` + feature service).

**Neden ikisi birden?**  
Örnek: Doktorun `randevu:goruntule` izni vardır (yetki var); ancak kapsam `KENDI_KAYDIM` ise yalnızca kendi randevularını görür. Yani “kaynağa erişim yetkisi” ile “kaydın sahibi olmak” aynı şey değildir. Bu ayrım KVKK ve hasta güvenliği açısından zorunludur: yanlışlıkla “listeleyebilir” demek “tüm hastaneyi görebilir” anlamına gelmemelidir.

---

### 7. Web Panel Tasarım Kararları

#### Rol bazlı sayfa haritası (iskelet)

| Rol kökü | Örnek sayfalar (iskelet) |
|----------|---------------------------|
| `/admin` | Dashboard, kullanıcılar, personel, departmanlar, randevular, ayarlar |
| `/doktor` | Dashboard, randevularım, muayene, hastalarım, profil |
| `/hemsire`, `/ebe` | Dashboard, departman randevuları, nöbet |
| `/laborant` | Dashboard, bekleyen tetkikler |
| `/temizlik` | Dashboard, görevlerim |
| `/bashekim`, `/mudur` | Yönetim/operasyon panelleri |
| Ortak | Giriş, ayarlar, şikayet, KVKK/onboarding iskeleti |

Router, rol bazlı `RoleLayoutRoute` / `RoleGuard` ile korunan ağaçlar halinde kuruldu.

#### `pages/` granülerlik sorunu ve çözüm

İlk düzende sayfalar düz isimlerle (`doktor-dashboard`, `doktor-randevularim`, …) birikip keşfedilebilirliği düşürüyordu. Karar: **`pages/{rol}/...`** altında gruplamak (ör. `pages/doktor/randevularim`). Bu hem FSD `pages` katmanına uyumlu hem sitemap’i rol üzerinden okunabilir kılar.

#### Soft UI ve tema sistemi

Yumuşak köşeler, kart/border token’ları ve düşük gürültülü arayüz (soft UI) tercih edildi; klinik panelde uzun süre kullanım ve okunabilirlik öncelikli. Tema: **Açık / Koyu / OLED** (`data-theme`). OLED temada arka plan gerçek siyah (`#000`) tutulur; OLED panellerde siyah piksel ışık yaymaz → daha yüksek kontrast ve pil tasarrufu. Normal koyu tema ise koyu gri tonlarla “yumuşak koyu” hissi verir; ikisi bilinçli olarak ayrılmıştır.

---

### 8. Geliştirme Ortamı Kolaylaştırıcıları

**Mock auth** (`VITE_USE_MOCK_AUTH`): Backend veya JWT akışı henüz stabil değilken web UI’nin rol bazlı rotalarla geliştirilebilmesi için eklendi. Flag `true` iken `shared/auth` mock kullanıcılarla oturum açar; `false` iken gerçek API’ye (`VITE_API_URL`) geçilir. Tek satır env değişikliği ile entegrasyon modu seçilir — frontend’in backend’i beklemeden ilerlemesini sağlar.

Yerel altyapı: `docker-compose.yml` ile PostgreSQL + Redis (+ isteğe bağlı backend/celery) ayağa kalkar.

---

### 9. Sonraki Adımlar

1. **Faz 1 — Auth + RBAC backend entegrasyonu:** Access/refresh token yaşam döngüsü, login guard’larının web’e bağlanması, izin matrisi testleri.  
2. **Faz 2 — Departman / Personel / Doktor CRUD:** Yönetim paneli formları, seed verisi, liste/detay ekranlarının API’ye bağlanması.  
3. Tema + mock auth + `pages/` rol gruplamasının (Gün 2) tamamlanması ve QA checklist’e işlenmesi.

---

### Öğrenilenler

- **Feature-based vs FSD:** Backend’de domain dilimi; frontend’de katmanlı kompozisyon — aynı monorepoda bilinçli farklı mimari seçmek over/under-engineering’i dengeler.  
- **RBAC’ta yetki ≠ sahiplik:** `require_permission` kapıyı açar; `Kapsam` hangi odalara girebileceğini söyler.  
- **SQLAlchemy mapper resolution:** String ilişki hedefleri, import edilmeden resolve edilemez; feature-based yapıda merkezi `models_registry` pratik bir zorunluluktur.  
- **Monorepo araçları:** `packageManager` tek kaynak olmalı; CI ve lokal pnpm sürümleri çakışmamalı.  
- **Vite + TanStack Query:** UI hızı ile server-state disiplininin birlikte kurulması sonraki CRUD günlerini hızlandırır.

---

*Bu rapor, 20.07.2026 tarihli git geçmişi (`first commit`, roadmap iskeleti, AUTH+RBAC başlangıcı) ve güncel monorepo yapısı esas alınarak hazırlanmıştır.*
