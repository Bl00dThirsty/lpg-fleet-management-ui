# 05 — API Endpoints (REST + WebSocket)

Base path: `/api/v1`. Every response follows the envelope: `{ success: boolean, message: string, data: any, pagination?: { page, limit, total }, filters?: {...} }`. All inputs validated with Zod. Every write endpoint must write to `audit_logs`.

> Grounded against the live SQL schema — endpoints referencing columns/tables that don't exist yet (e.g. `client_sites.client_id`, `redressements.currency`, `scan_events.tour_id`) are marked with ⚠️ and the actual join path to use instead.

## Auth & Users

```
POST   /auth/login                          JWT + refresh token
POST   /auth/refresh
POST   /auth/logout
POST   /auth/mfa/setup                      TOTP/SMS/EMAIL → user_mfa
POST   /auth/mfa/verify
POST   /auth/password/reset
POST   /auth/password/change                enforces must_change_password
```

## Organizations

```
GET    /organizations                       SUPERADMIN, ADMIN (scoped)
POST   /organizations                       SUPERADMIN only
GET    /organizations/:id
PATCH  /organizations/:id
DELETE /organizations/:id                   SUPERADMIN only
```

## Users & RBAC

```
GET    /users                                scoped by org_id + user_site_assignments
POST   /users                                ADMIN+ only; role ≤ own hierarchy_level
GET    /users/:id
PATCH  /users/:id                            cannot escalate system_role above own
DELETE /users/:id
GET    /users/:id/permissions                computed effective permissions
POST   /users/:id/assign-site                → user_site_assignments
POST   /users/:id/assign-role                → user_custom_roles
POST   /users/:id/lock                       sets locked_until
POST   /users/:id/unlock
```

## Custom Roles & Permissions

```
GET    /custom-roles                         per org_id
POST   /custom-roles
GET    /custom-roles/:id
PATCH  /custom-roles/:id
DELETE /custom-roles/:id
GET    /permissions                          full catalog
```

## Sites

```
GET    /sites                                scoped by user_site_assignments for AGENT/staff
POST   /sites                                MARKETEUR/ADMIN creates
GET    /sites/:id
PATCH  /sites/:id                             incl. status transitions
DELETE /sites/:id
POST   /sites/:id/verify                      AGENT/ADMIN → VERIFIED
POST   /sites/:id/suspend                     → SUSPENDED + reason
GET    /sites/nearby                          PostGIS ST_DWithin query on geo_point
```

## Client Sites

```
GET    /client-sites
POST   /client-sites
GET    /client-sites/:id
PATCH  /client-sites/:id
DELETE /client-sites/:id
POST   /client-sites/:id/verify
POST   /client-sites/:id/suspend
GET    /client-sites/nearby
```

## Clients

```
GET    /clients
POST   /clients
GET    /clients/:id
PATCH  /clients/:id
DELETE /clients/:id
GET    /clients/:id/sites                     ⚠️ live schema has no clients.id FK on client_sites;
                                               join via client_sites.client_org_id = clients.org_id
```

## Vehicles

```
GET    /vehicles                              scoped by org
POST   /vehicles
GET    /vehicles/:id
PATCH  /vehicles/:id
DELETE /vehicles/:id
GET    /vehicles/:id/certificate               fetch from MinIO
POST   /vehicles/:id/certificate               upload new certificate
GET    /vehicles/:id/position                  latest vehicle_positions row
GET    /vehicles/:id/history                   vehicle_positions time range query
```

## Drivers

```
GET    /drivers
POST   /drivers
GET    /drivers/:id
PATCH  /drivers/:id
DELETE /drivers/:id
```

## Devices

```
GET    /devices?deviceType=GPS|PDA|RFIDREADER
POST   /devices                                INTEGRATEUR only
GET    /devices/:id
PATCH  /devices/:id                            status transitions, assignments
DELETE /devices/:id
POST   /devices/:id/assign                     to user or vehicle
POST   /devices/:id/unassign
GET    /devices/:id/history                    device_status_history
POST   /devices/:id/sync                       PDA sync endpoint
GET    /devices/:id/telemetry                  battery, last_sync
```

## RFID Tags

```
GET    /rfid-tags
POST   /rfid-tags                              bulk import (INTEGRATEUR)
GET    /rfid-tags/:id
PATCH  /rfid-tags/:id                          status/location updates
GET    /rfid-tags/:id/history                  ⚠️ join via scan_events.rfid_tag_id
```

## Pickup Requests (Flux 1)

```
GET    /pickups
POST   /pickups                                MARKETEUR, status=DRAFT
GET    /pickups/:id
PATCH  /pickups/:id
POST   /pickups/:id/assign-vehicles            → pickup_request_vehicles
POST   /pickups/:id/validate                   ADMIN, sets approved_quantity, VALIDATED
POST   /pickups/:id/start                      INPROGRESS
POST   /pickups/:id/complete                   COMPLETED + proof photo
DELETE /pickups/:id
```

## Delivery Tours (Flux 2)

```
GET    /tours                                  scoped by org + user_site_assignments
POST   /tours                                  MARKETEUR creates
GET    /tours/:id
PATCH  /tours/:id
DELETE /tours/:id
POST   /tours/:id/send-to-transporter           EXTERNAL mode → PENDINGTRANSPORTERACK
POST   /tours/:id/acknowledge                   TRANSPORTEUR assigns crew → ACKNOWLEDGED  ⚠️ critical, must exist
POST   /tours/:id/start                         LIVREUR → INPROGRESS
POST   /tours/:id/close                         → CLOSED, computes delivered_quantity
POST   /tours/:id/cancel                        → CANCELLED
GET    /tours/:id/checkpoints
GET    /tours/:id/scans                         ⚠️ join checkpoints.tournee_id → scan_events.checkpoint_id
GET    /tours/:id/replay                        checkpoint visit history for map replay
```

## Checkpoints

```
GET    /checkpoints
POST   /checkpoints                            within tour creation, or standalone
GET    /checkpoints/:id
PATCH  /checkpoints/:id
POST   /checkpoints/:id/reach                   GPS captured, → REACHED
POST   /checkpoints/:id/complete
POST   /checkpoints/:id/skip                    mandatory skip_reason → SKIPPED
```

## Scan Events

```
GET    /scans                                  filter by checkpoint, livreur, tour (via checkpoint join), date range
POST   /scans                                  LIVREUR records a scan
GET    /scans/:id
PATCH  /scans/:id                              conflict resolution
POST   /scans/bulk                             PDA offline sync batch upload (pda_sync_id)
```

## Transporter Contracts

```
GET    /transporter-contracts
POST   /transporter-contracts                  MARKETEUR creates
GET    /transporter-contracts/:id
PATCH  /transporter-contracts/:id
DELETE /transporter-contracts/:id
POST   /transporter-contracts/:id/attach-proof  MARKETEUR attaches contract_document_url
POST   /transporter-contracts/:id/accept        TRANSPORTEUR sets transporter_accepted_at
POST   /transporter-contracts/:id/suspend       ADMIN/SUPERADMIN sets is_active=false
POST   /transporter-contracts/:id/reactivate    ADMIN/SUPERADMIN sets is_active=true
POST   /transporter-contracts/:id/set-primary   only one is_primary=true per marketeur_org_id
                                                 ⚠️ enforce via partial unique index + app transaction
```

## Declarations

```
GET    /declarations
POST   /declarations                           MARKETEUR, status=DRAFT
GET    /declarations/:id
PATCH  /declarations/:id
POST   /declarations/:id/submit                → SUBMITTED
POST   /declarations/:id/reconcile              triggers reconciliation computation
DELETE /declarations/:id
```

## Reconciliations

```
GET    /reconciliations
GET    /reconciliations/:id
PATCH  /reconciliations/:id/verify              AGENT → VERIFIED
GET    /reconciliations/:id/gap-details          breakdown of volume_gap (computed, no stored gap_percentage)
```

## Redressements

```
GET    /redressements
POST   /redressements                          ADMIN issues, status=ISSUED
GET    /redressements/:id
PATCH  /redressements/:id
POST   /redressements/:id/mark-paid             status=PAID, transaction_ref
POST   /redressements/:id/waive                 status=WAIVED ⚠️ live schema lacks waive_reason/waived_by
                                                 columns — add via migration if audit trail required
```

## Anomalies

```
GET    /anomalies                               filter by category, severity, status, assigned group
GET    /anomalies/:id
PATCH  /anomalies/:id                           status update, reassignment
POST   /anomalies/:id/assign                    creates anomaly_assignments row
POST   /anomalies/:id/resolve                   status=RESOLU, resolution_notes
GET    /anomalies/:id/history                    assignment history
```

## Notification Groups & Rules

```
GET    /notification-groups
POST   /notification-groups
GET    /notification-groups/:id
PATCH  /notification-groups/:id
POST   /notification-groups/:id/members         add user
DELETE /notification-groups/:id/members/:userId
GET    /notification-rules
POST   /notification-rules
PATCH  /notification-rules/:id
```

## Risk Scores

```
GET    /risks                                   filter by entity_type, entity_id, date range
POST   /risks/recompute                         SUPERADMIN/SUPERVISOR manual trigger
GET    /risks/summary                            dashboard aggregation
```

## Reports

```
POST   /reports                                 async generation request
GET    /reports                                 list current user's reports
GET    /reports/:id
GET    /reports/:id/download                    MinIO pre-signed URL
DELETE /reports/:id
```

## Settings

```
GET    /settings
GET    /settings/:key
PATCH  /settings/:key                            ADMIN/SUPERADMIN only, validated against value_type/min/max
POST   /settings/bulk
```

## Audit Logs

```
GET    /audit-logs                              SUPERADMIN/ADMIN only, filter by user/action/resource/date
GET    /audit-logs/:id
```

## System / Monitoring

```
GET    /system/health
GET    /system/metrics                          Prometheus format
GET    /system/dashboard                        aggregated status
```

## WebSocket Namespace `/ws`

```
connection                authenticate with JWT
join:room                 org-specific or role-specific room
anomaly:new                pushed when an anomaly is created
anomaly:assigned           pushed on reassignment
tour:update                pushed on tour status change to involved parties
device:telemetry           pushed on device health update
position:update             pushed on GPS position update (throttled)
```

## Prometheus Metrics (exposed at `GET /system/metrics`)

`gpl_api_requests_total`, `gpl_api_request_duration_seconds`, `gpl_active_pdas`, `gpl_active_tours{execution_mode}`, `gpl_scan_events_total{direction,type}`, `gpl_anomalies_total{category,type,severity}`, `gpl_device_offline_total{device_type}`, `gpl_reconciliation_gap{marketeur_org_id}`, `gpl_risk_score{entity_type,entity_id}`, `gpl_db_connection_pool`, `gpl_kafka_consumer_lag{topic,partition}`.

## MinIO Buckets

`csph-certificates` (vehicle certificates), `csph-proofs` (delivery/pickup proof photos), `csph-reports` (generated reports), `csph-documents` (general docs), `csph-firmware` (PDA/GPS firmware). All uploads produce pre-signed download URLs; retention matches `settings.audit.retention_years` for evidentiary buckets.
