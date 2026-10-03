### Task 1: Scope `buildDashboardView` by role + scope

**Files:**
- Modify: `apps/web/src/features/dashboard/data/dashboard.ts` (buildDashboardView signature + filters)

**Interfaces:**
- Consumes: `UserScope`, `Role`.
- Produces: `buildDashboardView(role?: Role, scope?: UserScope): DashboardView` — filters `getRouteTripsView`, `sites`, `trucks`, `reserveSites` by `scopeFilter`. When no scope, behaves as today (org view).

- [ ] **Step 1: Write the failing test**

In `apps/web/src/features/dashboard/data/dashboard.test.ts`:

```ts
it('scopes transported TM to the user site', () => {
  const scope: UserScope = { view: 'site', siteIds: ['site-0001-sctm-bonaberi'], userId: 'user-0007-sctm-marketeur' }
  const dash = buildDashboardView('MARKETEUR', scope)
  expect(dash.overview.totalTransportedTM).toBeGreaterThan(0)
  // org view shows strictly more or equal
  const orgDash = buildDashboardView('SUPERADMIN')
  expect(orgDash.overview.totalTransportedTM).toBeGreaterThanOrEqual(dash.overview.totalTransportedTM)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @lpg/web exec vitest run --browser=false src/features/dashboard/data/dashboard.test.ts`
Expected: FAIL — `buildDashboardView` takes no args.

- [ ] **Step 3: Implement**

Change the signature and add filtering:

```ts
export function buildDashboardView(role?: Role, scope?: UserScope): DashboardView {
  const trips = scope ? scopeFilter(getRouteTripsView(), scope, (t) => t.siteId ?? '') : getRouteTripsView()
  const sites = scope ? scopeFilter(allSites(), scope, (s) => s.id) : allSites()
  const trucks = scope ? scopeFilter(allTrucks(), scope, (t) => t.orgId ?? '') : allTrucks()
  // ... rest of the builder using `trips`/`sites`/`trucks`
}
```

Note: `TripActivity`/`SiteRow`/`Truck` must expose a site id or org id for the `keyBy` callbacks. Add the field accessor that maps to the scope's key (site id for site view; org id for transporter view — use a helper that picks the right key per scope.view).

- [ ] **Step 4: Run the full dashboard test**

Expected: PASS (existing assertions use the default no-scope path, unchanged).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/dashboard/data/dashboard.ts apps/web/src/features/dashboard/data/dashboard.test.ts
git commit -m "feat(dashboard): scope buildDashboardView by role and scope"
```

---

