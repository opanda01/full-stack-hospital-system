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
- HASTA: `epikriz:goruntule` (KENDI_KAYDIM, yalnızca ONAYLANDI)
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

