# Mobil (Expo) yol haritası

**Son kod taraması:** 2026-08-05  
**Depo yolu:** `docs/MOBİLE-ROADMAP.md` (bu dosya)

## Kapsam kararı

Personel (doktor, hemşire, idari) **mobil uygulama kapsamı dışındadır** — bilinçli tercih; personel yalnızca web panelini kullanır. Mobil istemci yalnızca **hasta OTP oturumu** ve PHR ekranları içindir (`mobile/app/(auth)`, `mobile/app/(hasta)`; personel route yok; `giris-yap` hasta dışı token’ı reddeder).

## Mevcut durum (özet)

| Alan | Özet |
|------|------|
| Hasta ekranları | MEVCUT — özet, randevu, tetkik, muayene, reçete, belge, şikayet, profil (`mobile/app/(hasta)/**`, `shared/api/hastaApi.ts`) |
| Push (expo-notifications, push-token API) | YOK |
| PanelBildirim → hasta push | YOK (personel bildirimleri web `GET /yatis/bildirimler`) |
| Token | MEVCUT — `expo-secure-store` (`shared/auth/storage.ts`) |
| Biyometrik / PIN | YOK |
| Offline kuyruk | YOK |
| Barkod/QR | YOK — roadmap’ten çıkarıldı (personel MAR senaryosu kalktı) |
| Aşı takvimi, KVKK tercih yönetimi, aktif ilaç ekranı | KISMEN / YOK — Faz 2 |

---

## Uyum tablosu

| Özellik | Durum | Dosya referansı |
|---------|--------|-----------------|
| Hasta OTP giriş/kayıt | MEVCUT | `mobile/src/features/giris-yap/`, `kayit-ol/`, `shared/api/index.ts` |
| Hasta PHR ekranları | MEVCUT | `mobile/app/(hasta)/**`, `shared/api/hastaApi.ts` |
| Personel mobil panel | KAPSAM DIŞI (bilinçli tercih — personel yalnızca web kullanacak) | `giris-yap/index.tsx`; `(personel)` route yok |
| expo-notifications / push token | YOK → **Faz 1** | `mobile/package.json`; backend push token bulunamadı |
| PanelBildirim → hasta mobil push | YOK → **Faz 1** | `backend/app/features/yatis/router.py`; `web/src/shared/ui/app-shell/Topbar.tsx` |
| expo-secure-store token | MEVCUT | `shared/auth/storage.ts` |
| Biyometrik / PIN kilit | YOK → **Faz 1** | paket/kod yok |
| KVKK onam / tercih yönetimi | KISMEN → **Faz 2** | `kayit-ol/`, `profil/index.tsx` |
| Aşı takvimi | YOK → **Faz 2** | mobilde route/API yok |
| Reçete / aktif ilaçlarım | KISMEN → **Faz 2** | `recetelerim/`, `muayenelerim/[id].tsx` |
| Offline kuyruk (şikayet vb.) | YOK → **Faz 3** | `shared/query/client.ts` |
| Barkod/QR | YOK (roadmap’ten çıkarıldı) | — |
| MAR (personel) | KAPSAM DIŞI (bilinçli tercih — personel yalnızca web kullanacak) | web hemşire paneli; mobil yok |
| Kritik lab bildirimi (personel mobil) | KAPSAM DIŞI (bilinçli tercih — personel yalnızca web kullanacak) | web Topbar; mobil yok |

*MAR ve kritik lab satırları yalnızca envanter referansıdır; aşağıdaki faz listesine alınmaz.*

---

## Yol haritası — uygulama fazları

### Faz 1 — Altyapı

1. **Push altyapısı (mobil + backend)**  
   - `expo-notifications` entegrasyonu.  
   - Backend: push token saklama (ör. cihaz tablosu + hasta oturumuna bağlı kayıt endpoint’i; henüz yok).  

2. **PanelBildirim → hasta push (filtreli)**  
   - Yalnızca **hastaya yönelik** bildirim türleri mobil push’a bağlanır.  
   - **Hariç tutulanlar (personel web’de kalır):** kritik lab, MAR, ilaç talep ve diğer personel `PanelBildirim` türleri.  

3. **Biyometrik / PIN kilidi**  
   - `expo-local-authentication` (veya eşdeğeri): uygulama açılışında kilit (politika: zorunlu / isteğe bağlı ürün kararı).  

### Faz 2 — Hasta deneyimi

1. **KVKK tercih yönetimi**  
   - Profil: düzenlenebilir onam ve veri paylaşım tercihleri.  
   - **Rıza geri çekme** akışı (backend API sözleşmesi gerekir).  

2. **Aşı takvimi**  
   - Yeni mobil ekran.  
   - **Backend (ayrı madde):** aşı kaydı / takvim modeli ve hasta API’si muhtemelen gerekir; mevcut kodda hasta aşı endpoint’i bulunamadı.  

3. **Aktif ilaçlarım**  
   - Reçete geçmişi ve muayene detayından ayrı, güncel ilaç odaklı ekran (veri: mevcut muayene/klinik onay veya yeni özet endpoint).  

### Faz 3 — İyileştirme (düşük öncelik)

1. **Offline kuyruk (sınırlı)**  
   - Yalnızca düşük riskli senaryolar (ör. şikayet/öneri formu).  
   - MAR / vital / personel senaryoları **kapsam dışı**.  

2. **Barkod/QR**  
   - Roadmap’ten **tamamen çıkarıldı** (kullanım personel MAR’a bağlıydı).  

---

## İlgili belgeler

- [ROADMAP.md](./ROADMAP.md) — ürün genel yol haritası (Faz D hasta mobil).  
- [`mobile/`](../mobile/) — Expo istemci kodu.
