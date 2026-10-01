# Features & Routes

> **Scope:** the full feature inventory. Every route, the feature that backs it, what it shows, who can access it, and the underlying data.

## How to read this

- **Path** is the route URL (no role prefix per `AGENTS.md` §5).
- **Feature** is the `features/<domain>/` folder that owns the page.
- **Primary actors** are the roles whose sidebar shows this item.
- **`requires`** is the permission code (or set) that gates visibility.
- **Page shape** is a one-line description of what the user sees.

The sidebar source is `apps/web/src/config/rbac/nav-items.ts` (`NAV_CATALOG` + `ROLE_NAV_DECL`).

---

## 1. Per-role view — what each role sees on its home

Each role's post-login landing is the first item of its first sidebar group.

### SUPERADMIN

Lands on `/dashboard`. Five sidebar groups:

- **Pilotage national** — overview, map, finance, risk-scores, dashboard
- **Entités** — organizations, marketers, transporters, depots, sites, client-sites, zones, users, trucks, certificates, devices
- **Opérations & Contrôle** — pickups, tours, tour-tracking, declarations, reconciliations, redressements, anomalies-investigation, anomalies-technical
- **Configuration système** — settings, custom-roles, notification-rules, transporter-contracts, reports, audit-logs
- **Monitoring infrastructure** — grafana, prometheus, system-health

### ADMIN

Lands on `/dashboard-admin`. Four groups:

- **Gestion** — overview, users, marketers, transporters, dashboard-admin
- **Validation & Contrôle** — site-verifications, pickups, declarations, reconciliations
- **Anomalies & Risques** — anomalies, risk-scores, alert-rules
- **Rapports** — reports, audit-logs

### SUPERVISOR

Lands on `/dashboard-supervisor`. Four groups:

- **Monitoring technique** — overview, infra, system-metrics, system-health, dashboard-supervisor
- **Piste technique (Anomalies)** — device-health, gps-tracking, alerts, anomalies-technical
- **Risque & Recompute** — risk-scores, recompute
- **Logs & Intégration** — logs, integrations

### INTEGRATEUR

Lands on `/overview`. Three groups:

- **Matériel IoT** — overview, devices, rfid-tags, gps-config
- **Authentification & Sécurité** — users, device-assignments
- **Maintenance** — maintenance, firmware, logs

### AGENT

Lands on `/overview`. Three groups:

- **Suivi terrain** — overview, marketers, client-sites
- **Investigation (Piste métier)** — declarations, anomalies-investigation, tours, tour-tracking, visits
- **Actions** — reconciliations, passwords

### MARKETEUR

Lands on `/overview`. Four groups:

- **Ma flotte** — overview, vehicles, drivers, devices, dashboard-marketeur
- **Flux 1 — Approvisionnement** — pickups, pickup-tracking
- **Flux 2 — Livraison** — tours, tour-tracking, transporter-contracts, clients
- **Déclarations & Performance** — declarations, performance, reports

> MARKETEUR does **not** see `organizations` or `marketers` (org-level views are SUPERADMIN/ADMIN only).

### TRANSPORTEUR

Lands on `/transporters`. Three groups:

- **Opérations** — overview, tours, tour-tracking, dashboard-transporteur
- **Ma flotte** — vehicles, drivers, livreurs
- **Contrats & Clients** — contracts, performance

### LIVREUR

Empty web sidebar (PDA-only). Post-login = PDA screens (deferred per `nav-items.ts` comment).

---

## 2. The six reference features

Per `AGENTS.md` §2, these are the **canonical reference screens**. New features copy their structure and conventions. Read their source before writing a new feature.

| Reference | Path | What it is |
|---|---|---|
| **`/trucks`** | `/trucks` | Operational fleet dashboard: top stats, status chips, live map, list table, CRUD sheet, telemetry side panel. VRAC in **TM**, bouteilles in **btl**. |
| **`/transporters`** | `/transporters` | List + create/edit transporter orgs. TRANSPORTEUR sees only their own org; SUPERADMIN/ADMIN see all. |
| **`/marketers`** | `/marketers` | Marketer org list with create/edit dialog; navigate to detail. |
| **`/routes`** (alias `/tours`) | `/tours`, `/tour-tracking` | Delivery-tour activity list with slice filter (ALL/INTERNAL/EXTERNAL/PENDING/ACTIVE/HISTORY), active header, table. Houses the tour state machine. |
| **`/activity/trip-tracking`** (alias `/tour-tracking`) | `/tour-tracking` | Live tracking of tours in progress; map + checklist. |
| **`/dashboard`** | `/dashboard` | National KPI dashboard (~1,130 lines): metrics, trends, charts, alerts, recent activity, route contributions, reserve sites. |

---

## 3. Full feature inventory (60 features)

Each row: **Path → feature folder → page shape → primary actors → `requires`**.

### Overview & piloting

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/overview` | `features/overview` | Role-aware home: cards per role (KPI tiles + shortcuts). | All web roles (role-typed). | `overview.read` |
| `/dashboard` | `features/dashboard` | National KPI dashboard: metrics, trends, recharts, alerts, recent activity, route contributions, reserve sites. | SUPERADMIN | `dashboard.read` |
| `/dashboard-admin` | `dashboard` | Admin regional dashboard (subset of national). | ADMIN | `dashboard.read` |
| `/dashboard-supervisor` | `dashboard` | Technical monitoring summary. | SUPERVISOR | `dashboard.read` |
| `/dashboard-marketeur` | `dashboard` | Marketeur scope dashboard. | MARKETEUR | `dashboard.read` |
| `/dashboard-transporteur` | `dashboard` | Transporter scope dashboard. | TRANSPORTEUR | `dashboard.read` |
| `/map` | `features/map` | Interactive ArcGIS map: all sites, client_sites, live vehicle positions, heatmap of flux, polygon zones. | SUPERADMIN | `national-map.read` |
| `/finance` | `features/finance` | Subsidy impact, economies realized, redressement totals, declaration trends. | SUPERADMIN, ADMIN | `subsidies.read` |

### Identity & access

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/users` | `features/users` | User list + create/edit dialog; MFA status, lock/unlock, role assignment, site assignment. | SUPERADMIN, ADMIN, INTEGRATEUR | `users.read` |
| `/permissions` | `features/permissions` | Permission catalog (read-only) + role matrix preview. | SUPERADMIN, AGENT | `permissions.read` |
| `/custom-roles` | `features/custom-roles` | Custom role builder: name, permission JSON, site scope. | SUPERADMIN | `custom-roles.manage` \| `roles.read` |
| `/passwords` | `features/passwords` | Password reset tool for assigned marketeurs and their livreurs. | AGENT | `users.reset` |

### Governance — organizations

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/organizations` | `features/organizations` | CRUD all orgs, filter by type and region. | SUPERADMIN | `orgs.read` |
| `/marketers` | `features/marketers` | Marketeur org list with create/edit dialog. | SUPERADMIN, ADMIN, AGENT (scoped) | `markets.read` |
| `/transporters` | `features/transporters` | Transporter list + create/edit. TRANSPORTEUR sees only own org. | All (TRANSPORTEUR scoped) | `transporters.read` |
| `/depots` | `features/depots` | SCDP/SNH depot orgs (filtered view of `organizations` where type=DEPOT). | SUPERADMIN | `orgs.read` |
| `/zones` | `features/zones` | Polygon zone editor: coverage zones, forbidden zones. | SUPERADMIN, ADMIN | `zones.read` |
| `/clients` | `features/clients` | Client and client_site management, delivery history. | MARKETEUR, ADMIN | `sites.read` |
| `/contracts` | `features/contracts` | Contracts with marketeurs, primary contract indicator. | TRANSPORTEUR | `transporters.read` |
| `/transporter-contracts` | `features/transporter-contracts` | Marketeur view of transporter contracts; primary flag. | MARKETEUR, ADMIN, SUPERADMIN | `transporters.read` |

### Sites

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/sites` | `features/sites` | Operational sites (depot + filling center + provisionable). Region filter, status machine, verification inbox. | SUPERADMIN, MARKETEUR | `sites.read` |
| `/client-sites` | `features/sites` | Client sites list; supplier switch history. | SUPERADMIN, AGENT, MARKETEUR | `sites.read` |
| `/site-verifications` | `features/sites` | Queue of sites/client_sites pending verification (ASSIGNED/ACTIVE → VERIFIED). | AGENT, ADMIN | `sites.verify` |
| `/visits` | `features/visits` | Field visit report creation and history. | AGENT | `tours.read` |

### Fleet

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/trucks` | `features/trucks` | **Reference screen.** National fleet: stats, chips, map, table, CRUD sheet, telemetry panel. | SUPERADMIN, INTEGRATEUR | `trucks.read` |
| `/vehicles` | `features/vehicles` | Own-org fleet view (MARKETEUR's trucks / TRANSPORTEUR's trucks). | MARKETEUR, TRANSPORTEUR | `trucks.read` |
| `/certificates` | `features/certificates` | Certificate registry, expiry calendar (VRAC trucks). | SUPERADMIN, ADMIN, AGENT | `certificates.read` |
| `/drivers` | `features/drivers` | Drivers list and management; license expiry alerts. | MARKETEUR, TRANSPORTEUR, SUPERADMIN | `drivers.read` |
| `/livreurs` | `features/livreurs` | Livreurs (PDA operators) list and assignment. | MARKETEUR, TRANSPORTEUR | `livreurs.read` |
| `/performance` | `features/performance` | Driver/livreur performance metrics, delivery counts, anomaly rates. | MARKETEUR, TRANSPORTEUR | `reports.read` |
| `/quotas` | `features/quotas` | Quotas & volumes per marketeur/region. | MARKETEUR, ADMIN, AGENT | `quotas.read` |

### Devices & IoT

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/devices` | `features/devices` | IoT inventory: type filter (GPS/PDA/RFID), top stats, table, CRUD sheet, details panel. | SUPERADMIN, INTEGRATEUR, MARKETEUR | `devices.read` |
| `/rfid-tags` | `features/rfid-tags` | RFID tag bulk import, status, location tracking. | INTEGRATEUR | `rfid.read` |
| `/gps-config` | `features/gps-config` | Yabby3-specific configuration: IMEI registry, tracking interval, heartbeat, geofence params. | INTEGRATEUR | `devices.write` |
| `/device-assignments` | `features/device-assignments` | Current device-to-user/vehicle mappings. | INTEGRATEUR, SUPERADMIN | `devices.read` |
| `/device-health` | `features/device-health` | Device fleet health: battery levels, offline devices, sync status. | SUPERVISOR, INTEGRATEUR | `devices.read` |
| `/gps-tracking` | `features/gps-tracking` | Live GPS tracking view, Yabby3 device status. | SUPERVISOR, SUPERADMIN | `metrics.read` |
| `/firmware` | `features/firmware` | Firmware version registry, OTA update status. | INTEGRATEUR | `devices.manage` |
| `/maintenance` | `features/maintenance` | Maintenance scheduling, device replacement workflow. | INTEGRATEUR | `devices.manage` |

### Operations

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/pickups` | `features/pickups` | Pickup-request list + create wizard + validate dialog + detail dialog. Vehicle recommendation. | MARKETEUR, ADMIN, SUPERADMIN | `pickups.read` |
| `/pickup-tracking` | `features/pickup-tracking` | Live tracking of in-progress pickups. | MARKETEUR, ADMIN, SUPERADMIN | `pickups.read` |
| `/supply` | `features/supply` | Quick "request a pickup" entry (subset of `/pickups` create wizard). | MARKETEUR | `pickups.create` |
| `/tours` | `features/tours` | **Reference screen.** Tour activity list with slice filter, active header, table. | MARKETEUR, TRANSPORTEUR, ADMIN, AGENT | `tours.read` |
| `/tour-tracking` | `features/tours` | **Reference screen.** Live tracking of tours in progress; map + checklist. | MARKETEUR, TRANSPORTEUR, AGENT, SUPERADMIN | `tours.read` |
| `/tours-internal` | `features/tours` | INTERNAL tour list and create. | MARKETEUR | `tours.read` |
| `/tours-external` | `features/tours` | EXTERNAL tour list and create. | MARKETEUR | `tours.read` |
| `/tours-pending` | `features/tours` | Tours in PENDINGTRANSPORTERACK awaiting ack. | TRANSPORTEUR | `tours.read` |
| `/tours-active` | `features/tours` | ACKNOWLEDGED + INPROGRESS tours. | TRANSPORTEUR | `tours.read` |
| `/tours-history` | `features/tours` | Closed tour history. | TRANSPORTEUR | `tours.read` |

### Compliance

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/declarations` | `features/declarations` | Monthly marketeur declarations (DRAFT → RECONCILED); KPI tiles + table. | MARKETEUR, AGENT, ADMIN, SUPERADMIN | `declarations.read` |
| `/reconciliations` | `features/reconciliations` | Reconciliation table + KPI tiles; gaps > 2.5% tolerance highlighted. Verify action (AGENT). | AGENT, ADMIN, SUPERADMIN | `reconciliations.read` |
| `/redressements` | `features/redressements` | Redressement issuance, payment tracking, waive. | SUPERADMIN, ADMIN | `redressements.read` |

### Risk & anomalies

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/anomalies` | `features/anomalies` | All anomalies (any track). | SUPERADMIN, ADMIN, INTEGRATEUR | `anomalies.read` |
| `/anomalies-investigation` | `features/anomalies` | INVESTIGATION track: VOLUMEGAP, DEVIATIONROUTE, SIPHONNAGE, FILLINGILLEGAL, etc. | AGENT, SUPERADMIN | `anomalies.investigate` |
| `/anomalies-technical` | `features/anomalies` | TECHNICAL track: PDAUNSYNCED, BATTERYCRITICAL, GPSFAILURE, KAFKATIMEOUT, etc. | SUPERVISOR, SUPERADMIN | `devices.read` \| `anomalies.read` |
| `/alerts` | `features/alerts` | Critical infrastructure alerts (Kafka timeouts, server unavailable). | SUPERVISOR, ADMIN | `alerts.read` |
| `/alert-rules` | `features/alert-rules` | Threshold and notification rule configuration. | ADMIN | `alerts.write` |
| `/risk-scores` | `features/risk-scores` | Risk score view per assigned marketeur/site/vehicle. | SUPERADMIN, ADMIN, SUPERVISOR | `risks.read` |
| `/risks` | `features/risks` | Risk model configuration, manual recompute, score distribution. | SUPERADMIN, SUPERVISOR | `risks.read` |
| `/recompute` | `features/recompute` | Manual risk recompute trigger (entity-specific or global). | SUPERVISOR, SUPERADMIN | `risks.manage` |

### Notifications

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/notification-groups` | `features/notification-groups` | Group CRUD: TECHNICAL, INVESTIGATION, ADMIN, MARKETING, TRANSPORT. Member management. | SUPERADMIN, ADMIN | `notification-groups.write` |
| `/notification-rules` | `features/notification-rules` | Anomaly-type → target-group routing rules; min_severity, escalation_hours. | SUPERADMIN, ADMIN | `notification-rules.write` |
| `/notifications` | `features/notifications` | Inbox of notifications addressed to the current user. | All web roles | (system) |

### Reporting & audit

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/reports` | `features/reports` | Report generation requests, download center. | All web roles (scoped) | `reports.read` |
| `/audit-logs` | `features/audit-logs` | Full audit trail, filterable and exportable. | SUPERADMIN, ADMIN, SUPERVISOR | `audit-logs.read` |

### Settings

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/settings` | `features/settings` | Global settings editor (all key-value pairs, with type validation, min/max, restart flag). | SUPERADMIN, ADMIN | `settings.read` |
| `/super-admin` | `features/super-admin` | SUPERADMIN home shortcut (alias of `/dashboard`). | SUPERADMIN | (admin home) |

### Monitoring & infrastructure

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/system-health` | `features/system-health` | Service health, DB metrics, response times. | SUPERVISOR, SUPERADMIN | `system-health.read` |
| `/system-metrics` | `features/system-metrics` | TimescaleDB query interface for monitoring_metrics. | SUPERVISOR, SUPERADMIN | `metrics.read` |
| `/infra` | `features/infra` | Grafana dashboard embeds (8 dedicated dashboards). | SUPERVISOR, SUPERADMIN | `metrics.read` |
| `/integrations` | `features/integrations` | Kafka consumer lag, API integration health, MinIO connectivity. | SUPERVISOR, INTEGRATEUR | `integrations.read` |
| `/logs` | `features/logs` | Centralized log viewer (structured, correlated by request ID). | SUPERVISOR, INTEGRATEUR | `audit-logs.read` |
| `/grafana` | (static route) | External Grafana URL. | SUPERVISOR, SUPERADMIN | `metrics.read` |
| `/prometheus` | (static route) | External Prometheus URL. | SUPERVISOR, SUPERADMIN | `metrics.read` |

### Utility

| Path | Feature | Page shape | Primary actors | `requires` |
|---|---|---|---|---|
| `/errors` | `features/errors` | System-level error pages. | All | — |
| `/command-palette` | `features/command-palette` | Global ⌘K palette for navigation and quick actions. | All | — |

---

## 4. Cross-cutting role behavior

| Behavior | Where | Notes |
|---|---|---|
| **Active role** | `apps/web/src/store/role-store.ts` (Zustand) | Allows role switching in dev/preview; in production equals the user's only `system_role`. |
| **Sidebar projection** | `apps/web/src/config/rbac/sidebar-by-role.ts` | Calls `buildSidebarFor(activeRole)` from `nav-items.ts`. |
| **Route guard** | `apps/web/src/routes/_authenticated.tsx` | Checks `activeRole` ∈ `WEB_ROLES`; redirect to `/auth/login` otherwise. |
| **Empty group drop** | `nav-items.ts → buildSidebarFor` | Groups with all items filtered out are not rendered. |
| **Post-login landing** | `sidebar-by-role.ts` | SUPERADMIN → `/dashboard`; others per their first group. |

---

## 5. Adding a new feature — checklist

1. Create `features/<domain>/` with `index.tsx`, `components/`, `data/`, `lib/`, `utils/`.
2. Create the route file `apps/web/src/routes/_authenticated/<domain>/index.tsx` that imports and renders `<Domain>Page`.
3. Add the `NAV_CATALOG` entry in `nav-items.ts` with `id, label, path, requires, icon?`.
4. Add the `id` to one or more `ROLE_NAV_DECL[role].groups[].items` arrays.
5. Wire the API: extend `packages/api-client/src/api.ts` (use `createResourceService` or add a custom action).
6. If the feature has a state machine, put the pure logic in `features/<domain>/lib/` and add tests next to it.
7. Use shared types from `@lpg/types`. Don't re-declare enums.
8. Run `npm run typecheck && npm run lint && npm test` before claiming done.

---

## 6. Feature-folder source map (quick reference)

For each feature below, the data folder is the single source of view-models. `lib/` houses pure logic.

```
features/<domain>/
  index.tsx          page entry
  components/        presentational
  data/              view-builders, fixtures, adapters
  lib/               state machines, business rules
  utils/             pure helpers
```

Reference templates to copy: `features/trucks/`, `features/transporters/`, `features/marketers/`, `features/tours/`, `features/dashboard/`, `features/overview/`.

If a feature has a duplicate file at the root (e.g. `features/<x>/<x>.tsx` while `features/<x>/components/<x>.tsx` exists), the root copy is dead code — delete it and update importers.
