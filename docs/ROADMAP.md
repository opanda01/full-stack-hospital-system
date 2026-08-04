# Ürün Yol Haritası (Auth & Bildirim)

## Faz A — Backend auth (tamamlandı)

- JWT access + refresh; `oturum_tipi` (personel | hasta)
- Çift profil: aynı `Kullanici` (TC unique) üzerinde Personel + Hasta
- Personel: sicil / kullanıcı adı / e-posta login, zorunlu ilk şifre + KVKK (allowlist)
- Hasta: OTP kayıt/giriş; `/auth/register` deprecated (`X-Deprecated`, `Sunset`)
- Celery + Redis personel CSV/XLSX import + progress polling
- Denetim kaydı + güvenilir proxy IP (`TRUSTED_PROXY_IPS`)
- Bildirim: `BildirimPort` + console implementasyonu

## Faz B — Web personel UI (tamamlandı)

- Sicil / kullanıcı adı / e-posta login formu; `VITE_USE_MOCK_AUTH=false` (dev varsayılan)
- İlk giriş: `/sifre-degistir` + `/kvkk-onay` (`sifre_degistirmeli_mi` / `kvkk_onaylandi_mi`)
- `OnboardingGuard` + API 403 onboarding yönlendirmesi
- Personel import UI + progress polling (`/admin/personel` vb.)

## Faz C — Bildirim production

- [x] E-posta: `BILDIRIM_BACKEND=smtp` + `SMTP_*` (`smtplib`)
- [ ] Gerçek SMS gateway adaptörü (SMTP yalnızca e-posta)
- [ ] Import için **batch / rate-limited kuyruk** (2000 satır × ayrı API call riski)
- [ ] Retry / DLQ

## Faz D — Hasta mobil istemci (uygulandı + e-Nabız benzeri genişleme)

- OTP gönder / doğrula ekranları (GIRIS + KAYIT + KVKK); e-posta/şifre ve `/auth/register` mobil istemciden kaldırıldı
- `oturum_tipi=hasta` token: SecureStore + Zustand hydrate; 401’de refresh; logout
- Özet ana sayfa + kısayollar; randevu liste/iptal/al; tetkik liste+detay+trend; muayene; reçete; onaylı epikriz; profil (`/hastalar/ben` + alerji); şikayet/öneri
- HASTA: `epikriz:goruntule` (KENDI_KAYDIM, yalnızca ONAYLANDI); `klinik_onay:goruntule` (onaylı belgeler); `GET /hastalar/ben/ozet`, `/ben/belgeler`, `/ben/yatis-ozet`; tetkik `hasta_goruldu_at` okunmamış sayacı
- Demo: TC `10000000006` / telefon `05551234567` (OTP kodu SMS stub / konsol)
- `/auth/register` backend’de deprecated (`X-Deprecated`, `Sunset`); mobil artık OTP kullanır

## Faz F — Başhekim paneli (uygulandı)

- Personel erişim onayı (`erisim_durumu`, onay/red/bypass audit)
- BASHEKIM / MUDUR izin ayrımı + gözetim dashboard (`/bashekim/ozet`, TTL)
- PHI görüntüleme audit (`KAYIT_GORUNTULEME`)
- MHRS kapasite, E-Nabız/SGK mock entegrasyon, klinik onay kuyruğu
- Eczane / fatura / döner görüntüleme
- Yetki duyurusu + sistem gözetim
- Envanter: `docs/bashekim-izin-envanteri.md`

## Faz G — Doktor klinik paneli (uygulandı)

- Kapsam: `GET /hastalar/benim`, `hasta:goruntule` (türevsel); genel hasta listesi doktor’a kapalı
- Canlı: randevularım, muayene (oluştur/güncelle), hastalarım, tetkiklerim
- Reçete / sevk / tıbbi rapor → `klinik_onay:olustur` + başhekim onayı
- Konsültasyon + sağlık kurulu (üye kapsamı)
- Yasaklı: personel, denetim, MHRS, fatura, eczane stok, RBAC UI

## Faz H — Hemşire servis yatış paneli (uygulandı)

- Servis / yatak / yatış kaydı + hareketler (servis, yatak, izin, ameliyat) + refakatçi
- `GET /yatis/kayitlar?kapsam=benim` (kendi servis / sorumlu hemşire); klinik durum satır renklendirmesi
- Hasta işlemleri: taburcu, nakil, izin, doktor/hemşire değiştir, kontrol, refakatçi → `HastaIslemLogu`
- Klinik: vital bulgular, MAR (`ilac_uygulamalari`), hasta notları; kritik vital → `PanelBildirim` + `klinik_durum=KRITIK`
- Görevler + vardiya devir notları; panel bildirimleri (Topbar zil)
- Depodan ilaç/malzeme talep (`/ilac-talepleri`, kalem satırları + `acil_mi`); durum: YENI / ONAY_BEKLIYOR / ONAYLANDI / VERILDI
- Dashboard: yatan / görev / ilaç / randevu / nöbet canlı sayılar; departman randevuları listesi
- Web: `/hemsire/servis-takip`, `/ilac-talep`, `/gorevler`, `/vardiya-devir`, `/departman-randevulari`
- İzinler: `yatis:*`, `vital:*`, `ilac_uygulama:*`, `hemsire_gorev:*`, `vardiya_devir:*`, `panel_bildirim:*`, `ilac_talep:*` (HEMSIRE/EBE)

## Faz I — Hemşire klinik görünürlük (uygulandı)

- Hasta arama: `GET /hastalar/?q=&kapsam=yatan|tumu`; `hasta:goruntule` DEPARTMANIM; UI `/hemsire/hasta-arama`
- Epikriz: model `/epikriz` (TASLAK/ONAYLANDI); hemşire oluşturur, doktor `/doktor/epikriz` onaylar
- Tetkik listesi: `tetkik:goruntule` DEPARTMANIM; `/hemsire/tetkikler` + servis-takip sekmesi
- Order takibi (composite): Tetkik + MAR + ilaç talep; `GET /yatis/ilac-uygulamalari`; `/hemsire/order-takip`
- Randevu: hasta adı, zaman filtreleri, oluştur formu
- Dashboard: bekleyen order kartı

## Faz J — EBE panel paritesi (uygulandı)

- Backend izinleri zaten HEMSIRE ≡ EBE; yeni API/migration yok
- Web: hemsire sayfa bileşenleri `/ebe` altına mount (sayfa kopyası yok)
- `useRoleBasePath` / `roleBasePathFromPathname` — dashboard ve klinik linkler `/ebe/...` veya `/hemsire/...`
- Nav paritesi: servis-takip, hasta-arama, order, tetkik, epikriz, ilaç talep, görev, vardiya, randevu, nöbet
- Demo: `ebe@hastane.example.com` / Test1234!

## Faz K — Güvenlik paneli (uygulandı)

- Rol `GUVENLIK`: olay / ziyaretçi / kayıp eşya / devriye / refakatçi sorgula + nöbet + şikayet
- Backend: `backend/app/features/guvenlik/` (`/guvenlik/*`), migration `011_guvenlik_paneli`
- Kod tipleri: BEYAZ / MAVİ / PEMBE / KIRMIZI / GRİ / GENEL; durum: AÇIK → MÜDAHALE → ÇÖZÜLDÜ
- Web: `/guvenlik` dashboard (canlı `/guvenlik/ozet`) + olaylar, ziyaretçiler, kayıp-eşya, devriyeler, refakatçi-sorgula
- Yönetim gözetimi: ADMIN/BASHEKIM/MUDUR olay-ziyaretçi-kayıp-eşya-devriye **görüntüleme**
- Kapsam dışı: CCTV / turnike / Bakanlık Beyaz Kod portal entegrasyonu

## Faz L — Klinik güvenlik (alerji / reçete)

- Yapılandırılmış `recete_kalemleri` + `hasta_alerjileri` + seed DDI
- Hard-stop (SIDDETLI/ANAFILAKSI/KONTRANDIKE) — break-glass yok; HAFIF/ORTA için `RECETE_UYARI_OVERRIDE`

## Faz M — KVKK + PHI şifreleme

- Versiyonlu `kvkk_metinleri` / `kvkk_onay_kayitlari`
- AES-GCM + ayrı HMAC blind index; backfill `skip_hasta_audit` + `PHI_ENCRYPT_BACKFILL`
- Celery `phi_retention.anonimlestir`

## Faz N — Entegrasyon portları (mock)

- `EnabizPort` / `MedulaPort` / `KpsPort`; `ENTEGRASYON_BACKEND=mock|live`
- Fatura `POST /faturalar/{id}/medula-gonder`; outbox tablosu

## Faz O — Headers + backup

- `SecurityHeadersMiddleware`; Compose `postgres-backup`; haftalık CI restore-smoke

## Faz P — ICD-10 + lab kalemleri

- `icd10_kodlari`, `muayene_tani_kodlari`, `tetkik_sonuc_kalemleri`, `GET /tetkikler/trend`

---

## Devlet HBYS uyum yol haritası (2026)

Kod tabanı taramasına dayalı gap analizi. Durum özeti: **MEVCUT** / **KISMEN** / **YOK**.

| Alan | MEVCUT | KISMEN | YOK |
|------|--------|--------|-----|
| A Kimlik | TC checksum (`app/core/tc_kimlik.py`) | Mükerrer engel (TC unique + create kontrolleri) | Yenidoğan/TC’siz, yabancı kimlik, MPI merge, veli/vasi |
| B Mali | — | MEDULA port + fatura gönder | Provizyon iş akışı, katkı payı, sevk zinciri kuralı |
| C Klinik güvenlik | Vital kritik uyarı | Reçete alerji/DDI | MAR’da aynı kontrol, lab panic, transfüzyon |
| D Bildirimler | — | Güvenlik renk kodları (adli değil) | BBY, adli vaka, ölüm/doğum, organ bağışı |
| E Randevu | — | MHRS kapasite mock | Acil triyaj, no-show |
| F KVKK | — | Retention/anonimleştirme, KVKK metin/onay | E-imza onam, export/print audit, veli onam, acil rıza istisnası |
| G Operasyon | Yatak doluluk (`GET .../doluluk`) | Temizlik görevleri | İzolasyon, sterilizasyon/cihaz, nöbet yasal süre |
| H Teknik | — | Login + OTP rate limit | OTP IP middleware, multi-tenant |

### Faz 1 — Kritik (hasta güvenliği ve mevzuat uyumu)

1. **MAR güvenlik kapısı** ✅
   - Neden: Reçetede alerji/DDI hard-stop var; `ilac_uygulama` (MAR) oluştur/VERILDI öncesinde aynı kontrol yok — ilaç uygulama hatası riski.
   - Katman: `yatis` (`klinik_service`), web hemşire MAR.
   - Büyüklük: **M**
   - Bağımlılık: `muayeneler/recete_guvenlik.py`, `hasta_alerjileri`
   - Yapıldı: `create_ilac_uygulama` + `VERILDI` patch → `uygula_veya_engelle(..., baglam="MAR")`; soft override + `MAR_UYARI_OVERRIDE` denetim; testler `test_mar_guvenlik.py`

2. **Lab panic değer motoru** ✅
   - Neden: Vital için kritik eşik + panel bildirim var; tetkik sonuçlarında panic/referans eşiği ve otomatik uyarı yok.
   - Katman: `tetkikler`, panel bildirimleri, web laborant/doktor.
   - Büyüklük: **L**
   - Bağımlılık: `tetkik_sonuc_kalemleri`, `PanelBildirim`
   - Yapıldı: `panic_min`/`panic_max`/`panic_mi` + migration `024_lab_panic`; `sonuc_gir` → isteyen doktora `KRITIK_LAB` panel bildirimi; `test_lab_panic.py`

3. **Mükerrer hasta / MPI iskeleti** ✅
   - Neden: TC unique ve create kontrolleri var; kontrollü merge / şüpheli duplicate kuyruğu yok (KVKK + hasta güvenliği).
   - Katman: `hastalar`, `crypto` (HMAC), denetim, web.
   - Büyüklük: **L**
   - Bağımlılık: `Hasta.tc_kimlik_no_hash`, `denetim_kaydi_yaz`
   - Yapıldı: `GET /hastalar/mukerrer-adaylar`, merge istek/onay API, `merged_into_hasta_id`, migration `025_mpi_mukerrer`; FK taşıma sonraki faz

4. **KPS doğrulama opsiyonunu kayıt path’ine bağlama** ✅
   - Neden: `KPS_DOGRULAMA_ZORUNLU` config’te var; hasta/OTP oluşturmada `get_kps()` kullanımı bulunamadı.
   - Katman: `hastalar`, `auth` OTP, `integrations`.
   - Büyüklük: **S**
   - Bağımlılık: `KpsPort`, `tc_kimlik` checksum
   - Yapıldı: `kps_dogrula_gerekirse` → OTP KAYIT + `create_hasta_with_user`; `test_kps_kayit.py`

5. **Zorunlu bildirim alanları (minimum)** ✅
   - Neden: Mevzuat (bulaşıcı/adli/ölüm) için BBY entegrasyonu öncesi en az bayrak + denetim gerekir.
   - Katman: `muayeneler`, `yatis`, web.
   - Büyüklük: **M**
   - Bağımlılık: ICD/tanı (`klinik_kodlar`), denetim
   - Yapıldı: `MuayeneKaydi` bayrakları + migration `026_zorunlu_bildirim`; create/update → `ZORUNLU_BILDIRIM_ISARET` denetim; `test_zorunlu_bildirim.py`

6. **OTP/login brute-force sertleştirme** ✅
   - Neden: Login IP rate limit + OTP telefon limiti var; OTP uçları IP bazlı middleware’de değil.
   - Katman: `login_rate_limit`, `auth`, Redis.
   - Büyüklük: **S**
   - Bağımlılık: `LoginRateLimitMiddleware`, `_otp_rate_limit_check`
   - Yapıldı: Middleware `/auth/otp/gonder` + `/auth/otp/dogrula` IP limit; `test_otp_ip_rate_limit.py`

7. **Veli/vasi / yasal temsilci onam akışı** ✅
   - Neden: 18 yaş altı veya ehliyeti kısıtlı hastada KVKK/açık rıza yalnızca oturum kullanıcısından alınıyor; `dogum_tarihi` onam path’ine yansımıyor; `veli_id`/vasi modeli yok (yalnızca yatış `Refakatci`). TMK yasal temsil / hasta hakları.
   - Katman: `hastalar`, `kvkk`/`auth`, web/mobil onboarding.
   - Büyüklük: **L**
   - Bağımlılık: `Hasta.dogum_tarihi`, `KvkkOnayKaydi` (genişletme); mevcut `klinik_onay` (RECETE/SEVK/TIBBI_RAPOR) belge kuyruğundan ayrı hasta onam kaydı
   - Yapıldı: `HastaYasalTemsilci` + `ehliyet_kisitli_mi` + migration `027_veli_vasi_onam`; KVKK onamında yaş/ehliyet kapısı; `test_veli_vasi.py`

8. **Acil rızasız müdahale istisnası** ✅
   - Neden: Bilinçsiz/acil hastada rıza alınamadığında iki hekim imzalı geçici onay, denetim ve sonradan hasta/yakın bilgilendirme yolu yok (`KlinikOnayKaydi` tek onaylayan; reçetede break-glass yok).
   - Katman: hasta-onam veya `klinik_onay` genişletmesi, `ameliyathane`/`yatis`, web.
   - Büyüklük: **M**
   - Bağımlılık: `denetim_kaydi_yaz`, personel/doktor
   - Yapıldı: `tur=ACIL_RIZASIZ` + `ikinci_onaylayan_id` / bilgilendirme alanları + migration `028_acil_rizasiz`; `test_acil_rizasiz.py`

### Faz 2 — Önemli (operasyonel eksikler)

9. **MEDULA provizyon iş akışı**
   - Neden: `MedulaPort.provizyon_al` mock var; kabul/muayene öncesi provizyon zinciri yok.
   - Katman: `faturalandirma`, `entegrasyonlar`, outbox.
   - Büyüklük: **L**
   - Bağımlılık: `MedulaPort`, fatura `provizyon_no` / `medula_takip_no`

10. **MHRS iki yönlü stub → sandbox**
    - Neden: Kapasite + mock senkron var; randevu oluştur/iptal MHRS id eşlemesi yok.
    - Katman: `mhrs`, `randevular`, web başhekim.
    - Büyüklük: **L**
    - Bağımlılık: `mhrs_kapasiteler`, `Randevu`

11. **Acil triyaj modülü**
    - Neden: `ServisTipi.ACIL` var; Manchester/ATS skor/renk kaydı yok.
    - Katman: yeni `acil` veya `yatis`, web.
    - Büyüklük: **M**
    - Bağımlılık: `ServisTipi.ACIL`

12. **No-show politikası**
    - Neden: `Randevu.durum` genel string; GELMEDI sayacı ve kısıt yok.
    - Katman: `randevular`, web/mobil.
    - Büyüklük: **M**
    - Bağımlılık: `Randevu`

13. **Yenidoğan / yabancı kimlik modeli**
    - Neden: TC zorunlu checksum; geçici protokol, anne FK, YKN/pasaport tipi yok.
    - Katman: `hastalar`, migration, web.
    - Büyüklük: **L**
    - Bağımlılık: `Hasta`, `tc_kimlik`

14. **İzolasyon + yatak kısıtı**
    - Neden: Yatak doluluk var; izolasyon tipi (damlacık/hava) yok.
    - Katman: `yatak_yonetimi`, `yatis`.
    - Büyüklük: **M**
    - Bağımlılık: `Yatak`, `YatisKaydi`

15. **E-Nabız paket üretimi**
    - Neden: Port + panel test senkron var; klinik olaylardan otomatik paket tetikleme sınırlı.
    - Katman: `entegrasyonlar`, outbox, klinik feature’lar.
    - Büyüklük: **L**
    - Bağımlılık: `EnabizPort`, `entegrasyon_gonderimleri`

16. **Katkı payı / sevk kural motoru (basit)**
    - Neden: Klinik onayda sevk metni var; aile hekimi sevk doğrulama ve ilave ücret satırı yok.
    - Katman: `faturalandirma`, `klinik_onay`.
    - Büyüklük: **L**
    - Bağımlılık: fatura modelleri, sevk belgesi

### Faz 3 — İyileştirme (teknik borç / UX)

17. **Export/print denetimi**
    - Neden: `KAYIT_GORUNTULEME` var; PDF/export/print aksiyon kodu bulunamadı.
    - Katman: `audit`, web.
    - Büyüklük: **S**
    - Bağımlılık: `denetim_kaydi_yaz`

18. **Ameliyat dijital onam**
    - Neden: `KvkkMetinTur` aydınlatma/açık rıza var; ameliyat özel onam + e-imza metadata yok.
    - Katman: `ameliyathane`, `kvkk`, web.
    - Büyüklük: **M**
    - Bağımlılık: `AmeliyatPlani`, KVKK metinleri

19. **Nöbet uyum kuralları**
    - Neden: Nöbet atama var; haftalık saat üst limiti / çakışma engeli yok.
    - Katman: `nobet_cizelgesi`.
    - Büyüklük: **M**
    - Bağımlılık: `NobetCizelgesi`

20. **Cihaz/sterilizasyon takibi**
    - Neden: Temizlik görevleri ≠ CSSD / tıbbi cihaz kalibrasyon.
    - Katman: yeni feature veya genişletilmiş ops.
    - Büyüklük: **L**
    - Bağımlılık: —

21. **Transfüzyon güvenlik**
    - Neden: `kan_grubu` profil alanı var; çapraz eşleşme / çift imza yok.
    - Katman: `tetkikler` / `yatis`, web.
    - Büyüklük: **L**
    - Bağımlılık: `Hasta.kan_grubu`

22. **Multi-tenant hazırlık**
    - Neden: `hastane_id` / `kurum_id` yok; tek kurum varsayımı.
    - Katman: çekirdek modeller, RBAC.
    - Büyüklük: **L**
    - Bağımlılık: —

23. **Seed/demo TC uyumu**
    - Neden: API checksum zorunlu; seed/demo TC’leri hâlâ uyumsuz olabilir.
    - Katman: `seed_rbac`, docs, mobil demo.
    - Büyüklük: **S**
    - Bağımlılık: `tc_ilk_dokuz_haneden` / `tc_kimlik`

