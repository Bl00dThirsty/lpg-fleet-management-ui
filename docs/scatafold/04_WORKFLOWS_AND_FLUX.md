# 04 — Workflows & Business Flux (End-to-End)

## Flux Overview

```
Flux 0: Onboarding      → orgs, users, RBAC setup
Flux 1: Approvisionnement → depot-to-depot pickup (pickup_requests)
Flux 2: Livraison         → depot-to-client delivery (delivery_tours), INTERNAL or EXTERNAL
Flux 3: Péréquation       → declarations → reconciliations → redressements
Flux 4: Anomaly/Risk      → cross-cutting detection, routing, scoring
Flux 5: Reporting         → async report generation
```

---

## Flux 0 — Organization & User Onboarding

1. SUPERADMIN creates an `organizations` row (`type` ∈ REGULATEUR/DEPOT/MARKETEUR/TRANSPORTEUR/CLIENT).
2. SUPERADMIN or ADMIN creates the first `users` row for that org with a `system_role`.
3. If `system_role` ∈ `settings.mfa.enforced_for_roles`, the user is redirected to MFA setup (`user_mfa`) before any sensitive action.
4. Org's own admin (e.g. a MARKETEUR-org ADMIN-level user) may define `custom_roles` scoped to `org_id`.
5. Additional staff onboarded: create user → `user_custom_roles` (role assignment) → `user_site_assignments` (site scoping).
6. Effective permissions resolved per-request as described in `02_RBAC_ROLES_PERMISSIONS.md`.

---

## Flux 1 — Approvisionnement (Depot Pickup)

**Actors:** MARKETEUR (creates/starts/completes), ADMIN (validates).

1. MARKETEUR creates a `pickup_requests` row: `source_site_id`, `destination_site_id` (must differ), `requested_quantity`. Status `DRAFT`.
2. System recommends vehicles by comparing `requested_quantity` against `vehicles.max_volume`/`max_bottle_count` for the marketeur's fleet.
3. MARKETEUR assigns one or more vehicles → `pickup_request_vehicles` rows.
4. ADMIN (or MARKETEUR, depending on org policy) validates → sets `approved_quantity`, status `VALIDATED`.
5. MARKETEUR starts the mission → status `INPROGRESS`, GPS tracking begins on the assigned vehicle(s)/device(s).
6. LIVREUR or MARKETEUR completes → status `COMPLETED`, proof photo uploaded to MinIO (`csph-proofs` bucket).
7. `CANCELLED` is reachable from `DRAFT` or `VALIDATED`.

---

## Flux 2a — INTERNAL Delivery Tour

**Actors:** MARKETEUR (creates), LIVREUR (executes).

1. MARKETEUR creates `delivery_tours`: `execution_mode=INTERNAL`, `vehicle_id`/`driver_id`/`livreur_user_id` mandatory and must belong to the marketeur's org, `type` (VRAC or BOUTEILLES50KG), plus a set of `checkpoints` (each referencing exactly one of `site_id`/`client_site_id`, ordered by `sequence`). Status `PLANNED`.
2. LIVREUR starts on PDA → status `INPROGRESS`, `started_at` set.
3. At each checkpoint, in sequence:
   a. LIVREUR arrives → `POST checkpoints/:id/reach` → GPS captured into `actual_arrival`/geo, status `REACHED`.
   b. LIVREUR records `scan_events` for each unit:
      - **Bottles:** `direction=OUT` (full bottle delivered) or `IN` (empty bottle collected), each tied to an `rfid_tag_id`.
      - **VRAC:** a single `meter_reading` scan, no RFID tag.
      - Each scan carries `geo_point`, `timestamp`, optional `photo_url`.
   c. Checkpoint auto-completes when expected scans are satisfied, or LIVREUR manually marks complete → status `COMPLETED`.
   d. If a stop cannot be visited: `POST checkpoints/:id/skip` with mandatory `skip_reason` → status `SKIPPED`.
4. Once all checkpoints are `COMPLETED`/`SKIPPED`, tour status becomes `CHECKPOINTACTIVE` then LIVREUR/MARKETEUR closes it → `CLOSED`, `closed_at` set.
5. Backend computes `delivered_quantity`:
   - Bottles: `SUM(scan_events WHERE direction=OUT) − SUM(scan_events WHERE direction=IN)`, joined through `checkpoints.tournee_id`.
   - VRAC: `SUM(meter_reading)`.

---

## Flux 2b — EXTERNAL Delivery Tour (Transporter Acknowledgment)

**Actors:** MARKETEUR (creates), TRANSPORTEUR (acknowledges), LIVREUR (executes, employed by either org).

1. MARKETEUR creates `delivery_tours`: `execution_mode=EXTERNAL`, `transporter_org_id` set (must have an active `transporter_contracts` row with this marketeur), `vehicle_id`/`driver_id`/`livreur_user_id` all NULL. Status `PENDINGTRANSPORTERACK`.
2. System notifies the `TRANSPORT` notification group (WebSocket `tour:update` + persisted notification).
3. TRANSPORTEUR admin reviews at their pending-tours view.
4. TRANSPORTEUR acknowledges → assigns their own `vehicle_id`/`driver_id`/`livreur_user_id` (must belong to the transporter's org), sets `assigned_by_transporter_user_id` and `transporter_assigned_at`. Status `ACKNOWLEDGED`.
5. **Time-based anomaly checks (scheduler):**
   - No ack within `settings.tournee.transporter_ack_timeout_hours` (4h) → `TRANSPORTERNOACK` anomaly, routed to TRANSPORT + INVESTIGATION/ADMIN groups.
   - Still unassigned after `settings.tournee.unassigned_alert_hours` (12h) → `TOURNEEUNASSIGNEDTOOLONG` anomaly.
6. From `ACKNOWLEDGED` onward, the flow is identical to Flux 2a: `INPROGRESS` → checkpoints/scans → `CHECKPOINTACTIVE` → `CLOSED`.

---

## Flux 3 — Péréquation (Declaration → Reconciliation → Redressement)

See `03_STATE_MACHINES.md §3.7` for the exact status chain. Narrative sequence:

1. MARKETEUR compiles monthly `declarations` (period_start/end, declared_volume) → `DRAFT` → `SUBMITTED`.
2. AGENT or ADMIN triggers reconciliation. Backend sums the period's `scan_events` for that marketeur (OUT − IN for bottles, or meter totals for VRAC, joined via `checkpoints → delivery_tours.marketeur_org_id`) and writes `reconciliations.tracked_volume`.
3. **[DB trigger]** `volume_gap` auto-recomputed as `declared_volume − tracked_volume`.
4. Backend computes `subsidy_impact` (business formula against current subsidy rate — not encoded in the schema, must be defined explicitly in the reconciliation service).
5. If `|volume_gap| / declared_volume` exceeds `settings.reconciliation.volume_gap_tolerance_percent` (2.5%), the reconciliation is flagged for review (and the declaration may transition to `DISPUTED` if the marketeur contests it).
6. AGENT reviews and verifies → `reconciliations.status = VERIFIED`.
7. ADMIN issues a redressement (reimbursement notice) for the gap → `redressements.status = ISSUED`, `due_date` computed from `settings.reconciliation.redressement_due_days` (15 days) → `reconciliations.status = REDRESSEMENTAPPLIED`.
8. ADMIN later marks `PAID` (with `transaction_ref`) or `WAIVED`.

**Regulatory intent (from schema comments):** this whole flow exists to prevent marketers from diverting government-subsidized LPG volumes to industrial clients or export markets — the volume-gap detection *is* the fraud-control mechanism, and `scan_events` is retained uncompressed for 5 years specifically because it is the evidentiary backbone for any redressement dispute.

---

## Flux 4 — Anomaly Detection, Routing & Risk Scoring

### Anomaly lifecycle
1. A detection event fires — either a DB-level condition (e.g. battery threshold trigger flips `battery_critical`) or an application/scheduler-level condition (SLA timeout, volume gap, route deviation, scan sequence mismatch, etc.).
2. Service creates an `anomalies` row: `type` (from the `anomaly_type` catalog), `category` (INVESTIGATION or TECHNICAL, derived from `type`), `severity` (`risk_level`), `entity_type`/`entity_id` (polymorphic pointer to whatever triggered it), `evidence_json` snapshot.
3. Service looks up `notification_rules` by `(anomaly_type, min_severity)` → resolves `target_group_id`.
4. Sets `anomalies.assigned_to_group` (the enum classification) and pushes a WebSocket `anomaly:new` event to all `notification_group_members` of the resolved group.
5. Creates the first `anomaly_assignments` row (who's on it).
6. **Track routing:** INVESTIGATION-category anomalies go to AGENT's queue; TECHNICAL-category go to SUPERVISOR's queue.
7. Reassignment (`POST anomalies/:id/assign`) creates a **new** `anomaly_assignments` row — full history is retained, never overwritten.
8. Resolution (`POST anomalies/:id/resolve`) sets `status=RESOLU`, `resolved_by`, `resolution_notes`, `resolved_at`.

### Anomaly type → category map
| Category | Types |
|---|---|
| INVESTIGATION | VOLUMEGAP, DEVIATIONROUTE, CHECKPOINTMISSED, SCANOUTOFSEQUENCE, SIPHONNAGE, SUBSTITUTIONBOUTEILLES, FALSIFICATIONPREUVES, FILLINGILLEGAL, DIVERSIONSUBSIDIES |
| TECHNICAL | PDAUNSYNCED, BATTERYCRITICAL, GPSFAILURE, KAFKATIMEOUT, IOTDEGRADATION, SERVERUNAVAILABLE, TOURNEEUNASSIGNEDTOOLONG, TRANSPORTERNOACK, GPSREMOVED, DEVICEOFFLINE |

### Risk scoring batch
1. Trigger events queue a recompute: tour closed, declaration submitted, sync failure, anomaly created.
2. A daily batch job (nominally 2 AM) computes a rolling 30-day score for every active entity across all 8 `risk_entity_type` values (MARKETEUR, TRANSPORTEUR, LIVREUR, SITE, TOURNEE, CLIENT, CLIENTSITE, VEHICLE).
3. Writes a `risk_scores` row: `score` (0-100), `level` (FAIBLE/MODERE/ELEVE/CRITIQUE/CRITIQUEEXTREME), `period_start/end`, `model_version`, `details_json` (explainable feature breakdown — seed data shows shapes like `{"anomaly_count_90d", "volume_gap_pct_avg", "unverified_sites", "offline_devices", ...}` for MARKETEUR, and device-specific fields like `battery_level`/`last_sync_hours_ago` for device-adjacent scores).
4. Refreshes `mv_site_risk_summary`.
5. SUPERADMIN/SUPERVISOR can manually trigger recompute (entity-specific or global) via the risks-recompute endpoint.

**Note:** `risk_entity_type` has no dedicated value for devices/PDAs; the seed data (`risk-008-pda-total-002`) reuses `VEHICLE` for a PDA — a modeling gap worth resolving (either add a `DEVICE` risk_entity_type or keep device risk folded into anomaly/device_status_history rather than risk_scores).

---

## Flux 5 — Reporting

1. Any role requests a report: `type` (OPERATIONAL/FINANCIAL/COMPLIANCE by convention), `format` (PDF/EXCEL/CSV/JSON), `parameters_json` (e.g. `{org_id, period}` or `{region}` per seed examples).
2. Service creates a `reports` row, `status=PENDING`.
3. Async worker generates the file, uploads to the appropriate MinIO bucket, updates `status=READY`, `file_url`, `file_size`, `generated_at`, `expires_at` (from `settings.report.default_expiry_days`, 30 days).
4. User downloads via a pre-signed MinIO URL.
5. On failure: `status=FAILED` (seed example: `rep-0005-compliance-audit`).
6. After `expires_at`: `status=EXPIRED`, file removed from MinIO by a scheduled cleanup job.

---

## Cross-Cutting: Audit Trail

Every sensitive action (create/update/delete/status-transition/assignment) must write an `audit_logs` row via the application layer (only `settings` changes are auto-audited by a DB trigger; everything else is an application responsibility). The `audit_action` enum enumerates the specific actions the system is expected to log — including tour lifecycle events (`TOURNEECREATED`, `TOURNEEASSIGNED`, `TOURNEESENTTOTRANSPORTER`, `TOURNEEACKNOWLEDGED`, `TOURNEESTARTED`, `TOURNEECLOSED`), auth events, and compliance events (`DECLARATIONSUBMITTED`, `RECONCILIATIONVERIFIED`). Any workflow step in this document that isn't already tied to a DB trigger should be treated as an explicit audit-log write point in the service layer.

## Cross-Cutting: PDA Offline-First Sync

LIVREUR users operate PDAs that may be offline in the field:
1. Scans are captured locally, batched with a shared `pda_sync_id`.
2. On reconnect, `POST scans/bulk` uploads the batch.
3. Backend validates each scan's `timestamp`/sequence against expected checkpoint order; inconsistencies are flagged in `conflict_status` (free-text field in the live schema — recommend standardizing values like `NONE`, `SEQUENCE_MISMATCH`, `TIMESTAMP_INVALID`, `DUPLICATE` at the application/validation layer even though the DB column itself is unconstrained `VARCHAR(20)`).
4. Conflicts surface in a livreur-facing sync-status view and, if severe, may themselves become `PDAUNSYNCED`/`SCANOUTOFSEQUENCE` anomalies.
