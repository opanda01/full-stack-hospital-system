# Staj Defteri — Gün 2: Auth/RBAC Entegrasyonu, Web Panel Düzeni ve Tema

**Tarih:** 21 Temmuz 2026  
**Proje:** Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS  
**Kapsam:** Access/refresh auth akışı, web login/onboarding, `pages/` rol bazlı yeniden düzenleme, 3’lü tema sistemi, mock auth, erken admin/operasyon bağlantıları

---

### 1. Günün Amacı

Gün 1’de kurulan monorepo iskeleti üzerine, sistemin “giriş yapılabilir ve rolüne göre yönlendirilebilir” hale getirilmesi hedeflendi. Ayrıca web tarafında sayfa klasör karmaşası giderildi; geliştiricinin backend beklemeden UI ilerletebilmesi için mock auth ve tema altyapısı tamamlandı. Gün sonunda Auth+RBAC çekirdeği ile web panel iskeleti birbirine bağlanmış durumda idi.

İlgili commit özetleri (2026-07-21):

- `Complete AUTH+RBAC with refresh-token lifecycle and web login flow` (önceki günden devam / tamamlanma hattı)
- `refactor(web): pages klasörünü rol bazlı grupla, tema sistemi ve mock auth ekle` (#1)
- `feat(auth): personel/hasta auth akışı, Celery import ve web onboarding` (#3)
- `feat(web-admin): doktor/randevu panellerini API'ye bağla ve seed örnek verisi ekle` (#4 / operasyonel devam)

---

### 2. Backend: Auth + RBAC Yaşam Döngüsü

#### Yapılanlar

- **JWT access + refresh** yaşam döngüsü netleştirildi; oturum tipi (`personel` | `hasta`) claim’i ile aynı kullanıcı modelinde çift profil senaryosuna zemin hazırlandı.
- `require_permission` / `require_role` guard’ları endpoint’lerde kullanılarak `IZIN_MATRISI` canlıya alındı.
- Personel tarafında giriş kimlikleri (sicil / e-posta vb.) ve hasta tarafında OTP odaklı akışın iskeleti genişletildi.
- Personel toplu import için **Celery + Redis** worker hattı eklendi (asenkron iş; API’nin uzun süren import’ta bloklanmaması). Lazy import sonrası task çağrısının `tasks.personel_import_isle.delay` biçiminde düzeltilmesi gün içinde hotfix olarak işlendi.

#### Teknik kazanım

Auth’u “sadece login endpoint’i” olarak değil; **token yenileme, rol matrisi, kapsam filtresi ve onboarding bayrakları** (şifre değiştirme / KVKK) ile birlikte düşünmek gerektiği görüldü. Web `OnboardingGuard` bu bayraklara göre yönlendirme yapacak şekilde bağlandı.

---

### 3. Web: `pages/` Rol Bazlı Yeniden Düzenleme

#### Sorun

Düz isimli sayfa dosyaları (`doktor-dashboard`, `doktor-randevularim`, `hemsire-dashboard`, …) hem router import’larını şişiriyor hem FSD `pages` katmanının “rol × ekran” okumasını zorlaştırıyordu.

#### Çözüm

Sayfalar `web/src/pages/{rol}/...` altına taşındı:

```
pages/
├── admin/
│   ├── dashboard/
│   ├── personel/
│   ├── departmanlar/
│   └── ...
├── doktor/
│   ├── dashboard/
│   ├── randevularim/
│   ├── muayene/
│   └── profilim/
├── hemsire/
├── laborant/
├── temizlik/
├── bashekim/
├── mudur/
└── ortak/          # giris, ayarlar, nobet, sikayet, …
```

`router.tsx` bu yeni yollara göre güncellendi; rol layout’ları (`RoleLayoutRoute`) sidebar + korumalı alt rotaları birlikte sunuyor.

---

### 4. Tema Sistemi (Açık / Koyu / OLED)

- `shared/theme` altında token’lar, Zustand store ve `ThemeProvider` eklendi.
- `globals.css` içinde `:root[data-theme="acik"|"koyu"|"oled"]` seçicileri ile CSS değişkenleri ayrıldı.
- Ayarlar ekranında `TemaSecici` ile önizlemeli seçim yapılıyor.

**OLED vs koyu:** OLED temada arka plan gerçek siyah; koyu temada ise yumuşak koyu gri. OLED panellerde siyah piksel ışık üretmediği için kontrast ve güç tüketimi avantajı vardır — hastane personelinin uzun vardiyalarında tercih edilebilir bir seçenek olarak bilinçli eklendi.

Soft UI (yumuşak radius, kart/border token’ları) Gün 1 kararıyla uyumlu şekilde tema token’larına işlendi.

---

### 5. Mock Auth ile Paralel Geliştirme

`web/.env.development` içinde:

```env
VITE_USE_MOCK_AUTH=false
VITE_API_URL=http://127.0.0.1:8000
```

- `VITE_USE_MOCK_AUTH=true` → `shared/auth/mock-users` ile rol denemesi (backend down olsa bile sitemap / layout testi).
- `false` → gerçek API login.

Bu bayrak, Gün 1’de planlanan “frontend’in backend’i beklemeden ilerlemesi” hedefini somutlaştırdı.

---

### 6. Erken Operasyonel Bağlantılar

Aynı gün içinde (veya aynı çalışma gününün devam PR’larında) web-admin tarafında doktor/randevu panellerinin API’ye bağlanması ve seed örnek verisi eklendi. Bu, iskeletin “sadece boş sayfa” olmaktan çıkıp **gerçek endpoint + seed** ile smoke test edilebilir hale gelmesi açısından önemli bir adımdı. Detaylı admin CRUD (birim/departman detay, personel tek form, rapor UX) aynı hat üzerinde ilerletildi; tam klinik derinlik sonraki günlere bırakıldı.

---

### 7. CI ve Kalite

- Web job: `pnpm install` → `pnpm --filter web typecheck` (lint soft).
- Backend job: `pytest`.
- Gün 1’de netleştirilen pnpm sürüm tek kaynak kuralı (`packageManager`) CI ile uyumlu tutuldu.

---

### 8. Sonraki Adımlar (Gün 3+ yönünde)

1. Başhekim erişim onayı / yönetim ayrımı ve gözetim panellerinin genişletilmesi.  
2. Doktor klinik masasasının (kendi hasta kapsamı, muayene, tetkik, reçete/sevk) derinleştirilmesi.  
3. Auth üretim sertleştirmesi (rate limit, şifre sıfırlama UX, kurumsal login).  
4. QA checklist’te rol bazlı manuel senaryoların işaretlenmesi.

---

### Öğrenilenler

- **Sayfa organizasyonu ürün kalitesini etkiler:** Rol klasörleri hem staj defterinde anlatımı hem code review’ı kolaylaştırır.  
- **Onboarding, auth’un parçasıdır:** Login 200 dönmek yetmez; zorunlu şifre/KVKK adımları guard ile bağlanmalı.  
- **Async işler için kuyruk:** Personel import gibi uzun işler Celery’ye alınmazsa HTTP timeout ve kötü UX kaçınılmazdır; lazy import/task adı gibi “küçük” hatalar production’da job’ın hiç çalışmamasına yol açabilir.  
- **Tema token’ları:** Üç temayı ayrı CSS değişken setiyle yönetmek, bileşen bazında `if (dark)` yazmaktan daha sürdürülebilir.  
- **Mock ↔ gerçek geçişi:** Env flag ile tek noktadan anahtarlamak, entegrasyon günlerinde sürprizi azaltır.

---

*Bu rapor, 21.07.2026 tarihli git geçmişi (pages refactor #1, auth-flow #3, web-admin operasyonel #4/#5 hattı) esas alınarak hazırlanmıştır.*
