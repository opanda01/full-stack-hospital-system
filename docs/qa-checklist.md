# Manuel QA — rol bazlı senaryolar

## Faz 1
- [ ] admin@hastane.example.com → /admin
- [ ] doktor@hastane.example.com → /doktor/randevularim
- [ ] hemsire@hastane.example.com → /hemsire
- [ ] temizlik@hastane.example.com → /temizlik
- [ ] laborant@hastane.example.com → /laborant
- [ ] mudur@hastane.example.com → /admin
- [ ] hasta@hastane.example.com (web) → /hasta
- [ ] hasta@hastane.example.com (mobil) → randevularım

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

Şifre (tümü): Test1234!
