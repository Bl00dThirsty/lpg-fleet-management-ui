# AGENTS.md

Operating rules for the LPG Fleet Management UI monorepo.

## Ownership of the web app

- `develop` and `main` build the **back-office** app (`apps/back-office`, package `@lpg/back-office`), moved there by the `feature/turborepo-architecture` branch. `main` is stale (predates the move) and should not be merged from directly.
- This repository also maintains `@lpg/web` (`apps/web`), a separate enterprise SPA. It is deployed independently on Vercel (see deploy config below) and is NOT part of the back-office build.

## Rule: analyze UI work on develop before adding it to @lpg/web

Every UI change that lands on `develop` (or its feature branches) must be reviewed against `@lpg/web`:

1. When a UI feature/change appears on `develop`, analyze its implementation.
2. **Adopt it into `@lpg/web` only if it is optimal** for the web app's architecture (Zustand + TanStack Query data layer, `@lpg/api-client` adapter, shared `@lpg/types`, custom JWT auth, PWA).
3. If a `develop` change diverges structurally from `@lpg/web` (e.g. mobile trip-tracking CSS, CSPH logo branding that does not fit the web SPA) and offers little value, **skip porting it**. Document the decision briefly.
4. Do not blindly merge `develop` into `@lpg/web`. Port selectively.

## Rule: keep @lpg/web live on Vercel

- `@lpg/web` must remain deployable and live on Vercel at all times.
- Root `vercel.json` filters the Vercel build to `@lpg/web` only:
  - `buildCommand`: `pnpm turbo run build --filter @lpg/web`
  - `outputDirectory`: `apps/web/dist`
  - SPA rewrite: `/(.*)` → `apps/web/dist/index.html`
- `apps/web/vercel.json` mirrors this for standalone/overridden deployments.
- Never change these configs in a way that breaks the Vercel build of `@lpg/web`.

## Rule: use the local mock backend to ease real-backend swap

- The data layer talks to a backend through `packages/api-client` (`HttpAdapter` + `ApiAdapter`).
- `VITE_API_MODE` controls the backend:
  - `fake` → **in-browser fixture data**, no server. Login just selects a demo profile (password ignored), all resources served from bundled `@lpg/mock-data` seeds. This is the mode used on Vercel/static hosts where the Express server cannot run.
  - `mock` → local Express mock server at `http://localhost:8787/api/v1` (run `pnpm mock`). Realistic HTTP + fake-JWT auth, for local dev.
  - `dev` / `production` → real API at `VITE_API_BASE_URL` (default `/api/v1`).
- The shared seed contract lives in `@lpg/mock-data` and is consumed by BOTH the Express server (`@lpg/mock-api`) and the browser fake adapter (`@lpg/api-client/src/fake-adapter.ts`), so they never drift apart.
- For local development, run `pnpm mock` and use `VITE_API_MODE=mock`. To preview the Vercel experience locally, set `VITE_API_MODE=fake` (no server needed).
- Swapping to a real backend is a one-flag change (`VITE_API_MODE=production` + `VITE_API_BASE_URL`).

## Dependency management (pnpm 9)

- pnpm 9 reads package overrides from **`pnpm-workspace.yaml`** (NOT from root `package.json`'s `pnpm.overrides`). Add/adjust version overrides there.
- Critical overrides are pinned there: `react`/`react-dom` 19.2.x, `@types/react` 19.2.14, `@types/react-dom` 19.2.3, `react-hook-form` 7.73.1, `@lpg/ui` aligned accordingly.

## Testing

- Tests use Vitest 4 browser mode. Use `expect.element(locator).matcher()` (Locator jest-dom matchers from `@vitest/browser`); do NOT add `@testing-library/jest-dom` (breaks types).
- Target: 51/51 tests passing. Run `pnpm test` (vitest run).

## Branch workflow

- Web refactor work lives on `refactor/apps-web-architecture` (branched from `develop` at `2c5d39c`).
- Feature branches of note: `feature/marketers-section` (file relocations — no net-new UI beyond `@lpg/web`'s `features/marketeurs`), `feature/trip-tracking-mobile-csph-logo` (mobile CSS + branding — skip porting per the adopt-iff-optimal rule).
