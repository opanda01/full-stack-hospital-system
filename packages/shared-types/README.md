# @hastane/shared-types

FastAPI OpenAPI şemasından üretilen paylaşılan TypeScript tipleri.

## Tip üretimi

Backend (`http://localhost:8000`) ayaktayken:

```bash
npx openapi-typescript http://localhost:8000/openapi.json -o src/index.ts
```

veya monorepo kökünden:

```bash
pnpm --filter @hastane/shared-types generate
```

Üretilen `src/index.ts` web ve mobile paketlerinde `@hastane/shared-types` olarak import edilir.
