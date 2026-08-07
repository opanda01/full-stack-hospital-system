# Panel navigasyonu

## Pilot roller (domain navigasyonu)

`ADMIN`, `BASHEKIM`, `MUDUR` panellerinde üstte **ana modül sekmeleri** (`PrimaryNav`) ve yan menüde yalnızca seçili modülün alt sayfaları gösterilir. Konfigürasyon: [`src/shared/config/nav-domains.ts`](../src/shared/config/nav-domains.ts).

| Domain | Admin | Başhekim | Müdür |
|--------|-------|----------|-------|
| Gösterge | `/admin/ozet`, … | `/bashekim/ozet`, … | `/mudur/ozet`, … |
| İnsan & erişim | kullanıcı, personel, … | erişim, personel, … | personel, … |
| Hasta & klinik | hasta, randevu, triyaj, … | + klinik onay | hasta, randevu, … |
| Kurumsal | — | MHRS, eczane, fatura, … | — |
| Tesis & operasyon | yatak, nöbet, temizlik, … | aynı | aynı |
| Sistem & rapor | şikayet, rapor, ayarlar, RBAC, denetim | + yetki matrisi | şikayet, rapor, ayarlar |

Eşleme: `resolveNavDomain()` en uzun path önekine göre aktif modülü seçer.

## Gösterge paneli sekmeleri

Dashboard hub bileşenleri: [`src/shared/ui/dashboard/`](../src/shared/ui/dashboard/).

- **Admin:** `ozet`, `bekleyenler`, `operasyon`, `insan-kaynaklari`, `sistem`
- **Başhekim:** `ozet`, `bekleyenler`, `operasyon`, `kurumsal`
- **Müdür:** `ozet`, `bekleyenler`, `operasyon`

## Diğer roller

`NAV_GROUPS` ([`nav-items.ts`](../src/shared/config/nav-items.ts)) tam sidebar listesi olarak kullanılmaya devam eder.
