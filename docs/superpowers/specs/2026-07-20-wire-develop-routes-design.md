# Design: Wire develop-branch routes into @lpg/web + adopt LPG-orange theme

**Date:** 2026-07-20
**Branch:** refactor/apps-web-architecture
**Author:** opencode (per user request to implement the develop UI into our backend/web app)

## Context

The `develop` branch and the current branch share the same base commit (`2c5d39c`), so there are no
net-new commits on develop to port. However, during the `refactor/apps-web-architecture` work, three
feature folders were already ported into `@lpg/web` but **left unmounted** — they have no route files, even
though the sidebar already links to them. The result: dead nav links / 404s.

The user explicitly asked to (a) implement all the pages that exist (matching develop), and (b) "use any
frontend skills to enhance and improve our project," and (c) supplied the develop `theme.css`/`index.css`
from `scph-docker/csph-admin`. The user "loves the UI of the develop branch."

## Audit: what already exists in @lpg/web

| Feature | Feature folder | Route file | Sidebar link | Status |
|---|---|---|---|---|
| Dashboard | `features/dashboard` | `routes/_authenticated/dashboard.tsx` | ✅ | wired |
| Trucks | `features/trucks` | `routes/_authenticated/trucks/index.tsx` | ✅ | wired (live mock backend) |
| Transporters | `features/transporters` | `routes/_authenticated/transporters/index.tsx` | ✅ | wired (live mock backend) |
| Routes (Tournées GPL) | `features/routes/*` | ❌ missing | ✅ `/routes` | **unwired** |
| Marketers | `features/marketers/*` | ❌ missing | ✅ `/marketers` | **unwired** |
| Trip-tracking (Suivi) | `features/activity/*` | ❌ missing | ✅ `/activity/trip-tracking` | **unwired** |

The unwired features already use **static in-file data** (mirroring develop). They do NOT use
`@lpg/api-client`/`@lpg/mock-data`. Per AGENTS.md adopt-if-optimal rule, we keep them static to stay
consistent with develop (no forced backend rewire). The `@lpg/ui` package already exports every primitive
these features need (`useTableUrlState`, `DataTable*`, all shadcn primitives, LPG gauge CSS).

## Visual enhancement decision

The web app's current `theme.css` uses a **blue/indigo** palette (primary `oklch(0.208 0.042 265.755)`).
The develop branch (and the supplied `scph-docker` theme) uses an **LPG gas orange/amber** palette
(primary `oklch(0.689 0.225 42.66)`) — the brand color of liquid petroleum gas. The user loves the
develop UI, so we **adopt develop's orange theme** into the web app's `theme.css`, giving the whole
console a cohesive, on-brand warm identity. `index.css` (LPG liquid gauge, ArcGIS bridge) is already
identical in both trees, so only `theme.css` changes.

## Plan

### 1. Theme adoption (frontend enhancement)
- Replace `apps/web/styles/theme.css` token values with develop's orange LPG palette (light + dark),
  keeping the same token names so no component changes are required. This is a drop-in brand shift.

### 2. Route wiring (mount existing features)
Create four route files that import the already-built page components, mirroring develop's route tree and
the existing `transporters/index.tsx` pattern:

- `apps/web/routes/_authenticated/routes/index.tsx`
  → `createFileRoute('/_authenticated/routes/')` → `RoutesPage` from `@/features/routes`
- `apps/web/routes/_authenticated/marketers/index.tsx`
  → `createFileRoute('/_authenticated/marketers/')` → `MarketersPage` from `@/features/marketers`
- `apps/web/routes/_authenticated/marketers/$marketerId.tsx`
  → `createFileRoute('/_authenticated/marketers/$marketerId')` → `MarketerDetailsPage` from
  `@/features/marketers/marketer-details`
- `apps/web/routes/_authenticated/activity/trip-tracking.tsx`
  → `createFileRoute('/_authenticated/activity/trip-tracking')` → `SuiviTripsPage` (renders
  `SuiviTripsLayout` from `@/features/activity/trip-tracking/components/trip-tracking-layout`)

### 3. Verification
- Regenerate the TanStack Router route tree (`pnpm turbo run dev` / build step) so the new routes are
  picked up.
- Run `pnpm test` and confirm the 51/51 target is preserved.
- `pnpm turbo run build --filter @lpg/web` succeeds (typecheck + bundle).

## Out of scope
- Rewiring the three static-data features onto the live mock backend (kept static to match develop).
- The `$role/$module` RBAC dynamic route (separate system, already functional).
- Any new UI beyond mounting what develop has.

## Risks
- The route tree must be regenerated or the new files won't be recognized by `@tanstack/react-router`.
- ArcGIS map in `route-corridor-map.tsx` requires `VITE_ARCGIS_API_KEY`; if absent it degrades gracefully
  (handled in-component). No change needed.
