# Domain Model

> **Scope:** the entities, enums, units, and business invariants that make up the LPG traceability domain. This is the "ubiquitous language" — when you talk about a `Tournee`, mean the same thing everywhere.

Source of truth for column names and enum values: `../csph_gpl_schema_v6_2.sql` (canonical SQL schema).
Source of truth for the web app's TypeScript shape: `packages/types/src/index.ts`.

When the two disagree, the **SQL schema wins** for naming/types and `@lpg/types` mirrors it.

---

## 1. Organizations and users

### `Organization` (`organizations`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT | |
| `type` | `OrgType` enum | `REGULATEUR` \| `DEPOT` \| `MARKETEUR` \| `TRANSPORTEUR` \| `CLIENT` |
| `registration_number` | TEXT | |
| `tax_id` | TEXT | |
| `is_active` | BOOL | soft delete via `deleted_at` |
| `*_count` | INT | denormalized counters (sites, vehicles, drivers, users) — recompute on every write |

**`OrgType` meaning**

| Value | Role in the system | Examples |
|---|---|---|
| `REGULATEUR` | CSPH itself, the regulator. Staff hold `system_role = SUPERADMIN/ADMIN/...`. | CSPH national |
| `DEPOT` | Filling center / depot. Sources for `PickupRequest.source_site_id`. | SCDP, SNH |
| `MARKETEUR` | Oil-company operator. The dominant role — creates pickups, tours, declarations. | Tradex, Oilibya, Total |
| `TRANSPORTEUR` | Carrier. Acknowledges external tours. | Camaco, Sotracam |
| `CLIENT` | Commercial buyer. Has `client_sites` (delivery destinations). | Industries, hotels, restaurants |

A `MARKETEUR` org's `users` includes its drivers, livreurs, and ops staff. A `TRANSPORTEUR` org's `users` includes its own drivers and livreurs who can be assigned to external tours.

### `AppUser` (`users`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `email` | TEXT UNIQUE | |
| `password_hash` | TEXT | bcrypt/argon2; never log |
| `first_name` / `last_name` | TEXT | |
| `system_role` | `Role` enum | 8 values, see [permissions-and-rbac.md](./permissions-and-rbac.md) |
| `org_id` | UUID FK | nullable only for `SUPERADMIN` |
| `mfa_status` | `MfaStatus` | `DISABLED \| PENDINGSETUP \| ENABLED \| LOCKED` |
| `last_login_at` / `last_login_ip` | TIMESTAMPTZ / INET | |
| `failed_login_count` | INT | auto-lock on threshold (default 5) |
| `locked_until` | TIMESTAMPTZ | |
| `must_change_password` | BOOL | first-login forced change |

A user can have additional **custom roles** (JSONB permissions, possibly site-scoped) via `user_custom_roles`. Effective permissions = `system_role` grants ∪ custom_role grants, filtered by `user_site_assignments`.

### `UserSiteAssignment` (`user_site_assignments`)

| Field | Type | Notes |
|---|---|---|
| `user_id` | UUID FK | |
| `site_id` | UUID FK | exactly one of `site_id` / `client_site_id` is set |
| `client_site_id` | UUID FK | |
| `is_primary` | BOOL | |

This is the **regional/operational scoping** table. An AGENT scoped to a region sees only the sites and client_sites in their assignments.

---

## 2. Geography

### `Region` enum (10 values)

`ADAMAOUA \| CENTRE \| EST \| EXTREMENORD \| LITTORAL \| NORD \| NORDOUEST \| OUEST \| SUD \| SUDOUEST`

These are the 10 administrative regions of Cameroon. The full names live in the `regions` table (`name` + `code`).

### PostGIS geo

- Type: `GEOGRAPHY(POINT, 4326)` (WGS84).
- Never store raw lat/lng float columns.
- Index: `GIST(geo_point)`.
- UI projects to `{lat, lng}` for display and feeds back the same shape on writes.

---

## 3. Sites

### `Site` (`sites`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `org_id` | UUID FK | owning org (typically `DEPOT` or `MARKETEUR`) |
| `name`, `address` | TEXT | |
| `region` | `Region` | |
| `functions` | `SiteType[]` (array) | a site can have **multiple** functions |
| `geo_point` | GEOGRAPHY | |
| `geo_confidence_score` | INT 0–100 | recomputed after every scan |
| `delivery_count` | INT | |
| `status` | `SiteStatus` | `UNASSIGNED \| ASSIGNED \| ACTIVE \| VERIFIED \| SUSPENDED \| REJECTED` |
| `is_verified` | BOOL | mirrors `status = VERIFIED` for query convenience |

### `SiteType` enum

`CENTREEMPLISSEUR` (filling center) \| `ENTREPOT` (warehouse) \| `POINTAPPROVISIONABLE` (provisionable point — e.g. retailer that can be resupplied)

### `SiteStatus` lifecycle

```
UNASSIGNED → ASSIGNED → ACTIVE → VERIFIED
     ↓          ↓          ↓
   (admin     (first    (auto: confidence ≥ 80 AND ≥ 5 deliveries)
   creates)   delivery)  OR (admin promotes)
                        ↓
                  SUSPENDED | REJECTED (admin/agent)
```

Auto-promotion logic lives in `features/sites/lib/auto-promotion.ts`. Thresholds come from settings:
- `geo.confidence_auto_verify_threshold` (default **80**) → ACTIVE
- `geo.confidence_flag_threshold` (default **30**) → stays UNASSIGNED, flagged

### `ClientSite` (`client_sites`)

Distinct from `Site` — this is a **commercial buyer's** delivery destination.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `client_id` | UUID FK | the buyer |
| `client_org_id` | UUID FK | their org |
| `current_marketeur_org_id` | UUID FK | who currently supplies them |
| `name`, `address`, `region` | | |
| `geo_point`, `geo_confidence_score`, `delivery_count` | | same semantics as `Site` |
| `status` | same `SiteStatus` enum | same FSM |

`ClientSite` exists because a buyer is a commercial actor (with billing, credit, contacts) and may switch suppliers over time. The supplier history is preserved via `current_marketeur_org_id` snapshots on each delivery.

---

## 4. Fleet

### `Vehicle` (`vehicles`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `org_id` | UUID FK | owner org (MARKETEUR or TRANSPORTEUR) |
| `license_plate` | TEXT UNIQUE within org | |
| `type` | `VehicleType` | `VRAC` \| `BOUTEILLES50KG` |
| `max_volume` | DECIMAL | **TM**, only when `type = VRAC` |
| `max_bottle_count` | INT | **btl**, only when `type = BOUTEILLES50KG` |
| `certificate_number` | TEXT | mandatory when VRAC |
| `certificate_url` | TEXT | MinIO URL — `csph-certificates` bucket |
| `certificate_issued_at` / `certificate_expiry_at` | DATE | |
| `tare_weight` | DECIMAL | for VRAC tank-trucks |
| `current_device_id` | UUID FK | currently mounted GPS |
| `is_active` | BOOL | |

**DB invariants** (`csph_gpl_schema_v6_2.sql`):

- `chk_vehicle_capacity` — exactly one of `max_volume` / `max_bottle_count` is NOT NULL.
- `chk_vehicle_vrac_cert` — if `type = VRAC`, then `certificate_number`, `certificate_expiry_at`, `certificate_url` are NOT NULL.

**Display rule.** VRAC quantities render in **TM**, bottle counts in **btl**. UI helper: `features/trucks/lib/quantity.ts → quantityInfo(truck)`.

### `Driver` (`drivers`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `org_id` | UUID FK | |
| `first_name` / `last_name` | TEXT | |
| `license_number` | TEXT | |
| `license_expiry` | DATE | |
| `user_id` | UUID FK | optional — only if the driver also has a system login |
| `is_active` | BOOL | |

---

## 5. Devices

### `Device` (`devices`)

Unified table for `GPS` (Yabby3), `PDA` (livreur's handheld), and `RFIDREADER`.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `device_type` | `DeviceType` | `GPS \| PDA \| RFIDREADER` |
| `serial_number` | TEXT UNIQUE | |
| `model`, `manufacturer` | TEXT | |
| `metadata_json` | JSONB | for GPS **MUST** contain `imei` (enforced by `chk_device_gps_imei`) |
| `status` | `DeviceStatus` (12 values) | see below |
| `battery_level` | INT 0–100 | |
| `battery_critical` | BOOL | DB trigger: auto-set when `battery_level ≤ device.battery_critical_threshold` (15) |
| `assigned_to_user_id` / `assigned_to_vehicle_id` | UUID FK | |
| `last_seen_at` / `last_sync_at` | TIMESTAMPTZ | |
| `org_id` | UUID FK | owning org |

### `DeviceStatus` lifecycle

```
UNASSIGNED → ASSIGNED → INMISSION
     ↓          ↓          ↓
  register   admin     tour starts
  device     assigns
             ↓
   OFFLINE, PENDINGSYNC, SYNCING, SYNCED, SYNCFAILED,
   MAINTENANCE, DEPLOYED, REMOVED, LOST
```

Any state can transition to `OFFLINE`, `MAINTENANCE`, `LOST`, `REMOVED`. `INMISSION` is the active mission state — the moment a tour starts, the GPS/PDA moves to `INMISSION`.

### `DeviceStatusHistory` (TimescaleDB hypertable)

Records every status change with `old_status`, `new_status`, `reason`, `changed_by`, `geo_point`. Append-only, retentionaligned to `audit.retention_years` (5).

### `VehiclePositions` (TimescaleDB hypertable)

GPS stream. Capture interval from `gps.capture_interval_minutes` (default 60). Index on `(vehicle_id, timestamp DESC)`. UI consumes via `api/vehicles/:id/position` (latest) or `api/vehicles/:id/history` (range).

---

## 6. Approvisionnement (Flux 1)

### `PickupRequest` (`pickup_requests`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `marketeur_org_id` | UUID FK | requesting marketeur |
| `source_site_id` | UUID FK | a `Site` (typically a `DEPOT`) |
| `destination_site_id` | UUID FK | another `Site` (≠ source) |
| `requested_quantity` | DECIMAL | TM or btl depending on `source_site.functions` |
| `approved_quantity` | DECIMAL | set on validate |
| `status` | `PickupStatus` | `DRAFT \| VALIDATED \| INPROGRESS \| COMPLETED \| CANCELLED` |
| `requested_at`, `validated_at`, `started_at`, `completed_at` | TIMESTAMPTZ | |
| `validated_by` | UUID FK | |
| `proof_photo_url` | TEXT | MinIO `csph-proofs` bucket |

DB invariant: `source_site_id ≠ destination_site_id`.

### `PickupRequestVehicle` (join)

`pickup_request_id × vehicle_id`, with `is_primary` flag. The `features/pickups/lib/vehicle-recommendation.ts → recommendVehicles` helper picks vehicles whose `max_volume` or `max_bottle_count` covers the requested quantity, with valid certificates.

---

## 7. Livraison (Flux 2)

### `DeliveryTour` (`delivery_tours`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `marketeur_org_id` | UUID FK | |
| `transporter_org_id` | UUID FK | **nullable**; required for EXTERNAL |
| `type` | `TourneeType` | `VRAC` \| `BOUTEILLES50KG` |
| `execution_mode` | `ExecutionMode` | `INTERNAL` \| `EXTERNAL` |
| `vehicle_id` | UUID FK | nullable for EXTERNAL until ack |
| `driver_id` | UUID FK | nullable for EXTERNAL until ack |
| `livreur_user_id` | UUID FK | nullable for EXTERNAL until ack |
| `assigned_by_transporter_user_id` | UUID FK | set on EXTERNAL ack |
| `transporter_assigned_at` | TIMESTAMPTZ | |
| `status` | `TourneeStatus` (8 values) | see below |
| `planned_start_at`, `actual_start_at`, `closed_at` | TIMESTAMPTZ | |
| `delivered_quantity` | DECIMAL | **computed** from scan totals |

### `TourneeStatus` lifecycle

```
INTERNAL:    DRAFT → PLANNED → INPROGRESS → CHECKPOINTACTIVE → CLOSED
EXTERNAL:    DRAFT → PENDINGTRANSPORTERACK → ACKNOWLEDGED → INPROGRESS → CHECKPOINTACTIVE → CLOSED
CANCELLED reachable from: DRAFT, PLANNED, PENDINGTRANSPORTERACK, ACKNOWLEDGED
```

DB invariants:
- `chk_tournee_internal` — if `execution_mode = INTERNAL` then `vehicle_id, driver_id, livreur_user_id` are NOT NULL.
- `chk_tournee_external` — if `execution_mode = EXTERNAL` then those three are NULL initially; `transporter_org_id` is NOT NULL.

### `Checkpoint` (`checkpoints`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `tour_id` | UUID FK | |
| `site_id` | UUID FK | **exactly one** of `site_id` / `client_site_id` set |
| `client_site_id` | UUID FK | |
| `sequence` | INT | order on the tour |
| `expected_quantity` | DECIMAL | |
| `status` | `CheckpointStatus` | `PENDING \| REACHED \| COMPLETED \| SKIPPED` |
| `reached_at`, `completed_at`, `skipped_at` | TIMESTAMPTZ | |
| `skip_reason` | TEXT | mandatory when SKIPPED |
| `actual_arrival` | GEOGRAPHY | captured on REACH |

### `ScanEvent` (`scan_events`)

**The primary evidentiary record.** TimescaleDB hypertable, **5 years uncompressed**.

| Field | Type | Notes |
|---|---|---|
| `id` | BIGSERIAL | |
| `timestamp` | TIMESTAMPTZ | when the scan happened (PDA clock) |
| `tour_id`, `checkpoint_id`, `livreur_user_id` | UUID FK | |
| `scan_direction` | `ScanDirection` | `IN` (empty bottle return) \| `OUT` (full bottle delivery) |
| `rfid_tag_id` | UUID FK | nullable — for bottles |
| `meter_reading` | DECIMAL | nullable — for VRAC (TM) |
| `geo_point` | GEOGRAPHY | GPS at scan time |
| `photo_url` | TEXT | MinIO `csph-proofs` |
| `pda_sync_id` | TEXT | groups offline batched scans |
| `conflict_status` | enum | `NONE \| SEQUENCE_MISMATCH \| TIMESTAMP_INVALID \| DUPLICATE` |
| `device_id` | UUID FK | the PDA that recorded it |

`delivered_quantity` for a tour is computed as `SUM(meter_reading)` for VRAC, or `COUNT(OUT) - COUNT(IN)` for bottles.

### `TransporterContract` (`transporter_contracts`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `marketeur_org_id` | UUID FK | marketeur party to the agreement |
| `transporter_org_id` | UUID FK | transporter party to the agreement |
| `contract_reference` | TEXT | |
| `started_at` / `ended_at` | TIMESTAMPTZ | contract validity window |
| `contract_document_url` | TEXT | MinIO URL for the PDF proof |
| `transporter_accepted_at` | TIMESTAMPTZ | set when the transporter accepts the contract |
| `is_active` | BOOL | false derives `SUSPENDED` |
| `is_primary` | BOOL | selects the primary contract; unique partial index allows at most one per `marketeur_org_id` |
| `deleted_at` | TIMESTAMPTZ | soft deletion input; derives `CANCELLED` |
| `terms_json` | JSONB | |

The derived status is one of `PENDING`, `PENDINGTRANSPORTERACK`, `ACTIVE`, `UPCOMING`, `EXPIRED`, `SUSPENDED`, or `CANCELLED`. Derivation checks `deleted_at` first, which always produces `CANCELLED`; then inactive contracts produce `SUSPENDED`, missing `contract_document_url` produces `PENDING`, and missing `transporter_accepted_at` produces `PENDINGTRANSPORTERACK`. Accepted contracts are then `EXPIRED` when `ended_at` is past, `UPCOMING` when `started_at` is in the future, and otherwise `ACTIVE`.

`is_primary` selects the primary contract for a marketeur; it does not determine the contract status. Required for an EXTERNAL tour to reference `transporter_org_id`, a tour's transporter must have a contract whose derived status is `ACTIVE` with the requesting marketeur.

---

## 8. RFID tags

### `RfidTag` (`rfid_tags`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `epc` | TEXT UNIQUE | Electronic Product Code — the tag's identity |
| `status` | `RfidTagStatus` | `AVAILABLE \| ASSIGNEDTOBOTTLE \| INTRANSITOUT \| INTRANSITIN \| LOST \| BLOCKED` |
| `current_site_id` / `current_client_site_id` | UUID FK | exactly one set when not in transit |
| `assigned_bottle_id` | UUID | |
| `last_scan_event_id` | UUID FK | |

### Lifecycle

```
AVAILABLE → ASSIGNEDTOBOTTLE → INTRANSITOUT → INTRANSITIN → AVAILABLE
                ↓                  ↓               ↓
              LOST, BLOCKED reachable from any state
```

`INTRANSITOUT` = scanned OUT at a depot (going to client). `INTRANSITIN` = scanned IN at a client (returning empty).

---

## 9. Péréquation (declaration → reconciliation → redressement)

### `Declaration` (`declarations`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `marketeur_org_id` | UUID FK | |
| `period_start` / `period_end` | DATE | usually one calendar month |
| `declared_volume` | DECIMAL | TM or btl |
| `status` | `DeclarationStatus` | `DRAFT \| SUBMITTED \| RECONCILED \| DISPUTED` |
| `submitted_at`, `reconciled_at` | TIMESTAMPTZ | |
| `submitted_by` | UUID FK | |

### `Reconciliation` (`reconciliations`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `declaration_id` | UUID FK | |
| `tracked_volume` | DECIMAL | summed from `scan_events` for the period |
| `volume_gap` | DECIMAL | **computed by DB trigger** `compute_reconciliation_gap` = `declared_volume - tracked_volume` |
| `subsidy_impact` | DECIMAL | gap × current subsidy rate |
| `gap_percentage` | DECIMAL | `(volume_gap / declared_volume) × 100` |
| `status` | `ReconciliationStatus` | `PENDING \| VERIFIED \| REDRESSEMENTAPPLIED` |
| `verified_by`, `verified_at` | | |

Pure computation lives in `features/reconciliations/data/reconciliation.ts → computeReconciliation`. The tolerance check is `|gap_percentage| > reconciliation.volume_gap_tolerance_percent` (default 2.5%).

### `Redressement` (`redressements`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `reconciliation_id` | UUID FK | |
| `amount` | DECIMAL | in XAF (Central African CFA franc) |
| `currency` | TEXT default `XAF` | |
| `due_date` | DATE | |
| `paid_at` | TIMESTAMPTZ | |
| `transaction_ref` | TEXT | payment reference |
| `status` | `RedressementStatus` | `ISSUED \| PAID \| WAIVED` |
| `issued_by`, `waived_by`, `waive_reason` | | |

---

## 10. Risk & anomalies

### `RiskScore` (`risk_scores`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `entity_type` | `RiskEntityType` | `MARKETEUR \| TRANSPORTEUR \| LIVREUR \| SITE \| TOURNEE \| CLIENT \| CLIENTSITE \| VEHICLE` |
| `entity_id` | UUID | |
| `score` | DECIMAL 0–100 | |
| `level` | `RiskLevel` | `FAIBLE \| MODERE \| ELEVE \| CRITIQUE \| CRITIQUEEXTREME` |
| `period_start`, `period_end` | DATE | rolling 30-day |
| `model_version` | TEXT | for explainability / rollback |
| `details_json` | JSONB | feature breakdown |
| `computed_at` | TIMESTAMPTZ | |

Recomputed nightly (2 AM) and on demand by SUPERADMIN/SUPERVISOR via `POST /risks/recompute`.

### `Anomaly` (`anomalies`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `type` | `AnomalyType` (19 values) | see below |
| `category` | `AnomalyCategory` | `INVESTIGATION \| TECHNICAL` — **dual track** |
| `severity` | `RiskLevel` | |
| `entity_type`, `entity_id` | | what it's about |
| `evidence_json` | JSONB | snapshot at detection time |
| `status` | `AnomalyStatus` | `NOUVEAU \| ENCOURS \| RESOLU \| FERME` |
| `assigned_to_group` | UUID FK | the `NotificationGroup` it routes to |
| `created_at`, `updated_at`, `resolved_at` | TIMESTAMPTZ | |
| `resolved_by`, `resolution_notes` | | |

### `AnomalyType` (19 values, two tracks)

**INVESTIGATION** (handled by AGENT / SUPERADMIN):
`VOLUMEGAP`, `DEVIATIONROUTE`, `CHECKPOINTMISSED`, `SCANOUTOFSEQUENCE`, `SIPHONNAGE`, `SUBSTITUTIONBOUTEILLES`, `FALSIFICATIONPREUVES`, `FILLINGILLEGAL`, `DIVERSIONSUBSIDIES`

**TECHNICAL** (handled by SUPERVISOR / SUPERADMIN):
`PDAUNSYNCED`, `BATTERYCRITICAL`, `GPSFAILURE`, `KAFKATIMEOUT`, `IOTDEGRADATION`, `SERVERUNAVAILABLE`, `TOURNEEUNASSIGNEDTOOLONG`, `TRANSPORTERNOACK`, `GPSREMOVED`, `DEVICEOFFLINE`

### `AnomalyAssignment` (history)

`anomaly_id × assigned_to_user_id × assigned_by × assigned_at × status × notes` — full history retained on reassignment.

---

## 11. Notifications

### `NotificationGroup` (`notification_groups`)

`id`, `name`, `type` (one of `TECHNICAL \| INVESTIGATION \| ADMIN \| MARKETING \| TRANSPORT`), `is_active`.

### `NotificationGroupMember` (join)

`group_id × user_id`. Group membership drives anomaly routing.

### `NotificationRule` (`notification_rules`)

`anomaly_type` + `min_severity` → `target_group_id`. Plus optional `escalation_hours` and `escalation_group_id` for overdue routing.

---

## 12. Settings, audit, reports

### `Setting` (`settings`)

`setting_key` (UNIQUE) + `setting_value` + `value_type` (`STRING\|NUMBER\|BOOLEAN\|JSON`) + `category` + `is_encrypted` + `min_value`/`max_value` + `requires_restart`.

The 11 mandatory keys are seeded in `packages/mock-data/src/seed/curated/10_system_config.json` and listed in [data-and-settings.md](./data-and-settings.md).

### `AuditLog` (TimescaleDB hypertable)

`timestamp` + `user_id` + `org_id` + `action` (`AuditAction` enum, 29 values) + `entity_type`/`entity_id` + `old_values`/`new_values` JSONB + `ip_address`. Retention: `audit.retention_years` (5). Compressed after 30 days.

### `Report` (`reports`)

`report_type` (`OPERATIONAL\|FINANCIAL\|COMPLIANCE`) + `report_format` (`PDF\|EXCEL\|CSV\|JSON`) + `status` (`PENDING\|GENERATING\|READY\|FAILED\|EXPIRED`) + `file_url` (MinIO `csph-reports`) + `expires_at` (`report.default_expiry_days`, 30) + `parameters_json`.

---

## 13. Units cheat-sheet

| Concept | Unit | Why |
|---|---|---|
| VRAC volume | **TM** (tonne métrique) | Industry standard. Never liters. |
| Bottles | **btl** | 50 kg units, counted individually. Never kg. |
| Currency | **XAF** | Central African CFA franc. |
| Geo | `GEOGRAPHY(POINT, 4326)` | PostGIS WGS84. |
| Time | UTC ISO 8601 | DB stores `TIMESTAMPTZ`; UI formats per locale. |
| Geo confidence | INT 0–100 | Comparable across sites, sites, client_sites. |
| Risk score | DECIMAL 0–100 | Mapped to `RiskLevel` band. |

---

## 14. Naming conventions (recap)

- **English** in code: file names, exports, URLs, types, variables.
- **French** in `label` strings only.
- **UPPERCASE** for every enum value, type, table name. Never `snake_case` enum values.
- **snake_case** for column names and JSON keys (matches SQL).
- **camelCase** for TypeScript properties that wrap snake_case fields uses the same snake_case form — we don't reshape to camelCase to keep the API ↔ DB mapping trivial.

If a name conflict appears (e.g. CSPIH uses `BOUTEILLE_50KG` in legacy docs), the **SQL schema wins**.
