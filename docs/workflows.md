# Workflows

> **Scope:** the eleven end-to-end interaction sequences that make the system useful. Each workflow lists the actor, the actions in order, the state transitions, and which settings/endpoints are touched.

Source: TODO.md §5. Code locations listed where the workflow is implemented in the front-end.

---

## 1. Organization & user onboarding

**Goal:** create a new oil company / transporter / depot, give it an admin, and onboard staff.

```
1. SUPERADMIN creates the organization
   POST /organizations      status: REGULATEUR | DEPOT | MARKETEUR | TRANSPORTEUR | CLIENT

2. SUPERADMIN or ADMIN creates the first user for that org
   POST /users              system_role = ADMIN or MARKETEUR (or appropriate)

3. If user's system_role ∈ mfa.enforced_for_roles
   (default: ["ADMIN","SUPERADMIN","SUPERVISOR"])
      → redirect to MFA setup before first sensitive action
   POST /auth/mfa/setup     TOTP | SMS | EMAIL
   POST /auth/mfa/verify

4. The org owner (e.g. MARKETEUR admin) creates custom roles
   POST /custom-roles       { name, permissions_json, site_scoped?, site_id? }

5. Staff onboarded
   POST /users              create user
   POST /users/:id/assign-role
   POST /users/:id/assign-site
   POST /users/:id/reset-password   (initial password delivery)

6. Effective permissions computed at request time
   system_role grants  ∪  custom_role grants
   AND filtered by  user_site_assignments
   GET  /users/:id/permissions
```

**Hierarchy rule:** a user can only create subordinates at or below their own tier (`canCreate(actor, target)`). See [permissions-and-rbac.md §2](./permissions-and-rbac.md#the-eight-roles).

**Code:** `features/users/`, `features/custom-roles/`, `features/organizations/`.

---

## 2. Site geo-assignment & verification

**Goal:** create a site, build confidence in its GPS location via deliveries, verify it.

```
1. MARKETEUR creates the site (status = UNASSIGNED)
   POST /sites              { name, address, region, functions[], geo_point, ... }
   POST /client-sites       (same shape, for a commercial buyer)

2. LIVREUR delivers to the site using PDA
   POST /scans              includes GPS point, RFID or meter reading
   → Backend updates sites.geo_point  (cluster centroid)
                sites.delivery_count  (++)
                sites.geo_confidence_score  (recomputed)

3. Auto-promotion based on thresholds (settings-driven)
   geo.confidence_flag_threshold (30)        → stays UNASSIGNED, flagged
   geo.confidence_auto_verify_threshold (80) → ASSIGNED
   AND delivery_count ≥ 5                    → ACTIVE
   (See features/sites/lib/auto-promotion.ts)

4. AGENT visits the site monthly
   POST /client-sites/:id/verify
      → status = VERIFIED, verified_by, verified_at, verification_reason

5. If fraud detected
   POST /client-sites/:id/suspend
      → status = SUSPENDED | REJECTED
      + verification_reason mandatory
      → may raise an investigation anomaly
```

**Code:** `features/sites/`, `features/sites/lib/auto-promotion.ts`, `features/visits/` (AGENT field reports).

---

## 3. Vehicle & certificate registration

**Goal:** register a truck and (for VRAC) upload its certificate de jaugeage.

```
1. TRANSPORTEUR or MARKETEUR submits the vehicle
   POST /vehicles           { license_plate, type, max_volume | max_bottle_count, ... }

2. If type = VRAC, certificate_number, certificate_expiry_at, certificate_url are MANDATORY
   Upload PDF to MinIO bucket csph-certificates
   POST /vehicles/:id/certificate    (multipart)

3. Daily cron scans certificate_expiry_at
   If approaching or passed:
      → create VEHICLECERTIFICATEEXPIRED anomaly (audit action enum)
      → block vehicle from tour assignment

4. Certificate viewable
   GET /vehicles/:id/certificate     (MinIO pre-signed URL)
```

**DB invariants:** `chk_vehicle_capacity` (exactly one of `max_volume` / `max_bottle_count`); `chk_vehicle_vrac_cert` (VRAC requires cert fields).

**Code:** `features/trucks/`, `features/transporters/data/transporters-crud.ts`, `features/certificates/`.

---

## 4. Device lifecycle (Yabby3 GPS)

**Goal:** register an IoT device, configure it, assign it, and keep it healthy.

```
1. INTEGRATEUR registers the device
   POST /devices
      device_type: GPS | PDA | RFIDREADER
      For GPS: metadata_json MUST contain "imei" (chk_device_gps_imei)
      Yabby3-specific config in metadata_json: tracking_mode, heartbeat_interval,
                                                   accelerometer_sensitivity

2. ADMIN / MARKETEUR / TRANSPORTEUR assigns the device
   POST /devices/:id/assign
      assigned_to_user_id OR assigned_to_vehicle_id
      → status = ASSIGNED

3. On tour start → status = INMISSION
   vehicle_positions hypertable stream begins
      capture interval from settings.gps.capture_interval_minutes (60min default)
   Every status change → device_status_history row

4. Battery telemetry
   DB trigger: if battery_level ≤ device.battery_critical_threshold (15)
      → devices.battery_critical = true
      → raise BATTERYCRITICAL anomaly
      → route to TECHNICAL notification group

5. No heartbeat within device.offline_alert_minutes (30)
   → DEVICEOFFLINE anomaly

6. GPS signal lost mid-mission
   → GPSREMOVED anomaly (INVESTIGATION track, suspected tampering)

7. PDA offline sync
   Livreur batches scans locally, then:
   POST /scans/bulk   { pda_sync_id, scans: [...] }
   Backend flags conflict_status per scan:
      NONE | SEQUENCE_MISMATCH | TIMESTAMP_INVALID | DUPLICATE
```

**Code:** `features/devices/`, `features/gps-config/`, `features/device-health/`, `features/device-assignments/`, `features/maintenance/`, `features/firmware/`.

---

## 5. Flux 1 — Approvisionnement

**Goal:** move product from a depot to another site.

```
1. MARKETEUR creates a pickup request
   POST /pickups            { source_site_id, destination_site_id, requested_quantity, ... }
      status = DRAFT

2. System recommends vehicles
   features/pickups/lib/vehicle-recommendation.ts → recommendVehicles
   Filters: capacity (TM or btl), active, valid certificate

3. MARKETEUR assigns vehicles
   POST /pickups/:id/assign-vehicles   { vehicle_ids: [...] }

4. ADMIN or MARKETEUR validates
   POST /pickups/:id/validate
      { approved_quantity, ... }
   → status = VALIDATED, validated_by, validated_at

5. MARKETEUR starts the mission
   POST /pickups/:id/start
   → status = INPROGRESS, GPS tracking on

6. LIVREUR / MARKETEUR completes
   POST /pickups/:id/complete   (multipart, proof photo)
   → status = COMPLETED, proof_photo_url in MinIO bucket csph-proofs
```

**Code:** `features/pickups/`, `features/pickup-tracking/`, `features/pickups/lib/pickup-wizard-schema.ts`, `features/pickups/lib/vehicle-recommendation.ts`.

---

## 6. Flux 2a — INTERNAL delivery tour

**Goal:** marketeur crew delivers using marketeur's own vehicle/driver/livreur.

```
1. MARKETEUR creates the tour
   POST /tours
   {
     execution_mode: INTERNAL,
     vehicle_id, driver_id, livreur_user_id,   ← all MANDATORY, must belong to marketeur org
     type: VRAC | BOUTEILLES50KG,
     checkpoints: [
       { site_id | client_site_id, sequence, expected_quantity }
     ]
   }
   → status = PLANNED

2. LIVREUR starts the tour on PDA
   POST /tours/:id/start
   → status = INPROGRESS

3. At each checkpoint:
   a) LIVREUR reaches the stop
      POST /checkpoints/:id/reach
      → GPS captured, status = REACHED
   b) LIVREUR scans bottles or records the meter
      POST /scans
        IN:  empty bottle return   (rfid_tag_id)
        OUT: full bottle delivery  (rfid_tag_id)
        VRAC: meter_reading (TM)
   c) Checkpoint auto-completes when expected scans match
      OR LIVREUR manually completes:
        POST /checkpoints/:id/complete
   d) If impossible to visit:
        POST /checkpoints/:id/skip
        skip_reason MANDATORY
        → status = SKIPPED

4. LIVREUR closes the tour
   POST /tours/:id/close
   → status = CLOSED
   → delivered_quantity computed from scan totals:
        VRAC:      SUM(meter_reading)
        Bouteilles: COUNT(OUT) - COUNT(IN)
```

**Code:** `features/tours/`, `features/tours/data/tour-machine.ts`, `features/transporters/data/transporter-tours.ts`.

---

## 7. Flux 2b — EXTERNAL delivery tour (transporter acknowledgment)

**Goal:** marketeur creates the tour but a transporter executes it. Includes the ack SLA.

```
1. MARKETEUR creates the tour
   POST /tours
   {
     execution_mode: EXTERNAL,
     transporter_org_id,            ← must be active in transporter_contracts
     vehicle_id, driver_id, livreur_user_id ← all NULL at this point
     ...
   }
   → status = PENDINGTRANSPORTERACK

2. System sends notification to TRANSPORT group
   (WebSocket + persisted)
   POST /notifications

3. TRANSPORTEUR admin views pending tours
   GET /tours?status=PENDINGTRANSPORTERACK&transporter_org_id=...

4. TRANSPORTEUR acknowledges
   POST /tours/:id/acknowledge
   {
     vehicle_id, driver_id, livreur_user_id  ← all belonging to transporter's org
   }
   → assigned_by_transporter_user_id, transporter_assigned_at set
   → status = ACKNOWLEDGED

5. Auto-anomalies (cron / system):
   a) tournee.transporter_ack_timeout_hours (4h default) in PENDINGTRANSPORTERACK
      → TRANSPORTERNOACK anomaly
      → route to TRANSPORT + INVESTIGATION/ADMIN groups
   b) tournee.unassigned_alert_hours (12h) with no transporter
      → TOURNEEUNASSIGNEDTOOLONG anomaly

6. From ACKNOWLEDGED the flow is identical to INTERNAL
   (start → checkpoints → scans → close)
```

**Code:** `features/tours/`, `features/transporters/`, `features/transporter-contracts/`, `features/anomalies/`.

---

## 8. Declaration → Reconciliation → Redressement

**Goal:** marketeur's monthly self-report is reconciled against tracked volume; gaps above tolerance trigger financial redressement.

```
1. MARKETEUR submits the declaration
   POST /declarations        { period_start, period_end, declared_volume }
   → status = DRAFT
   POST /declarations/:id/submit
   → status = SUBMITTED

2. AGENT or ADMIN triggers reconciliation
   POST /declarations/:id/reconcile
   → backend sums scan_events (OUT − IN for bottles, meter_reading for VRAC)
     for that marketeur / period
   → writes reconciliations.tracked_volume

3. DB trigger compute_reconciliation_gap
   → volume_gap = declared_volume − tracked_volume
   → gap_percentage = abs(volume_gap) / declared_volume × 100

4. Backend computes subsidy_impact using the current subsidy rate

5. If |gap_percentage| > settings.reconciliation.volume_gap_tolerance_percent
   (default 2.5%):
      → reconciliation flagged for review

6. AGENT verifies
   PATCH /reconciliations/:id/verify
   → status = VERIFIED, verified_by, verified_at

7. ADMIN issues redressement
   POST /redressements        { reconciliation_id, amount, currency='XAF', due_date }
   → status = ISSUED
   → reconciliation.status = REDRESSEMENTAPPLIED

8. ADMIN marks paid
   PATCH /redressements/:id/mark-paid
   { transaction_ref }
   → status = PAID

   OR admin waives
   PATCH /redressements/:id/waive
   { waive_reason }
   → status = WAIVED
```

**Code:** `features/declarations/`, `features/reconciliations/`, `features/redressements/`, `features/reconciliations/data/reconciliation.ts`.

---

## 9. Anomaly detection & dual-track routing

**Goal:** every detected anomaly reaches the right people and is resolved.

```
1. Detection
   - DB trigger (e.g. battery_critical)
   - Cron (TRANSPORTERNOACK, TOURNEEUNASSIGNEDTOOLONG)
   - Real-time event processor (DEVIATIONROUTE, CHECKPOINTMISSED, ...)
   - User action (SITESUSPENDED, anomaly manually opened)

2. Anomaly row created
   { type, category (INVESTIGATION | TECHNICAL), severity, entity_type,
     entity_id, evidence_json snapshot, status = NOUVEAU }

3. Routing
   Look up notification_rules for (anomaly_type, min_severity)
   → target_group_id
   → set anomalies.assigned_to_group
   → push via WebSocket "anomaly:new" to all group members
   → create anomaly_assignments row (initial)

4. Track handling
   INVESTIGATION track:  AGENT  → /agent/anomalies-investigation
                          SUPERADMIN → /super-admin/anomalies/investigation
   TECHNICAL track:      SUPERVISOR → /supervisor/anomalies-technical
                          SUPERADMIN → /super-admin/anomalies/technical

5. Reassignment
   POST /anomalies/:id/assign   { assigned_to_user_id, notes }
   → new anomaly_assignments row (history retained)

6. Resolution
   POST /anomalies/:id/resolve
   { resolution_notes }
   → status = RESOLU, resolved_by, resolved_at
```

**Code:** `features/anomalies/`, `features/notification-groups/`, `features/notification-rules/`, `features/alerts/`.

---

## 10. Risk scoring

**Goal:** every entity gets a rolling 30-day risk score, recomputed on events and on a nightly batch.

```
1. Event queue recompute job
   Triggers:
     - tour closed
     - declaration submitted
     - PDA sync failure
     - anomaly created
   POST /risks/recompute   (manual) or background worker

2. Daily batch at 02:00
   Rolling 30-day score for every active entity
   (MARKETEUR, TRANSPORTEUR, LIVREUR, SITE, CLIENTSITE, TOURNEE, CLIENT, VEHICLE)

3. Write risk_scores row
   { entity_type, entity_id, score (0–100), level (FAIBLE..CRITIQUEEXTREME),
     period_start, period_end, model_version, details_json (explainable features),
     computed_at }

4. Refresh materialized view mv_site_risk_summary

5. SUPERADMIN / SUPERVISOR can manually trigger
   /supervisor/recompute or /super-admin/risks
   POST /risks/recompute   { entity_type?, entity_id? }
```

**Code:** `features/risk-scores/`, `features/recompute/`, `features/risks/`.

---

## 11. Reporting

**Goal:** async report generation, MinIO storage, expiry.

```
1. User requests a report
   POST /reports
   { type (OPERATIONAL|FINANCIAL|COMPLIANCE),
     format (PDF|EXCEL|CSV|JSON),
     parameters_json }
   → reports.status = PENDING

2. Async worker
   - Generates the file
   - Uploads to MinIO bucket csph-reports
   - Sets status = READY, file_url, expires_at
     (expires_at = now + report.default_expiry_days, default 30)

3. User downloads
   GET /reports/:id/download
   → MinIO pre-signed URL (time-limited)

4. After expiry
   - Daily cron: status = EXPIRED, file deleted from MinIO
```

**Code:** `features/reports/`, `features/finance/`.

---

## 12. Quick navigation

| Workflow | Primary actor | Page entry | State machines |
|---|---|---|---|
| 1. Onboarding | SUPERADMIN | `/super-admin/organizations`, `/super-admin/users` | — |
| 2. Site geo-verification | AGENT, MARKETEUR | `/agent/client-sites`, `/marketeur/clients` | Site |
| 3. Vehicle + certificate | TRANSPORTEUR, MARKETEUR | `/transporters/vehicles`, `/marketeur/vehicles` | — |
| 4. Device lifecycle | INTEGRATEUR, ADMIN | `/integrateur/devices`, `/integrateur/gps-config` | Device |
| 5. Flux 1 | MARKETEUR | `/marketeur/pickups`, `/marketeur/pickup-tracking` | Pickup |
| 6. Flux 2a INTERNAL | MARKETEUR, LIVREUR | `/marketeur/tours-internal`, `/livreur/missions` | Tournee (INTERNAL) |
| 7. Flux 2b EXTERNAL | MARKETEUR, TRANSPORTEUR, LIVREUR | `/marketeur/tours-external`, `/transporters/tours-pending` | Tournee (EXTERNAL) |
| 8. Declaration → Reconciliation → Redressement | MARKETEUR, AGENT, ADMIN | `/marketeur/declarations`, `/agent/reconciliations`, `/super-admin/redressements` | Declaration, Reconciliation, Redressement |
| 9. Anomalies | AGENT, SUPERVISOR | `/agent/anomalies-investigation`, `/supervisor/anomalies-technical` | Anomaly |
| 10. Risk scoring | SUPERVISOR, SUPERADMIN | `/supervisor/recompute`, `/super-admin/risks` | — |
| 11. Reporting | All roles (own scope) | `/<role>/reports` | Report |
