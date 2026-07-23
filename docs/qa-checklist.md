# Manuel QA — rol bazlı senaryolar

Strateji, P0–P2 öncelikler ve otomasyon envanteri: [test-plan.md](test-plan.md).  
Müdür / başhekim izin ayrımı regresyonu: [bashekim-izin-envanteri.md](bashekim-izin-envanteri.md).

## Faz 1
- [ ] admin@hastane.example.com → /admin
- [ ] doktor@hastane.example.com → /doktor/randevularim
- [ ] hemsire@hastane.example.com → /hemsire
- [ ] temizlik@hastane.example.com → /temizlik
- [ ] laborant@hastane.example.com → /laborant
- [ ] mudur@hastane.example.com → /admin
- [ ] hasta@hastane.example.com (web) → /hasta
- [ ] Mobil OTP giriş (TC `10000000006` / tel `05551234567`) → randevularım

## Faz 2–3
- [ ] Admin departman ekler / listeler
- [ ] Admin personel ekler
- [ ] Doktor profilini görür
- [ ] Mobil: departman → doktor → slot → randevu
- [ ] Doktor kendi randevusunu görür; başka doktorunkini göremez
- [ ] Hemşire sadece kendi departman randevularını görür

## Faz 4
- [ ] Doktor muayene kaydı + tetkik ister
- [ ] Laborant sonuç girer
- [ ] Hasta mobilde sonucu görür

## Faz D — Hasta mobil (OTP)
- [ ] OTP GIRIS: telefon + TC → kod (konsol/SMS stub) → `oturum_tipi=hasta` tabs
- [ ] Salt-hasta `/auth/login` şifre → 403 (OTP zorunlu)
- [ ] OTP KAYIT: ad/soyad + KVKK → doğrula → randevu alabilir
- [ ] SecureStore: uygulamayı kapat/aç → oturum korunur; Çıkış → refresh iptal
- [ ] Randevu Al: yalnızca seçilen departman doktorları; iptal `Randevularım`’da
- [ ] Tetkikler tab’ı kendi sonuçlarını listeler; başka hasta verisi yok

## Faz 5
- [ ] Müdür nöbet oluşturur; personel kendi nöbetini görür
- [ ] Temizlik görev tamamlar / yönetim görev atar
- [ ] Şikayet gönderilir; yönetim listeler

## Faz G — Doktor klinik paneli
- [ ] Doktor `GET /hastalar/` → 403; `/hastalar/benim` yalnızca kendi hastaları
- [ ] Başka doktor hastası detayı → 403
- [ ] Randevularım canlı liste + zaman dilimi (bugün / gelecek hafta / ay)
- [ ] Muayene oluştur + güncelle; nested AppShell yok
- [ ] Tetkiklerim: istek + sonuç görüntüleme
- [ ] Reçete / sevk / tıbbi rapor oluştur → başhekim klinik onay kuyruğunda
- [ ] Konsültasyon iste / kabul → hedef doktorda hasta görünür
- [ ] Sağlık kurulu: yalnızca üye olduğu kayıtlar
- [ ] Nav’da personel / denetim / MHRS / fatura / eczane yok

## Faz H — Hemşire servis yatış
- [ ] hemsire@hastane.example.com (H-001 / Test1234!) → `/hemsire/servis-takip` varsayılan `kapsam=benim`
- [ ] Kolonlar: protokol, ad soyad, yaş, cinsiyet, yatak/oda, yatış, gün, doktor, durum
- [ ] ACIL/KRITIK kırmızı, BEKLEYEN_TETKIK sarı satır
- [ ] Detay sekmeleri: Vital (ekle), MAR (Verildi/Atlandı), Servis, Konsültasyon, Notlar
- [ ] Taburcu / nakil / izin / doktor değiştir / kontrol → işlem logu
- [ ] `/hemsire/ilac-talep`: kalem bazlı liste + Acil; stok / verilen sekmeleri
- [ ] `/hemsire/gorevler` toggle; `/hemsire/vardiya-devir` not ekle
- [ ] Topbar zil: okunmamış bildirim badge; tıklayınca okundu
- [ ] Dashboard: yatan / görev / ilaç / randevu / nöbet sayıları dolu (— değil)
- [ ] `/hemsire/departman-randevulari` canlı liste
- [ ] Laborant `GET /yatis/kayitlar` → 403

## Faz I — Hemşire klinik görünürlük
- [ ] `/hemsire/hasta-arama`: Ad/TC/protokol ara; detay + tetkik/epikriz link
- [ ] `/hemsire/epikriz`: taslak oluştur; doktor `/doktor/epikriz` onayla
- [ ] `/hemsire/tetkikler`: salt okunur liste; servis-takip Tetkikler sekmesi
- [ ] `/hemsire/order-takip`: TETKIK/MAR/ILAC_TALEP; MAR Verildi/Atlandı
- [ ] Departman randevuları: hasta adı, bugün/hafta filtre, oluştur
- [ ] Dashboard “Bekleyen order” kartı dolu
- [ ] HEMSIRE `GET /tetkikler/` 200 (departman kapsamı)

## Faz J — EBE panel paritesi
- [ ] ebe@hastane.example.com / Test1234! → `/ebe` dashboard canlı kartlar
- [ ] Nav’da HEMSIRE ile aynı 11 menü (path kökü `/ebe`)
- [ ] `/ebe/servis-takip` listeler; dashboard kart linkleri `/ebe/...` (hemsire’ye kaçmaz)
- [ ] `/ebe/hasta-arama`, `/order-takip`, `/tetkikler`, `/epikriz`, `/ilac-talep`, `/gorevler`, `/vardiya-devir` açılır
- [ ] Laborant `GET /yatis/kayitlar` → 403 (değişmez)

## Faz K — Güvenlik paneli
- [ ] guvenlik@hastane.example.com (G-001 / Test1234!) → `/guvenlik` özet kartları dolu
- [ ] Olay oluştur (renk kodu: BEYAZ / MAVI / PEMBE / KIRMIZI / GRI / GENEL)
- [ ] Olay durumu: AÇIK → MÜDAHALE → ÇÖZÜLDÜ
- [ ] Ziyaretçi kaydı + çıkış
- [ ] Kayıp eşya kaydı
- [ ] Devriye kaydı
- [ ] Refakatçi sorgula (protokol / hasta)
- [ ] Yönetim (admin/başhekim/müdür) güvenlik kayıtlarını salt okuma gözetimiyle görür; operasyonel CRUD güvenlik rolünde

## Faz L — Laborant / Temizlik smoke
- [ ] laborant@hastane.example.com → `/laborant`: bekleyen tetkik listesi; sonuç girişi
- [ ] Laborant `GET /yatis/kayitlar` → 403 (klinik yatışa sızmaz)
- [ ] temizlik@hastane.example.com → `/temizlik`: kendi görevini görür / tamamlar
- [ ] Yönetim (müdür) temizlik görevi atar; personel listede görür

## Müdür regresyon (başhekim ayrımı)
Detaylı checklist: [bashekim-izin-envanteri.md](bashekim-izin-envanteri.md#müdür-regresyon-checklist).
- [ ] `GET /personel/`, `/departmanlar/`, `/randevular/` → 200
- [ ] `POST /personel/.../onayla` → 403
- [ ] `GET /denetim/` → 403
- [ ] `GET /bashekim/ozet` → 403
- [ ] `GET/POST /klinik-onay` onay uçları → 403

Şifre (tümü): Test1234!
