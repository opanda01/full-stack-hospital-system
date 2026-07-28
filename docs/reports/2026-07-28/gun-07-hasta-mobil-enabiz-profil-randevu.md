# Staj Defteri — Gün 7: Hasta Mobil e-Nabız Özeti, Profil ve Randevu Takvimi

**Tarih:** 28 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS (Çanakkale Mehmet Akif Ersoy Devlet Hastanesi)  
**Kapsam:** Hasta mobil e-Nabız tarzı IA (özet, muayene, reçete, belge, şikayet); profil boy/kilo güncelleme; poliklinik başına doktor seed; randevu takvimi + Randevularım/Geçmiş sekmeleri; tahlil/özet UX cilası; Metro LAN API proxy

---

### 1. Günün Amacı

Gün 6’da OTP + LAN API smoke yolu main’e girmişti. Gün 7’de odak **hasta uygulamasını e-Nabız benzeri kullanılabilir bir PHR yüzüne** çıkarmak: özet hub, sağlık kayıt menüleri, profil düzenleme (boy/kilo), randevu deneyimi (takvim + geçmiş ayrımı) ve demo verinin poliklinik başına yeterli doktorla doldurulması.

| Saat (yaklaşık) | İş | Özet |
|-----------------|-----|------|
| Sabah | Seed | Her poliklinikte ≥3 online randevu doktoru |
| — | Özet / tahlil UX | Türkçe tarih-saat; tahlil üst açıklama kaldırıldı |
| — | Profil | `PATCH /hastalar/ben` + boy/kilo (migration `018`) |
| — | Randevu | Takvim; **Randevularım** / **Geçmiş** sekmeleri |
| — | Mobil IA | Özet, muayene, reçete, epikriz, şikayet sekmeleri/ekranları |

---

### 2. Backend

#### Hasta profil (e-Nabız tarzı)

- `hastalar.boy_cm` / `hastalar.kilo_kg` — Alembic `018_hasta_boy_kilo`
- `HastaProfilUpdate` + `PATCH /hastalar/ben` (yalnız `Rol.HASTA`)
- Güncellenebilir: doğum tarihi, cinsiyet, kan grubu, adres, boy, kilo, telefon  
- TC değiştirilemez; adres PHI şifrelemesi `update` yolunda korunur
- `GET /hastalar/ben` yanıtına `boy_cm`, `kilo_kg`, `telefon` eklendi

#### Epikriz / tetkik (hasta okuma)

- Hasta `epikriz:goruntule` + `KENDI_KAYDIM` (yalnız onaylı)
- Tetkik `created_at` read şemasında (özet/tahlil gruplama)

#### Seed

- `seed_hastane.py`: her departmanda en az 3 doktor (`online_randevu_acik_mi=True`)
- İsimli örnek doktorlar (Kardiyoloji, Cerrahi, Ortopedi, Acil) korundu; üretim TC aralığı `21…`

---

### 3. Mobil — Hasta PHR

#### Navigasyon / özet

- Tab’lar: Özet, Randevu, Randevu Al, Tahlil, Profil (+ ikonlar)
- Özet: yaklaşan randevu / son tetkik; menü: muayene, reçete, belge, şikayet, profil
- Tarih-saat `tr-TR` okunabilir format (`Salı, 28 Temmuz 2026, 14:30`)

#### Profil

- Düzenlenebilir form: boy, kilo, VKİ hesabı, kan grubu/cinsiyet chip’leri, telefon, adres
- **Bilgileri kaydet** → `PATCH /hastalar/ben`

#### Randevularım

- Üst sekmeler: **Randevularım** | **Geçmiş**
- Takvim yalnızca **Randevularım** altında; randevulu günlerde nokta; güne tıklayınca filtre
- Geçmiş sekmesinde takvim yok, yalnızca geçmiş liste

#### Tahlil

- Tarih → istek grubu accordion
- Üst açıklama / gereksiz meta satırları kaldırıldı

#### Dev / LAN

- Metro `/hbys-api` proxy, `resolveApiUrl`, start script’leri (firewall / port temizliği)
- Randevu al: poliklinik arama + 3 adımlı sihirbaz

---

### 4. Doğrulama

- Migration `018` uygulandı (`alembic upgrade head`)
- Seed: 44 poliklinik × 3 doktor doğrulandı
- Epikriz/RBAC testleri (önceki oturumda) geçti; tip kontrolü mobil tarafta temizlendi

---

### 5. Bilinçli Sınırlar / Sonraki Adımlar

- Alerji kaydı hâlâ personel ekler; hasta yalnız okur
- Takvim yerel ay grid’i (harici calendar paketi yok)
- Fiziksel cihazda Expo Go yenilemesi sonrası yeni ekranların görünmesi gerekir
- İleride: randevu kartında doktor/departman adı, tahlil parametre trend UX’i derinleştirme

---

### 6. Dosya Özeti (ana)

| Alan | Örnek dosyalar |
|------|----------------|
| Migration | `backend/alembic/versions/018_hasta_boy_kilo.py` |
| Hasta API | `hastalar/models|schemas|router|service.py` |
| Seed | `backend/app/core/seed_hastane.py` |
| Mobil ekranlar | `mobile/app/(hasta)/ozet|profil|randevularim|tetkik-sonuclarim|…` |
| API istemci | `mobile/src/shared/api/hastaApi.ts`, `http.ts`, `types.ts` |
| Metro/LAN | `metroApiProxy.cjs`, `resolveApiUrl.ts`, `scripts/start-expo.cjs` |
