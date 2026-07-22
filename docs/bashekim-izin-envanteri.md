# `_yonetim_ortak()` izin envanteri ve BASHEKIM / MUDUR ayrımı

Kaynak: [`backend/app/core/permissions.py`](../backend/app/core/permissions.py)

## Mevcut `_yonetim_ortak()` kodları → endpoint

| İzin kodu | Router / kullanım | MUDUR (korunacak) | BASHEKIM (koru + ek) |
|-----------|-------------------|:-----------------:|:--------------------:|
| `personel:listele` | `GET/POST/PATCH /personel/*` (create dahil) | ✅ | ✅ |
| `personel:import` | `POST/GET /personel/import*` | ✅ | ✅ |
| `departman:olustur` | `POST/PATCH/DELETE /departmanlar*` | ✅ | ✅ |
| `departman:goruntule` | `GET /departmanlar*`, doktor list | ✅ | ✅ |
| `doktor:profil_duzenle` | `PATCH /doktorlar*` | ✅ | ✅ |
| `randevu:olustur` | `POST /randevular*` | ✅ | ✅ |
| `randevu:goruntule` | `GET /randevular*` | ✅ | ✅ |
| `randevu:iptal` | iptal endpoint | ✅ | ✅ |
| `hasta:listele` | (matris; list role-guard) | ✅ | ✅ |
| `muayene:goruntule` | `GET /muayeneler/` | ✅ | ✅ |
| `tetkik:goruntule` | `GET /tetkikler*` | ✅ | ✅ |
| `nobet:olustur` | `POST /nobet-cizelgesi` | ✅ | ✅ |
| `nobet:goruntule` | `GET /nobet-cizelgesi` | ✅ | ✅ |
| `temizlik_gorevi:ata` | `POST /temizlik-gorevleri` | ✅ | ✅ |
| `temizlik_gorevi:goruntule` | `GET /temizlik-gorevleri` | ✅ | ✅ |
| `sikayet_oneri:gonder` | `POST /sikayet-oneri` | ✅ | ✅ |
| `sikayet_oneri:tumunu_goruntule` | `GET /sikayet-oneri` | ✅ | ✅ |

## BASHEKIM’e eklenenler (MUDUR’da yok)

| İzin | Amaç |
|------|------|
| `personel:onayla` | Erişim onay/red |
| `denetim:goruntule` | Denetim log + PHI view log |
| `bashekim:ozet` | Dashboard aggregation |
| `mhrs:yonet` | MHRS kapasite |
| `entegrasyon:goruntule` | E-Nabız/SGK paneli |
| `klinik_onay:goruntule` / `klinik_onay:onayla` | Reçete/sevk/rapor |
| `eczane:goruntule` | Eczane |
| `fatura:goruntule` | Faturalandırma |
| `doner:goruntule` | Döner sermaye |
| `yetki:devret` | Yetki devri / duyuru |
| `sistem:gozetim` | Sistem gözetim salt okunur |
| `temizlik_gorevi:guncelle` | Yönetim gözetiminde güncelleme |

## ADMIN-only (BASHEKIM yok)

| İzin / yetenek | Not |
|----------------|-----|
| `*` / kullanıcı hard-CRUD | Teknik |
| `personel:onay_bypass` | Gerekçeli acil onay + `PERSONEL_ERISIM_ONAY_BYPASS` |

## Müdür regresyon checklist

Ayrım sonrası MUDUR ile doğrulanacak:

- [ ] `GET /personel/` 200
- [ ] `POST /personel/with-user` → `erisim_durumu=BEKLEMEDE` (aktif değil)
- [ ] `GET /departmanlar/` 200
- [ ] `GET /randevular/` 200
- [ ] `GET /muayeneler/` 200
- [ ] `GET /tetkikler/` 200
- [ ] `GET /nobet-cizelgesi/` 200
- [ ] `GET /temizlik-gorevleri/` 200
- [ ] `GET /sikayet-oneri/` 200
- [ ] `POST /personel/.../onayla` → 403
- [ ] `GET /denetim/` → 403
- [ ] `GET /bashekim/ozet` → 403
