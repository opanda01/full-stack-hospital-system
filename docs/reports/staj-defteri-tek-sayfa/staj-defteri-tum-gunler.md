# Staj Defteri — Tüm Günler (Tek Sayfa Özetler)

**Proje:** Devlet Hastanesi HBYS (Çanakkale Mehmet Akif Ersoy Devlet Hastanesi)  
**Dönem:** 20 Temmuz – 24 Ağustos 2026 (26 iş günü)

Bu belge, günlük staj defteri özetlerinin birleştirilmiş halidir. Her bölüm yaklaşık bir Word sayfasına sığacak şekilde kısaltıldı. Detaylı raporlar: `docs/reports/2026-*` klasörleri.

---

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

---

# Staj Defteri — Gün 2

**Tarih:** 21 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Auth/RBAC entegrasyonu, web panel düzeni ve tema

---

Gün 1 iskeleti üzerine sistemin giriş yapılabilir ve rolüne göre yönlendirilebilir hale getirilmesi hedeflendi. JWT access + refresh token yaşam döngüsü tamamlandı; `require_permission` / `require_role` guard'ları `IZIN_MATRISI` ile endpoint'lere bağlandı. Personel toplu import için Celery + Redis worker hattı eklendi.

Web `pages/` klasörü rol bazlı yeniden düzenlendi (`pages/admin/`, `pages/doktor/`, `pages/hemsire/`, …). `router.tsx` ve `RoleLayoutRoute` yeni yapıya uyarlandı. Tema sistemi (Açık / Koyu / OLED) `shared/theme` altında token'lar, Zustand store ve CSS değişkenleriyle kuruldu; ayarlar ekranında `TemaSecici` eklendi.

Mock auth (`VITE_USE_MOCK_AUTH`) ile backend olmadan rol bazlı UI geliştirme mümkün kılındı. Aynı gün doktor/randevu panelleri API'ye bağlandı ve seed örnek verisi eklendi. CI: web typecheck ve backend pytest yeşil tutuldu.

**Öğrenilenler:** Rol klasörleri keşfedilebilirliği artırır; onboarding (şifre/KVKK) auth'un parçasıdır ve guard ile bağlanmalıdır; uzun işler Celery'ye alınmalıdır; tema token'ları bileşen bazlı `if (dark)` yazmaktan sürdürülebilir.

---

# Staj Defteri — Gün 3

**Tarih:** 22 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Rol panelleri, klinik derinlik ve güvenlik paneli

---

Auth/RBAC oturduktan sonra gerçek personel rollerine göre kullanılabilir paneller üretildi. Admin operasyonel sertleştirme: denetim ekranı, RBAC UI, şifre sıfırlama, login rate limit. Başhekim paneli: erişim onayı, klinik onay, MHRS, eczane, faturalandırma, entegrasyonlar; migration 006 ve izin envanteri dokümantasyonu.

Doktor klinik masası: kendi hasta kapsamı (`GET /hastalar/benim`), muayene, tetkik, konsültasyon, sağlık kurulu, klinik belgeler. Hemşire servis yatış paneli (yatak, MAR, ilaç talep, vardiya devir) ve klinik görünürlük (hasta arama, epikriz, order takibi) tamamlandı. EBE paneli hemşire sayfalarının kopyalanmadan `/ebe` altına mount edilmesiyle sağlandı (`useRoleBasePath`).

Güvenlik paneli: olay, ziyaretçi, kayıp eşya, devriye, refakatçi sorgula. ROADMAP Faz F–K uygulandı; `docs/reports` tarih klasörleri standartlaştırıldı.

**Öğrenilenler:** Rol paneli = kapsam + yasak listesi; dikey slice (feature + migration + web + test) entegrasyon borcunu azaltır; rol paritesi için mount, kopya değil; güvenlik paneli klinik PHI'den bilinçli ayrıldı.

---

# Staj Defteri — Gün 4

**Tarih:** 23 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Hasta mobil Faz D ve Expo SDK 54 yükseltmesi

---

ROADMAP Faz D ile hasta mobil istemcisine geçildi. Mobil e-posta+şifre yerine telefon + TC + OTP akışı backend HASTA RBAC ile hizalandı. Oturum expo-secure-store + Zustand; randevularım, randevu al, tetkikler ve profil ekranları API'ye bağlandı.

Fiziksel cihazda Expo Go ile test için LAN API (`EXPO_PUBLIC_API_URL`), Metro `resolveApiUrl` ve development OTP (`gelistirme_kodu`) eklendi. Expo Go SDK 54 uyumsuzluğu, Metro monorepo çözümleme (`watchFolders`, `disableHierarchicalLookup`) ve `@expo/metro-runtime` sürüm hatası (`getDevServer is not a function`) giderildi. Expo ~54, RN 0.81.5, React 19.1'e yükseltildi.

PR #15 ile Faz D işlevsel kodu tamamlandı; Android bundle Metro'da 200 ile doğrulandı.

**Öğrenilenler:** İstemci–API drift mobil uygulamayı tamamen kırar; Expo Go sabit SDK zorlar; `@expo/metro-runtime` sürümü kritik; Windows + pnpm monorepo'da hoist ve Metro kökü şart.

---

# Staj Defteri — Gün 5

**Tarih:** 24 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Modern DB, yasal uyum ve liste pagination

---

Altyapı sertleştirme günü: modern hibrit DB (atomik yazım, MHRS idempotency, denetim partition, İstanbul TZ), PHI `public_id` UUID (dış API tahmin edilemez kimlik), yasal/klinik uyum Faz L–P ve liste pagination aynı günde main'e alındı.

Faz L: alerji–reçete hard-stop, DDI. Faz M: KVKK metinleri, AES-GCM PHI şifreleme. Faz N: Enabız/Medula/KPS mock portları. Faz O: güvenlik header'ları, postgres-backup, restore-smoke CI. Faz P: ICD-10, lab kalemleri. Migration 012–017.

Ortak `Page[T]` pagination; yatış N+1 azaltma (`batch_load`); web `ListPager` UI. Vite `/api` proxy varsayılan. Alembic 012 MHRS SQL bind escape hotfix.

**Öğrenilenler:** Hibrit DB'de yalnız yarış noktaları atomik yapılır; iç/dış kimlik ayrımı (`public_id`) migration'ı sade tutar; uyum paketi dikey slice olarak gitmeli; `Page[T]` erken standart olunca onlarca liste aynı desende güncellenir.

---

# Staj Defteri — Gün 6

**Tarih:** 27 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Mobil OTP/LAN API, web lookup ve PR birleştirme

---

Gün 5'te kalan WIP PR #23 ile main'e alındı. Odak yeni feature değil; mobil OTP geliştirme ergonomisi ve web lookup tutarlılığı. `resolveApiUrl`: boş/localhost ise Metro LAN IP; Android emülatör `10.0.2.2`. Backend OTP yanıtına `gelistirme_kodu` (yalnız development); formlar otomatik doldurur.

SecureStore ile token hydrate; demo hasta seed idempotent. Web randevu/tetkik lookup `LOOKUP_PAGE_SIZE`; admin randevu `ListPager`. Paginated `Page[T]` yanıtlarına web/mobil unwrap.

Aynı Wi-Fi'deki telefonda Expo Go → OTP → hasta paneli zinciri tekrarlanabilir hale geldi.

**Öğrenilenler:** Fiziksel cihazda `localhost` çalışmaz; dev OTP smoke süresini kısaltır; pagination istemci yüzeyi backend ile aynı PR'da kapanmalı; lookup sabit sayfa boyutu tutarlılık sağlar.

---

# Staj Defteri — Gün 7

**Tarih:** 28 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Hasta mobil e-Nabız özeti, profil ve randevu takvimi

---

Hasta uygulaması e-Nabız benzeri PHR yüzüne çıkarıldı. Tab'lar: Özet, Randevu, Randevu Al, Tahlil, Profil. Özet hub: yaklaşan randevu, son tetkik; menü: muayene, reçete, belge, şikayet. Tarih-saat `tr-TR` formatında.

Backend: `boy_cm` / `kilo_kg` (migration 018), `PATCH /hastalar/ben`; epikriz ve tetkik hasta okuma izinleri. Seed: her poliklinikte ≥3 online randevu doktoru. Randevularım / Geçmiş sekmeleri; randevu takvimi eklendi. Profil: boy, kilo, VKİ, kan grubu, telefon düzenleme.

Metro LAN API proxy ile fiziksel cihaz testi sürdürüldü.

**Öğrenilenler:** PHR özet hub tek bakışta hasta deneyimini toplar; profil PATCH PHI şifrelemesi korunmalı; seed verisi poliklinik başına yeterli doktorla randevu akışını test edilebilir kılar.

---

# Staj Defteri — Gün 8

**Tarih:** 29 Temmuz 2026  
**Proje:** Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS  
**Konu:** Web kurumsal kimlik ve doktor panel eksikleri

---

Web kurumsal kimlik netleştirildi: tema token'ları, klinik durum renkleri, `InstitutionEmblem`, AppShell (sidebar, topbar), MetricCard. Auth/profil personel alanları genişletildi. Doktor panel günlük iş akışları tamamlandı: randevu çizelgesi, hasta seçimi, ICD-10 tanı, reçete/sevk/tıbbi rapor formları, Servisim (yatış listesi), Nöbetlerim (salt okunur).

Departman nöbet ve temizlik çizelgeleri; backend slot kuralları ve seed'ler. Kişiselleştirilmiş doktor dashboard. PR #27: 115 dosya, +6928 satır. Klinik belgeler sayfasında görsel sadeleştirme.

**Öğrenilenler:** Kurumsal shell tüm rollerde görsel dil birliği sağlar; doktor paneli yönetim panellerinden kapsam ile ayrılmalı; çizelge + slot kuralları backend'de tanımlanmalı; büyük UI PR'ları smoke test ile doğrulanmalı.

---

# Staj Defteri — Gün 9

**Tarih:** 30 Temmuz 2026  
**Proje:** Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS  
**Konu:** Entegrasyon QA ve hasta PHR tasarımı

---

Gün 8 doktor panel dalı main ile hizalandıktan sonra manuel doğrulama ve PHR sonraki faz tasarımı yapıldı. Migration 019 (nöbet çizelgesi) doğrulandı. Doktor UAT: randevu grid, ICD-10, klinik belge → onay kuyruğu, Servisim, Nöbetlerim geçti.

Tespit edilen boşluklar: hasta Özet parça parça endpoint'lere bağlı → tek `GET /hastalar/ben/ozet` tasarlandı; onaylı reçete/sevk/rapor mobilde görünmüyor → birleşik belge listesi planlandı; tetkik okunmamış rozeti için `hasta_goruldu_at` alanı tasarlandı.

Birleşik belge modeli: onaylı Epikriz + onaylı KlinikOnayKaydi (RECETE, SEVK, TIBBI_RAPOR); ortak DTO, sayfalı liste. Bu gün kod commit'i yok; çıktı test notları ve 31 Temmuz implementasyon planı.

**Öğrenilenler:** UAT doktor tarafını doğrular; PHR veri kaynağı önceden sözleşmeyle netleşmeli; analiz günleri implementasyon borcunu azaltır.

---

# Staj Defteri — Gün 10

**Tarih:** 31 Temmuz 2026  
**Proje:** Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS  
**Konu:** Hasta PHR belgeler, özet API ve CI typecheck

---

Gün 9 PHR sözleşmesi uygulandı. `phr_service`: birleşik onaylı belgeler, `hasta_ozet` (yaklaşan randevu, okunmamış tetkik, yatış özeti), `yatis_ozet`. Router: `/hastalar/ben/belgeler`, `/ben/ozet`, `/ben/yatis-ozet`. Migration 020: `tetkikler.hasta_goruldu_at`. Şikayet `GET /sikayet-oneri/benim`.

Mobil parite: Özet, Belgelerim, Reçetelerim, Profil, Şikayet tek API'den beslenir. Özet yaklaşan randevu UTC düzeltmesi (`as_utc`). CI: `@types/react` override, shared-types tsc, mobil `tsconfig` `process` hatası giderildi. Maestro E2E iskeleti.

**Öğrenilenler:** Tek belge listesi hasta UX'i sadeleştirir; özet hub backend-odaklı olmalı; monorepo React 19 tip hizalama CI'da erken kırılır; tetkik okunma zamanı bildirim sayacına bağlanır.

---

# Staj Defteri — Gün 11

**Tarih:** 3 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Yatak yönetimi, ameliyathane, Orthanc radyoloji

---

PHR dalı üzerine klinik operasyon modülleri eklendi. Yatak yönetimi: Servis/Oda/Yatak envanteri (migration 021), doluluk özeti, yatak atama; web `YatakHaritasi` widget; hemşire servis-takip uyumu. Ameliyathane: plan, ekip, anestezi (migration 022); takvim, post-op akışları.

Orthanc PACS: docker-compose konteyneri, backend istemci; radyoloji istem–görüntü bağlantısı (migration 023). Yatış ve PHR `yatis_ozet` tek envanter modeline bağlandı. `origin/main` merge; 6 dosya çakışma çözüldü; pytest 121 geçti; web build başarılı. PR #29.

**Öğrenilenler:** Yatak envanteri yatış ve PHR'yi tek kaynakta birleştirir; ameliyathane tetkik benzeri feature yapısında modellenir; PACS yerel Orthanc ile başlanabilir; büyük dal merge öncesi test zorunlu.

---

# Staj Defteri — Gün 12

**Tarih:** 4 Ağustos 2026  
**Proje:** Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS  
**Konu:** TC kimlik doğrulama ve Devlet HBYS Faz 1

---

Kimlik ve hasta güvenliği odaklı gün. TC kimlik algoritmik checksum (`tc_kimlik.py`): Pydantic tipleri, auth/hasta/personel şemaları; web `tc-kimlik.ts`, mobil `tcKimlik.ts`. NVI/KPS olmadan sahte 11 haneli numara engellendi.

ROADMAP Devlet HBYS Faz 1: MAR güvenlik, lab panic, MPI iskeleti, KPS kayıt, zorunlu bildirim bayrakları, OTP IP rate limit, veli/vasi onam, acil rızasız iki hekim. Migration 024–028; ilgili test suite'leri. PR #30; main merge çakışması ve CI düzeltmesi. GitHub repo About topic'leri güncellendi.

**Öğrenilenler:** TC checksum API kapısı KPS öncesi zorunlu; Faz 1 maddeleri gap analizine dayanmalı; veli/vasi ve acil rıza mevzuat yakın minimum backend kapıları gerektirir.

---

# Staj Defteri — Gün 13

**Tarih:** 5 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Hasta OTP kapsam düzeltmesi ve mobil UX

---

Fiziksel cihazda Özet "Kendi kaydı kapsamı tanımlı değil", Randevu/Tahlil "Sunucuya bağlanılamadı" hataları giderildi. Kök neden: `require_permission` HASTA matrisi uygular; liste filtresi DB `rol` kullanıyordu. Çift profil (personel + hasta) kullanıcıda izin HASTA, filtre DOKTOR dalına düşüyordu.

`erisim_rolu(current_user, oturum_tipi)` eklendi; randevu, tetkik, PHR özet servislerine `oturum_tipi` aktarıldı. Mobil: `fetchRandevular`, `parseError` ile gerçek API mesajı; alt sekme FAB hizası (56px, tab bar padding). Test: `test_hasta_oturumunda_personel_rolu_ile_ozet`. PR #34.

**Öğrenilenler:** Hasta OTP oturumunda filtre rolü her zaman HASTA olmalı; 403 genel "bağlanılamadı" yerine `detail` gösterilmeli; çift profil senaryosu erken test edilmeli.

---

# Staj Defteri — Gün 14

**Tarih:** 6 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Mobil sekme önbelleği, skeleton ve hastaApi

---

Hasta mobil sekme geçişlerinde tam ekran spinner ve gereksiz ağ trafiği azaltıldı. React Query: `staleTime` 60 sn, merkezi `queryKeys`, `useRefetchOnTabFocus` — sekmeye dönüşte önbellek anında, arka planda refetch.

`hastaApi.ts`: sayfalı listeler, detay, `parseError` (FastAPI detail). Skeleton bileşenleri: `RandevuScreenSkeleton`, `OzetSkeleton` vb. (~360 satır pulse animasyon). Ekranlar ince `useQuery` ile kalır; invalidation tek `queryKeys` üzerinden.

**Öğrenilenler:** Mobilde staleTime sekme UX'ini belirgin iyileştirir; skeleton ilk yüklemede spinner'dan daha iyi; fetch mantığı tek katmanda toplanmalı; focus refetch window focus yerine Expo `useFocusEffect` ile yapılır.

---

# Staj Defteri — Gün 15

**Tarih:** 7 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Auth akış analizi ve oturum kapsamı

---

Gün 13–14 sonrası kalan auth/kapsam boşlukları kapatıldı. `erisim_rolu` deseni muayene, epikriz, radyoloji, alerji, klinik onay, randevu erişim kontrolüne yayıldı. JWT: hasta oturumunda claim ve `/auth/me` efektif rol `HASTA`. OTP telefon normalizasyonu (`telefon_normalize`); GIRIS'te kayıt eşleşmesi.

Web: yeni `/hasta` OTP girişi; `authStore` refresh/rehydrate KVKK; `AyarlarRedirect` hasta yönlendirmesi. Mobil: guard `rol === HASTA` + `hydrated`; giriş hedefi `/(hasta)/ozet`. Şifre sıfırlama rate limit. Test: `test_auth_extended` 12 passed. PR #36.

**Öğrenilenler:** Oturum tipi tek kaynak kapsam kuralı olmalı; JWT claim DB rolünden bağımsız düşünülmeli; web/mobil hasta girişi ayrı rotalarla hizalanmalı; telefon normalizasyonu OTP güvenliği için şart.

---

# Staj Defteri — Gün 16

**Tarih:** 7 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** HBYS operasyon UI (Faz C) ve bildirim DLQ

---

Hazır operasyon API'lerinin personel paneline bağlanması ve Faz C klinik modülleri. Web: acil triyaj, mükerrer hasta, özel kimlik kayıt, randevu provizyon/MHRS/gelmedi (`RandevuOperasyonActions`), yatak izolasyon PATCH'leri. Nav menü girdileri; başhekim entegrasyon outbox görünürlüğü.

Backend: transfüzyon, sterilizasyon, entegrasyon outbox; yatak/yatış izolasyon API; bildirim DLQ, Celery görevleri. Migration 033. CI: `.gitleaks.toml` allowlist. Envanter: `hbys-operasyon-ui-envanter.md`.

**Öğrenilenler:** Operasyon ekranları backend hazır API'ye bağlanarak hızlanır; DLQ bildirim güvenilirliği için gerekli; triyaj/mükerrer/özel kimlik HBYS operasyonunun temel yüzleri.

---

# Staj Defteri — Gün 17

**Tarih:** 7 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Web gösterge paneli ve navigasyon redesign

---

Uzun sidebar yönetim rollerinde modül karmaşası yaratıyordu. Admin/Başhekim/Müdür için gösterge hub: URL'li sekmeler (`/admin/ozet`, bekleyenler, operasyon, …), `DashboardHub`, `QuickLinkGrid`. Domain tabanlı üst navigasyon: `PrimaryNav` (Gösterge, İnsan & erişim, Hasta & klinik, …) + bağlamsal yan menü.

AppShell sadeleştirildi: sticky üst header; pilot rollerde sidebar 200px. Giriş sonrası ana yollar `/admin/ozet`, `/bashekim/ozet`, `/mudur/ozet`. Dokümantasyon: `web/docs/navigation.md`.

**Öğrenilenler:** Gösterge paneli komuta merkezi olmalı; domain navigasyonu uzun menüleri gruplar; üst şerit tekrarlayan başlıkları kaldırarak alan kazandırır; NavLink sekmeler Radix tabs olmadan da erişilebilir olabilir.

---

# Staj Defteri — Gün 18

**Tarih:** 7 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Gösterge metrikleri ve şikayet durum yönetimi

---

Gün 17 hub sonrası KPI kartları anlamsal renk ve durum rozetleriyle zenginleştirildi (`metricCardSemantics`: kritik/uyarı/nötr). Admin/Başhekim/Müdür özet: `DashboardInsetList`, şikayet özeti, kısayollar. Şikayet modülü: dört durum filtresi (beklemede, inceleniyor, çözüldü, reddedildi) + PATCH durum güncelleme.

Backend: `GET …/ozet`, `PATCH …/{id}/durum`; RBAC ve `test_sikayet_oneri_durum.py`. Spec: `backend-sikayet-durum-spec.md`. Veri kancaları şikayet özet API'ye bağlandı.

**Öğrenilenler:** Metrik kartları renk ve rozet ile bağlam sunar; şikayet durum yaşam döngüsü filtre + güncelleme ile tamamlanır; boş durumlar açık gösterilmeli.

---

# Staj Defteri — Gün 19

**Tarih:** 11 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Plan demo, üst bar navigasyon ve PHR mobil

---

Panates/Probel benzeri demo senaryoları prod entegrasyon olmadan gösterildi. Tüm personel rollerinde sidebar kaldırıldı; `PrimaryNav` + `SecondaryNav` üst şerit navigasyonu. Profil çift sidebar sorunu: rol altı `/…/profil`. Backend demo: laborant/idari/analytics özet API'leri; PHR aşı ve aktif ilaç (`migration 034`); zorunlu bildirim mock BBY outbox.

Web: başhekim analitik Recharts grafikleri; muayene bildirim checkbox'ları. Mobil: aşı takvimi, aktif ilaçlar ekranları. Seed `seed_plan_demo.py`. PR #40.

**Öğrenilenler:** Demo kapsamı mock portlarla güvenli gösterilir; üst bar navigasyon tüm rollerde tutarlılık sağlar; PHR mobil genişlemesi backend endpoint'leriyle eşlenmeli.

---

# Staj Defteri — Gün 20

**Tarih:** 12 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Nav hizası, toplu seed, nöbet silme ve kullanıcı filtre

---

Gösterge paneli alt sekme yerleşimi tüm modüllere yayıldı: `SecondaryNav` içerik alanı üstünde (Gösterge ile aynı his). Profil URL düzeltmesi: `roleRootForRole` → `/admin/profil` (önceki `/admin/ozet/profil` 404).

Toplu personel seed: `seed_personel_toplu` — 11 rol × 50 = 550 kayıt; Docker entrypoint idempotent. Nöbet çizelgesi: Trash2 silme butonu, DnD silme alanı (`NobetSilmeAlani`), `DELETE /nobet-cizelgesi/{id}`. Kullanıcı listesi sunucu tarafı `rol` + `aktif_mi` filtreleri (önce istemci filtresi boş liste veriyordu).

**Öğrenilenler:** Alt navigasyon tutarlılığı UX'te önemli; profil URL rol kökünden türetilmeli; demo ortamı için toplu seed otomatik çalışmalı; liste filtreleri sunucu tarafında yapılmalı.

---

# Staj Defteri — Gün 21

**Tarih:** 17 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** PR #40 sonrası stabilizasyon ve merge doğrulama

---

Plan demo ve üst bar navigasyon merge’ünden sonra `feature/plan-uygulama` branch’i `main` ile birleştirildi; `router.tsx`, profil URL ve seed dosyalarındaki conflict’ler çözüldü. `pnpm-lock.yaml` web importer uyumu için güncellendi (CI frozen-lockfile hatası giderildi).

Manuel smoke test: admin, başhekim, müdür rollerinde `PrimaryNav` + `SecondaryNav` ve gösterge alt sekmeleri doğrulandı. PHR mobil aşı/aktif ilaç ekranları backend endpoint’leriyle eşleştirildi. `test_plan_dashboard.py` yeşil.

**Öğrenilenler:** Büyük branch’lerde erken merge conflict birikimini azaltır; lock dosyası monorepo CI’da bloklayıcıdır; demo seed idempotent olmalıdır.

---

# Staj Defteri — Gün 22

**Tarih:** 18 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Admin gösterge paneli UX analizi ve iyileştirme planı

---

Admin Özet sekmesi sekiz eşit KPI kartı ve boş alt bölge ile “yarım kalmış” hissi veriyordu. Dekoratif renk döngüsü (`RENK[i % 4]`), bağlamsız sayılar, “Nöbet: Git” bug’ı ve client-side 200 kayıt filtresi analiz edildi.

Hedef mimari çıkarıldı: hero KPI (bekleyen randevu/şikayet/temizlik), compact istatistik şeridi, haftalık trend + servis doluluk grafikleri, aktivite listeleri. Backend için `AdminOzet` genişletme, zero-fill trend API ve tek sorgulu servis doluluk; frontend için `MetricCard` boyutları ve `dashboardEsikleri.ts` planlandı.

**Öğrenilenler:** Hastane panellerinde renk durum dili olmalıdır; KPI hiyerarşisi operasyonel alarm ile arka plan istatistiğini ayırmalıdır; teknik kısıtlar (zero-fill, N+1 yasak) plana yazılmalıdır.

---

# Staj Defteri — Gün 23

**Tarih:** 19 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Admin dashboard backend API genişletmesi

---

`backend/app/features/dashboard/router.py` güncellendi. `AdminOzet`’e şikayet bekleyen, temizlik açık, yatak dolu/boş, aktif yatış, nöbet bugün ve randevu onay bekleyen alanları SQL COUNT ile eklendi.

`GET /dashboard/admin/trend?gun=7` — randevu ve yatış günlük dizileri; `_zero_fill_gunluk()` ile kayıtsız günler `adet: 0`. `GET /dashboard/admin/servis-doluluk` — `GROUP BY servis_id` tek aggregate sorgu. `test_admin_dashboard.py`: 8 test (COUNT, zero-fill, 401/403).

**Öğrenilenler:** Grafik API’lerinde zero-fill backend sorumluluğudur; toplu doluluk N+1 yerine tek sorgu ile yapılmalıdır; admin metrikleri için yetki testleri zorunludur.

---

# Staj Defteri — Gün 24

**Tarih:** 20 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** MetricCard tasarım sistemi ve veri kancası

---

`MetricCard`’a `size` (hero/compact), `kritik` renk ve nötr panel arka planı eklendi; renk yalnızca sol border ile gösteriliyor. `dashboardEsikleri.ts` ile şikayet/randevu/temizlik uyarı-kritik eşikleri tanımlandı; `metricCardSemantics.ts` config tabanlı `renkKritik` kullanıyor.

`useAdminDashboardData` genişletildi: trend, servis doluluk, analytics özet ve `sikayet-oneri/ozet` query’leri. Client-side 200 kayıt temizlik filtresi kaldırıldı. `DashboardGrid`’e `hero` ve `compact` preset’leri eklendi.

**Öğrenilenler:** Eşik değerleri merkezi config’de tutulmalıdır; border semantiği pastel arka plandan daha profesyonel görünür; hook katmanı API değişikliklerini tek noktada toplar.

---

# Staj Defteri — Gün 25

**Tarih:** 21 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Admin Özet sekmesi ve grafik bileşenleri

---

`OzetTab.tsx` katmanlı düzene geçirildi: üstte 3 hero KPI (bekleyen randevu, şikayet, temizlik), “Genel istatistikler” compact şeridi, altta Recharts grafikleri (haftalık trend, servis doluluk, yatak özeti) ve `BekleyenIslerPanel` listeleri.

Yeni bileşenler: `AdminDashboardCharts.tsx`, `BekleyenIslerPanel.tsx`, paylaşılan `ChartCard.tsx`. `BekleyenlerTab`, `OperasyonTab`, `IkTab` semantik renklere uyarlandı. Yönetim dashboard nöbet “Git” bug’ı `variant="action"` ile düzeltildi.

**Öğrenilenler:** `DashboardInsetList` tekrar kullanımı kod tekrarını azaltır; grafik kabuğu (`ChartCard`) raporlar ve dashboard arasında paylaşılabilir; responsive preset’ler mobilde okunabilirliği korur.

---

# Staj Defteri — Gün 26

**Tarih:** 24 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Entegrasyon testi, PR #42 ve staj defteri teslimi

---

Admin dashboard UX paketi entegre test edildi: `pytest test_admin_dashboard.py` (8 passed), `npm run build` başarılı. `/admin/ozet` manuel smoke: hero KPI, compact şerit, grafikler ve listeler doğrulandı.

Commit `e5c62f9`, push ve PR #42 (`feature/plan-uygulama` → `main`) açıldı. Yerel ortam: `pnpm dev` + backend `8000`; değişiklik görünmeme durumunda dev sunucusu yeniden başlatma ve hard refresh gerekli.

Gün 21–26 staj defteri raporları (detaylı + tek sayfa) tamamlandı; dönem 26 iş gününe uzatıldı.

**Öğrenilenler:** UI refactor backend + tasarım sistemi + sayfa olarak bölünebilir; PR öncesi pytest ve build zorunludur; staj raporu tarihleri iş günü takvimine uymalıdır.
