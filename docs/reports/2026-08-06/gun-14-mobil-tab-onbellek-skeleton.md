# Staj Defteri — Gün 14: Mobil sekme önbelleği, arka plan yenileme ve skeleton

**Tarih:** 6 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Kapsam:** Hasta mobil sekmelerinde React Query önbelleği; ilk yüklemede skeleton; sekmeye dönüşte arka planda `refetch`; ortak `hastaApi` fetch katmanı

---

### 1. Günün Amacı

Gün 13’te (#34) backend OTP kapsamı ve randevu/tahlil hata metinleri düzeltilmişti; hasta uygulamasında sekme geçişlerinde her seferinde tam ekran spinner ve gereksiz ağ trafiği kullanıcı deneyimini yavaşlatıyordu. 6 Ağustos odağı: **veriyi kısa süre önbellekte tutmak**, **ilk açılışta iskelet (skeleton) göstermek**, sekmeye geri dönünce **önbelleği bozmadan arka planda yenilemek** ve fetch mantığını tek yerde toplamak.

| Alan | Önce | Sonra |
|------|------|--------|
| Sekme geçişi | Sık tam ekran `ActivityIndicator` | Önbellekteki liste anında; `staleTime` 60 sn |
| İlk giriş | Boş / spinner | `RandevuScreenSkeleton`, `OzetSkeleton` vb. |
| Sekmeye dönüş | Manuel `useEffect` + fetch | `useRefetchOnTabFocus` + `queryClient.refetch` |
| API çağrıları | Ekran içi dağınık `apiFetch` | `hastaApi.ts` + `queryKeys` |

---

### 2. React Query yapılandırması

**Dosya:** `mobile/src/shared/query/client.ts`

- `HASTA_STALE_MS = 60_000` — 1 dakika boyunca veri “taze” sayılır; tab değişiminde anında önbellek gösterilir.
- `gcTime` 5 dakika, `retry: 1`, `refetchOnWindowFocus: false` (mobilde pencere odağı yerine Expo `useFocusEffect` kullanılır).
- Merkezi **`queryKeys`**: özet, profil, belgeler, randevular, tetkikler, muayeneler, reçeteler, detay id’leri, randevu-al bootstrap, şikayet.

**Dosya:** `mobile/src/shared/query/focus.ts`

- `useRefetchOnTabFocus(refetch)` — sekme odaklandığında `refetch()` çağrılır; kullanıcı önbellekli içeriği görürken güncelleme arka planda gelir.

---

### 3. `hastaApi` — ortak fetch katmanı

**Dosya:** `mobile/src/shared/api/hastaApi.ts` (+140 satır civarı)

- Sayfalı listeler: `fetchPage`, `fetchRandevular`, `fetchMuayeneler`, `fetchTetkikler`, belgeler, reçeteler, epikriz, klinik onay vb.
- Detay: `fetchMuayeneById`, `fetchTetkik`, belge kaynak/id.
- **`parseError`**: FastAPI `detail` string veya validation dizisinden okunabilir Türkçe/teknik mesaj (Gün 13’teki “Sunucuya bağlanılamadı” sorununa uyumlu).
- Profil / özet / alerji / yatış özeti / şikayet endpoint sarmalayıcıları.

**Kazanım:** Ekranlar `useQuery({ queryKey, queryFn })` ile ince kalır; invalidation tek `queryKeys` üzerinden yapılabilir.

---

### 4. Skeleton bileşenleri

**Dosya:** `mobile/src/shared/ui/skeleton.tsx` (~360 satır)

- `SkeletonBox` — pulse animasyonlu placeholder.
- Ekrana özel iskeletler: özet, profil, randevu listesi, tetkik, muayene, belge, reçete vb. (`RandevuScreenSkeleton`, …).
- `Screen` + safe area ile mevcut tema (`palette`, `radius`, `spacing`) ile uyumlu.

**Export:** `mobile/src/shared/ui/index.tsx` üzerinden ekranlara dağıtıldı.

---

### 5. Güncellenen hasta ekranları

| Ekran | Değişiklik özeti |
|--------|------------------|
| `ozet/index.tsx` | `useQuery` + özet skeleton |
| `profil/index.tsx` | Profil sorgusu + skeleton |
| `randevularim/index.tsx` | `fetchRandevular`, segment (yaklaşan/geçmiş), pull-to-refresh, tab focus refetch |
| `tetkik-sonuclarim/` (liste + detay) | Tetkik query + skeleton |
| `muayenelerim/` (liste + detay) | Muayene query |
| `belgelerim/` (liste + detay) | Belge sayfalama |
| `recetelerim/index.tsx` | Liste sadeleştirme + query |
| `randevu-olustur/index.tsx` | Bootstrap query (`randevuAlBootstrap`) |

Net diff: **16 dosya**, yaklaşık **+890 / −408** satır (PR #35).

---

### 6. Pull request

- Dal: `feature/mobile-tab-loading-skeletons`
- Merge: `main` — [#35](https://github.com/opanda01/full-stack-hospital-system/pull/35)
- Commit: `6728a54` — *feat(mobile): tab önbelleği, arka plan yenileme ve skeleton yükleme*

PR açıklaması: Sekme geçişlerinde tam ekran spinner yerine React Query önbelleği ve skeleton ilk yükleme; hasta listeleri ve detay ekranlarına uygulandı.

---

### 7. Operasyon ve test notları

- `npm run typecheck` (mobile) — PR öncesi temiz hedeflenir.
- Backend Gün 13 kapsam düzeltmesi (#34) ile birlikte test: OTP giriş → Özet / Randevu / Tahlil sekmeleri arası hızlı geçiş, pull-to-refresh.
- Önbellek 60 sn: aynı sekmede bekleyip tekrar açınca arka plan `refetch` ile güncel veri gelmeli.

---

### 8. Sonraki adımlar (o gün sonrası)

- Auth / OTP kapsamının kalan modüllerde taranması (muayene, epikriz, radyoloji — 7 Ağustos PR #36’da kapatıldı).
- Push bildirimi sonrası ilgili `queryKey` invalidation (tetkik sonucu hazır vb.).
- İsteğe bağlı: offline / ağ yok `WifiOff` durumunda önbellekten salt okunur gösterim.

---

*Bu rapor, 6.08.2026 tarihli `main` merge commit’i `6728a54` (PR #35) ve ilgili mobil dosya diff’i esas alınarak hazırlanmıştır.*
