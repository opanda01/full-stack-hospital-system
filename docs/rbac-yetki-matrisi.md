# Kaynak Bazlı Yetki Matrisi

Kaynak: Devlet hastanesi HBYS RBAC tasarımı.

Bu belge **tasarım özetidir**. Çalışan kod matrisi tek kaynak gerçeğidir:

- [`backend/app/core/permissions.py`](../backend/app/core/permissions.py) → `IZIN_MATRISI`
- Guard: `require_permission("kaynak:aksiyon")` → `request.state.kapsam`
- Okuma API: `GET /rbac/roller`, `GET /rbac/izinler`, `GET /rbac/roller/{kod}/izinler`

İzin kodları **iki nokta** formatındadır: `randevu:goruntule` (eski `.` formatı kullanılmaz).

---

## 1. Rol sütunları (özet)

| Belge sütunu | Sistem rol kodları | Not |
|--------------|-------------------|-----|
| ADMIN | `ADMIN` | Tüm izinler (`*`) |
| BAŞHEKİM/MÜDÜR | `BASHEKIM`, `MUDUR` | Yönetim; birincil `Kullanici.rol` |
| DOKTOR | `DOKTOR` | Meslek |
| HEMŞİRE/EBE | `HEMSIRE`, `EBE` | Meslek |
| LABORANT | `LABORANT` | Meslek |
| RADYOLOG | `RADYOLOG` | Meslek (PACS raporlama) |
| TEMİZLİK | `TEMIZLIK_PERSONELI` | Meslek |
| HASTA | `HASTA` | Sistem |

Ek roller: `GUVENLIK`, `IDARI_PERSONEL`.

---

## 2. Kaynak / aksiyon matrisi

Semboller:

- ✅ = rol düzeyinde izin var (`require_permission`)
- ❌ = izin yok
- *italik* = izin var; **nesne kapsamı** service katmanında uygulanır

| Kaynak / Aksiyon | İzin kodu | ADMIN | BAŞHEKİM/MÜDÜR | DOKTOR | HEMŞİRE/EBE | LABORANT | TEMİZLİK | HASTA |
|------------------|-----------|:-----:|:--------------:|:------:|:-----------:|:--------:|:--------:|:-----:|
| Kullanıcı oluştur/sil | `kullanici:olustur` / `kullanici:sil` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Personel listele | `personel:listele` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Personel import | `personel:import` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Departman oluştur | `departman:olustur` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Departman görüntüle | `departman:goruntule` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Doktor profili düzenle | `doktor:profil_duzenle` | ✅ | ✅ | *kendi* | ❌ | ❌ | ❌ | ❌ |
| Randevu oluştur | `randevu:olustur` | ✅ | ✅ | ❌ | *departman* | ❌ | ❌ | *kendi* |
| Randevu görüntüle | `randevu:goruntule` | ✅ | ✅ | *kendi* | *departman* | ❌ | ❌ | *kendi* |
| Randevu iptal | `randevu:iptal` | ✅ | ✅ | *kendi* | ❌ | ❌ | ❌ | *kendi* |
| Hasta listele | `hasta:listele` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Hasta görüntüle (türevsel) | `hasta:goruntule` | ✅ | ✅ | *kendi* | *departman* | ❌ | ❌ | ❌ |
| Muayene oluştur | `muayene:olustur` | ✅ | ❌ | *kendi* | ❌ | ❌ | ❌ | ❌ |
| Muayene güncelle | `muayene:guncelle` | ✅ | ❌ | *kendi* | ❌ | ❌ | ❌ | ❌ |
| Muayene görüntüle | `muayene:goruntule` | ✅ | ✅ | *kendi* | *departman* | ❌ | ❌ | *kendi* |
| Tetkik iste | `tetkik:iste` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tetkik sonucu gir | `tetkik:sonuc_gir` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tetkik görüntüle | `tetkik:goruntule` | ✅ | ✅ | *isteyen* | *departman* | ✅ | ❌ | *kendi* |
| Radyoloji iste | `radyoloji:iste` | ✅ | ✅ | *kendi* | ❌ | ❌ | ❌ | ❌ |
| Radyoloji sonuç/rapor | `radyoloji:sonuc_gir` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ (radyolog) | ❌ |
| Radyoloji görüntüle | `radyoloji:goruntule` | ✅ | ✅ | *isteyen* | *departman* | ❌ | ✅ | *kendi (raporlu)* |
| Epikriz görüntüle (hasta: yalnız onaylı) | `epikriz:goruntule` | ✅ | ✅ | *kendi* | ✅ | ❌ | ❌ | *kendi (onaylı)* |
| Epikriz oluştur/güncelle | `epikriz:olustur` / `:guncelle` | ✅ | ✅ | *kendi* | ✅ | ❌ | ❌ | ❌ |
| Epikriz onayla | `epikriz:onayla` | ✅ | ✅ | *kendi* | ❌ | ❌ | ❌ | ❌ |
| Klinik onay görüntüle (hasta: yalnız onaylı) | `klinik_onay:goruntule` | ✅ | ✅ (başhekim) | *kendi* | ❌ | ❌ | ❌ | *kendi (onaylı)* |
| Klinik onay oluştur | `klinik_onay:olustur` | ✅ | ✅ (başhekim) | *kendi* | ❌ | ❌ | ❌ | ❌ |
| Klinik onay onayla | `klinik_onay:onayla` | ✅ | ✅ (başhekim) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Konsültasyon | `konsultasyon:olustur/goruntule/yanitla` | ✅ | ❌ | *kendi* | ❌ | ❌ | ❌ | ❌ |
| Sağlık kurulu görüntüle | `saglik_kurulu:goruntule` | ✅ | ✅ (başhekim) | *üye* | ❌ | ❌ | ❌ | ❌ |
| Nöbet oluştur | `nobet:olustur` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Nöbet görüntüle | `nobet:goruntule` | ✅ | ✅ | *kendi* | *kendi* | *kendi* | *kendi* | ❌ |
| Yatış görüntüle | `yatis:goruntule` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | *kendi özeti* |
| Yatış işlem | `yatis:islem` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Servis görüntüle | `servis:goruntule` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Yatak görüntüle | `yatak:goruntule` | ✅ | ✅ | *departman* | *departman* | ❌ | ❌ | ❌ |
| Yatak ata | `yatak:ata` | ✅ | ✅ | *departman* | *departman* | ❌ | ❌ | ❌ |
| Yatak durum güncelle | `yatak:durum_guncelle` | ✅ | ✅ | *departman* | *departman* | ❌ | ❌ | ❌ |
| Ameliyat planla | `ameliyat:planla` | ✅ | ✅ | *kendi cerrah* | ❌ | ❌ | ❌ | ❌ |
| Ameliyat görüntüle | `ameliyat:goruntule` | ✅ | ✅ | *kendi* | *departman* | ❌ | ❌ | ❌ |
| Ameliyat güncelle / başlat / tamamla | `ameliyat:guncelle` | ✅ | ✅ | *kendi* | ❌ | ❌ | ❌ | ❌ |
| Ameliyat iptal | `ameliyat:iptal_et` | ✅ | ✅ | *kendi* | ❌ | ❌ | ❌ | ❌ |
| Anestezi kaydı | `anestezi:kaydet` | ✅ | ✅ | *kendi* | ❌ | ❌ | ❌ | ❌ |
| Vital görüntüle/oluştur | `vital:goruntule` / `:olustur` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| İlaç uygulama (MAR) | `ilac_uygulama:goruntule` / `:olustur` / `:guncelle` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Hemşire görev | `hemsire_gorev:goruntule` / `:olustur` / `:guncelle` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Vardiya devir | `vardiya_devir:goruntule` / `:olustur` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Panel bildirim | `panel_bildirim:goruntule` / `:guncelle` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| İlaç talep görüntüle/oluştur/durum | `ilac_talep:goruntule` / `:olustur` / `:durum_guncelle` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Eczane stok görüntüle | `eczane:goruntule` | ✅ | ✅ (başhekim) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Temizlik ata | `temizlik_gorevi:ata` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Temizlik görüntüle/güncelle | `temizlik_gorevi:goruntule` / `temizlik_gorevi:guncelle` | ✅ | ✅ | ❌ | ❌ | ❌ | *kendi* | ❌ |
| Şikayet gönder | `sikayet_oneri:gonder` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Şikayet kendi kayıtları | `sikayet_oneri:benim` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | *kendi* |
| Şikayet tümünü gör | `sikayet_oneri:tumunu_goruntule` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Şikayet durum güncelle | `sikayet_oneri:durum_guncelle` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Güvenlik olay görüntüle | `guvenlik_olay:goruntule` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Güvenlik olay oluştur/güncelle | `guvenlik_olay:olustur` / `:guncelle` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ziyaretçi / kayıp eşya / devriye görüntüle | `guvenlik_ziyaretci:goruntule` / `kayip_esya:goruntule` / `guvenlik_devriye:goruntule` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Refakatçi sorgula | `refakatci:sorgula` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Ek rol `GUVENLIK`:** `nobet:goruntule` (kendi), `sikayet_oneri:gonder`, `guvenlik_olay:*`, `guvenlik_ziyaretci:*`, `kayip_esya:*`, `guvenlik_devriye:goruntule/olustur`, `refakatci:sorgula`, `guvenlik:ozet`.

---

## 3. İki katmanlı yetki

1. **Rol → izin:** endpoint’e girilebilir mi? → `require_permission("randevu:goruntule")`
2. **Nesne kapsamı:** hangi kayıtlar? → `Kapsam` + `scope.py` / service filtreleri

**Oturum tipi:** JWT claim `oturum_tipi` (`personel` | `hasta`). Hasta oturumunda izin matrisi her zaman `HASTA` rolünden okunur (çift profilli personel mobil hastadan işlem yapabilir; web panelinde personel yetkileri korunur).

---

## 4. Birincil rol modeli

Canlı yetkilendirme **`Kullanici.rol`** (tek birincil rol) üzerinden yapılır.

`Personel.yonetim_gorevi` + `sync_yonetim_rolu` / `kullanici_roller` **canlı auth’ta kullanılmaz**; yalnızca legacy/metadata yardımcısıdır. DB `roller` / `izinler` tabloları şema uyumu içindir; guard `IZIN_MATRISI` okur.

---

## 5. Seed

```bash
cd backend
python -m app.core.seed_cli
```

Demo kullanıcılar oluşturulur; izinler kod matrisinden gelir (DB `rol_izinler` senkronu yoktur).

## 6. Başhekim ayrımı (2026-07)

- `BASHEKIM` ≠ `MUDUR`: bkz. [`docs/bashekim-izin-envanteri.md`](bashekim-izin-envanteri.md)
- Personel erişim: `erisim_durumu` tek kaynak; `aktif_mi` transition ile türetilir
- Onay: `personel:onayla`; Admin bypass: `personel:onay_bypass` + `PERSONEL_ERISIM_ONAY_BYPASS` audit + zorunlu gerekçe
- PHI detay okuma: `KAYIT_GORUNTULEME` denetim event
- Denetim listesi: `denetim:goruntule` (ADMIN `*` + BASHEKIM)