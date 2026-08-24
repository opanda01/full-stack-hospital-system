# Staj Defteri — Gün 14

**Tarih:** 6 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Mobil sekme önbelleği, skeleton ve hastaApi

---

Hasta mobil sekme geçişlerinde tam ekran spinner ve gereksiz ağ trafiği azaltıldı. React Query: `staleTime` 60 sn, merkezi `queryKeys`, `useRefetchOnTabFocus` — sekmeye dönüşte önbellek anında, arka planda refetch.

`hastaApi.ts`: sayfalı listeler, detay, `parseError` (FastAPI detail). Skeleton bileşenleri: `RandevuScreenSkeleton`, `OzetSkeleton` vb. (~360 satır pulse animasyon). Ekranlar ince `useQuery` ile kalır; invalidation tek `queryKeys` üzerinden.

**Öğrenilenler:** Mobilde staleTime sekme UX'ini belirgin iyileştirir; skeleton ilk yüklemede spinner'dan daha iyi; fetch mantığı tek katmanda toplanmalı; focus refetch window focus yerine Expo `useFocusEffect` ile yapılır.
