# AGENTS.md — LPG Fleet Management UI

Project conventions. Apply these on **every** task. They are non-negotiable unless you ask the
user and they explicitly override.

## 1. Source of truth (reference documents)

- `../TODO.md` — the master audit & implementation guide (schema, API map, state machines,
  role-by-role navigation, workflows, security). **Follow its logic and acceptance criteria.**
- `../csph_gpl_schema_v6_2.sql` — the canonical database schema. It, not local files, defines
  the domain model, **table names, column names, and ENUM values**.

When types, statuses, or business rules are needed, resolve them against these two files first.

## 2. Canonical reference interfaces

Only the following base routes contain the reference code/methodology that all other screens
**must** replicate. Treat them as the pattern to copy:

- `/trucks`
- `/transporters`
- `/marketers`
- `/routes`
- `/activity/trip-tracking`
- `/dashboard`

Every new screen / feature must follow the exact same structure and conventions.

## 3. Feature folder pattern (mandatory, no exceptions)

One domain = one feature tree under `features/<domain>/`, with a static route in
`routes/_authenticated/<domain>/` that imports it:

```
features/<domain>/
  index.tsx          # page entry — exports <Domain>Page
  components/        # presentational pieces, tables, columns
  data/              # data access / view-builders / fixtures (SINGLE source of data)
  lib/               # pure logic: state machines, business rules + colocated tests
  utils/             # pure helpers
```

Rules:
- **One file per responsibility. No file has a duplicate** (root vs `components/` vs `data/`
  with the same name is forbidden). If you need to move a file, move it — never copy it.
- Data/models live in `data/`, never re-declared at the feature root.
- A `components/` or `data/` sibling that already exists is the LIVE version; a stale root copy
  is dead code — delete it and re-point importers.
- Tests live next to the pure logic they cover (`lib/*.test.ts`).
- Icons/components come from the local `components/ui` tree / `@lpg/ui` — do not fork import
  paths across a feature (pick one convention per feature and keep it consistent).
- VRAC (GPL vrac) → TM (tonnes métriques). Never kg, never bare t.
- Bouteilles 50 kg → btl (count of individual bottles).

## 4. Business rules & system conventions

- **Settings-Driven, zero hardcoded thresholds.** Business rules never embed raw
  values. Geo confidence thresholds (`geo.confidence_*`), battery/offline alerts
  (`device.battery_critical_threshold`, `device.offline_alert_minutes`), SLA
  timeouts (`tournee.*`), tolerance percentages
  (`reconciliation.volume_gap_tolerance_percent`), retention years
  (`audit.retention_years`), MFA enforcement (`mfa.enforced_for_roles`), GPS
  capture interval, and report expiry are read by `setting_key` from the
  `settings` model (frontend fixture:
  `packages/mock-data/src/seed/curated/10_system_config.json`, accessor
  `getSettingNumber` in `packages/mock-data/src/settings.ts`).
- **Role hierarchy:** SUPERADMIN > ADMIN > SUPERVISOR/AGENT/INTEGRATEUR >
  MARKETEUR/TRANSPORTEUR > LIVREUR. A user may only create subordinates at or
  below their own level (`HIERARCHY_LEVEL` / `canCreate` in `@lpg/permissions`).
- **Dual-layer RBAC:** effective permissions = `system_role` base grants OR
  `custom_roles` (JSONB) overrides, scoped by `user_site_assignments`. The web
  matrix (`ROLE_GRANTS`) models the base layer; sidebars and route guards consume
  it. No feature may rely solely on `system_role`.
- **No organizational view for MARKETEUR.** MARKETEUR-role users work on-site
  (e.g. site director of a MARKETEUR org). They never see organization-level
  entity views (`/marketers`, `/organizations`); their home view is `/overview`.
  Org-level entity management belongs to SUPERADMIN/ADMIN/AGENT.
- **Site-level data isolation (scope):** MARKETEUR users see only their own
  site's data + what they created; TRANSPORTEUR users see only their org's
  assigned tours/crew; AGENT users see only their assigned sites
  (`user_site_assignments`); LIVREUR users see only their assigned missions'
  sites. Only REGULATEUR-org staff (SUPERADMIN/ADMIN, plus
  SUPERVISOR/INTEGRATEUR) get the organizational view. There is **no**
  org-level view for non-regulateurs. Implemented via `features/scope`
  (`getScope`/`scopeFilter`/`scopeBySiteOrCreator`/`scopeWithOrgId`); the
  pickups, tours, declarations, vehicles, trucks and dashboard data builders
  apply the authenticated user's scope. `scopeWithOrgId` adds the org id to
  the site set only for `site`/`transporter` views (where the org IS the
  operational scope); `agent`/`livreur` never see org-wide rows. (Other
  builders — sites, users, anomalies — are organization-level screens;
  scope them when per-site semantics land.)
- **Defense-in-depth RBAC:** every mutation is gated at three layers — the UI
  button (`hasPermission`), the store (`lib/security/guards`), and the form
  (site-scoped fields). No store writes may bypass the guards.
- **Site-scoped writes:** MARKETEUR creates only for their site; TRANSPORTEUR
  acknowledges with only their org's crew.
- **MFA awareness:** `mfa.enforced_for_roles` (JSON array or comma-separated
  string in the setting) gates the MFA setup prompt; never hardcode the role list.
- **File storage:** all images, certificates, and proofs live in MinIO
  (S3-compatible); only URL references are kept in the database.
- **Cache invalidation:** every mutation invalidates its API-resource query
  key via `lib/api/invalidation`; WebSocket events (`tour:update`,
  `anomaly:new`, `device:telemetry`) invalidate the matching keys.
- **Async resources:** reports and risk recompute are polled to a terminal
  state (`READY`/`FAILED`/`EXPIRED`); the UI shows a spinner and freshness.
- **Optimistic updates:** low-risk status toggles use optimistic UI with
  rollback on error; mutating buttons are disabled while pending.
- **Forms:** every create/edit form uses react-hook-form + zod + shadcn Form
  with inline per-field `FormMessage` errors (never toast validation errors).
  Submitting buttons show a spinner and are disabled while pending.
  Auto-collected fields (org_id from auth, status defaults, created_by,
  timestamps) are hidden from the user.
- **Toasts:** exactly one toast per outcome; inline validation errors are
  never toasted. Use `hooks/use-toast-feedback` (`runMutation` /
  `extractErrorMessage`).
- **Notifications:** the center is driven by WS events + anomalies; unread
  badge increments on `anomaly:new`/`tour:update` (`ws:notify`); a short
  notification sound plays when enabled (`hooks/use-notification-sound`).
- **Route UX:** data-heavy routes have a `pendingComponent` skeleton
  (`components/layout/route-skeleton`) and an `errorComponent` reusing
  `GeneralError`.
- **API envelope:** every response is `{ success, message, data, pagination?, filters? }`.
- **Soft delete:** DELETE on any table with `deleted_at` sets `deleted_at =
  now()` (never a hard row removal). Reads exclude rows where
  `deleted_at IS NOT NULL`. The frontend fake adapter mirrors this; no
  restore endpoint is documented.
- **Status lifecycles** come from the schema (device, RFID, pickup, tour, site) —
  never invent new status strings.
- **Tournee workflow:** a MARKETEUR creates a tour via the step wizard —
  INTERNAL requires the marketeur's crew (→ PLANNED); EXTERNAL requires a
  transporter with an active contract (→ PENDINGTRANSPORTERACK). The
  TRANSPORTEUR acknowledges by assigning **their own org's** vehicle/driver/
  livreur (→ ACKNOWLEDGED). LIVREUR starts/closes. Transitions follow
  `features/tours/data/tour-machine.ts`; no step is skipped.
- **Contrats marketeur↔transporteur:** MARKETEUR declares contracts with PDF
  proof, `started_at`/`ended_at`, and `is_primary`; the TRANSPORTEUR must
  accept via `transporter_accepted_at` before use. Status is derived by
  `features/transporter-contracts/lib/contract-status.ts`:
  `PENDING`, `PENDINGTRANSPORTERACK`, `ACTIVE`, `UPCOMING`, `EXPIRED`,
  `SUSPENDED`, or `CANCELLED` (including `deleted_at` soft-delete input).
  EXTERNAL tours are eligible only when the contract status is `ACTIVE`. The
  centralized `contracts.*` permissions in
  `@lpg/permissions` govern the workflow: MARKETEUR manages its contracts,
  TRANSPORTEUR reads and accepts, and ADMIN/SUPERADMIN suspend or reactivate.
  TRANSPORTEUR creates and assigns only livreurs belonging to its own
  organization; MARKETEUR does not create or assign transporter livreurs.
  API actions are `GET`/`POST`/`PATCH`/`DELETE` on
  `/api/v1/transporter-contracts`, plus `attach-proof`, `accept`, `suspend`,
  `reactivate`, and `set-primary` actions; `DELETE` is a soft delete.
- **Workflows** resolve against TODO.md §5 (onboarding, geo-verification, certificates,
  device lifecycle, flux 1 / 2a / 2b, reconciliation, anomalies, risk, reporting);
  **monitoring/security** against TODO.md §6–§7.

## 5. Routing & navigation

- **Only static feature routes exist.** There is **no** `$role/$module` dynamic router, no
  `ModuleScreen`, no `MODULE_CATALOG` — do not reintroduce a generic module grid.
- The single `AppSidebar` drives navigation for all roles.
- Role/actor visibility is expressed **permission-gated** in `config/rbac/nav-items.ts` via
  `requires` (from `@lpg/permissions`), **not** by URL-prefixing with a role slug.
- The active actor determines which nav links show (actor point-of-view). Respect the
  role hierarchy: SUPERADMIN > ADMIN > SUPERVISOR/AGENT/INTEGRATEUR >
  MARKETEUR/TRANSPORTEUR > LIVREUR.
- Post-login landing is **`/overview` for every role** (personalized). 

## 6. Code naming & units

- **English** in code everywhere: file/folder names, exports, URLs, types, variables.
- **French** only in user-facing `label` strings (i18n UI).
- **UPPERCASE** for all ENUM values and type names (schema rule). Never snake_case enum values.
- Units: **VRAC quantities are TM (tonnes métriques), NOT liters.** Bouteilles are counted as
  individual 50 kg units (TM / btl displayed accordingly).
- No hardcoded thresholds/business rules — reference the `settings` model by key.
- Status flows (e.g. `tournee_status`, `pickup_status`, site lifecycle) come from the schema —
  never invent new status strings.

## 7. Types & duplication budget

- Shared domain types/enums come from `@lpg/types` (+ `@lpg/permissions` for RBAC). Never
  re-declare `Site`, `PickupStatus`, `VehicleType`, `Role`, etc. locally.
- **Redundancy budget is ZERO.** Before adding a file, grep for an existing equivalent. A new
  feature means a new directory; an update means editing the existing file, not adding a
  parallel one.

## 8. Process (always)

- **Before creative work** (new features/screens/refactors): brainstorm → ask clarifying
  questions if anything is ambiguous → then implement. Never jump straight to code.
- **Ask** when there is >1 reasonable approach. Don't guess.
- **Apply frontend/design skills** when shaping UI.
- **Verify before claiming done:** run typecheck, lint, and tests (`npm run typecheck`,
  `npm run lint`, `npm test`) and confirm green. Provide evidence.
- Do not commit unless the user explicitly asks.

Note: TODO.md, schema SQL, and this file change over time — re-read them as needed; this file
is the standing contract and should be kept in sync with any new rule the user adds.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues, accessed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context — read `CONTEXT.md` and `docs/adr/` at the repo root when exploring the codebase. See `docs/agents/domain.md`.
