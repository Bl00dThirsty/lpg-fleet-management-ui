# Data & Settings

> **Scope:** the mandatory system settings (key-value configuration for business rules), the data model's time-series organization (TimescaleDB), file storage (MinIO), monitoring (Grafana/Prometheus), and retention policies.

All business thresholds are read from the `settings` table by `setting_key`. Hardcoded numbers in business logic are a violation of `AGENTS.md` §3 and `TODO.md` §5.

---

## 1. The 11 mandatory settings

Source: `packages/mock-data/src/seed/curated/10_system_config.json`. Every key must exist in the `settings` table. The `value_type` field determines how the UI validates and renders the value.

| # | `setting_key` | `value_type` | `value` (default) | `category` | `description` | `min` / `max` | `requires_restart` |
|---|---|---|---|---|---|---|---|
| 1 | `geo.confidence_auto_verify_threshold` | `INTEGER` | `80` | GEO | Minimum `geo_confidence_score` at which a site or client_site is auto-promoted to `ACTIVE` (after 5 deliveries). | 0–100 | no |
| 2 | `geo.confidence_flag_threshold` | `INTEGER` | `30` | GEO | Below this value raises a manual review flag (stays `UNASSIGNED`). | 0–100 | no |
| 3 | `device.battery_critical_threshold` | `INTEGER` | `15` | DEVICE | Battery % at or below which a device is flagged `BATTERYCRITICAL`. DB trigger auto-sets `battery_critical=true`. | 0–100 | no |
| 4 | `device.offline_alert_minutes` | `INTEGER` | `30` | DEVICE | Minutes without sync before a device is flagged `DEVICEOFFLINE`. | 1–1440 | no |
| 5 | `reconciliation.volume_gap_tolerance_percent` | `DECIMAL` | `2.5` | COMPLIANCE | Acceptable `volume_gap` percentage before a `redressement` is triggered. | 0–100 | no |
| 6 | `tournee.transporter_ack_timeout_hours` | `INTEGER` | `4` | LOGISTICS | Hours a transporter has to acknowledge a `PENDINGTRANSPORTERACK` tour before `TRANSPORTERNOACK` anomaly is raised. | 1–72 | no |
| 7 | `tournee.unassigned_alert_hours` | `INTEGER` | `12` | LOGISTICS | Hours with no transporter assigned to a tour before `TOURNEEUNASSIGNEDTOOLONG` anomaly is raised. | 1–720 | no |
| 8 | `audit.retention_years` | `INTEGER` | `5` | AUDIT | Audit log retention in years. Determines when TimescaleDB compression and MinIO expiry take effect. | 1–25 | no |
| 9 | `mfa.enforced_for_roles` | `JSON` | `["ADMIN","SUPERADMIN","SUPERVISOR"]` | SECURITY | Roles that must complete MFA setup before first sensitive action. Format: `["ROLE1","ROLE2",...]`. | — | no |
| 10 | `gps.capture_interval_minutes` | `INTEGER` | `60` | GPS | GPS capture interval for `vehicle_positions` (TimescaleDB chunk interval). **Requires server restart** to take effect. | 1–1440 | **yes** |
| 11 | `report.default_expiry_days` | `INTEGER` | `30` | REPORT | Default number of days a generated report is valid before status → `EXPIRED` and MinIO file is deleted. | 1–365 | no |

### Settings access in the UI

- `getSettingNumber(key)` from `packages/mock-data/src/settings.ts` — returns `number` (throws if not INTEGER or value_type mismatch).
- `getSettingString(key)` — returns `string`.
- `getSettingBoolean(key)` — returns `boolean`.
- `getSettingJsonArray(key)` — returns `string[]` (parses the JSON column).
- The UI reads these at startup and stores them in a readonly `settings` Zustand slice. Never write directly to the DB; use the API `PATCH /settings/:key`.

### Backend settings CRUD

- `GET /api/v1/settings` — list all keys (authenticated user can see all; SUPERADMIN/ADMIN can `PATCH`).
- `GET /api/v1/settings/:key` — single value with `value_type`, `category`, `description`, `min_value`, `max_value`, `requires_restart`.
- `PATCH /api/v1/settings/:key` — SUPERADMIN/ADMIN only; validates `data_type` before writing.
- `POST /api/v1/settings/bulk` — SUPERADMIN only; bulk update with per-key validation.

---

## 2. TimescaleDB hypertables

The system has **11 tables** created as hypertables for time-series compression and auto-partitioning. Each has a `timestamp` column and a `create_hypertable` call.

| Table | Chunk interval | Compression | Notes |
|---|---|---|---|
| `device_status_history` | 1 day | after 30 days | Append-only; no compression needed for 5-year audit. |
| `vehicle_positions` | 1 day | after 30 days | Index: `(vehicle_id, timestamp DESC)`. |
| `scan_events` | 1 day | **NO compression** for 5 years (primary evidentiary record). | Chunks can be manually compressed later if storage becomes an issue. |
| `monitoring_metrics` | 1 day | after 30 days | Prometheus-style metrics. |
| `audit_logs` | 1 day | after 30 days | Retention = `audit.retention_years` (default 5). |
| `reconciliations` | not a hypertable (small, periodic recompute) | — | Small table; recompute job writes rows. |
| `redressements` | not a hypertable | — | Small table. |
| `risk_scores` | not a hypertable | — | Written nightly by batch job. |
| `notification_group_members` | not a hypertable | — | Junction table. |
| `notification_rules` | not a hypertable | — | Static configuration. |
| `settings` | not a hypertable | — | Key-value, never time-series. |

**Hypertable creation** is done via SQL migration scripts (not in this repo; assumed in the Fastify+Postgres deployment). The `create_hypertable` call must NOT use a literal ellipsis (`...`) — this was a v6.1 bug fixed in v6.2 (`csph_gpl_schema_v6_2.sql`).

### Compression policies (SQL example)

```sql
-- device_status_history: compress chunks older than 30 days
SELECT add_compression_policy('device_status_history', INTERVAL '30 days');

-- vehicle_positions: compress chunks older than 30 days
SELECT add_compression_policy('vehicle_positions', INTERVAL '30 days');

-- audit_logs: compress chunks older than 30 days
SELECT add_compression_policy('audit_logs', INTERVAL '30 days');

-- scan_events: NO compression (5 years uncompressed)
-- (Leave default: DO NOT compress)
```

---

## 3. MinIO object storage

Five buckets are required. All uploads must generate pre-signed URLs for download. Retention policies match `audit.retention_years` (5 years) for evidentiary data.

| Bucket | Content | Retention |
|---|---|---|
| `csph-certificates` | Vehicle certificates de jaugeage (PDF). VRAC trucks only. | 5 years (match `audit.retention_years`). |
| `csph-proofs` | Delivery proof photos, pickup completion photos, scan event photos. | 5 years. |
| `csph-reports` | Generated PDF/Excel/CSV reports. | `report.default_expiry_days` (default 30) → after expiry: status=EXPIRED, file deleted. |
| `csph-documents` | General document storage (contracts, IDs, etc.). | 5 years. |
| `csph-firmware` | PDA/GPS firmware files (OTA updates). | 5 years. |

### MinIO setup notes

- Server-side encryption must be enabled on all buckets.
- Pre-signed URLs expire at the `report.default_expiry_days` TTL (30 days) or at a manually set TTL for certificates/ proofs.
- Cron job daily: any report with `expires_at < now()` → `status = EXPIRED`, `DELETE` from MinIO.
- Upload flow: client → presigned URL → MinIO. DB only stores the URL.

---

## 4. Grafana dashboards (8 dedicated)

These are embedded in the UI at the routes listed in `api-endpoints.md → Monitoring & System Health`. Each maps to a Prometheus data source.

| # | Dashboard | What it shows |
|---|---|---|
| 1 | **API Performance** | Request rate, latency P50/P95/P99, error rate (gpl_api_requests_total, gpl_api_request_duration_seconds). |
| 2 | **Tour Operations** | Active tours by status, completion rate, avg duration (gpl_active_tours, tour SLA). |
| 3 | **Device Health** | Battery levels, offline devices, sync status, GPS signal quality (gpl_gauge, gpl_device_offline_total). |
| 4 | **Anomalies** | Anomalies by category/severity over time, resolution time (gpl_anomalies_total). |
| 5 | **PǸrǸquation** | Declaration vs tracked volume, gap trends, redressement amounts (gpl_reconciliation_gap). |
| 6 | **Geographic** | Live vehicle positions, site density, delivery heatmap (PostGIS geo + vehicle_positions). |
| 7 | **Infrastructure** | CPU, memory, disk, network, PostgreSQL metrics, Redis metrics (system metrics). |
| 8 | **Business KPIs** | Traceability rate, subsidy impact, fraud detection rate (custom Grafana expressions). |

Each dashboard is an embed from the Grafana instance (separate deployment). The UI does not host Grafana; it iframes or uses the Grafana HTTP API to render JSON dashboards.

---

## 5. Kafka topics (real-time event bus)

The system uses Kafka for real-time event propagation. These topics are consumed by the backend (Fastify) and the UI (WebSocket `/ws` namespace). Not all are configured in the dev mock, but the schema is defined.

| Topic | Key | Value | Consumers |
|---|---|---|---|
| `anomaly_new` | `anomaly_id` | JSON: `{type, category, severity, entity_type, entity_id, evidence_json, status}` | Backend → writes `anomalies` row + routes to notification groups. UI receives `anomaly:new` WS event. |
| `anomaly_assigned` | `anomaly_id` | JSON: `{assigned_to_user_id, assigned_by_user_id, notes}` | Backend → writes `anomaly_assignments` + WS `anomaly:assigned`. |
| `anomaly_resolved` | `anomaly_id` | JSON: `{resolution_notes, resolved_by, resolved_at}` | Backend → writes `anomaly` status=RESOLU/closed; UI receives WS update. |
| `tour_update` | `tour_id` | JSON: `{tour_id, new_status, old_status, changed_by}` | Backend → updates `delivery_tours` + WS `tour:update`. |
| `device_telemetry` | `device_id` | JSON: `{battery_level, status, last_seen_at, geo_point}` | Backend → writes `devices` + `device_status_history` + WS `device:telemetry`. |
| `position_update` | `vehicle_id` | JSON: `{geo_point, speed, heading, accuracy, timestamp}` | Backend → writes `vehicle_positions` + WS `position:update` (throttled). |
| `declaration_submitted` | `declaration_id` | JSON: `{declaration_id, marketeur_org_id, period_start, period_end, declared_volume}` | Backend → may trigger reconciliation job. |
| `risk_recompute` | `entity_id` | JSON: `{entity_type, entity_id, score, level}` | Backend → upserts `risk_scores` row + refreshes `mv_site_risk_summary`. |

**Note:** In the current dev setup (fake-adapter + mock-api), Kafka is not active. These topics are for the production deployment.

---

## 6. Data conventions cheat-sheet

| Concept | Unit / Format | Why |
|---|---|---|
| VRAC volume | **TM** (tonne métrique) | Industry standard. Never liters. |
| Bottles | **btl** (50 kg units) | Counted individually. Never kg. |
| Currency | **XAF** (CFA franc) | Central African monetary zone. |
| Geo | `GEOGRAPHY(POINT, 4326)` | PostGIS WGS84. UI projects to `{lat, lng}`. |
| Time | UTC ISO 8601 `TIMESTAMPTZ` | DB stores with timezone; UI formats per locale. |
| Geo confidence | INT 0–100 | Comparable across sites/client_sites. |
| Risk score | DECIMAL 0–100 | Mapped to `RiskLevel` band (FAIBLE/MODERE/ELEVE/CRITIQUE/CRITIQUEEXTREME). |
| API envelope | `{ success, message, data, pagination?, filters?, aggregations? }` | All responses. |
| File URLs | MinIO pre-signed HTTP(S) URL | DB stores only the URL; bucket + key are the object path. |
| ENUM values | UPPERCASE, no `snake_case` | `AGENTS.md` §6 convention. |
| Column names | `snake_case` | Matches SQL schema `csph_gpl_schema_v6_2.sql`. |

---

## 7. Retention policies

| Data type | Duration | Action after expiry |
|---|---|---|
| `audit_logs` | `audit.retention_years` (default **5 years**) | TimescaleDB compression after 30 days; rows deleted after 5 years. MinIO objects in `csph-certificates`, `csph-proofs`, `csph-documents`, `csph-firmware` also deleted. |
| `scan_events` | 5 years **uncompressed** (primary evidentiary record) | No automatic compression; manual archive if needed. |
| `reconciliations` | 5 years | Same as audit_logs. |
| `redressements` | 5 years | Same as audit_logs. |
| `risk_scores` | 5 years | Same as audit_logs. |
| `reports` | `report.default_expiry_days` (**default 30 days**) | After expiry: `status = EXPIRED`, MinIO file deleted from `csph-reports`. |
| `device_status_history` | 5 years | Append-only; compression after 30 days. |
| `vehicle_positions` | 5 years | Compression after 30 days (chunks older than 30 days are compressed). |

All retention is driven by the `audit.retention_years` setting for audit-adjacent data and `report.default_expiry_days` for reports.

---

## 8. Quick-reference table

| Setting | Key | Default | Category |
|---|---|---|---|
| `geo.confidence_auto_verify_threshold` | 80 | GEO |
| `geo.confidence_flag_threshold` | 30 | GEO |
| `device.battery_critical_threshold` | 15 | DEVICE |
| `device.offline_alert_minutes` | 30 | DEVICE |
| `reconciliation.volume_gap_tolerance_percent` | 2.5 | COMPLIANCE |
| `tournee.transporter_ack_timeout_hours` | 4 | LOGISTICS |
| `tournee.unassigned_alert_hours` | 12 | LOGISTICS |
| `audit.retention_years` | 5 | AUDIT |
| `mfa.enforced_for_roles` | `["ADMIN","SUPERADMIN","SUPERVISOR"]` | SECURITY |
| `gps.capture_interval_minutes` | 60 | GPS |
| `report.default_expiry_days` | 30 | REPORT |

| Bucket | Content |
|---|---|
| `csph-certificates` | Vehicle certificates |
| `csph-proofs` | Proof photos, scan photos |
| `csph-reports` | Generated reports |
| `csph-documents` | General documents |
| `csph-firmware` | Firmware files |

| Hypertable | Chunk interval | Compression |
|---|---|---|
| `device_status_history` | 1 day | after 30 days |
| `vehicle_positions` | 1 day | after 30 days |
| `scan_events` | 1 day | **NO** compression (5 yrs) |
| `monitoring_metrics` | 1 day | after 30 days |
| `audit_logs` | 1 day | after 30 days |