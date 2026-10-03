# 03 — State Machines

Every status-bearing entity in the schema, with exact enum transitions, guard conditions (from CHECK constraints/triggers), and the actor/trigger that drives each transition. DB-enforced constraints are marked **[DB]**; everything else is **[APP]**-layer logic that must be implemented in the service tier (the schema intentionally does not encode full workflow logic in triggers).

---

## 3.1 Delivery Tour (`delivery_tours.status` — `tournee_status`)

```
INTERNAL mode:
  DRAFT → PLANNED → INPROGRESS → CHECKPOINTACTIVE → CLOSED
  (+ CANCELLED reachable from DRAFT, PLANNED)

EXTERNAL mode:
  DRAFT → PENDINGTRANSPORTERACK → ACKNOWLEDGED → INPROGRESS → CHECKPOINTACTIVE → CLOSED
  (+ CANCELLED reachable from DRAFT, PENDINGTRANSPORTERACK, ACKNOWLEDGED)
```

| Transition | Actor | Guard | Enforcement |
|---|---|---|---|
| create → `DRAFT` | MARKETEUR | `execution_mode` fixed at creation | **[DB]** `chk_tournee_internal`/`chk_tournee_external` |
| `DRAFT` → `PLANNED` (INTERNAL) | MARKETEUR | `vehicle_id`, `driver_id`, `livreur_user_id` set, must belong to marketeur's org | **[DB]** partial (NOT NULL check only) + **[APP]** org-match check |
| `DRAFT` → `PENDINGTRANSPORTERACK` (EXTERNAL) | MARKETEUR | `transporter_org_id` set and has active `transporter_contracts` row; vehicle/driver/livreur NULL | **[DB]** `chk_tournee_external`, `chk_tournee_no_double_assign` + **[APP]** contract-active check |
| `PENDINGTRANSPORTERACK` → `ACKNOWLEDGED` | TRANSPORTEUR admin | assigns own vehicle/driver/livreur (must belong to transporter's org); sets `assigned_by_transporter_user_id`, `transporter_assigned_at` | **[APP]** |
| `ACKNOWLEDGED` / `PLANNED` → `INPROGRESS` | LIVREUR (via PDA) | sets `started_at` | **[APP]**, `chk_tournee_dates` **[DB]** guards ordering |
| `INPROGRESS` → `CHECKPOINTACTIVE` | system | first checkpoint reached | **[APP]** |
| `CHECKPOINTACTIVE` → `CLOSED` | LIVREUR or MARKETEUR | all checkpoints COMPLETED or SKIPPED; sets `closed_at`, computes `delivered_quantity` | **[APP]** |
| any pre-ACKNOWLEDGED state → `CANCELLED` | MARKETEUR/ADMIN | — | **[APP]** |

**Auto-anomalies (scheduler-driven, [APP]):**
- `TRANSPORTERNOACK` if stuck in `PENDINGTRANSPORTERACK` > `settings.tournee.transporter_ack_timeout_hours` (4h).
- `TOURNEEUNASSIGNEDTOOLONG` if no transporter assigned within `settings.tournee.unassigned_alert_hours` (12h).

---

## 3.2 Pickup Request (`pickup_requests.status` — `pickup_status`)

```
DRAFT → VALIDATED → INPROGRESS → COMPLETED
  (+ CANCELLED reachable from DRAFT, VALIDATED)
```

| Transition | Actor | Effect |
|---|---|---|
| create → `DRAFT` | MARKETEUR | `source_site_id ≠ destination_site_id` **[DB]** `chk_pickup_sites_different` |
| assign vehicles | MARKETEUR | writes `pickup_request_vehicles` rows (system recommends by capacity vs `requested_quantity`) |
| `DRAFT` → `VALIDATED` | ADMIN/MARKETEUR | sets `approved_quantity` |
| `VALIDATED` → `INPROGRESS` | MARKETEUR | GPS tracking begins |
| `INPROGRESS` → `COMPLETED` | LIVREUR/MARKETEUR | requires proof photo (MinIO URL) |

---

## 3.3 Site / Client-Site Status (`sites.status` / `client_sites.status` — `site_status`)

```
UNASSIGNED → ASSIGNED → ACTIVE → VERIFIED
  (+ SUSPENDED, REJECTED reachable from ANY status, by ADMIN/AGENT)
```

| Transition | Trigger | Guard |
|---|---|---|
| create → `UNASSIGNED` | MARKETEUR creates site/client_site | default status |
| `UNASSIGNED` → `ASSIGNED` | first GPS capture on a delivery scan | **[APP]**, `geo_confidence_score` between flag (30) and auto-verify (80) thresholds |
| `ASSIGNED` → `ACTIVE` | auto-promotion | **[APP]** requires BOTH `delivery_count ≥ 5` AND `geo_confidence_score ≥ 80` — **note:** the DB trigger `autogeopromote()` only checks the confidence score and directly flips `is_verified=true`; it does **not** check `delivery_count` and does not distinguish ACTIVE vs VERIFIED as separate steps. The app layer must reconcile this: either extend the trigger or treat `is_verified` as equivalent to reaching VERIFIED and manage the ACTIVE step purely in application code before the trigger fires. |
| `ACTIVE` → `VERIFIED` | AGENT/ADMIN physical field visit | **[APP]** `POST .../verify`, sets `verified_by`, `verified_at` |
| any → `SUSPENDED` / `REJECTED` | ADMIN/AGENT | mandatory `reason` field |

**Geo-confidence auto-promotion detail (per delivery scan):**
1. Update `geo_point` (cluster centroid of scan locations).
2. `delivery_count++`.
3. Recompute `geo_confidence_score`.
4. `< 30` → stays low-confidence, flagged for manual review (no auto action).
5. `30–79` → `ASSIGNED`.
6. `≥ 80` (**[DB] trigger fires here** on the `geo_confidence_score` column) → `is_verified = true`, `verified_at = now()` — app layer should treat this as reaching at least ACTIVE, pending the `delivery_count ≥ 5` business condition for full VERIFIED-eligibility.

---

## 3.4 Device Status (`devices.status` — `device_status`)

```
UNASSIGNED → ASSIGNED → INMISSION
  (+ OFFLINE, PENDINGSYNC, SYNCING, SYNCED, SYNCFAILED, MAINTENANCE,
     DEPLOYED, REMOVED, LOST reachable from any status)
```

| Transition | Actor | Notes |
|---|---|---|
| create → `UNASSIGNED` | INTEGRATEUR registers device | GPS devices require `metadata_json.imei` **[DB]** `chk_device_gps_imei` |
| `UNASSIGNED` → `ASSIGNED` | ADMIN/MARKETEUR/TRANSPORTEUR | sets `assigned_to_user_id` and/or `assigned_to_vehicle_id` |
| `ASSIGNED` → `INMISSION` | tour start | `vehicle_positions` stream begins at `settings.gps.capture_interval_minutes` |
| any → `OFFLINE` | no heartbeat within `settings.device.offline_alert_minutes` (30) | scheduler → `DEVICEOFFLINE` anomaly |
| any → `REMOVED`/`LOST` | ADMIN | e.g. GPS signal lost mid-mission → `GPSREMOVED` anomaly, INVESTIGATION track (possible tampering) |

Every transition writes a `device_status_history` row (`old_status`, `new_status`, `reason`, `changed_by`, `geo_point`, `timestamp`).

**Battery-critical [DB, automatic]:** `trg_devices_battery_critical` sets `battery_critical := battery_level ≤ settings.device.battery_critical_threshold` (default 15) on every insert/update of `battery_level` — app layer then raises a `BATTERYCRITICAL` anomaly when this flips true.

---

## 3.5 RFID Tag Status (`rfid_tags.status` — `rfid_tag_status`)

```
AVAILABLE → ASSIGNEDTOBOTTLE → INTRANSITOUT → INTRANSITIN → AVAILABLE
  (+ LOST, BLOCKED reachable from any status)
```

| Transition | Trigger |
|---|---|
| `AVAILABLE` → `ASSIGNEDTOBOTTLE` | tag linked to a physical bottle (`bottle_serial` set) |
| `ASSIGNEDTOBOTTLE` → `INTRANSITOUT` | scan OUT at depot/site (`scan_events.direction = OUT`) |
| `INTRANSITOUT` → `INTRANSITIN` | scan IN at client/depot on return leg |
| `INTRANSITIN` → `AVAILABLE` | cycle complete, bottle back at a site |

`chk_rfid_location` **[DB]** guards that at most one of `current_site_id`/`current_client_site_id` is populated at any time (both null = in transit).

---

## 3.6 Checkpoint Status (`checkpoints.status` — `checkpoint_status`)

```
PENDING → REACHED → COMPLETED
PENDING → SKIPPED (mandatory skip_reason)
```

- `PENDING → REACHED`: LIVREUR arrives, GPS captured (`actual_arrival` set).
- `REACHED → COMPLETED`: all expected scans recorded for that checkpoint (auto) or manual completion by LIVREUR.
- `PENDING/REACHED → SKIPPED`: requires `skip_reason` (nullable column, but **must** be enforced non-null at the app/API validation layer for this transition — no DB CHECK enforces this today, a **gap to close**).
- `chk_checkpoint_exclusive` **[DB]**: exactly one of `site_id`/`client_site_id` per checkpoint.

---

## 3.7 Declaration → Reconciliation → Redressement

```
declarations.status:        DRAFT → SUBMITTED → RECONCILED (or DISPUTED)
reconciliations.status:     PENDING → VERIFIED → REDRESSEMENTAPPLIED
redressements.status:       ISSUED → PAID | WAIVED
```

Full chain:
1. MARKETEUR: `DRAFT` → `SUBMITTED` declaration.
2. AGENT/ADMIN triggers reconciliation: backend sums `scan_events` (OUT − IN, joined via `checkpoints.tournee_id → delivery_tours.marketeur_org_id`) for the period → writes `reconciliations.tracked_volume`.
3. **[DB]** `trg_reconciliations_compute_gap` fires on insert/update of `tracked_volume`: `volume_gap := declared_volume − tracked_volume` (pulls `declared_volume` live from the linked `declarations` row).
4. **[APP]** computes `subsidy_impact` (rate × gap or similar formula — not specified in schema, must be defined) and checks `|volume_gap| / declared_volume > settings.reconciliation.volume_gap_tolerance_percent` (2.5%) → if exceeded, flag for review; `declarations.status` may move to `DISPUTED` if the marketeur contests.
5. AGENT verifies: `reconciliations.status → VERIFIED` (`verified_by`, `verified_at` set).
6. If gap exceeded tolerance: ADMIN issues a `redressements` row (`status=ISSUED`, `due_date` from `settings.reconciliation.redressement_due_days`, default 15) → `reconciliations.status → REDRESSEMENTAPPLIED`.
7. ADMIN marks `PAID` (+ `transaction_ref`, `paid_at` — **[DB]** `chk_redressements_paid_at` requires `status='PAID'` for `paid_at` to be non-null) or `WAIVED`.

**Real example from seed data** (`07_compliance.json`): CAMGAZ October 2024 — declared 620,000 kg, tracked 558,000 kg → 62,000 kg (10%) gap, far over the 2.5% tolerance → `recon-007-camgaz-oct2024` status `PENDING` (disputed by marketeur, under review) → `red-001-camgaz` already `ISSUED` for 31,000,000 XAF, due 2024-12-06. This demonstrates the system can issue a redressement while the underlying reconciliation is still `PENDING`/disputed — worth confirming whether that's intended sequencing or whether redressement issuance should be gated on `VERIFIED` status first (the documented workflow in `TODO.md §5.8` implies verify-then-issue, but this fixture shows issuance while still pending — **a workflow ambiguity to resolve with product owner**).

---

## 3.8 Anomaly Status (`anomalies.status` — `anomaly_status`)

```
NOUVEAU → ENCOURS → RESOLU → FERME
```

- `NOUVEAU`: created by detection logic (see `04_WORKFLOWS_AND_FLUX.md §Anomaly Detection`).
- `ENCOURS`: an `anomaly_assignments` row exists and is being worked.
- `RESOLU`: `resolved_at`, `resolved_by`, `resolution_notes` all set — **[DB]** `chk_anomalies_resolution` enforces `resolved_at IS NOT NULL` whenever status is RESOLU or FERME.
- `FERME`: administratively closed after resolution (e.g. post-audit sign-off).

Dual-track routing by `category`: `INVESTIGATION` → AGENT; `TECHNICAL` → SUPERVISOR. Routing to a specific `notification_groups` row happens via `notification_rules` lookup on `(anomaly_type, min_severity)`, not stored on the anomaly itself.

---

## 3.9 Report Status (`reports.status` — `report_status`)

```
PENDING → GENERATING → READY → EXPIRED
                     ↘ FAILED
```

- `PENDING`: row created on request.
- `GENERATING`: async worker picked it up.
- `READY`: `file_url`, `file_size`, `generated_at`, `expires_at` (from `settings.report.default_expiry_days`, 30) set.
- `FAILED`: worker error (seed shows `rep-0005-compliance-audit` in this state).
- `EXPIRED`: past `expires_at`, file deleted from MinIO — cron job responsibility, no DB trigger.

---

## 3.10 MFA Status (`users.mfa_status` — `mfa_status`)

```
DISABLED → PENDINGSETUP → ENABLED
                              ↓
                           LOCKED (after repeated failed challenges)
```
