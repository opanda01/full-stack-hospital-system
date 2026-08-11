# Backend — Şikayet/öneri durum yönetimi

## Durum değerleri (`SikayetDurum`)

| Değer | Anlam |
|--------|--------|
| `ACIK` | Yeni / bekleyen |
| `INCELENIYOR` | İşlemde |
| `COZULDU` | Çözüldü |
| `REDDEDILDI` | Reddedildi |

Yeni kayıtlar `ACIK` ile oluşturulur.

## API

| Metot | Yol | İzin |
|--------|-----|------|
| `GET` | `/sikayet-oneri/ozet` | `sikayet_oneri:tumunu_goruntule` |
| `PATCH` | `/sikayet-oneri/{id}/durum` | `sikayet_oneri:durum_guncelle` |

**Özet yanıtı:** `{ toplam, bekleyen, cozulen }` — `bekleyen` = ACIK + INCELENIYOR; `cozulen` = COZULDU + REDDEDILDI.

**Durum güncelleme gövdesi:** `{ "durum": "INCELENIYOR", "not": "opsiyonel" }` — `not` şimdilik saklanmaz (ileride denetim için).

Liste endpoint'i mevcut `durum` query parametresi ile filtrelemeye devam eder.

## RBAC

`sikayet_oneri:durum_guncelle` — Admin (wildcard), Müdür ve Başhekim (`_mudur_izinleri`).

## Frontend (sonraki adım)

- Dashboard: `GET /sikayet-oneri/ozet` → `bekleyen` veya `?durum=ACIK&page_size=1`
- Liste ekranı: durum değiştirme → `PATCH /{id}/durum`

Migration gerekmez (`durum` kolonu zaten var).
