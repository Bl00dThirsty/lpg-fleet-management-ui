# Task 7 Report — Apply scoping to feature data builders

**Status:** DONE
**Commit:** `7a940da` — `feat(scope): apply site-level scoping to feature data builders`
**Branch:** `fix/cleanup-corrigee`

## TDD evidence — `site-creator.test.ts`

### RED (before `site-creator.ts` existed)
Command: `pnpm --filter @lpg/web exec vitest run --browser=false src/features/scope/site-creator.test.ts`
```
 FAIL  src/features/scope/site-creator.test.ts [ src/features/scope/site-creator.test.ts ]
Error: Cannot find module './site-creator' imported from .../site-creator.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

### GREEN (after `site-creator.ts`)
```
 Test Files  1 passed (1)
      Tests  6 passed (6)
```
(One test assertion was corrected after initial run: the "org-keyed match" test used `userId: 'user-7'`, which matched row `c` via the creator branch; switched to `userId: 'user-99'` to isolate the org branch. Implementation was correct.)

## What was wired

- **`scopeBySiteOrCreator`** — `apps/web/src/features/scope/site-creator.ts` (verbatim from brief) + companion `scopeWithOrgId(scope)` that extends `scope.siteIds` with `scope.orgId`. **Rationale:** the brief's stated acceptance behavior is `marketeur_org_id === scope.orgId || created_by === scope.userId`, but the verbatim helper matches `siteKey(row)` against `scope.siteIds` (which hold *site* ids, e.g. `site-0001-sctm-bonaberi`, never org ids). Without the org id in the site set, an org-keyed `siteKey` (e.g. `marketeur_org_id`) can never match and a MARKETEUR would only see rows they personally created. `scopeWithOrgId` reconciles the two (org view and site-less scopes pass through unchanged).
- **`getPickups(scope?)`** — `features/pickups/data/pickups.ts:57`. The `Pickup` view did **not** carry `marketeur_org_id`/`created_by` (the brief expected it did), so I added both fields to the `Pickup` interface, populated them for base rows and the synthetic extras, and filter the combined array with `scopeBySiteOrCreator` (siteKey `marketeur_org_id`, creatorKey `created_by`). This also correctly scopes the extras (they otherwise leak a fixed marketeur org's rows into every site view).
- **`getTourActivity(slice, scope?)`** — `features/tours/data/tour-activity.ts:717`. Filters `delivery_tours` at the source, **before** `buildView`. `site/agent/livreur` views use `marketeur_org_id`; `transporter` view uses `transporter_org_id`; creatorKey `created_by`. `getRouteTripsView` alias carries the new signature automatically.
- **`getDeclarations(scope?)`** — `features/declarations/data/declarations.ts:34`. Filters the raw `declarations` array at source (siteKey `marketeur_org_id`, creatorKey `created_by`). No view changes needed.
- **`vehicles` page** — `features/vehicles/index.tsx`. Replaced the `org_id === scopeOrgId` filter with `scopeBySiteOrCreator` (siteKey `org_id`, creatorKey `created_by`). `VehicleView` gained `created_by?: string | null` (`features/vehicles/data/vehicles.ts`), populated from the curated row.
- **Callers updated to pass `getScope(useAuthStore.getState().user)`:** `features/pickups/index.tsx:16` (+ `handleCreated` now sets the two new `Pickup` fields), `features/pickup-tracking/data/pickup-tracking.ts:55,61,76`, `features/tours/index.tsx:21`, `features/tours/follow-up/index.tsx:14`, `features/declarations/index.tsx:9`, `features/dashboard/index.tsx:46`, `features/dashboard/dashboard-details.tsx:11,75`.
- **Dashboard** — `features/dashboard/data/dashboard.ts` threads an optional `scope` through `buildDashboardView` → `buildReserveSites`, `buildFleetSummaries`, `buildAlerts`, all calling `getRouteTripsView('ALL', scope)`.

## Backward compatibility

All builders keep working with `scope === undefined` (no filtering); every existing unit test calls them scope-less and passes **unchanged**. `getScope(null)` → org view → no filtering, so the pickup-tracking data functions (which now read the auth store internally) stay global in the test environment.

## Test results (full suite)

- `pnpm --filter @lpg/web run test:unit` → **79 files / 374 tests PASS** (372 existing + 2 new scoped `getTourActivity` tests in `tour-activity.test.ts`; 6 new in `site-creator.test.ts`). No existing test modified except adding scoped tests.
- `pnpm --filter @lpg/web exec tsc --noEmit -p tsconfig.app.json` → clean, exit 0.
- `pnpm --filter @lpg/web run lint` → **3 errors, all pre-existing** in `apps/web/src/features/scope/scope.test.ts` (`@typescript-eslint/no-explicit-any` on `as any` casts, verbatim from the Task 4 brief, last touched in commit `5ec777e`). My changed files produce zero lint errors. Left untouched as it is a reviewed Task 4 artifact outside this task's file list.

## Self-review

- Helper used verbatim; `scopeWithOrgId` is a small additive companion, exported from `site-creator.ts`, shared by all four builders (no duplication).
- Source-level filtering for tours/declarations avoids polluting view types; `Pickup`/`VehicleView` gained the two fields the brief assumed existed (documented above).
- `siteKey`/`creatorKey` return `string | undefined` per the verbatim signature — null-able fields wrapped with `?? undefined` at call sites.
- `command-palette/global-search.tsx:135` (`getRouteTripsView()`) intentionally left unscoped — not in the task's caller list.
- Scratch docs under `.superpowers/sdd/` (progress.md tick) updated but not committed, per the established workflow.

## Concerns

1. **`scope.orgId` vs `scope.siteIds` reconciliation** — the verbatim helper matches against `siteIds`; without `scopeWithOrgId` the brief's stated `<org_field> === scope.orgId` behavior is impossible. A reviewer may want this documented in AGENTS.md (Task 8 covers the rule).
2. Pre-existing lint failure in `scope.test.ts` (3 errors, from Task 4).

## Final P2T3 review finding — EntityForm reset key

**Status:** DONE
**Commit:** `549500a` — `fix(crud): include complete field config in reset key`

Updated `apps/web/src/components/entity-crud/entity-form.tsx` so `resetKey` serializes every `FieldConfig` value except the unstable `transform` function identity. The reset effect depends on `[form, resetKey]` and calls `buildInitial(fields, initial, autoDefaults)` from the current render. Inline field arrays/objects with identical serialized values therefore keep the same key and do not reset; any serialized field configuration change produces a new key and resets the form.

## Verification

### Entity-crud tests

Command: `pnpm --filter @lpg/web exec vitest run --browser=false src/components/entity-crud`
```

 RUN  v4.1.10 C:/Users/DTA_WorkStation/Documents/manga/lpg-fleet-management-ui/apps/web


 Test Files  2 passed (2)
      Tests  20 passed (20)
   Start at  09:11:24
   Duration  3.58s (transform 576ms, setup 0ms, import 3.51s, tests 24ms, environment 0ms)
```

### Typecheck

Command: `pnpm --filter @lpg/web run typecheck`
```

> @lpg/web@ typecheck C:\Users\DTA_WorkStation\Documents\manga\lpg-fleet-management-ui\apps\web
> tsc --noEmit -p tsconfig.app.json
```

### Targeted lint

Command: `pnpm --filter @lpg/web exec eslint src/components/entity-crud/entity-form.tsx`

Output: no output; exit code `0`.
