<!-- generated-by: gsd-doc-writer -->
# Features & Routes

Routes are static files under `apps/web/src/routes`; they do not contain a `$role/$module` router. The authenticated shell uses `AppSidebar`, and `config/rbac/nav-items.ts` declares each item with permission codes in `requires`. `buildSidebarFor(role)` projects that catalog for the active actor.

## Landing and navigation

`/overview` is the landing route for every authenticated role. `/dashboard` is a separate permission-gated national dashboard. The URL is not prefixed with a role slug.

## Reference features

Use these as the canonical patterns for new screens:

- `/trucks` — fleet inventory, status, telemetry, and CRUD patterns.
- `/transporters` — organization-scoped transporter management and pending tours.
- `/marketers` — organization-oriented marketer management for regulator roles.
- `/tours` and `/tour-tracking` — tour creation, state actions, and live tracking.
- `/dashboard` — dashboard data builders, Recharts visualizations, alerts, and freshness.

## Route inventory

| Route | Feature folder | Purpose |
|---|---|---|
| `/overview` | `features/overview` | Personalized landing for all roles. |
| `/dashboard` | `features/dashboard` | National KPI dashboard; regulator/permission-gated. |
| `/dashboard-admin` | `features/dashboard` | Administrative dashboard view. |
| `/dashboard-supervisor` | `features/dashboard` | Technical monitoring view. |
| `/dashboard-marketeur` | `features/dashboard` | Marketeur-scoped dashboard. |
| `/dashboard-transporteur` | `features/dashboard` | Transporter-scoped dashboard. |
| `/organizations` | `features/organizations` | Regulator organization management. |
| `/marketers` | `features/marketers` | Marketeur organization management; not available to MARKETEUR. |
| `/transporters` | `features/transporters` | Transporter organizations and operational views. |
| `/depots` | `features/depots` | Depot organization view. |
| `/zones` | `features/zones` | Coverage and restricted zones. |
| `/sites` | `features/sites` | Operational `sites`, functions, status, and verification. |
| `/client-sites` | `features/sites` | Commercial `client_sites`; distinct from operational sites. |
| `/site-verifications` | `features/sites` | Verification queue. |
| `/vehicles` | `features/vehicles` | Organization-scoped fleet. |
| `/trucks` | `features/trucks` | National/reference fleet screen. |
| `/drivers` | `features/drivers` | Driver records and licence expiry. |
| `/livreurs` | `features/livreurs` | Organization-scoped livreur assignment. |
| `/certificates` | `features/certificates` | Vehicle certificates and MinIO URLs. |
| `/devices` | `features/devices` | GPS, PDA, and RFID reader inventory. |
| `/rfid-tags` | `features/rfid-tags` | Tag status and scan history. |
| `/device-assignments` | `features/device-assignments` | Device-to-user/vehicle mappings. |
| `/device-health` | `features/device-health` | Battery, offline, and sync health. |
| `/gps-config` | `features/gps-config` | GPS device configuration. |
| `/gps-tracking` | `features/gps-tracking` | Live GPS and telemetry. |
| `/pickups` | `features/pickups` | Supply requests and validation. |
| `/pickup-tracking` | `features/pickup-tracking` | Active pickup tracking. |
| `/supply` | `features/supply` | Shortcut to pickup creation. |
| `/tours` | `features/tours` | Delivery tour list and state actions. |
| `/tours-internal` | `features/tours` | Internal execution mode. |
| `/tours-external` | `features/tours` | External execution mode. |
| `/tours-pending` | `features/tours` | Awaiting transporter acknowledgement. |
| `/tours-active` | `features/tours` | Acknowledged/in-progress tours. |
| `/tours-history` | `features/tours` | Closed tour history. |
| `/tour-tracking` | `features/tours` | Live map and checkpoint tracking. |
| `/declarations` | `features/declarations` | Volume declarations in TM. |
| `/reconciliations` | `features/reconciliations` | Declared/tracked volume comparison. |
| `/redressements` | `features/redressements` | Reconciliation follow-up and payment. |
| `/anomalies` | `features/anomalies` | All anomaly records. |
| `/anomalies-investigation` | `features/anomalies` | Investigation track. |
| `/anomalies-technical` | `features/anomalies` | Technical track. |
| `/risk-scores` | `features/risk-scores` | Risk scores. |
| `/risks` | `features/risks` | Risk model view. |
| `/recompute` | `features/recompute` | Async risk recomputation. |
| `/reports` | `features/reports` | Async report generation and downloads. |
| `/audit-logs` | `features/audit-logs` | Audit history. |
| `/notifications` | `features/notifications` | Notification center. |
| `/users` | `features/users` | User and assignment administration. |
| `/permissions` | `features/permissions` | Permission catalog. |
| `/custom-roles` | `features/custom-roles` | Custom role builder. |
| `/settings` | `features/settings` | System settings, profile, and security. |

Feature folders follow the canonical `index.tsx` + `components/` + `data/` + `lib/` + `utils/` structure. Data and models are not duplicated at the feature root.
