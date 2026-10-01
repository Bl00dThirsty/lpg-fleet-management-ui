# State Machines

> **Scope:** every finite-state machine the system enforces. Each FSM lists: states, transitions (with who can trigger), side effects, and where the logic lives in code.

The backend owns authoritative state transitions; the front-end reflects them and gates the UI accordingly. When a UI action is dispatched, the front-end state machine in `features/tours/data/tour-machine.ts` (and `features/sites/lib/site-status-machine.ts`) decides whether to surface the button; the API enforces the real transition and returns the new state.

---

## 1. Delivery tour (`TourneeStatus`)

The most complex FSM. Two parallel graphs depending on `execution_mode`.

States (8):
`DRAFT` · `PLANNED` · `PENDINGTRANSPORTERACK` · `ACKNOWLEDGED` · `INPROGRESS` · `CHECKPOINTACTIVE` · `CLOSED` · `CANCELLED`

### INTERNAL mode graph

```
            ┌──────────┐
            │  DRAFT   │
            └────┬─────┘
                 │ marketeur assigns crew+vehicle
                 ▼
            ┌──────────┐
            │ PLANNED  │
            └────┬─────┘
                 │ livreur starts tour on PDA
                 ▼
            ┌────────────┐
            │ INPROGRESS │
            └────┬───────┘
                 │ first checkpoint reached
                 ▼
            ┌─────────────────┐
            │ CHECKPOINTACTIVE│
            └────┬────────────┘
                 │ all checkpoints COMPLETED or SKIPPED, tour closed
                 ▼
            ┌──────────┐
            │  CLOSED  │
            └──────────┘
```

### EXTERNAL mode graph

```
            ┌──────────┐
            │  DRAFT   │
            └────┬─────┘
                 │ marketeur sends to transporter
                 ▼
            ┌──────────────────────┐
            │ PENDINGTRANSPORTERACK│
            └────┬─────────────────┘
                 │ transporter admin assigns own crew+vehicle
                 ▼
            ┌──────────────┐
            │ ACKNOWLEDGED │
            └────┬─────────┘
                 │ livreur starts tour on PDA
                 ▼
            ┌────────────┐
            │ INPROGRESS │
            └────┬───────┘
                 │ first checkpoint reached
                 ▼
            ┌─────────────────┐
            │ CHECKPOINTACTIVE│
            └────┬────────────┘
                 │ all checkpoints COMPLETED or SKIPPED, tour closed
                 ▼
            ┌──────────┐
            │  CLOSED  │
            └──────────┘
```

### Cancellation

`CANCELLED` is reachable from `DRAFT`, `PLANNED`, `PENDINGTRANSPORTERACK`, `ACKNOWLEDGED`. After `INPROGRESS` the tour cannot be cancelled (it must close or be flagged as anomaly).

### Transition rules (from TODO.md §3.1)

| Transition | Pre-conditions | Who triggers |
|---|---|---|
| `DRAFT → PLANNED` (INTERNAL) | `vehicle_id`, `driver_id`, `livreur_user_id` set and all belong to marketeur's org | MARKETEUR |
| `DRAFT → PENDINGTRANSPORTERACK` (EXTERNAL) | `transporter_org_id` set, active in `transporter_contracts`; `vehicle_id`, `driver_id`, `livreur_user_id` all NULL | MARKETEUR |
| `PENDINGTRANSPORTERACK → ACKNOWLEDGED` | Transporter assigns own `vehicle_id`, `driver_id`, `livreur_user_id`, all belonging to transporter's org | TRANSPORTEUR |
| `ACKNOWLEDGED → INPROGRESS` | LIVREUR on PDA taps "Start" | LIVREUR |
| `INPROGRESS → CHECKPOINTACTIVE` | First checkpoint status = `REACHED` | LIVREUR (implicit on scan) |
| `CHECKPOINTACTIVE → CLOSED` | All checkpoints `COMPLETED` or `SKIPPED` | LIVREUR or MARKETEUR |
| `* → CANCELLED` (from DRAFT/PLANNED/PENDINGTRANSPORTERACK/ACKNOWLEDGED) | None | MARKETEUR or TRANSPORTEUR (depending on state) |

### Auto-anomalies driven by the tour FSM

- `TRANSPORTERNOACK` raised automatically if tour stays in `PENDINGTRANSPORTERACK` longer than `tournee.transporter_ack_timeout_hours` (default **4h**). Routed to `TRANSPORT` and `INVESTIGATION`/`ADMIN` notification groups.
- `TOURNEEUNASSIGNEDTOOLONG` raised if no transporter is assigned within `tournee.unassigned_alert_hours` (default **12h**).

### Code

- Front-end machine: `features/tours/data/tour-machine.ts` — exports `TourAction`, `canTransition`, `nextStatuses`, `tourActions`, `validateTour`, `resolveSlaThresholds`, `tourSlaFlags`, `applyAction`.
- DB constraints: `chk_tournee_internal`, `chk_tournee_external` (schema §1.6).

---

## 2. Pickup request (`PickupStatus`)

States (5):
`DRAFT` · `VALIDATED` · `INPROGRESS` · `COMPLETED` · `CANCELLED`

```
       ┌──────────┐
       │  DRAFT   │──────┐
       └────┬─────┘      │
            │ ADMIN or   │ (cancel)
            │ MARKETEUR  │
            │ validates  │
            ▼            │
       ┌──────────┐      │
       │VALIDATED │──────┤
       └────┬─────┘      │
            │ mission    │
            │ starts     │ (cancel)
            ▼            │
       ┌────────────┐    │
       │ INPROGRESS │    │
       └────┬───────┘    │
            │ mission    │
            │ completes  │
            ▼            │
       ┌──────────┐      │
       │COMPLETED │      │
       └──────────┘      │
                        ▼
                  ┌────────────┐
                  │ CANCELLED  │
                  └────────────┘
```

### Rules

| Transition | Pre-conditions | Who triggers |
|---|---|---|
| `DRAFT → VALIDATED` | `requested_quantity` set; vehicles assigned | ADMIN or MARKETEUR (`POST /pickups/:id/validate`) |
| `VALIDATED → INPROGRESS` | None | MARKETEUR (`POST /pickups/:id/start`) — GPS on |
| `INPROGRESS → COMPLETED` | Proof photo uploaded | LIVREUR/MARKETEUR (`POST /pickups/:id/complete`) |
| `DRAFT/VALIDATED → CANCELLED` | None | MARKETEUR |

### Vehicle recommendation

At `DRAFT → VALIDATED` the system suggests vehicles by capacity (`features/pickups/lib/vehicle-recommendation.ts → recommendVehicles`) — VRAC by `max_volume` (TM), Bouteilles by `max_bottle_count` (btl). Only vehicles with valid certificates and active status are suggested.

---

## 3. Site & client-site (`SiteStatus`)

States (6):
`UNASSIGNED` · `ASSIGNED` · `ACTIVE` · `VERIFIED` · `SUSPENDED` · `REJECTED`

```
   ┌────────────┐
   │ UNASSIGNED │  (admin creates site)
   └─────┬──────┘
         │ first delivery (LIVREUR scans)
         │ (geo_point + delivery_count + confidence updated)
         ▼
   ┌────────────┐
   │  ASSIGNED  │
   └─────┬──────┘
         │ auto: confidence_score ≥ geo.confidence_auto_verify_threshold
         │     AND delivery_count ≥ 5
         │     → ACTIVE
         │ OR admin promotes manually
         ▼
   ┌──────────┐
   │  ACTIVE  │
   └─────┬────┘
         │ AGENT/ADMIN physical verification
         │ → POST /sites/:id/verify or /client-sites/:id/verify
         ▼
   ┌──────────┐
   │ VERIFIED │
   └──────────┘

   SUSPENDED or REJECTED reachable from ANY state (ADMIN/AGENT)
```

### Auto-promotion rules

`features/sites/lib/auto-promotion.ts → explainPromotion(PromotionThresholds)`:

| Condition | Outcome |
|---|---|
| `confidence_score < geo.confidence_flag_threshold` (default 30) | stays `UNASSIGNED`, manual review flag |
| `30 ≤ confidence_score < geo.confidence_auto_verify_threshold` (default 80) | `ASSIGNED` |
| `confidence_score ≥ 80` **AND** `delivery_count ≥ 5` | auto-promote to `ACTIVE` |
| ADMIN/AGENT manual override | any transition to `VERIFIED`, `SUSPENDED`, `REJECTED` |

### How confidence is computed

After every scan event, the backend updates the site/client_site row:
- `geo_point` ← cluster centroid of recent scan GPS points
- `delivery_count` ← `delivery_count + 1`
- `geo_confidence_score` ← recomputed (cluster spread × sample size)

### Suspension / rejection

`POST /sites/:id/suspend` (or `/client-sites/:id/suspend`) sets status to `SUSPENDED` or `REJECTED` with a mandatory `verification_reason`. Used when fraud is detected (e.g. site at known siphonnage location).

### Code

- `features/sites/lib/site-status-machine.ts` — `SiteStatus`, `SiteRole`, `SiteRow`, `TransitionRequest`, `TransitionResult`, `canTransition`.
- `features/sites/lib/auto-promotion.ts` — thresholds + `explainPromotion`.

---

## 4. Device (`DeviceStatus`)

States (12):
`UNASSIGNED` · `ASSIGNED` · `INMISSION` · `OFFLINE` · `PENDINGSYNC` · `SYNCING` · `SYNCED` · `SYNCFAILED` · `MAINTENANCE` · `DEPLOYED` · `REMOVED` · `LOST`

### Core mission graph

```
   ┌────────────┐
   │ UNASSIGNED │  (INTEGRATEUR registers device)
   └─────┬──────┘
         │ admin assigns (to user or vehicle)
         ▼
   ┌──────────┐
   │ ASSIGNED │
   └─────┬────┘
         │ tour starts → device is on the mission
         ▼
   ┌────────────┐
   │ INMISSION  │
   └────────────┘
```

### Sideline states (any → any)

```
   OFFLINE           no heartbeat within device.offline_alert_minutes (30)
   PENDINGSYNC       PDA has unsynced scans
   SYNCING           PDA is uploading a batch
   SYNCED            batch upload succeeded
   SYNCFAILED        batch upload failed (conflict_status != NONE)
   MAINTENANCE       under service
   DEPLOYED          registered, ready to be assigned
   REMOVED           decommissioned
   LOST              missing in the field (anomaly: GPSREMOVED, DEVICEOFFLINE)
```

### Triggers

- `INMISSION → OFFLINE`: no heartbeat for ≥ `device.offline_alert_minutes` (default 30min). Triggers `DEVICEOFFLINE` anomaly.
- Any → `LOST`: when a GPS-equipped device is physically removed mid-mission, the server stops receiving positions → `GPSREMOVED` anomaly (INVESTIGATION track, suspected tampering).
- Battery telemetry: DB trigger sets `battery_critical = true` when `battery_level ≤ device.battery_critical_threshold` (default 15). Triggers `BATTERYCRITICAL` anomaly.

### `device_status_history` (TimescaleDB hypertable)

Every status change writes a row with `old_status`, `new_status`, `reason`, `changed_by`, `geo_point`, `timestamp`. Append-only, retained per `audit.retention_years` (5).

---

## 5. RFID tag (`RfidTagStatus`)

States (6):
`AVAILABLE` · `ASSIGNEDTOBOTTLE` · `INTRANSITOUT` · `INTRANSITIN` · `LOST` · `BLOCKED`

```
   ┌──────────┐    link to bottle    ┌───────────────────┐
   │AVAILABLE │─────────────────────▶│ ASSIGNEDTOBOTTLE  │
   └──────────┘                      └─────┬─────────────┘
                                           │ scan OUT at depot
                                           ▼
                                    ┌───────────────┐
                                    │ INTRANSITOUT  │
                                    └─────┬─────────┘
                                          │ scan IN at client
                                          ▼
                                    ┌───────────────┐
                                    │ INTRANSITIN   │
                                    └─────┬─────────┘
                                          │ bottle returned to depot
                                          ▼
                                    ┌──────────┐
                                    │AVAILABLE │
                                    └──────────┘
   LOST and BLOCKED reachable from any state (admin/agent)
```

### DB invariant

`chk_rfid_location`: exactly one of `current_site_id` / `current_client_site_id` is set when not in transit (`INTRANSITOUT` / `INTRANSITIN`).

---

## 6. Declaration → Reconciliation → Redressement

This is a **three-table pipeline** with state on each table, but the values flow forward.

### `Declaration` (4 states)

```
   ┌──────────┐
   │  DRAFT   │  marketeur creates
   └────┬─────┘
        │ marketeur submits
        ▼
   ┌────────────┐
   │ SUBMITTED │
   └────┬───────┘
        │ admin/agent triggers reconciliation
        ▼
   ┌────────────┐
   │ RECONCILED │  volume_gap computed
   └────┬───────┘
        │ if gap > tolerance → flagged → dispute possible
        ▼
   ┌──────────┐
   │ DISPUTED │
   └──────────┘
```

### `Reconciliation` (3 states)

```
   ┌──────────┐
   │ PENDING  │  volume_gap computed by DB trigger
   └────┬─────┘
        │ agent verifies
        ▼
   ┌──────────┐
   │ VERIFIED │
   └────┬─────┘
        │ admin issues redressement
        ▼
   ┌──────────────────────┐
   │ REDRESSEMENTAPPLIED  │
   └──────────────────────┘
```

### `Redressement` (3 states)

```
   ┌──────────┐
   │  ISSUED  │  admin issues (status=ISSUED)
   └────┬─────┘
        │ admin marks paid
        ▼
   ┌──────────┐
   │   PAID   │  transaction_ref set
   └──────────┘

        OR admin waives
        ▼
   ┌──────────┐
   │  WAIVED  │  waive_reason set
   └──────────┘
```

### Tolerance check

`features/reconciliations/data/reconciliation.ts → computeReconciliation`:

```ts
gap_percentage = abs(volume_gap) / declared_volume × 100

if (gap_percentage > settings.reconciliation.volume_gap_tolerance_percent) {
  // default 2.5%
  // flag for review → status flagged, anomaly candidate
}
```

### Code

- `features/reconciliations/data/reconciliation.ts` — pure math (`computeReconciliation`, `sumTrackedVolume`, `reconciliationFromDeclaration`).
- DB trigger: `compute_reconciliation_gap` auto-recalculates `volume_gap` whenever `tracked_volume` changes.
- DB constraint: `chk_settings_numeric_check` (settings integrity).

---

## 7. Checkpoint (`CheckpointStatus`)

States (4):
`PENDING` · `REACHED` · `COMPLETED` · `SKIPPED`

```
   ┌──────────┐
   │ PENDING  │  tour starts, checkpoint not yet visited
   └────┬─────┘
        │ livreur reaches stop (GPS captured)
        ▼
   ┌──────────┐
   │ REACHED  │
   └────┬─────┘
        │ scans done (or VRAC meter recorded)
        ▼
   ┌───────────┐
   │ COMPLETED │
   └───────────┘

        OR livreur cannot visit (e.g. closed client site)
        skip_reason mandatory
        ▼
   ┌──────────┐
   │ SKIPPED  │
   └──────────┘
```

### Rules

- A checkpoint auto-completes when expected scans match, or the livreur manually completes it.
- If the livreur marks `SKIPPED`, `skip_reason` is **mandatory** (DB constraint + API validation).
- Skipping a checkpoint is reversible: agent can mark `COMPLETED` later if the stop was actually visited.

### DB constraint

`chk_checkpoint_exclusive` — exactly one of `site_id` / `client_site_id` is NOT NULL.

---

## 8. Anomaly (`AnomalyStatus`)

States (4):
`NOUVEAU` · `ENCOURS` · `RESOLU` · `FERME`

```
   ┌──────────┐
   │  NOUVEAU │  detected, routed to notification group
   └────┬─────┘
        │ someone in the group acknowledges
        ▼
   ┌──────────┐
   │ ENCOURS  │
   └────┬─────┘
        │ resolver marks resolved (resolution_notes mandatory)
        ▼
   ┌──────────┐
   │  RESOLU  │  (record stays, audit complete)
   └────┬─────┘
        │ supervisor closes the file
        ▼
   ┌──────────┐
   │  FERME   │
   └──────────┘
```

### Anomaly assignment history

Reassignment does not change `status`. A new row in `anomaly_assignments` records each handoff. Full history is preserved.

### Auto-creation

Many anomaly types are created by the system (not by a user). Examples:
- `BATTERYCRITICAL` (DB trigger on `devices.battery_level`)
- `TRANSPORTERNOACK` (cron after 4h in PENDINGTRANSPORTERACK)
- `TOURNEEUNASSIGNEDTOOLONG` (cron after 12h with no transporter)
- `GPSREMOVED` (signal lost mid-mission)
- `CHECKPOINTMISSED` (tour closed with PENDING checkpoints)
- `SCANOUTOFSEQUENCE` (PDA sync detected out-of-order timestamps)

---

## 9. State-machine cheat-sheet

| Machine | States count | Critical transitions | Code location |
|---|---|---|---|
| Tournee | 8 | `DRAFT→PLANNED/PENDINGTRANSPORTERACK`, `PENDINGTRANSPORTERACK→ACKNOWLEDGED`, `INTERNAL/EXTERNAL` divergence | `features/tours/data/tour-machine.ts` |
| Pickup | 5 | `DRAFT→VALIDATED` (vehicle recommendation), `INPROGRESS→COMPLETED` (proof photo) | `features/pickups/` |
| Site / ClientSite | 6 | `ASSIGNED→ACTIVE` (auto-promotion by confidence + delivery count) | `features/sites/lib/site-status-machine.ts` |
| Device | 12 | `ASSIGNED→INMISSION` (tour start), `INMISSION→OFFLINE` (no heartbeat) | `features/devices/` |
| RFID | 6 | `ASSIGNEDTOBOTTLE→INTRANSITOUT→INTRANSITIN→AVAILABLE` | `features/rfid-tags/` |
| Checkpoint | 4 | `PENDING→REACHED` (GPS capture), `*→SKIPPED` (mandatory reason) | `features/tours/` |
| Declaration | 4 | `SUBMITTED→RECONCILED` (admin/agent triggers) | `features/declarations/` |
| Reconciliation | 3 | `PENDING→VERIFIED` (agent), `VERIFIED→REDRESSEMENTAPPLIED` (admin) | `features/reconciliations/` |
| Redressement | 3 | `ISSUED→PAID` (transaction_ref), `ISSUED→WAIVED` (waive_reason) | `features/redressements/` |
| Anomaly | 4 | `NOUVEAU→ENCOURS→RESOLU→FERME` | `features/anomalies/` |
