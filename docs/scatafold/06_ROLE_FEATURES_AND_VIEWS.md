# 06 — Role Features & Views (Sidebar / Navigation Spec)

Every route is guarded by role + effective permission + site scope (see `02_RBAC_ROLES_PERMISSIONS.md`). Each entry notes the primary tables read/written.

## SUPERADMIN — `/super-admin/*`

| Route | Purpose | Tables |
|---|---|---|
| `/overview` | National dashboard: volumes, traceability rate, financial indicators, alerts, risk heatmap | declarations, reconciliations, risk_scores, anomalies |
| `/map` | ArcGIS map: all sites/client_sites, live vehicle positions, flux heatmap, zones | sites, client_sites, vehicle_positions |
| `/finance` | Subsidy impact, redressement totals, declaration trends | reconciliations, redressements, declarations |
| `/risks` | Risk model config, manual recompute, score distribution | risk_scores, settings |
| `/organizations` | CRUD all orgs by type/region | organizations |
| `/marketeurs`, `/transporters`, `/depots` | Dedicated org-type views | organizations (filtered) |
| `/sites`, `/client-sites` | Full management + verification queues | sites, client_sites |
| `/zones` | Polygon zone editor (coverage/forbidden zones) | — (new spatial table if not present) |
| `/users` | All users, RBAC, MFA status, lock/unlock | users, user_mfa, user_custom_roles |
| `/vehicles`, `/certificates` | Full fleet + certificate expiry calendar | vehicles |
| `/devices` | Unified device registry | devices |
| `/pickups`, `/tours` | All pickups/tours, SLA monitoring | pickup_requests, delivery_tours |
| `/declarations`, `/reconciliations`, `/redressements` | Full péréquation control | declarations, reconciliations, redressements |
| `/anomalies/investigation`, `/anomalies/technical` | Dual-track anomaly views | anomalies (filtered by category) |
| `/settings` | Global key-value settings editor | settings |
| `/custom-roles` | Permission catalog + role builder | permissions, custom_roles |
| `/notification-rules` | Anomaly→group routing config | notification_rules |
| `/transporter-contracts` | Contract registry | transporter_contracts |
| `/reports`, `/audit-logs`, `/system-health` | Reporting, full audit trail, system status | reports, audit_logs, monitoring_metrics |

## ADMIN — `/admin/*`

`/overview`, `/users` (org-scoped), `/marketeurs`, `/transporters`, `/site-verifications` (queue: ASSIGNED/ACTIVE→VERIFIED), `/pickups` (validation queue), `/declarations` (awaiting reconciliation trigger), `/reconciliations` (gap > tolerance), `/anomalies` (assignment/routing), `/risk-scores` (scoped), `/alert-rules` (threshold/notification config), `/reports`, `/audit-logs` (scoped).

## SUPERVISOR — `/supervisor/*` (Technical track)

`/overview` (Prometheus summary: CPU/mem/network/API latency/P95), `/infra` (8 Grafana dashboard embeds), `/system-metrics` (monitoring_metrics query UI), `/device-health` (battery, offline, sync status), `/gps-tracking` (live GPS, device status), `/alerts` (Kafka timeouts, server unavailable), `/anomalies-technical` (TECHNICAL-category investigation/resolution), `/risk-scores` (monitoring), `/recompute` (manual trigger), `/logs` (centralized, request-ID correlated), `/integrations` (Kafka lag, API health, MinIO connectivity).

## INTEGRATEUR — `/integrateur/*` (Device provisioning track)

`/overview` (device activation dashboard), `/devices` (full registry — GPS/Yabby3 config, PDA, RFID readers), `/rfid-tags` (bulk import, status, location), `/gps-config` (Yabby3 IMEI registry, tracking interval, heartbeat, geofence), `/auth` (certificate fingerprints, API key rotation — `integration_auth`), `/device-assignments` (current user/vehicle mappings), `/status-history` (device_status_history timeline), `/maintenance` (scheduling, replacement workflow), `/firmware` (version registry, OTA status), `/logs`.

## AGENT — `/agent/*` (Investigation/field track)

`/overview` (assigned marketeurs consolidated: declarations, anomalies, site status), `/marketeurs` (regional scope), `/client-sites` (pending verification / low geo confidence), `/declarations` (submitted, awaiting review), `/anomalies-investigation` (VOLUMEGAP, DEVIATIONROUTE, SIPHONNAGE, FILLINGILLEGAL, etc.), `/tours` (investigation-flagged tours), `/visits` (field visit report creation/history), `/reconciliations` (verify action + gap details), `/passwords` (reset for assigned marketeurs and their livreurs).

## MARKETEUR — `/marketeur/*`

`/overview` (fleet status, active tours, monthly volume, quota usage), `/vehicles` (own fleet + certificate expiry alerts), `/drivers` (drivers/livreurs, license expiry), `/devices` (assigned PDA/GPS), `/pickups` (creation wizard + vehicle recommendation), `/pickup-tracking` (live), `/tours-internal`, `/tours-external` (with transporter selection + ack monitoring), `/transporter-contracts` (primary flag), `/clients` (client + client_site management, per-client delivery history), `/declarations` (creation, draft, submission), `/performance` (driver/livreur metrics, anomaly rates), `/reports` (own org scope).

## TRANSPORTEUR — `/transporteur/*`

`/overview` (pending acks, active tours, fleet status), `/tours-pending` (PENDINGTRANSPORTERACK — acknowledge action), `/tours-active` (ACKNOWLEDGED/INPROGRESS assigned to this transporter), `/tours-history` (completed), `/vehicles` (own fleet + certificates), `/drivers`, `/livreurs` (PDA operators, assignment), `/contracts` (with marketeurs, primary indicator), `/performance` (completion rates, on-time metrics).

## LIVREUR — `/livreur/*` (field/mobile, offline-first PDA UI)

`/missions` (today's assigned tours), `/tour-start` (→ INPROGRESS), `/checkpoints` (sequence, expected quantity, navigation), `/scan-rfid` (IN empty / OUT full, bottle status), `/scan-vrac` (meter reading TM, GPS auto-capture), `/photos` (delivery proof capture), `/sync` (manual trigger when online), `/sync-status` (uploaded/pending/conflicts), `/offline-data` (local storage viewer).

## Cross-Role Feature Matrix

| Feature | SUPERADMIN | ADMIN | SUPERVISOR | AGENT | INTEGRATEUR | MARKETEUR | TRANSPORTEUR | LIVREUR |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Manage organizations | ✅ | scoped | — | — | — | — | — | — |
| Manage users/RBAC | ✅ | scoped | — | reset pwd only | — | own staff | own staff | — |
| Global settings | ✅ | non-global | — | — | — | — | — | — |
| Verify sites/client-sites | ✅ | ✅ | — | ✅ | — | — | — | — |
| Manage vehicles/drivers | ✅ | — | — | — | — | own fleet | own fleet | — |
| Manage devices (GPS/PDA/RFID) | ✅ | — | monitor only | — | ✅ full lifecycle | assigned only | assigned only | assigned only |
| Create pickups | — | — | — | — | — | ✅ | — | executes |
| Create/manage tours | ✅ view-all | ✅ view-scoped | — | ✅ investigate | — | ✅ create | ✅ acknowledge | ✅ execute |
| Submit declarations | — | — | — | — | — | ✅ | — | — |
| Trigger/verify reconciliation | ✅ | ✅ | — | ✅ verify | — | — | — | — |
| Issue/waive redressements | ✅ | ✅ | — | — | — | — | — | — |
| Resolve INVESTIGATION anomalies | ✅ | ✅ | — | ✅ | — | — | — | — |
| Resolve TECHNICAL anomalies | ✅ | — | ✅ | — | — | — | — | — |
| Trigger risk recompute | ✅ | — | ✅ | — | — | — | — | — |
| View/export audit logs | ✅ | scoped | — | — | — | — | — | — |
| Generate reports | ✅ | ✅ | — | ✅ | — | ✅ own org | ✅ own org | — |
| Scan/execute deliveries | — | — | — | — | — | — | — | ✅ |
