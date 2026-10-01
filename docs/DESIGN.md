# CSPH GPL Traceability System — Design Reference v6.2

Source of truth: `csph_gpl_schema_v6_2.sql` (PostgreSQL 15 + PostGIS + TimescaleDB) and the agreed API/query conventions. Where the schema diverges from earlier concept notes, the divergence is explicit.

## 1. Purpose

A country-scale traceability platform for LPG/GPL distribution in Cameroon, built for CSPH to track product from filling centers through transporters to final clients, detect volume leakage/fraud, and automate péréquation (subsidy reconciliation) with a full audit trail and dual-track incident handling.

## 2. Actors

System roles are defined by the `system_role` enum.

| Actor | Org type | Responsibility |
| SUPERADMIN | REGULATEUR | Full system control: organizations, roles, settings, risk recompute, redressement payments |
| ADMIN | REGULATEUR / any org | Day-to-day administration scoped to org: users, sites, vehicles, anomaly assignment |
| SUPERVISOR | REGULATEUR | TECHNICAL notification track; system health/metrics |
| AGENT | REGULATEUR | INVESTIGATION track; regional site verification; reconciliation verification |
| MARKETEUR | MARKETEUR | Pickup requests, delivery tours, monthly declarations, fleet/sub-roles |
| TRANSPORTEUR | TRANSPORTEUR | Vehicle/certificate management; transporter acknowledgment on external tours |
| LIVREUR | TRANSPORTEUR or MARKETEUR | Field operations: PDA, tours, checkpoints, scan events |
| INTEGRATEUR | REGULATEUR or technical partner | Device/RFID registration; system integrations; integration auth |
| CLIENT contact | CLIENT | Not a default system login; represented via `clients` and `client_sites` |

Regional scoping for AGENT/ADMIN/MARKETEUR staff is enforced through `user_site_assignments`, not org alone.

## 3. Core Domain Model

### 3.1 Organizations, Sites, Clients

The original concept note used a single `Organization.type` and one `Site` entity. The implementation splits these concerns.

| Concept | Concept note | Actual schema |
|---|---|---|
| Org types | CSPH, SCDP, SNH, MARKETEUR, TRANSPORTEUR | `org_type`: REGULATEUR, DEPOT, MARKETEUR, TRANSPORTEUR, CLIENT |
| Operational sites | `Site` with single type | `sites` with `site_function[]`: CENTREEMPLISSEUR, ENTREPOT, POINTAPPROVISIONABLE |
| End-customer destinations | Same `Site` entity | Separate `client_sites` table, owned by a `CLIENT` org |
| Client commercial data | Not modeled | `clients` table: billing, payment terms, credit limit, tax ID, industry sector |
| Site lifecycle | PENDING_GEO_ASSIGN → ACTIVE → SUSPENDED/REJECTED | `site_status`: UNASSIGNED → ASSIGNED → ACTIVE → VERIFIED → SUSPENDED → REJECTED |

Verification is a first-class status driven by `geo_confidence_score` against configurable thresholds in `settings`.

### 3.2 Users & RBAC

- `users`: `system_role`, `org_id`, MFA status, lockout counters, password policy fields
- `user_site_assignments`: regional scoping
- `custom_roles` + `user_custom_roles`: org-defined sub-roles with `permissions_json`
- `permissions`, `system_roles`, `system_role_permissions`: data-driven system abilities
- Security tables: `user_mfa`, `integration_auth`, `user_sessions`, `audit_logs`

### 3.3 Fleet, Drivers & Devices

- `vehicles`: certificate fields mandatory for VRAC; capacity is type-exclusive
- `drivers`: physical driver, optionally linked to a user
- `devices`: unified table for GPS, PDA, RFIDREADER; rich lifecycle
- `device_status_history` + `vehicle_positions`: TimescaleDB hypertables
- `rfid_tags`: lifecycle status; location is either a site or a client site, not both

### 3.4 Fluxes: Pickup & Delivery Tours

- `pickup_requests` + `pickup_request_vehicles`
- `delivery_tours` supports execution modes:
  - INTERNAL: marketeur's own vehicle/driver/livreur
  - EXTERNAL: transporter acknowledges and assigns crew
- `transporter_contracts`: marketeur-transporter agreements
- `checkpoints`: destination is exclusively a site or a client site
- `scan_events`: TimescaleDB hypertable; `conflict_status` and `pda_sync_id` for offline-first sync

### 3.5 Péréquation

- `declarations` → `reconciliations` → `redressements`
- DB trigger auto-computes `volume_gap = declared_volume - tracked_volume`

### 3.6 Settings

Business rules are configurable in `settings`.

| Key | Default | Purpose |
|---|---|---|
| `geo.confidence_auto_verify_threshold` | 80 | Auto-promotion to VERIFIED |
| `geo.confidence_flag_threshold` | 30 | Low-confidence review flag |
| `device.battery_critical_threshold` | 15 | Battery anomaly threshold |
| `device.offline_alert_minutes` | 30 | Offline device anomaly |
| `reconciliation.volume_gap_tolerance_percent` | 2.5 | Redressement trigger threshold |
| `tournee.transporter_ack_timeout_hours` | 4 | Transporter ack SLA |
| `tournee.unassigned_alert_hours` | 12 | Unassigned tour SLA |
| `audit.retention_years` | 5 | Audit log retention |
| `mfa.enforced_for_roles` | ADMIN, SUPERADMIN, SUPERVISOR | Mandatory MFA roles |

### 3.7 Risk, Anomalies & Notifications

- `risk_scores`: covers MARKETEUR, TRANSPORTEUR, LIVREUR, SITE, CLIENTSITE, TOURNEE, CLIENT, VEHICLE
- `anomalies`: INVESTIGATION vs TECHNICAL; 18 anomaly types
- `anomaly_assignments`: assignment history, not a single overwrite
- `notification_groups`: TECHNICAL, INVESTIGATION, ADMIN, MARKETING, TRANSPORT
- `notification_rules`: maps anomaly_type + min severity to target group

### 3.8 Reporting & Monitoring

- `reports`: async generation; PENDING → GENERATING → READY/FAILED/EXPIRED
- `monitoring_metrics`: TimescaleDB hypertable for Prometheus-style metrics
- Materialized views: `mv_site_risk_summary`, `mv_marketeur_declaration_summary`

## 4. Enum Reference

| Enum | Values |
|---|---|
| `org_type` | REGULATEUR, DEPOT, MARKETEUR, TRANSPORTEUR, CLIENT |
| `region` | ADAMAOUA, CENTRE, EST, EXTREMENORD, LITTORAL, NORD, NORDOUEST, OUEST, SUD, SUDOUEST |
| `site_function` | CENTREEMPLISSEUR, ENTREPOT, POINTAPPROVISIONABLE |
| `site_status` | UNASSIGNED, ASSIGNED, ACTIVE, VERIFIED, SUSPENDED, REJECTED |
| `system_role` | SUPERADMIN, ADMIN, SUPERVISOR, INTEGRATEUR, AGENT, MARKETEUR, LIVREUR, TRANSPORTEUR |
| `vehicle_type` / `tournee_type` | VRAC, BOUTEILLES50KG |
| `execution_mode` | INTERNAL, EXTERNAL |
| `tournee_status` | DRAFT, PLANNED, PENDINGTRANSPORTERACK, ACKNOWLEDGED, INPROGRESS, CHECKPOINTACTIVE, CLOSED, CANCELLED |
| `checkpoint_status` | PENDING, REACHED, COMPLETED, SKIPPED |
| `scan_direction` | IN, OUT |
| `pickup_status` | DRAFT, VALIDATED, INPROGRESS, COMPLETED, CANCELLED |
| `declaration_status` | DRAFT, SUBMITTED, RECONCILED, DISPUTED |
| `reconciliation_status` | PENDING, VERIFIED, REDRESSEMENTAPPLIED |
| `redressement_status` | ISSUED, PAID, WAIVED |
| `device_type` | GPS, PDA, RFIDREADER |
| `device_status` | UNASSIGNED, ASSIGNED, INMISSION, OFFLINE, PENDINGSYNC, SYNCING, SYNCED, SYNCFAILED, MAINTENANCE, DEPLOYED, REMOVED, LOST |
| `rfid_tag_status` | AVAILABLE, ASSIGNEDTOBOTTLE, INTRANSITOUT, INTRANSITIN, LOST, BLOCKED |
| `risk_level` | FAIBLE, MODERE, ELEVE, CRITIQUE, CRITIQUEEXTREME |
| `risk_entity_type` | MARKETEUR, TRANSPORTEUR, LIVREUR, SITE, TOURNEE, CLIENT, CLIENTSITE, VEHICLE |
| `anomaly_category` | INVESTIGATION, TECHNICAL |
| `anomaly_type` | VOLUMEGAP, DEVIATIONROUTE, CHECKPOINTMISSED, SCANOUTOFSEQUENCE, SIPHONNAGE, SUBSTITUTIONBOUTEILLES, FALSIFICATIONPREUVES, FILLINGILLEGAL, DIVERSIONSUBSIDIES, PDAUNSYNCED, BATTERYCRITICAL, GPSFAILURE, KAFKATIMEOUT, IOTDEGRADATION, SERVERUNAVAILABLE, TOURNEEUNASSIGNEDTOOLONG, TRANSPORTERNOACK, GPSREMOVED, DEVICEOFFLINE |
| `anomaly_status` | NOUVEAU, ENCOURS, RESOLU, FERME |
| `notification_group_type` | TECHNICAL, INVESTIGATION, ADMIN, MARKETING, TRANSPORT |
| `mfa_type` | TOTP, SMS, EMAIL |
| `mfa_status` | DISABLED, PENDINGSETUP, ENABLED, LOCKED |
| `report_format` | PDF, EXCEL, CSV, JSON |
| `report_status` | PENDING, GENERATING, READY, FAILED, EXPIRED |

## 5. API Conventions

Base URL: `/api/v1`

- Response envelope: `{ success, message, data, pagination }`
- Auth: JWT Bearer in `Authorization` header
- Geo queries: `?lat=...&lng=...&radius=...`
- Soft delete: DELETE sets `deleted_at = now()`
- WebSocket: `/ws` namespace for live GPS, scan events, anomaly push

## 6. Query Parameter Standard

Supported on every list endpoint:

- `page`, `limit`, `sortBy`, `order`
- `groupBy`
- `dateFrom`, `dateTo` (ISO-8601)

`groupBy` returns `{ items, aggregations }` with `buckets`, `totalVolume`, `totalCount`.

## 7. Materialized Views

- `mv_site_risk_summary`: latest risk score per site
- `mv_marketeur_declaration_summary`: declaration + reconciliation rollup per marketeur

Refresh on schedule, not on write. Use `REFRESH MATERIALIZED VIEW CONCURRENTLY` with the unique indexes already defined.

## 8. Microservice Bounding Contexts

- Identity & Auth Service
- Organization Service
- Site Service
- Fleet & Device Service
- Tour & Delivery Service
- Scan Service
- Reconciliation Service
- Risk & Notification Service
- Audit & Reporting

## 9. Open Items

1. Confirm materialized view definitions against reporting requirements.
2. Decide if `CLIENT` org needs a read-only portal login.
3. Add `GET /client-sites` and `POST /tours/:id/acknowledge` to the API route map.
4. Confirm retention/compression windows against CSPH contractual obligations.
