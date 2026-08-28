# Task 1 Report — Scope `buildDashboardView` by role + scope

**Status:** DONE

## What changed

- `apps/web/src/features/dashboard/data/dashboard.ts`
  - Signature: `buildDashboardView(scope?: UserScope)` → `buildDashboardView(role?: Role, scope?: UserScope)`.
  - Imported `Role` from `@/config/rbac/roles` (same source the page uses).
  - Added optional `viewRole?: Role` on `DashboardView` and set `viewRole: role` on the returned view (threads the role for P7T5 without changing aggregate behavior).
  - Scope threading unchanged: `getRouteTripsView('ALL', scope)`, `buildReserveSites(scope)`, `buildAlerts(..., scope)`, `buildFleetSummaries(..., scope)` all keep passing `scope` as before.
  - No `scopeFilter` additions were needed on top of P1T7: trips are already org/site-scoped through `getTourActivity` → `scopeBySiteOrCreator` (site view keys by `marketeur_org_id` plus creator fallback; transporter view keys by `transporter_org_id`). The dashboard's `sites`/`trucks` remain full-set — the P7T5 role-aware filtering of sites/trucks/reserve is out of scope for this task.
- `apps/web/src/features/dashboard/index.tsx` — `DashboardPage` now calls `buildDashboardView(role, getScope(useAuthStore.getState().user))`.
- `apps/web/src/features/dashboard/dashboard-details.tsx` — the two other callers (`FleetDetailPage`, `ReserveSiteDetailPage`) updated to `buildDashboardView(undefined, getScope(...))` so `UserScope` stays in the second slot (kept typecheck green).
- `apps/web/src/features/dashboard/data/dashboard.test.ts` — added the scoped test from the brief, verbatim (assertions held: scoped site view > 0, org view >= site view). The scope resolves because `scopeBySiteOrCreator` matches tours via `created_by === 'user-0007-sctm-marketeur'` even without an `orgId`, so `totalTransportedTM` for the site scope is non-zero.

## Verification

- Focused: `vitest run --browser=false src/features/dashboard/data/dashboard.test.ts` → 4/4 passed.
- Full unit: `pnpm --filter @lpg/web run test:unit` → 84 files, 423/423 passed.
- Typecheck: `tsc --noEmit -p tsconfig.app.json` → clean.
- Lint: 0 errors (78 pre-existing react-refresh warnings, none from the files I touched).

## Notes / concerns

- `role` is currently a no-op for aggregates (stored as `viewRole` only). P7T5 will consume it to filter `sites`/`trucks`/reserve by site vs org.
- Brief's Step 5 says "commit" — per task instructions this was intentionally NOT committed; changes are left in the working tree.
- Test file has no trailing newline (pre-existing style, unchanged).
