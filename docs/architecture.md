# Architecture

> **Scope:** how the codebase is layered, what each package owns, and how a request flows from a click to the database.

## 1. Repo layout

```
lpg-fleet-management-ui/
├── apps/
│   └── web/                      # Vite + React 19 + TanStack Router app
│       └── src/
│           ├── routes/           # Static, file-based route tree
│           │   └── _authenticated/<domain>/index.tsx
│           ├── features/         # One folder per domain
│           │   └── <domain>/
│           │       ├── index.tsx
│           │       ├── components/
│           │       ├── data/     # view-builders, fixtures, pure adapters
│           │       ├── lib/      # state machines, business rules
│           │       └── utils/
│           ├── components/       # shared UI shell (sidebar, layout, ui)
│           ├── config/rbac/      # nav-items, sidebar-by-role
│           ├── context/          # React contexts (auth, role)
│           ├── hooks/
│           ├── lib/              # shared utilities (api, cookies, errors)
│           └── store/            # Zustand stores
├── packages/
│   ├── api-client/              # typed REST + WebSocket wrapper
│   ├── config/                  # shared tsconfig, eslint, tailwind presets
│   ├── mock-api/                # mock server (Express) for fake-adapter
│   ├── mock-data/               # seed fixtures & curated config
│   ├── permissions/             # CASL abilities + ROLE_GRANTS
│   ├── types/                   # shared domain enums & entities
│   └── ui/                      # shadcn-style primitives
├── docs/                        # ← this documentation tree
├── AGENTS.md                    # standing project contract
└── package.json                 # pnpm workspace root
```

`apps/web` is the only deployable. Everything in `packages/` is consumed by it.

## 2. Package responsibilities

### `@lpg/types` — single source of truth for domain shape

`packages/types/src/index.ts`. Exports:

- **Enums** (all UPPERCASE string unions): `Role`, `OrgType`, `Region`, `SiteType`, `SiteStatus`, `VehicleType`, `ExecutionMode`, `TourneeStatus`, `CheckpointStatus`, `ScanDirection`, `PickupStatus`, `DeclarationStatus`, `ReconciliationStatus`, `RedressementStatus`, `DeviceType`, `DeviceStatus`, `RfidTagStatus`, `RiskLevel`, `RiskEntityType`, `AnomalyCategory`, `AnomalyType`, `AnomalyStatus`, `NotificationGroupType`, `MfaType`, `MfaStatus`, `ReportType`, `ReportFormat`, `ReportStatus`.
- **Entities** (interfaces with snake_case fields, matching the SQL schema): `Organization`, `AppUser` (alias `User`), `Vehicle`, `Driver`, `Site`, `Client`, `ClientSite`, `Device`, `TransporterContract`, `PickupRequest`, `DeliveryTour`, `Checkpoint`, `ScanEvent`, `RfidTag`, `Declaration`, `Reconciliation`, `Redressement`, `RiskScore`, `Anomaly`, `AnomalyAssignment`, `NotificationGroup`, `NotificationGroupMember`, `NotificationRule`, `Notification`, `Report`, `AuditLog`, `IntegrationAuth`, `UserMfa`, `Setting`.
- **API envelope**: `ApiEnvelope<T>`, `ApiPagination`, `ApiFilters`, `AggregationBucket`, `AggregationResult`.

Re-declaring any of these locally is forbidden (`AGENTS.md` §7). Import from `@lpg/types`.

### `@lpg/permissions` — dual-layer RBAC

`packages/permissions/src/index.ts`. Built on `@casl/ability`. Exports:

- `PERMISSION_CATALOG` — the **single source of truth** for permission codes (~153 entries, 9 categories: `identity, governance, sites, fleet, supply, tours, compliance, risk, reporting`).
- `ROLE_GRANTS` — `Record<Role, readonly PermissionCode[]>` mapping each of the 8 roles to the codes it holds.
- `ACTION_IMPLICATIONS` — `manage` is the super-action; granting `something.manage` implies every other action on that resource.
- `HIERARCHY_LEVEL` — 5 tiers, 8 roles: SUPERADMIN(100), ADMIN(80), SUPERVISOR(60), INTEGRATEUR(60), AGENT(60), MARKETEUR(40), TRANSPORTEUR(40), LIVREUR(20).
- `can(role, action, resource)`, `hasPermission(role, code)`, `defineAbilityFor(role)`, `canCreate(actor, target)`, `getCreatableRoles(actor)`.
- `ROLES`, `WEB_ROLES` (excludes LIVREUR), `ROLE_LABELS`, `ROLE_DESCRIPTIONS`.

See [permissions-and-rbac.md](./permissions-and-rbac.md) for the full matrix.

### `@lpg/api-client` — typed transport

`packages/api-client/src/api.ts`. One file wires every endpoint. Two adapters are provided:

- `fake-adapter.ts` — in-memory, served by `@lpg/mock-api`, used in dev/storybook.
- `http-adapter.ts` — real REST + WebSocket against the Fastify backend.

The factory `createResourceService<T>(adapter, name)` (`resource.ts`) auto-generates `list/getById/create/patch/remove` for any resource. Domain-specific actions (e.g. `POST /delivery-tours/:id/start`) are added explicitly in `api.ts`.

### `@lpg/mock-data` — seed fixtures

`packages/mock-data/src/seed/curated/`. Used by `fake-adapter` to populate the dev backend. Critical file: `10_system_config.json` — the **11 mandatory settings** are seeded here and consumed by the UI via the `getSettingNumber` accessor in `packages/mock-data/src/settings.ts`.

### `@lpg/ui` — shared component primitives

shadcn-style primitives (button, card, dialog, table, sidebar, sheet, toast, command palette, chart wrappers). All features compose from these.

## 3. Request lifecycle (click → DB)

```
┌─────────────────────────────────────────────────────────────────────┐
│  apps/web/src/routes/_authenticated/<domain>/index.tsx              │
│  ── renders <Domain>Page                                            │
│                                                                     │
│  <Domain>Page (features/<domain>/index.tsx)                        │
│  ── TanStack Query: useResources(name) → api.<name>.list(...)       │
│  ── passes data to <DomainTable/>                                   │
│                                                                     │
│  api-client (packages/api-client/src/api.ts)                        │
│  ── adapter (http or fake)                                          │
│  ── returns ApiEnvelope<T> { success, message, data, pagination? }  │
│                                                                     │
│  HTTP path:                                                         │
│  ── Fastify backend → Zod validation → CASL authorize → DB          │
│  ── DB trigger / TimescaleDB hypertable / PostGIS geo / MinIO url  │
│                                                                     │
│  UI update:                                                         │
│  ── TanStack Query invalidates affected keys                       │
│  ── features/<domain>/data/<view-builder>.ts projects to view shape │
│  ── components render                                               │
└─────────────────────────────────────────────────────────────────────┘
```

Key invariants:

- **Pure projection.** `features/<domain>/data/` builds view-models from raw API responses. No `useEffect`-driven shaping inside components.
- **Server state via TanStack Query.** Never copy server data into Zustand; only UI state lives there.
- **Optimistic updates** are allowed for low-risk actions (status toggles) but every write goes through the adapter so audit hooks fire.

## 4. Feature pattern (mandatory, AGENTS.md §3)

One domain = one folder:

```
features/<domain>/
  index.tsx          # page entry — exports <Domain>Page
  components/        # presentational pieces, tables, columns
  data/              # data access / view-builders / fixtures (SINGLE source)
  lib/               # pure logic: state machines, business rules + tests
  utils/             # pure helpers
```

Hard rules:

- **One file per responsibility.** No duplicate of the same name across `components/`, `data/`, root.
- Data/models live in `data/`, never re-declared at the feature root.
- Tests live next to the pure logic they cover (`lib/*.test.ts`).
- Icons/components come from `components/ui` / `@lpg/ui` — do not fork import paths.

**Reference features** (the canonical pattern, copy from these): `/trucks`, `/transporters`, `/marketers`, `/routes`, `/activity/trip-tracking`, `/dashboard`.

## 5. Routing & navigation

- **Static file-based routes only.** `apps/web/src/routes/_authenticated/<domain>/index.tsx` imports the feature's `<Domain>Page`. There is no `$role/$module` dynamic router and no `ModuleScreen` (`AGENTS.md` §5).
- **Single sidebar drives all roles.** `apps/web/src/components/layout/app-sidebar.tsx` is a 34-line shell; it calls `getSidebarData(activeRole)` from `config/rbac/sidebar-by-role.ts`, which projects `ROLE_NAV_DECL` → `NAV_CATALOG` against the active role's `ROLE_GRANTS`.
- **Permission-gated visibility.** A nav item shows if `item.requires.some(code => hasPermission(role, code))`. `requires` is OR-semantics; `hasPermission` recognizes `manage`-implies-everything.
- **Post-login landing** is per-role. Only `SUPERADMIN` lands on `/dashboard`; other roles land on their home feature (`TRANSPORTEUR → /transporters`, `MARKETEUR → /overview`, etc.).
- **`resolveFeaturePath(decl)`** returns bare paths (`/trucks`, `/marketers`) so no role prefix leaks into the URL. Static items (e.g. `/grafana`, `/prometheus`) opt out via `static: true`.

## 6. Auth & session

- `apps/web/src/context/` exposes the active user, active role, and ability.
- Role is **not a global singleton**: a user can hold a `system_role` plus `custom_roles` (JSONB permissions), and effective permissions = `system_role` ∪ `custom_roles`, scoped by `user_site_assignments`.
- The web app currently exposes the role-switcher so reviewers can preview any role. In production, the active role equals the user's only `system_role` (multi-role support is future work).
- MFA enforcement is settings-driven (`mfa.enforced_for_roles`); the UI redirects to MFA setup when the user first hits a sensitive action and their role is in that list.

## 7. Data conventions

- **Units.** VRAC → **TM** (tonnes métriques). Bouteilles → **btl** (50 kg units). Never liters. Never kg.
- **Geo.** All coordinates are PostGIS `GEOGRAPHY(POINT, 4326)`. UI receives `{lat, lng}` projections; never raw WKT.
- **Time.** All timestamps are UTC ISO 8601 with timezone. UI formats per user locale.
- **Enums.** Every value is `UPPERCASE`, no `snake_case`. TypeScript unions mirror the SQL `CREATE TYPE`.
- **API envelope.** Every response: `{ success: boolean, message: string, data: T, pagination?, filters?, aggregations? }`.
- **File storage.** MinIO. DB stores only URLs. Buckets: `csph-certificates`, `csph-proofs`, `csph-reports`, `csph-documents`, `csph-firmware` (TODO.md §6.3).

## 8. Layered security

```
┌──────────────────────────────────────────────────────────────┐
│ Browser                                                      │
│  ── route guard (TanStack Router beforeLoad)                 │
│  ── role-based sidebar projection (NAV_CATALOG)              │
│  ── CASL ability check via <Can /> or can(...)               │
├──────────────────────────────────────────────────────────────┤
│ API client                                                   │
│  ── JWT access + refresh in httpOnly cookie (planned)        │
│  ── idempotency keys for mutating endpoints                  │
├──────────────────────────────────────────────────────────────┤
│ Backend (Fastify, separate repo)                             │
│  ── Zod validation of body / params / query                  │
│  ── RBAC middleware: system_role ∪ custom_role + site scope  │
│  ── audit_logs row on every sensitive action                 │
│  ── MFA verification for ADMIN/SUPERADMIN/SUPERVISOR         │
├──────────────────────────────────────────────────────────────┤
│ Database                                                     │
│  ── parameterized queries (no string concat)                 │
│  ── row-level scoping by org_id / user_site_assignments      │
│  ── CHECK constraints enforce business invariants            │
└──────────────────────────────────────────────────────────────┘
```

**No endpoint relies on `system_role` alone.** Both layers are required (`AGENTS.md` §4).

## 9. Conventions cheat-sheet

(Full rules: `AGENTS.md`.)

- English in code, file names, URLs, types, variables. French in `label` strings only.
- UPPERCASE for every enum value, type, table name.
- VRAC = TM, bouteilles = btl. Never liters, never kg.
- Settings-driven. No hardcoded thresholds. Add a `settings` row.
- One file per responsibility. No duplicates.
- Static routes only. Permission-gated sidebar, not URL-prefixed.
- Pure logic in `lib/`, side-effecting in `data/` and pages.
- Never commit secrets. MinIO URLs only.
