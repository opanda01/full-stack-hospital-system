# Canlı entegrasyon geçiş checklist

Önkoşul: [README.md](./README.md) adapter deseni ve `ENTEGRASYON_BACKEND=live`.

## Kurum ve sertifika

- [ ] Kurum kodu / hastane tanımlayıcıları (MEDULA, MHRS, e-Nabız)
- [ ] Üretim sertifikaları ve güvenli depolama (secret manager, `.env` commit edilmez)
- [ ] WSDL / REST endpoint URL’leri (sandbox → prod)
- [ ] IP allowlist / VPN gereksinimleri doğrulandı

## Ortam

- [ ] `ENTEGRASYON_BACKEND=live`
- [ ] `KPS_DOGRULAMA_ZORUNLU` politikası onaylandı
- [ ] `MEDULA_PROVIZYON_ZORUNLU` (varsa) canlı provizyon testi yapıldı
- [ ] `PUSH_BACKEND=expo` + `EXPO_ACCESS_TOKEN` (hasta mobil)
- [ ] `BILDIRIM_BACKEND=smtp` veya `sms` + gateway env’leri

## Sandbox doğrulama

- [ ] MEDULA: provizyon → muayene → fatura gönderim zinciri
- [ ] e-Nabız: muayene sonrası paket + durum sorgu
- [ ] KPS: kayıt path’inde TC doğrulama
- [ ] MHRS: randevu oluştur / iptal eşlemesi

## Operasyon

- [ ] Outbox (`entegrasyon_gonderimleri`) izleme — başhekim **Entegrasyonlar** ekranı
- [ ] Hata durumunda `POST /entegrasyonlar/outbox/{id}/retry`
- [ ] Bildirim DLQ (`bildirim_dlq_kayitlari`) Celery `bildirim.dlq_isle` ile
- [ ] Denetim: `ENTEGRASYON_SENKRON`, `MEDULA_PROVIZYON`, `ENABIZ_PAKET`

## Rollback

- [ ] `ENTEGRASYON_BACKEND=mock` ile hızlı geri dönüş prosedürü
- [ ] Canlıya geçişte feature flag / bakım penceresi notu
