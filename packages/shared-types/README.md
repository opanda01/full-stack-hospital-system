# @hastane/shared-types

FastAPI OpenAPI şemasından üretilen paylaşılan TypeScript tipleri.

## Tip üretimi

Backend (`http://localhost:8000`) ayaktayken:

```bash
pnpm --filter @hastane/shared-types generate
```

Komut, monorepo kökündeki hoisted `openapi-typescript` paketini doğrudan çağırır (`node-linker=hoisted` ile uyumlu).

Alternatif (aynı çıktı):

```bash
npx openapi-typescript http://localhost:8000/openapi.json -o packages/shared-types/src/index.ts
```

Üretilen `src/index.ts` web ve mobile paketlerinde `@hastane/shared-types` olarak import edilir.
