# Permissions & RBAC

> **Scope:** the dual-layer permission model. How the 8 roles are organized, what each role can do, how the sidebar is built from permissions, and how `canCreate` rules hierarchy.

Source: `packages/permissions/src/index.ts` (~553 lines). The package is built on `@casl/ability` (`AbilityBuilder`, `createMongoAbility`).

---

## 1. Two-layer model

```
effective permissions = system_role grants   ∪   custom_role grants
                       (ROLE_GRANTS)            (user_custom_roles JSONB)
                       AND   scoped by user_site_assignments
```

- **Layer 1 — `system_role`.** One of 8 fixed roles, enum-valued on `users.system_role`. The base set of capabilities.
- **Layer 2 — `custom_role`.** Optional, org-scoped, JSONB-granular. Defined in `custom_roles` and assigned via `user_custom_roles`. Allows sites to fine-tune abilities without inventing a new role.
- **Site scope.** Even if a user has a permission, they only see rows tied to their `user_site_assignments`. AGENT and ADMIN are the most-scoped roles; SUPERADMIN has no scope filter.

**No endpoint relies on `system_role` alone.** Both layers must be checked (`AGENTS.md` §4).

---

## 2. The eight roles

| Role | Tier (`HIERARCHY_LEVEL`) | French label | What they are |
|---|---|---|---|
| `SUPERADMIN` | **100** | Super Admin | CSPH national regulator staff. |
| `ADMIN` | **80** | Administrateur | CSPH regional/admin staff. |
| `SUPERVISOR` | **60** | Superviseur | Technical ops — infra, devices, integrations. |
| `INTEGRATEUR` | **60** | Intégrateur | IoT integration partner. Devices, GPS config. |
| `AGENT` | **60** | Agent validateur | Field validator — sites, declarations, anomalies. |
| `MARKETEUR` | **40** | Marketeur | Oil-company operator. Owns pickups, tours, declarations. |
| `TRANSPORTEUR` | **40** | Transporteur | Carrier. Acknowledges external tours. |
| `LIVREUR` | **20** | Livreur | PDA operator. No web UI (PDA screens deferred). |

Five tiers, eight roles. `SUPERVISOR`/`INTEGRATEUR`/`AGENT` share tier 60; `MARKETEUR`/`TRANSPORTEUR` share tier 40.

`LIVREUR` is in the `Role` enum and `ROLE_GRANTS` (so permissions for the PDA flow are well-defined), but is **excluded from `WEB_ROLES`** and from `AppSidebar` rendering.

### `canCreate(actor, target)` rule

A user may create subordinates **at or below** their own tier (inclusive):

```ts
HIERARCHY_LEVEL[actor] >= HIERARCHY_LEVEL[target]
```

| Actor | Can create |
|---|---|
| SUPERADMIN (100) | everyone |
| ADMIN (80) | everyone below 80: SUPERVISOR, INTEGRATEUR, AGENT, MARKETEUR, TRANSPORTEUR, LIVREUR (and self) |
| SUPERVISOR / INTEGRATEUR / AGENT (60) | MARKETEUR, TRANSPORTEUR, LIVREUR (and self) |
| MARKETEUR / TRANSPORTEUR (40) | LIVREUR (and self) |
| LIVREUR (20) | nobody |

This rule is enforced in the API when creating a user — a SUPERADMIN can promote a MARKETEUR to ADMIN, but an ADMIN cannot promote a peer ADMIN.

---

## 3. Permission catalog

`PERMISSION_CATALOG` is a `as const` array of every permission code (~153 entries, 9 categories). `PermissionCode` and `Resource` types are derived from it via TypeScript template literal types — adding a code is a one-line edit and the build enforces it everywhere.

### Categories

| ID | Label | Approx. count |
|---|---|---|
| `identity` | Identité & accès | 16 |
| `governance` | Gouvernance | 19 |
| `sites` | Sites | 13 |
| `fleet` | Flotte & dispositifs | 27 |
| `supply` | Approvisionnement | 8 |
| `tours` | Tournées, scans & missions | 19 |
| `compliance` | Conformité & finances | 14 |
| `risk` | Risques & anomalies | 15 |
| `reporting` | Reporting & système | 22 |

### Catalog by category

**identity** (16): `users.read|write|create|invite|delete|reset|manage`, `roles.read|write|create|edit|delete`, `permissions.read|write|manage`, `custom-roles.manage`

**governance** (19): `orgs.read|write|create|delete|manage`, `markets.read|write|manage`, `transporters.read|write|manage`, `zones.read|write|manage`, `clients.read|write|create|delete|manage`

**sites** (13): `sites.read|write|create|delete|manage|validate|verify|affect`, `certificates.read|write|manage`, `site-types.read|write`

**fleet** (27): `trucks.read|write|create|delete|manage`, `vehicle-types.read|write`, `drivers.read|write|create|delete|manage`, `livreurs.read|write|manage`, `devices.read|write|create|delete|manage`, `pda.read|write|sync`, `rfid.read|write|delete`

**supply** (8): `pickups.read|write|create|manage`, `quotas.read|write|manage`, `supply.manage`

**tours** (19): `tours.read|write|create|validate|assign|manage`, `deliveries.read|write|manage`, `checkpoints.read|write|manage`, `scans.read|write|manage`, `missions.read|write|assign|manage`

**compliance** (14): `declarations.read|write|validate|manage`, `reconciliations.read|write|manage`, `redressements.read|write|manage`, `subsidies.read|write`, `invoices.read|write`

**risk** (15): `anomalies.read|write|investigate|manage`, `risks.read|write|manage`, `alerts.read|write|manage`, `incidents.read|write|manage`, `fraud.read|manage`

**reporting** (22): `reports.read|generate|export|manage`, `metrics.read|write`, `audit-logs.read|write|export`, `notification-groups.read|write`, `notification-rules.read|write|manage`, `settings.read|write|manage`, `system-health.read`, `integrations.read|write`, `national-map.read`, `dashboard.read`, `overview.read`

### Actions

`Action` is a 17-value union: `read | write | create | delete | manage | invite | reset | validate | verify | affect | sync | assign | reconcile | investigate | generate | export | edit`.

### `ACTION_IMPLICATIONS` — `manage` is the super-action

```ts
{
  manage:      ['read','write','create','delete','invite','reset',
                'validate','verify','affect','sync','assign',
                'reconcile','investigate','generate','export','edit'],
  write:       ['write','create'],
  edit:        ['edit','write','create'],
  // all other actions imply themselves only
}
```

This means:

- Granting `something.manage` covers every action on that resource.
- A nav item requires only ONE code in its `requires` array, and `can()` recognizes implicit grants.
- `can(role, 'read', 'tours')` returns `true` if the role has `tours.read`, `tours.write`, `tours.manage`, or any action whose implications include `read`.

---

## 4. `ROLE_GRANTS` matrix (per role)

The complete role-to-codes map. Use this to know what each role can do.

### SUPERADMIN (all codes — entire catalog)

Every permission in the system. National scope, no site filter.

### ADMIN (~80 codes)

- **Identity**: full `users.*`, `roles.*`, `permissions.*`, `custom-roles.manage`.
- **Governance**: full `orgs.*`, `markets.*`, `transporters.*`, `zones.*`, `clients.*`.
- **Sites**: `sites.*` (all actions), `certificates.*`, `site-types.*`. (Note: no `sites.verify` — that's AGENT.)
- **Fleet**: `trucks.read`, `drivers.*` (no `manage`), `devices.*` (no `manage`), `livreurs.read`.
- **Tours**: `tours.read`, `deliveries.read`.
- **Compliance**: full `declarations.*` (including `validate`), full `reconciliations.*`, `redressements.read`.
- **Risk**: `anomalies.read`, `risks.read`, `alerts.write`, `alerts.read`.
- **Reporting**: `reports.*`, `metrics.read`, `audit-logs.*`, `settings.*`, `system-health.read`, `dashboard.read`, `overview.read`.

### SUPERVISOR (~21 codes, read-only / monitoring focus)

`metrics.read`, `system-health.read`, `alerts.read|write`, `risks.read|write`, `anomalies.read`, `incidents.read`, `fraud.read`, `audit-logs.read`, `reports.read|export`, `integrations.read`, `pda.read`, `devices.read`, `trucks.read`, `tours.read`, `checkpoints.read`, `scans.read`, `overview.read`. Plus `risks.manage` (to trigger recompute).

### INTEGRATEUR (~30 codes, IoT/material focus)

`devices.*` (full CRUD + `manage`), `pda.*`, `rfid.*`, `trucks.read`, `vehicle-types.*`, `drivers.read`, `sites.read`, `tours.read`, `missions.read`, `checkpoints.read`, `scans.read`, `alerts.read`, `risks.read`, `metrics.read`, `integrations.*`, `notification-groups.read`, `notification-rules.read`, `audit-logs.read`, `anomalies.read`, `incidents.read`, `overview.read`.

### AGENT (~30 codes, validator/terrain)

`users.read|reset|invite`, `roles.read`, `permissions.read`, `declarations.*` (with `validate`), `reconciliations.read|write`, `redressements.read`, `anomalies.read|investigate`, `risks.read`, `alerts.read`, `sites.read|verify`, `certificates.read`, `reports.read`, `metrics.read`, `deliveries.read`, `tours.read`, `markets.read`, `transporters.read`, `livreurs.read`, `quotas.read`, `clients.read`, `notification-groups.read`, `notification-rules.read`, `overview.read`.

### MARKETEUR (~40 codes, oil-company operator)

`trucks.*` (full CRUD + `manage`), `vehicle-types.*`, `drivers.*`, `livreurs.*`, `tours.*` (with `create`, `assign`, `manage`), `deliveries.*`, `checkpoints.read`, `scans.read`, `pickups.*` (with `create`, `manage`), `quotas.*`, `supply.manage`, `declarations.read|write`, `subsidies.read`, `invoices.read`, `sites.read`, `anomalies.read`, `risks.read`, `alerts.read`, `reports.*`, `metrics.read`, `overview.read`.

**Note:** MARKETEUR **does not** hold `markets.read` or `orgs.read` — they never see `/marketers` or `/organizations` (`AGENTS.md` §4).

### TRANSPORTEUR (~37 codes, carrier)

`trucks.*` (full CRUD + `manage`), `vehicle-types.read`, `drivers.*`, `livreurs.*`, `tours.*` (with `create`, `assign`, `manage`), `missions.*`, `deliveries.*`, `checkpoints.*`, `scans.*`, `pda.*`, `rfid.read|write`, `devices.read`, `pickups.read`, `quotas.read`, `declarations.read`, `subsidies.read`, `anomalies.read`, `risks.read`, `alerts.read`, `reports.read`, `metrics.read`, `overview.read`.

### LIVREUR (~19 codes, PDA-only)

`missions.read|assign`, `tours.read|write|assign`, `deliveries.read|write`, `checkpoints.read|write`, `scans.read|write`, `pda.*`, `rfid.read|write`, `anomalies.read`, `alerts.read`, `metrics.read`, `livreurs.read`.

(No web UI; PDA screens intentionally deferred per `nav-items.ts` comment.)

---

## 5. Permission helper API

```ts
// packages/permissions/src/index.ts

can(role, action, resource): boolean
  // Returns true if any granted code on `role` matches `resource`
  // and the action falls under ACTION_IMPLICATIONS.

hasPermission(role, code): boolean
  // Convenience: parseCode(code) + can().

defineAbilityFor(role): AppAbility
  // Builds a CASL MongoAbility from ROLE_GRANTS[role],
  // expanding each code's action via ACTION_IMPLICATIONS.

defineAbilitiesFor(role | 'GUEST'): AppAbility
  // App-facing; 'GUEST' returns an empty ability.

getCatalogEntry(code): { code, category, label }
  // Throws on unknown code.

parseCode(code): { resource, action }
  // Splits 'users.read' → { resource: 'users', action: 'read' }.

canCreate(actor, target): boolean
  // HIERARCHY_LEVEL[actor] >= HIERARCHY_LEVEL[target].

getCreatableRoles(actor): Role[]
  // ROLES.filter(r => canCreate(actor, r)).
```

---

## 6. The sidebar projection (NAV_CATALOG → NAV_GROUPS)

`apps/web/src/config/rbac/nav-items.ts` (826 lines) is the single source of truth for navigation.

### Shape

```ts
interface NavItemDecl {
  id: string                            // stable key
  requires: readonly PermissionCode[]   // OR-semantics: any one suffices
  label: string                         // French
  icon?: NavIcon
  path?: string                         // bare path segment ('trucks' → '/trucks')
  static?: boolean                      // true ⇒ path is absolute literal
  badge?: string                        // e.g. '!' for alerts
}

interface NavGroupDecl { id; title; items: NavItemDecl[] }
interface NavRoleDecl  { id; title; groups: NavGroupDecl[] }
```

### `requires` semantics

```ts
isVisibleTo(role, item) =
  item.requires.some(code => hasPermission(role, code))
```

`hasPermission` understands `manage`-implies-everything, so a typical item like `requires: ['sites.read']` is visible to every role with `sites.read`, `sites.write`, `sites.manage`, etc.

### `resolveFeaturePath`

```ts
decl.static ? (decl.path ?? '/') : `/${decl.path ?? decl.id}`
```

- `static: true` items (e.g. `path: '/grafana'`, `path: '/prometheus'`) keep their literal absolute path.
- Feature items become bare paths (`/trucks`, `/marketers`).
- **No role prefixing** — paths are flat per `AGENTS.md` §5.

---

## 7. Per-role sidebar groupings

`ROLE_NAV_DECL: Record<Role, NavRoleDecl>` assembles the groups each role sees, in the order they see them. Items in a group's `items[]` that the role lacks permissions for are filtered out by `buildSidebarFor(role)`.

### SUPERADMIN (5 groups)

- **Pilotage national**: `overview, map, finance, risk-scores, dashboard`
- **Entités**: `organizations, marketers, transporters, depots, sites, client-sites, zones, users, trucks, certificates, devices`
- **Opérations & Contrôle**: `pickups, tours, tour-tracking, declarations, reconciliations, redressements, anomalies-investigation, anomalies-technical`
- **Configuration système**: `settings, custom-roles, notification-rules, transporter-contracts, reports, audit-logs`
- **Monitoring infrastructure**: `grafana, prometheus, system-health`

### ADMIN (4 groups)

- **Gestion**: `overview, users, marketers, transporters, dashboard-admin`
- **Validation & Contrôle**: `site-verifications, pickups, declarations, reconciliations`
- **Anomalies & Risques**: `anomalies, risk-scores, alert-rules`
- **Rapports**: `reports, audit-logs`

### SUPERVISOR (4 groups)

- **Monitoring technique**: `overview, infra, system-metrics, system-health, dashboard-supervisor`
- **Piste technique (Anomalies)**: `device-health, gps-tracking, alerts, anomalies-technical`
- **Risque & Recompute**: `risk-scores, recompute`
- **Logs & Intégration**: `logs, integrations`

### INTEGRATEUR (3 groups)

- **Matériel IoT**: `overview, devices, rfid-tags, gps-config`
- **Authentification & Sécurité**: `users, device-assignments`
- **Maintenance**: `maintenance, firmware, logs`

### AGENT (3 groups)

- **Suivi terrain**: `overview, marketers, client-sites`
- **Investigation (Piste métier)**: `declarations, anomalies-investigation, tours, tour-tracking, visits`
- **Actions**: `reconciliations, passwords`

### MARKETEUR (4 groups)

- **Ma flotte**: `overview, vehicles, drivers, devices, dashboard-marketeur`
- **Flux 1 — Approvisionnement**: `pickups, pickup-tracking`
- **Flux 2 — Livraison**: `tours, tour-tracking, transporter-contracts, clients`
- **Déclarations & Performance**: `declarations, performance, reports`

> MARKETEUR does **not** see `organizations` or `marketers` — those are org-level entity views they don't need.

### TRANSPORTEUR (3 groups)

- **Opérations**: `overview, tours, tour-tracking, dashboard-transporteur`
- **Ma flotte**: `vehicles, drivers, livreurs`
- **Contrats & Clients**: `contracts, performance`

### LIVREUR

Empty `groups` array — PDA-only. The 9 PDA screens are intentionally deferred per the file comment.

---

## 8. Post-login landing

`apps/web/src/config/rbac/sidebar-by-role.ts` defines the home route per role:

| Role | Lands on |
|---|---|
| `SUPERADMIN` | `/dashboard` |
| `ADMIN` | `/dashboard-admin` |
| `SUPERVISOR` | `/dashboard-supervisor` |
| `INTEGRATEUR` | `/overview` |
| `AGENT` | `/overview` |
| `MARKETEUR` | `/overview` |
| `TRANSPORTEUR` | `/transporters` (own-org transporter view) |
| `LIVREUR` | PDA |

Only `SUPERADMIN` lands on `/dashboard`. Other roles land on their home feature. Bare paths, no role prefix.

---

## 9. Custom roles (layer 2)

Custom roles are org-scoped permission overrides.

```ts
interface CustomRole {
  id: UUID
  org_id: UUID                 // owning org
  name: string
  permissions_json: JSONB      // array of PermissionCode or richer
  site_scoped: boolean
  site_id?: UUID               // if site_scoped
}
```

A user has both:

- `system_role` base grants from `ROLE_GRANTS[system_role]`
- Plus every code in any `custom_role` they hold, intersected with their `user_site_assignments`

Typical use case: an oil-company "regional manager" needs most MARKETEUR powers but only for their region — site-scoped custom role.

The `custom-roles.manage` permission gates the custom-role builder UI. Only users with that permission can author custom roles.

---

## 10. Sidebar item → permission map (cheat-sheet)

For the full catalog see the `NAV_CATALOG` in `nav-items.ts`. Highlights:

| Item | `requires` |
|---|---|
| `overview` | `overview.read` |
| `map` | `national-map.read` |
| `organizations` | `orgs.read` |
| `marketers` | `markets.read` |
| `transporters` | `transporters.read` |
| `sites`, `client-sites` | `sites.read` |
| `site-verifications` | `sites.verify` |
| `users` | `users.read` |
| `permissions` | `permissions.read` |
| `custom-roles` | `custom-roles.manage` \| `roles.read` |
| `trucks`, `vehicles` | `trucks.read` |
| `certificates` | `certificates.read` |
| `devices` | `devices.read` |
| `rfid-tags` | `rfid.read` |
| `gps-config` | `devices.write` |
| `firmware`, `maintenance` | `devices.manage` |
| `pickups` | `pickups.read` |
| `pickup-tracking` | `pickups.read` |
| `tours`, `tour-tracking` | `tours.read` |
| `declarations` | `declarations.read` |
| `reconciliations` | `reconciliations.read` |
| `redressements` | `redressements.read` |
| `anomalies` | `anomalies.read` |
| `anomalies-investigation` | `anomalies.investigate` |
| `anomalies-technical` | `devices.read` \| `anomalies.read` |
| `risk-scores` | `risks.read` |
| `recompute` | `risks.manage` |
| `alert-rules` | `alerts.write` |
| `drivers` | `drivers.read` |
| `livreurs` | `livreurs.read` |
| `transporter-contracts` | `transporters.read` |
| `clients` | `sites.read` (client_sites share the sites permission) |
| `performance` | `reports.read` |
| `quotas` | `quotas.read` |
| `supply` | `pickups.create` |
| `contracts` (TRANSPORTEUR) | `transporters.read` |
| `visits` (AGENT) | `tours.read` |
| `passwords` (AGENT) | `users.reset` |
| `finance` | `subsidies.read` |
| `notification-rules` | `notification-rules.write` |
| `notification-groups` | `notification-groups.write` |
| `reports` | `reports.read` |
| `audit-logs` | `audit-logs.read` |
| `settings` | `settings.read` |
| `system-health` | `system-health.read` |
| `system-metrics` | `metrics.read` |
| `infra` | `metrics.read` |
| `alerts` | `alerts.read` |
| `gps-tracking` | `metrics.read` |
| `device-health` | `devices.read` |
| `integrations` | `integrations.read` |
| `logs` | `audit-logs.read` |
| `grafana`, `prometheus` | `metrics.read` (static literal paths) |

---

## 11. Adding a new permission — checklist

1. Add the code to `PERMISSION_CATALOG` in `packages/permissions/src/index.ts` with `category` and `label`.
2. If it's a new resource: add a new top-level resource string. If it's a new action: extend `Action` and possibly `ACTION_IMPLICATIONS`.
3. Add the code to every role's `ROLE_GRANTS[...]` array that should have it. (Or just to SUPERADMIN for admin-only actions.)
4. If the new code gates a nav item, add the corresponding entry to `NAV_CATALOG` with `requires: [...]`.
5. Add the nav item to one or more `ROLE_NAV_DECL[role].groups[].items` arrays so it actually shows.
6. Use the helper in code: `hasPermission(activeRole, 'my.new.permission')` for guards, or use CASL's `<Can I="..." a="..." />`.
7. Mirror the check in the backend: the Fastify RBAC middleware must recognize the same code (TODO.md §7).
