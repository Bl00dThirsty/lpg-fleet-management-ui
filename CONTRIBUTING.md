<!-- generated-by: gsd-doc-writer -->
# Contributing to the LPG Fleet Management UI

This repository is the **frontend only** workspace for the CSPH GPL traceability platform:
a pnpm + Turborepo monorepo whose deployable artifact is the `apps/web` Vite SPA. The
backend (PostgreSQL/PostGIS/TimescaleDB, Fastify, MinIO) is not in this repo; the
frontend talks to it through `@lpg/api-client`, which currently runs against an in-browser
fake adapter seeded with curated fixtures.

Read [`AGENTS.md`](./AGENTS.md) before you change code — it is the contract. The deep
domain references live in [`docs/`](./docs/README.md). The domain vocabulary is fixed in
[`CONTEXT.md`](./CONTEXT.md); use those terms in code, tests, and issue titles.

## 1. Setup

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/lpg-fleet-management-ui.git
cd lpg-fleet-management-ui

# 2. Point at the canonical repository
git remote add upstream https://github.com/Bl00dThirsty/lpg-fleet-management-ui.git

# 3. Install (pnpm 9 is pinned via packageManager)
pnpm install

# 4. Configure the app
cp apps/web/.env.example apps/web/.env

# 5. Run it
pnpm dev
```

The web app starts on the Vite dev server with `VITE_API_MODE=fake`, so no backend is
required. `apps/web/.env.example` is the canonical list of variables:

| Variable | Purpose |
|---|---|
| `VITE_API_MODE` | `fake` selects the in-browser fake adapter; anything else uses `VITE_API_BASE_URL` (defaults to `/api`). |
| `VITE_ARCGIS_API_KEY` | Required for the map to load. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Reserved for a future auth provider; unused today. |

Tooling: Node with pnpm 9 (`corepack` is the easiest way to pin it), and Chromium for
the browser test suite (`pnpm --filter @lpg/web run test:browser:install`).

## 2. Architecture at a glance

- `apps/web` — the Vite SPA. Static TanStack Router files under
  `apps/web/src/routes`, feature code under `apps/web/src/features`, shared shadcn
  primitives under `apps/web/src/components`, and cross-cutting helpers under
  `apps/web/src/lib`.
- `packages/types` — domain enums, entities, and roles mapped to the SQL schema.
- `packages/permissions` — the permission catalog, `ROLE_GRANTS`, hierarchy, and the
  CASL ability builders.
- `packages/api-client` — the typed resource facade plus the fake and HTTP adapters.
  This is the only place that knows whether data comes from fixtures or HTTP.
- `packages/mock-data` — curated fixtures and the settings accessors.
- `packages/ui` — shared shadcn components (`Button`, `ChartContainer`, …).
- `packages/config` — env access and TS/TSX tooling config.

Full detail: [`docs/architecture.md`](./docs/architecture.md).

## 3. Feature workflow

One domain, one folder: `apps/web/src/features/<domain>/` with `index.tsx` (route entry),
`components/`, `data/`, `lib/`, `utils/`.

- **Data and view builders go in `data/`.** They project raw resources into view models
  and are the right home for colocated tests of that projection.
- **Pure state machines, rules, and reducers go in `lib/`,** with their tests colocated
  as `lib/<name>.test.ts`. This is where a transition guard is tested directly, without
  rendering.
- **UI composition goes in `components/`.** No new one-off chart, table, or dialog
  primitive — extend `apps/web/src/components` or use `@lpg/ui`.
- **One file, one responsibility.** Do not create a parallel implementation "for the
  wizard" or "for mobile"; compose the existing one.
- **Static routes only.** Add a route file under `apps/web/src/routes/_authenticated/`.
  There is deliberately no dynamic `$role/$module` router; the sidebar is projected from
  `apps/web/src/config/rbac/nav-items.ts` and permission checks instead.
- Post-login landing is `/overview` for every role; `/dashboard` is the SUPERADMIN
  national view.

### Test-driven development

For anything with a rule in it — a state machine, a scope helper, a status derivation, a
validator, an invalidation map — write the failing colocated test first, watch it fail,
then implement. The pure logic in `features/*/lib/` and `packages/*` is deliberately
testable in isolation for exactly this reason. React component tests are the exception:
render the component and assert the user-visible outcome, not the internals.

## 4. Commands

Only use scripts that exist in `package.json`.

```bash
pnpm install

pnpm dev                       # all dev servers
pnpm mock                      # just the mock API package
pnpm build                     # turbo build
pnpm lint                      # turbo lint
pnpm format                    # prettier --write (ts, tsx, md)

pnpm --filter @lpg/web run typecheck
pnpm --filter @lpg/web run i18n:check
pnpm --filter @lpg/web run test:unit        # no browser required
pnpm --filter @lpg/web run test:coverage
pnpm --filter @lpg/web run test             # browser mode (chromium)
pnpm --filter @lpg/web run test:watch
```

The browser suite needs Chromium once per machine:
`pnpm --filter @lpg/web run test:browser:install`. The full build is
`tsc -b && vite build`, so `pnpm build` already type-checks; run `typecheck` on its own
for a fast signal.

## 5. Rules that survive review

### i18n

The UI is bilingual. Every user-facing string exists in both
`apps/web/public/locales/fr/` and `apps/web/public/locales/en/`, wired through
`apps/web/src/lib/i18n/config.ts` namespaces (`common`, `nav`, `fields`, `errors`,
`breadcrumbs`, `overview`, `dashboard`, `tours`, `pickups`).

- Add the key to **both** locale files, or `pnpm --filter @lpg/web run i18n:check` fails.
- Use `useTranslation()` / `t()`; do not hardcode French in a component. ESLint already
  blocks French literals in the files it scopes today (`src/features/pickups/index.tsx`,
  `src/lib/handle-server-error.ts`) — the rest is enforced by review, so do not rely on
  the linter to catch you.
- Register a new namespace in `config.ts` and the check script, not just in the JSON.
- Note: `extractErrorMessage` in `apps/web/src/hooks/use-toast-feedback.ts` still returns
  French operator messages. If you touch that function, route the new strings through the
  error namespace.

### Accessibility

- Every control has an accessible name. Pending controls are disabled, expose
  `aria-busy`, and keep their label — use `SubmitButton` from
  `apps/web/src/components/entity-crud/form-ui.tsx` rather than a bare `Button` with a
  spinner.
- Data lists distinguish **loading**, **error**, **empty**, and **filtered-empty**. Use
  `pendingComponent` skeletons and `GeneralError` on data-heavy routes.
- Charts go through `apps/web/src/components/charts` only. Those primitives set Recharts'
  `accessibilityLayer` and disable animation when the OS asks for reduced motion. Do not
  add a bare `<AreaChart>`/`<PieChart>`/`<BarChart>` in a feature.
- Honour `prefers-reduced-motion` for any new animation (`motion-reduce:animate-none`,
  or `usePrefersReducedMotion()` for JS-driven animation).
- Validation errors are inline in the form. Never toast them.

### Settings, RBAC, and scope

- **No hardcoded business thresholds.** Tolerances, timeouts, battery levels, geo
  confidence, retention, MFA enforcement — read them via `getSetting` /
  `getSettingNumber` from `@lpg/mock-data`, backed by
  `packages/mock-data/src/seed/curated/10_system_config.json`. If the rule you need does
  not exist, add the setting rather than a literal.
- **Units are fixed by the domain.** VRAC is TM, BOUTEILLES50KG is btl. Never litres or
  kilograms. Enum values are UPPERCASE.
- **Permissions are two-layered.** The effective set is the union of `system_role` grants
  and custom-role grants, constrained by scope. Enforce at all four layers: the control
  (`hasPermission` / `defineAbilityFor`), the store guard
  (`apps/web/src/lib/security/guards.ts`), the form, and the API boundary.
- **Scope is not a role check.** Use `apps/web/src/features/scope` (`getScope`,
  `scopeFilter`, `scopeWithOrgId`) so an agent sees only assigned sites, a marketeur its
  own site plus its own rows, a transporteur its organization's tours and crew, and a
  livreur its missions. Regulator staff get the organizational view.
- **Delete is soft.** Set `deleted_at`; never physically remove a row.

### API and mock rules

- Go through `@lpg/api-client` (`api.<resource>`) or `useCrud` / `use-resources`. Never
  mutate `curated` directly and never fetch from a component.
- The fake adapter supports list/get/create/patch/remove against in-memory collections, so
  a feature written against it should work unchanged against HTTP.
- Every mutation invalidates its TanStack Query key (`invalidateResource` in
  `apps/web/src/lib/api/invalidation.ts`). Add the key if the resource is new.
- WebSocket `tour:update`, `anomaly:new`, and `device:telemetry` events invalidate the
  matching keys — keep that wiring intact.
- Long-running work (reports, risk recomputation) is polled to a terminal
  `READY`/`FAILED`/`EXPIRED` state, with a pending indicator and a freshness label.
- File references (certificates, proofs, contracts, reports, firmware) are object URLs
  only, written through `apps/web/src/lib/save-link.ts`. Never store blobs.
- Exactly one Sonner toast owns each mutation outcome. See
  [`docs/adr/0002-exactly-one-sonner-toast-per-mutation.md`](./docs/adr/0002-exactly-one-sonner-toast-per-mutation.md).
  If the caller reports the outcome, pass `handled: true` so the global mutation error
  handler stays quiet.

### Issues and pull requests

Issues are tracked on GitHub with the `gh` CLI; the conventions live in
[`docs/agents/issue-tracker.md`](./docs/agents/issue-tracker.md). Use
`gh issue view <n> --comments` before starting work on a ticket.

There is no PR template in this repository yet, so this checklist is the contract:

- [ ] The change is scoped to one concern, and the issue it closes is linked.
- [ ] New rules have colocated tests; changed rules have updated tests.
- [ ] `pnpm --filter @lpg/web run typecheck` and `test:unit` pass.
- [ ] `pnpm --filter @lpg/web run i18n:check` passes if any user-facing string changed.
- [ ] `pnpm lint` and `pnpm format` are clean.
- [ ] Permissions and scope are enforced for the new surface, not just hidden in the UI.
- [ ] No hardcoded threshold, no hardcoded French literal, no bare chart, no toast duplication.
- [ ] No secret, token, key, or real personal data in the diff.

### Secrets and commits

- **Never commit secrets.** No API keys, tokens, `.env` files, ArcGIS keys, or production
  URLs. `apps/web/.env` is local only; only `.env.example` is tracked.
- **Never commit real user or operational data.** Fixtures live in
  `packages/mock-data/src/seed/curated/` and must stay synthetic.
- **Do not commit unless you are asked to.** Leave the working tree dirty and let the
  requester review it. When a commit is requested, keep it to the intended files and
  write a message that matches the surrounding history.
- Never force-push a shared branch or rewrite history someone else may have based work on.

## 6. Reporting problems

Security issues go through the private channel described in
[`SECURITY.md`](./SECURITY.md) — not the public issue tracker.
