# Bakanlık / SGK entegrasyonları

Adapter deseni: `app/integrations/` (`BildirimPort` ile aynı).

## Env

- `ENTEGRASYON_BACKEND=mock|live` (varsayılan `mock`)
- `MOCK_ENTEGRASYON_FAIL=true` — mock hata senaryosu
- `KPS_DOGRULAMA_ZORUNLU=true` — hasta oluşturmada KPS (opsiyonel)

## Portlar

- `EnabizPort` — paket gönder / durum
- `MedulaPort` — provizyon / fatura / sonuç
- `KpsPort` — TC doğrula

Live sınıflar `NotImplementedError` fırlatır (kimlik/WSDL yok).

## Canlıya geçiş checklist

1. Kurum kodu, sertifika, WSDL/endpoint
2. Sandbox test + `ENTEGRASYON_BACKEND=live`
3. Outbox (`entegrasyon_gonderimleri`) retry/DLQ izleme
4. Başhekim entegrasyon paneli hata özetleri
