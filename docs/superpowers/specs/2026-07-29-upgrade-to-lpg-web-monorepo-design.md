# Upgrade target to `@lpg/web` monorepo — Design

- **Date**: 2026-07-29
- **Status**: Approved (pending user review of written spec)
- **Target repo**: `C:\Users\DTA_WorkStation\Documents\manga\lpg-fleet-management-ui`
- **Source of truth**: `C:\Users\DTA_WorkStation\Documents\lpg-fleet-management-ui` (per user clarification: source = `Documents\lpg-fleet-management-ui`)
- **Migration mode**: Full monorepo mirroring of `apps/web` only (per `AGENTS.md` "adopt only if optimal" — no back-office)
- **Compatibility bar**: keep every existing target route working; `typecheck + lint + build + test` must all pass before/after

---

## 1. Goal

Bring the target repo (`Documents\manga\lpg-fleet-management-ui`, currently a single Vite SPA) to the same shape and feature surface as `@lpg/web` in the source monorepo (`Documents\lpg-fleet-management-ui/apps/web`), without breaking any currently-working route, while adopting:

- the pnpm + turbo monorepo skeleton (apps/web + 7 shared packages),
- the CASL-based permissions system (AuthStore, PermissionsProvider, AbilityContext),
- the role-aware module routing system (registry, role stores, dynamic `$role/$module` route),
- the shared `@lpg/ui` shadcn primitive package (with backward-compatible re-exports for any target-only components),
- the new dashboard charts, notifications feature, command palette, PWA support,
- the mock backend stack (`@lpg/api-client` + `@lpg/mock-data` + `@lpg/mock-api`) with `VITE_API_MODE` switching,
- the test suite and tooling at parity with source.

Out of scope (per user choice + AGENTS.md): migrating `@lpg/back-office` or any `develop`-branch-only content.

---

## 2. Architecture

### 2.1 Topology

```
target-root/
├── apps/
│   └── web/                    ← migrated from current src/ + new files
├── packages/
│   ├── api-client/             ← workspace package
│   ├── config/                 ← workspace package
│   ├── mock-api/               ← workspace package
│   ├── mock-data/              ← workspace package
│   ├── permissions/            ← workspace package
│   ├── types/                  ← workspace package
│   └── ui/                     ← workspace package
├── docs/superpowers/specs/     ← this spec lives here
├── pnpm-workspace.yaml         ← adds apps/* and packages/*
├── turbo.json                  ← new
├── package.json                ← root workspace manifest
├── pnpm-lock.yaml              ← regenerated
├── vercel.json                 ← preserved, filters to @lpg/web
├── README.md
├── AGENTS.md                   ← adapted from source
└── .gitignore
```

### 2.2 Workspace configuration

- **Package manager**: pnpm 9.x (matches source).
- **Workspace declaration** (`pnpm-workspace.yaml`):
  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
  ```
- **pnpm overrides** moved from any root-level `pnpm.overrides` to `pnpm-workspace.yaml` per AGENTS.md. Critical pins: `react`/`react-dom` 19.2.x, `@types/react` 19.2.14, `@types/react-dom` 19.2.3, `react-hook-form` 7.73.1.
- **Turborepo** (`turbo.json`): pipeline tasks `build`, `dev`, `lint`, `typecheck`, `test`. `build` depends on `^build` (so packages build before the app). Outputs: `dist/**`.
- **Vercel** (`vercel.json` at root):
  ```json
  {
    "buildCommand": "pnpm turbo run build --filter @lpg/web",
    "outputDirectory": "apps/web/dist",
    "rewrites": [{ "source": "/(.*)", "destination": "/apps/web/dist/index.html" }]
  }
  ```
  `apps/web/vercel.json` mirrors the same config for standalone/override deploys.

### 2.3 App name & identity

- App package name: `@lpg/web` (matches source).
- App version: `0.0.0` (private workspace package).
- Title shown to users: "CSPH — Gestion de flotte" (PWA manifest `name`).

---

## 3. Directory layout — `apps/web/`

```
src/
├── components/
│   ├── layout/                          # app-header, app-sidebar, app-title,
│   │                                    # authenticated-layout, breadcrumbs,
│   │                                    # header, main, nav-group, nav-user,
│   │                                    # page, page-header, role-switcher (NEW),
│   │                                    # types
│   ├── confirm-dialog.{tsx,test.tsx}
│   ├── long-text.tsx
│   ├── navigation-progress.tsx
│   ├── password-input.{tsx,test.tsx}
│   └── skip-to-main.tsx
│
├── config/
│   ├── fonts.ts
│   ├── modules/{registry.ts, types.ts}              # NEW: module registry
│   └── rbac/{roles.ts, sidebar-by-role.ts}          # NEW: role config
│
├── context/
│   ├── AbilityContext.ts                            # NEW
│   ├── PermissionsProvider.tsx                      # NEW
│   ├── direction-provider.tsx
│   ├── font-provider.tsx
│   └── theme-provider.tsx
│
├── features/
│   ├── activity/trip-tracking/                      # kept + trip-route-map
│   ├── command-palette/                             # NEW (cmdk)
│   ├── dashboard/                                   # + chart-area-interactive,
│   │                                               # chart-bar, chart-line, chart-pie,
│   │                                               # dashboard-details, multiselect-filter,
│   │                                               # recent-activity, section-cards
│   ├── errors/{general-error, not-found-error}.tsx
│   ├── marketers/                                   # + marketers-bulk-actions
│   ├── notifications/                               # NEW: center, group-form,
│   │                                               # group-schema, groups-store,
│   │                                               # notifications-store + tests
│   ├── routes/                                      # + route-corridor-map,
│   │                                               # route-lpg-variation,
│   │                                               # route-lpg-variation-panel,
│   │                                               # route-telemetry-chart
│   ├── sites/                                       # data + utils
│   ├── transporters/                                # + transporter-history,
│   │                                               # transporter-routes,
│   │                                               # transporter-trucks,
│   │                                               # transporter-trucks-list
│   └── trucks/                                      # + truck-details-sheet, trucks-map
│
├── hooks/
│   ├── use-dialog-state.tsx
│   ├── use-mobile.tsx                               # moved to @lpg/ui + re-export shim
│   └── use-table-url-state.{ts,test.ts}
│
├── lib/
│   ├── api/{mappers.ts, use-resources.ts}           # NEW
│   ├── breadcrumbs.{ts,test.ts}                     # NEW test
│   ├── cookies.{ts,test.ts}
│   ├── handle-server-error.{ts,test.ts}
│   ├── show-submitted-data.tsx
│   ├── toast.ts                                     # NEW (toastError/toastSuccess)
│   └── utils.{ts,test.ts}
│
├── module/                                          # NEW
│   ├── build-columns.tsx
│   ├── custom-screens.tsx
│   ├── mock-data.ts
│   ├── module-bulk-actions.tsx
│   ├── module-screen.tsx
│   └── role-dashboard.tsx
│
├── roles/                                           # NEW
│   ├── agent/{declarations-screen.tsx, index.ts}
│   ├── integrateur/{pda-screen.tsx, index.ts}
│   ├── livreur/{missions-screen.tsx, scan-screen.tsx, index.ts}
│   ├── manifest.ts
│   ├── marketeur/{delivery-tours-screen.tsx, supply-screen.tsx, index.ts}
│   ├── super-admin/{custom-roles-screen.tsx, map-screen.tsx, risk-dashboard-screen.tsx, index.ts}
│   └── supervisor/{infra-screen.tsx, index.ts}
│
├── routes/                                          # file-based (replaces src/routes)
│   ├── __root.tsx
│   ├── _authenticated/
│   │   ├── $role/{index.tsx, $module.tsx}           # NEW: dynamic role + module
│   │   ├── activity/trip-tracking.tsx
│   │   ├── dashboard/{index.tsx, fleets/$fleetName.tsx, sites/$siteId.tsx}
│   │   ├── index.tsx
│   │   ├── marketers/{index.tsx, $marketerId.tsx}
│   │   ├── route.tsx
│   │   ├── routes/index.tsx
│   │   ├── settings/{index.tsx, notification-groups.tsx, profile.tsx}
│   │   ├── transporters/{index.tsx, $transporterId.tsx}
│   │   └── trucks/{index.tsx, $truckId.tsx}
│   ├── login.tsx                                    # NEW
│   └── terms.tsx                                    # NEW
│
├── store/
│   ├── auth-store.ts                                # NEW
│   └── role-store.ts                                # NEW
│
├── styles/index.css
├── test-utils/{cookies.ts, tanstack-table.ts}
├── main.tsx
├── routeTree.gen.ts                                 # regenerated
├── tanstack-table.d.ts
├── vite-env.d.ts
├── vite.config.ts                                   # + VitePWA plugin
├── eslint.config.mjs
├── tsconfig.{json, app.json, node.json}
└── vercel.json
```

### 3.1 Backward-compatibility shim

Target files that source has not moved to a shared package continue to resolve via a thin re-export shim under `apps/web/src/components/`:

- `src/components/data-table/{bulk-actions,column-header,faceted-filter,pagination,toolbar,view-options,index}.tsx` — kept at `apps/web/src/components/data-table/*` AND re-exported via `@lpg/ui` package `index.ts` for source parity. (Both names resolve; existing imports keep working.)
- `src/components/select-dropdown.tsx`, `src/components/learn-more.tsx`, `src/components/coming-soon.tsx`, `src/components/date-picker.tsx` — kept at `apps/web/src/components/*` as-is. If `@lpg/ui` later exposes equivalents, the shim still wins on the import path.
- `src/hooks/use-mobile.tsx` — kept locally AND re-exported from `@lpg/ui`.
- `src/hooks/use-table-url-state.ts` — kept locally AND re-exported from `@lpg/ui`.

Rationale: keeps every existing import path in the target's current code working while we layer the monorepo on top. Once the migration passes all gates, the shim can be tightened in a follow-up PR.

---

## 4. Shared packages

Each package is a self-contained workspace with its own `package.json`, `tsconfig.json`, and `src/`. Versions match source.

| Package | Purpose | Key exports |
|---|---|---|
| `@lpg/types` | Domain types | truck, route, marketer, transporter, site, trip, user, role, permission |
| `@lpg/config` | Runtime config (env parsing, API mode) | `apiMode`, `apiBaseUrl`, `arcgisApiKey`, `featureFlags` |
| `@lpg/permissions` | CASL ability factory + role definitions | `createAbility`, `Role`, `Action`, `Subject` |
| `@lpg/api-client` | HTTP + adapter + fake + resources hook | `ApiAdapter`, `HttpAdapter`, `FakeAdapter`, `useResources`, `mappers` |
| `@lpg/mock-data` | Seed data shared by server & browser fake | seed modules for every domain entity |
| `@lpg/mock-api` | Express server on `:8787/api/v1` | server bootstrap, route handlers |
| `@lpg/ui` | shadcn primitives + data-table + hooks | all UI primitives, `data-table/*`, `date-picker`, `use-mobile`, `use-table-url-state`, `lib/utils`, `lib/export-utils` |

---

## 5. Data flow

```
┌────────────────────────────────────────────────────────────────────┐
│ UI components (apps/web/src/features/*, components/*)              │
│   consume TanStack Query via useResources() from @lpg/api-client   │
└────────────────────────┬───────────────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────────────┐
│ @lpg/api-client                                                    │
│   adapter = pickAdapter(VITE_API_MODE)                             │
│     fake  → FakeAdapter   (in-browser, @lpg/mock-data seeds)       │
│     mock  → HttpAdapter   (axios → /api/v1 → :8787)                │
│     dev   → HttpAdapter   (axios → VITE_API_BASE_URL)              │
│     prod  → HttpAdapter   (axios → VITE_API_BASE_URL)              │
└────────────────────────┬───────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   VITE_API_MODE     VITE_API_MODE    VITE_API_MODE
   =mock             =dev|prod        =fake
   (local)           (real API)       (static)
   @lpg/mock-api     VITE_API_BASE    @lpg/mock-data
   Express :8787     _URL             in-browser
   /api/v1                            fixtures
```

- **Single seed source**: `@lpg/mock-data` is consumed by BOTH `mock-api` and `api-client/src/fake-adapter.ts`. They cannot drift.
- **Auth**: `useAuthStore` (zustand) → `PermissionsProvider` builds a CASL `AppAbility` from `role-store` → consumers use `useAbility()` / `<Can I="…" a="…">`.
- **Module routing**: `routes/_authenticated/$role/$module.tsx` reads `config/modules/registry.ts` at runtime, renders `module/module-screen.tsx` with the right screen component.
- **Toast**: single `lib/toast.ts` (toastError, toastSuccess) replaces ad-hoc `toast(...)` calls.

### 5.1 Mock data strategy (deferred)

Per user choice, the existing target's static mock files under `src/features/*/data/*.ts` are **kept** for now. The new `@lpg/mock-data` and `@lpg/mock-api` packages are scaffolded and wired but the existing per-feature mock data files are not deleted. A follow-up plan phase will move the seeds into `@lpg/mock-data` and switch `useResources` to consume them. The upgrade passes gates either way.

---

## 6. Error handling

- **Query errors** → `QueryCache.onError` in `main.tsx`:
  - 401 → `toastError('Session expired.')` → `authStore.logout()` → `router.navigate({ to: '/login' })`
  - 500 → `toastError('Internal server error.')`
  - 304 → `toastError('Content not modified!')` (from mutation onError)
- **Mutation errors** → `handleServerError(error)` (in `lib/handle-server-error.ts`, unit-tested) → toast.
- **Retry policy**: skip retries on 401/403; cap at 3 in prod, disable in dev.
- **Route errors** → `features/errors/{general-error,not-found-error}.tsx` (already in target, kept).
- **ArcGIS map immutability** (`trip-route-map.tsx`): the 3 pre-existing lint errors (2× `no-explicit-any` on lines 113/227, 1× `react-hooks/immutability` on line 113, 1× `no-console` on line 241, 1× `react-refresh/only-export-components` in `trip-tracking.tsx`) are **fixed during this upgrade** by replacing `as any` with the actual ArcGIS basemap type and using a local mutable variable inside the effect. Not deferred.

---

## 7. Testing

### 7.1 Stack (matches source)

- Vitest 4 in browser mode + Playwright chromium (already used by target)
- `@testing-library/react` (NEW) + `jsdom` (NEW) for component tests needing DOM
- `@vitest/browser-playwright` + `vitest-browser-react` (already in target)
- No `@testing-library/jest-dom` — use `expect.element(locator).matcher()` from `@vitest/browser`

### 7.2 Test inventory

Files that must exist and pass:

- `apps/web/src/components/confirm-dialog.test.tsx` ✓ (exists)
- `apps/web/src/components/password-input.test.tsx` ✓ (exists)
- `apps/web/src/hooks/use-table-url-state.test.ts` ✓ (exists)
- `apps/web/src/lib/cookies.test.ts` ✓ (exists)
- `apps/web/src/lib/handle-server-error.test.ts` ✓ (exists)
- `apps/web/src/lib/utils.test.ts` ✓ (exists)
- `apps/web/src/lib/breadcrumbs.test.ts` (new — copied from source)
- `apps/web/src/features/dashboard/dashboard.test.ts` (new)
- `apps/web/src/features/routes/route-lpg-variation.test.ts` (new)
- `apps/web/src/features/routes/routes.test.ts` (new)
- `apps/web/src/features/notifications/notifications-store.test.ts` (new)
- Any test files in shared packages (mock-data, permissions, api-client) copied from source

Target: **51/51 tests passing** (matches source's stated count).

---

## 8. Verification gates (hard, all must pass)

### 8.1 Pre-upgrade baseline (captured 2026-07-29)

- `tsc.cmd --noEmit -p tsconfig.app.json` → ✅ **TYPECHECK_OK**
- `eslint .` → **5 issues**: 4 errors + 1 warning
  - `src/features/activity/trip-tracking/components/trip-route-map.tsx:113` `react-hooks/immutability` (viewRef mutated inside effect)
  - `src/features/activity/trip-tracking/components/trip-route-map.tsx:113` `@typescript-eslint/no-explicit-any` (basemap cast)
  - `src/features/activity/trip-tracking/components/trip-route-map.tsx:227` `@typescript-eslint/no-explicit-any`
  - `src/features/activity/trip-tracking/components/trip-route-map.tsx:241` `no-console`
  - `src/routes/_authenticated/activity/trip-tracking.tsx:8` `react-refresh/only-export-components` (warning)

### 8.2 Post-upgrade gates

Every gate must pass before the upgrade is considered complete:

1. `pnpm install` (workspace) — clean, no peer-dep errors
2. `pnpm -r typecheck` — 0 errors across all packages + apps
3. `pnpm -r lint` — 0 errors, 0 warnings (the 5 pre-existing issues are fixed; no new ones)
4. `pnpm -r build` — `@lpg/web` bundle produced, no warnings beyond known PWA
5. `pnpm -r test` — all 51+ tests pass
6. Vercel config preserved: root `vercel.json` filters to `@lpg/web`; `apps/web/vercel.json` mirrors
7. Manual smoke: dev server boots, login page renders, role-switcher cycles, dashboard charts render, list pages load, PWA manifest valid

### 8.3 Rollback

Every phase commit is atomic and revertable. If a phase breaks a gate, that commit is reverted (`gsd-undo`) and the plan is revised. Work starts on a clean branch off current `main`/default.

---

## 9. Phasing summary (for writing-plans)

1. **Foundation** — `pnpm-workspace.yaml`, `turbo.json`, root `package.json`, `.gitignore`, pnpm overrides, `vercel.json` migration. Verify: `pnpm install` clean.
2. **Shared packages skeleton** — create empty `packages/{types,config,permissions,api-client,mock-data,mock-api,ui}` with `package.json` + `tsconfig.json` from source. Verify: `pnpm -r typecheck`.
3. **Move existing app to `apps/web/`** — relocate `src/`, root configs, `index.html`, `public/`. Verify: `tsc` + `eslint` + `build` + `test` all still pass.
4. **Adopt `@lpg/ui`** — copy `packages/ui/src/*` from source, add backward-compat shim. Verify: build + test.
5. **Adopt `@lpg/types`, `@lpg/config`, `@lpg/permissions`** — copy from source, wire into app. Verify: typecheck + lint.
6. **Adopt `@lpg/api-client`, `@lpg/mock-data`, `@lpg/mock-api`** — copy from source, wire `main.tsx` adapter, add `VITE_API_MODE` env. Verify: typecheck + lint + test.
7. **Adopt CASL permissions** — add `auth-store`, `role-store`, `PermissionsProvider`, `AbilityContext`, role-switcher. Verify: lint + test.
8. **Adopt module routing + roles** — add `module/`, `roles/`, `routes/_authenticated/$role/$module.tsx`, `routes/login.tsx`, `routes/terms.tsx`, dynamic dashboard subroutes. Verify: build + test.
9. **Adopt dashboard charts, notifications, command-palette, PWA** — copy remaining features + `VitePWA` plugin + `vite.config.ts` updates. Verify: build + test.
10. **Adopt test suite + fix pre-existing lint errors** — copy missing tests, fix `trip-route-map.tsx` and `trip-tracking.tsx` issues. Verify: lint clean + all tests pass.
11. **Final verification** — run all 7 gates in §8.2 + manual smoke. Sign off.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Workspace pnpm install peer-dep mismatches | Pin overrides in `pnpm-workspace.yaml`; use exact `5.99.2` / `1.168.23` etc. (no `^`) where source pins |
| TanStack Router route file move breaks generated tree | Re-run `pnpm -F @lpg/web dev` to regenerate `routeTree.gen.ts`; commit it |
| Existing imports break when components move to `@lpg/ui` | Backward-compat shim in `apps/web/src/components/*` keeps every old path resolving |
| Mock data divergence between server and fake | `@lpg/mock-data` is the single seed source for both (per AGENTS.md) |
| Vercel build picks wrong app | Root `vercel.json` filters with `--filter @lpg/web`; standalone mirror in `apps/web/vercel.json` |
| Lint regression | Pre-upgrade baseline captured; lint must end with fewer (target: zero) issues than it started |
| Test flake from Playwright | Pin `playwright@1.59.1` and chromium version; do not bump during the upgrade |

---

## 11. Out of scope (explicit)

- Migrating `@lpg/back-office` or `develop`-branch content
- Real backend integration (the upgrade stays on `VITE_API_MODE=mock`/`fake` for the demo)
- Internationalization beyond the current French strings
- Theming/dark-mode redesign (current `ThemeProvider` is kept)
- Replacing the static mock data with `@lpg/mock-data` (deferred to a follow-up plan phase per user choice)
- E2E tests beyond what `vitest` browser mode already provides
- Any structural changes to the LPG business domain
