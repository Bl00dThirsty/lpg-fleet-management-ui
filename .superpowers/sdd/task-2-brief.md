### Task 2: LANDING_BY_ROLE → all roles land on /overview

**Files:**
- Modify: `apps/web/src/config/rbac/sidebar-by-role.ts` (LANDING_BY_ROLE + docstring)

**Interfaces:**
- Consumes: nothing.
- Produces: `LANDING_BY_ROLE[role] === '/overview'` for every role.

- [ ] **Step 1: Update the map**

```ts
export const LANDING_BY_ROLE: Record<Role, string> = {
  SUPERADMIN: '/overview',
  ADMIN: '/overview',
  SUPERVISOR: '/overview',
  INTEGRATEUR: '/overview',
  AGENT: '/overview',
  MARKETEUR: '/overview',
  TRANSPORTEUR: '/overview',
  LIVREUR: '/overview',
}
```

Fix the docstring to state all roles land on `/overview`.

- [ ] **Step 2: Verify route-access tests**

Run: `pnpm --filter @lpg/web exec vitest run --browser=false src/config/rbac` (or the route-access test file)
Expected: PASS (tests that asserted SUPERADMIN → `/dashboard` need updating).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/config/rbac/sidebar-by-role.ts
git commit -m "feat(overview): all roles land on /overview"
```

---

