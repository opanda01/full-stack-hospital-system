# Maestro hasta mobil smoke

Geliştirme ortamında [Maestro](https://maestro.mobile.dev/) ile temel akış doğrulaması.

## Önkoşullar

- Backend: `http://localhost:8000` (veya `EXPO_PUBLIC_API_URL`)
- Seed hasta: TC `10000000006`, telefon `05551234567`
- Expo uygulaması cihaz/emülatörde açık

## Çalıştırma

```bash
cd mobile
maestro test .maestro/smoke.yaml
```

OTP adımı için stub kod (`gelistirme_kodu`) kullanıldığında tam E2E genişletilebilir.
