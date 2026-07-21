# Kaynak Bazlı Yetki Matrisi

Kaynak: Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS RBAC tasarımı.

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
| Muayene oluştur | `muayene:olustur` | ✅ | ❌ | *kendi* | ❌ | ❌ | ❌ | ❌ |
| Muayene görüntüle | `muayene:goruntule` | ✅ | ✅ | *kendi* | *departman* | ❌ | ❌ | *kendi* |
| Tetkik iste | `tetkik:iste` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tetkik sonucu gir | `tetkik:sonuc_gir` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tetkik görüntüle | `tetkik:goruntule` | ✅ | ✅ | *isteyen* | ❌ | ✅ | ❌ | *kendi* |
| Nöbet oluştur | `nobet:olustur` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Nöbet görüntüle | `nobet:goruntule` | ✅ | ✅ | *kendi* | *kendi* | *kendi* | *kendi* | ❌ |
| Temizlik ata | `temizlik_gorevi:ata` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Temizlik görüntüle/güncelle | `temizlik_gorevi:goruntule` / `temizlik_gorevi:guncelle` | ✅ | ✅ | ❌ | ❌ | ❌ | *kendi* | ❌ |
| Şikayet gönder | `sikayet_oneri:gonder` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Şikayet tümünü gör | `sikayet_oneri:tumunu_goruntule` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

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
