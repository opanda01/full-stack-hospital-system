# Kaynak Bazlı Yetki Matrisi

Kaynak: Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS RBAC tasarımı.

Bu belge **kaynak gerçeğidir**. Çalışan kod matrisi:

- [`backend/app/core/permissions.py`](../backend/app/core/permissions.py) → `IZIN_MATRISI`
- Guard: `require_permission("kaynak:aksiyon")` → `request.state.kapsam`

---

## 1. Rol sütunları (özet)

| Belge sütunu | Sistem rol kodları | Not |
|--------------|-------------------|-----|
| ADMIN | `ADMIN` | Tüm izinler |
| BAŞHEKİM/MÜDÜR | `BASHEKIM`, `MUDUR` | Yönetim görevi (`Personel.yonetim_gorevi`); meslek rolünden ayrı |
| DOKTOR | `DOKTOR` | Meslek |
| HEMŞİRE/EBE | `HEMSIRE`, `EBE` | Meslek |
| LABORANT | `LABORANT` | Meslek |
| TEMİZLİK | `TEMIZLIK_PERSONELI` | Meslek |
| HASTA | `HASTA` | Sistem |

Ek roller (matriste ayrı sütun yok; seed’de minimal): `BIRIM_SORUMLUSU`, `GUVENLIK`, `IDARI_PERSONEL`.

---

## 2. Kaynak / aksiyon matrisi

Semboller:

- ✅ = rol düzeyinde izin var (`require_permission`)
- ❌ = izin yok
- *italik* = izin var ama **nesne kapsamı** (ownership / departman) service katmanında uygulanır — henüz tam implemente değil

| Kaynak / Aksiyon | İzin kodu | ADMIN | BAŞHEKİM/MÜDÜR | DOKTOR | HEMŞİRE/EBE | LABORANT | TEMİZLİK | HASTA |
|------------------|-----------|:-----:|:--------------:|:------:|:-----------:|:--------:|:--------:|:-----:|
| Kullanıcı oluştur/sil | `kullanici.create` (+ ileride delete) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Personel listele (tümü) | `personel.read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Departman oluştur/düzenle | `departman.write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Departman görüntüle | `departman.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Doktor profili düzenle | `doktor.write` | ✅ | ✅ | *kendi* | ❌ | ❌ | ❌ | ❌ |
| Randevu oluştur | `randevu.create` | ✅ | ✅ | ❌ | *kendi departmanı* | ❌ | ❌ | *kendi adına* |
| Randevu görüntüle | `randevu.read` | ✅ | ✅ *rapor* | *kendi* | *kendi departmanı* | ❌ | ❌ | *kendi* |
| Randevu iptal et | `randevu.cancel` | ✅ | ✅ | *kendi* | ❌ | ❌ | ❌ | *kendi* |
| Muayene oluştur/düzenle | `muayene.create` | ✅ | ❌ | *kendi hastasına* | ❌ | ❌ | ❌ | ❌ |
| Muayene görüntüle | `muayene.read` | ✅ | ✅ | *kendi yazdığı* | *asistan olduğu* | ❌ | ❌ | *kendi kaydı* |
| Tetkik iste | `tetkik.iste` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tetkik sonucu gir | `tetkik.sonuc_gir` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tetkik sonucu görüntüle | `tetkik.read` | ✅ | ❌ | *isteyen doktor* | ❌ | *kendi girdiği* | ❌ | *kendi sonucu* |
| Nöbet çizelgesi oluştur | `nobet.write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Nöbet çizelgesi görüntüle | `nobet.read` | ✅ | ✅ | *kendi* | *kendi* | *kendi* | *kendi* | ❌ |
| Temizlik görevi ata | `temizlik.write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Temizlik görüntüle/güncelle | `temizlik.read` / `temizlik.tamamla` | ✅ | ✅ | ❌ | ❌ | ❌ | *sadece kendi* | ❌ |
| Şikayet/öneri gönder | `sikayet.create` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Şikayet/öneri görüntüle (tümü) | `sikayet.read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. İki katmanlı yetki

1. **Rol → izin (bu matris):** endpoint’e girilebilir mi? → `require_permission("randevu.read")`
2. **Nesne kapsamı (object-level):** hangi kayıtlar? → service içinde (*kendi*, *departman*, *asistan*) — ayrı iş; matris satırındaki *italik* notlar bunu işaret eder.

Örnek: Hemşire `randevu.create` alır; service yalnızca kendi `departman_id` için oluşturmaya izin verir.

---

## 4. Yönetim görevi hatırlatması

`BASHEKIM` / `MUDUR` meslek değildir. Örnek:

- Kullanıcı rolleri: `DOKTOR`
- `Personel.yonetim_gorevi = BASHEKIM` → `BASHEKIM` rolü `kullanici_roller`’a senkronize edilir
- Etkin izinler = `DOKTOR` ∪ `BASHEKIM`

---

## 5. Seed senkronu

```bash
cd backend
python -m app.core.seed_cli
```

`seed_rbac` sistem rollerinin `rol_izinler` bağlarını bu matrise **tam senkron** eder (eksik ekler, fazla kaldırır).
