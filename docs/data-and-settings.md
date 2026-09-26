<!-- generated-by: gsd-doc-writer -->
# Data & Settings

The schema is the source of truth for tables, columns, and enums. The frontend mock layer mirrors the schema through curated JSON fixtures and the API adapter. This document distinguishes frontend data behavior from backend infrastructure that is not implemented here.

## Settings-driven rules

Business rules read `settings.setting_key`; do not embed thresholds in components or state machines. The canonical fixture is `packages/mock-data/src/seed/curated/10_system_config.json`, accessed by `getSettingNumber` and related helpers in `packages/mock-data/src/settings.ts`.

| Key | Fixture value | Use |
|---|---:|---|
| `geo.confidence_auto_verify_threshold` | `80` | Operational site geo promotion. |
| `geo.confidence_flag_threshold` | `30` | Low-confidence review flag. |
| `device.battery_critical_threshold` | `15` | Critical battery state. |
| `device.offline_alert_minutes` | `30` | Offline alert window. |
| `reconciliation.volume_gap_tolerance_percent` | `2.5` | Reconciliation gap tolerance. |
| `tournee.transporter_ack_timeout_hours` | `4` | Transporter acknowledgement SLA. |
| `tournee.unassigned_alert_hours` | `12` | Unassigned tour alert window. |
| `audit.retention_years` | `5` | Audit retention contract. |
| `mfa.enforced_for_roles` | `["ADMIN","SUPERADMIN","SUPERVISOR"]` | MFA setup gate. |
| `gps.capture_interval_minutes` | `60` | GPS capture interval. |
| `report.default_expiry_days` | `30` | Report expiry. |
| `reconciliation.subsidy_rate_per_tm` | `1000` | Subsidy recovery rate per TM. |
| `reserve.critical_fill_percent` | `35` | Critical reserve threshold. |
| `flux1.pickup_source_functions` | `["CENTREEMPLISSEUR","POINTAPPROVISIONABLE"]` | Allowed pickup source functions. |

The last three are present in the current fixture even though older documentation called the first eleven the complete list. Read the fixture when the list changes.

## Canonical market merge

The curated market data is merged from the canonical `market.json` source. The frontend seed represents **10 existing organizations plus 204 `UNASSIGNED`/unverified operational sites**. These 204 rows belong to the operational `sites` model; they are not `client_sites`. Keep operational sites, commercial clients, and client delivery destinations distinct in types, API resources, scope filters, and UI copy.

## Data boundaries

- `packages/mock-data` contains curated fixtures and settings accessors.
- `packages/mock-api` supplies mock handlers/adapter support.
- `@lpg/api-client` exposes the resource boundary and domain actions.
- TanStack Query owns server state; Zustand owns local UI/mock state. Do not duplicate server collections into long-lived client stores.
- Responses use `{ success, message, data, pagination?, filters? }`.

## Storage and real-time contracts

Images, certificates, contracts, proofs, reports, and firmware are MinIO/S3 objects in the system design. The frontend deals with URLs and does not store binary payloads. File fields must not be represented as database blobs.

WebSocket events named `tour:update`, `anomaly:new`, and `device:telemetry` are invalidation signals. The event bus implementation is outside this frontend repository; the UI contract is to invalidate the matching query keys and refresh the relevant view.

## Time-series and async data

The SQL schema defines time-series tables such as `scan_events`, `vehicle_positions`, `device_status_history`, `audit_logs`, and `monitoring_metrics` for the backend. The frontend consumes their projections and does not implement TimescaleDB hypertables. Reports and risk recomputation are polled to `READY`, `FAILED`, or `EXPIRED` and expose freshness in the UI.

## Deletion, units, and geography

Deletes are soft: the adapter mirrors `deleted_at` and normal reads exclude deleted rows. VRAC is displayed in TM; 50 kg bottles are counted in btl. Geographic values are schema-shaped PostGIS points; UI adapters may project them for maps, but do not invent a second location model.
