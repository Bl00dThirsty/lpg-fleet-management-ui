<!-- generated-by: gsd-doc-writer -->
# 03 — State machines

The exact enum vocabulary belongs to [`../../../csph_gpl_schema_v6_2.sql`](../../../csph_gpl_schema_v6_2.sql). The maintained code-facing version is [`../state-machines.md`](../state-machines.md). This scaffold keeps the phase sequence and labels application-only guards clearly.

## Delivery tour

```text
INTERNAL:  DRAFT → PLANNED → INPROGRESS → CHECKPOINTACTIVE → CLOSED
EXTERNAL:  DRAFT → PENDINGTRANSPORTERACK → ACKNOWLEDGED → INPROGRESS → CHECKPOINTACTIVE → CLOSED
```

`CANCELLED` is allowed only from the pre-start states documented by the tour machine. INTERNAL requires vehicle, driver, and livreur references. EXTERNAL requires a transporter and is eligible only when the derived contract status is `ACTIVE`; the transporter acknowledgment assigns its own vehicle, driver, and livreur before `ACKNOWLEDGED`. The pure frontend machine lives in `features/tours/data/tour-machine.ts`; it projects actions and SLA flags, while the backend is authoritative.

SLA flags use `tournee.transporter_ack_timeout_hours` and `tournee.unassigned_alert_hours`, not embedded numbers. The tour builder applies the current user scope.

## Pickup

`DRAFT → VALIDATED → INPROGRESS → COMPLETED`; `CANCELLED` is allowed before execution. The SQL stores `status`, `approved_quantity`, and site FKs, but no proof-photo column. Do not claim that the schema stores a MinIO proof URL for pickups.

## Site and client site

`UNASSIGNED → ASSIGNED → ACTIVE → VERIFIED`; `SUSPENDED` and `REJECTED` are terminal administrative states. Geo thresholds and delivery-count rules are settings/application concerns. The v6.2 trigger is a database signal; it does not by itself prove the full application lifecycle. The frontend site builder and status machine must use the current scope.

## Device and RFID

Device states are the twelve SQL values: `UNASSIGNED`, `ASSIGNED`, `INMISSION`, `OFFLINE`, `PENDINGSYNC`, `SYNCING`, `SYNCED`, `SYNCFAILED`, `MAINTENANCE`, `DEPLOYED`, `REMOVED`, `LOST`. Battery and offline decisions use `device.battery_critical_threshold` and `device.offline_alert_minutes`; the UI shows sync and maintenance states without inventing a new enum.

RFID states are `AVAILABLE`, `ASSIGNEDTOBOTTLE`, `INTRANSITOUT`, `INTRANSITIN`, `LOST`, and `BLOCKED`. The SQL location check allows both location FKs to be null, or exactly one to be set; do not require a location while in transit.

## Compliance and notifications

- Declaration: `DRAFT → SUBMITTED → RECONCILED` or `DISPUTED`.
- Reconciliation: `PENDING → VERIFIED → REDRESSEMENTAPPLIED`.
- Redressement: `ISSUED → PAID` or `WAIVED`.
- Anomaly: `NOUVEAU → ENCOURS → RESOLU → FERME`.
- Report: `PENDING → GENERATING → READY`, with `FAILED` or `EXPIRED` terminal alternatives.

The SQL has no `gap_percentage`, `redressement_due_days` column, `currency`, `waive_reason`, or escalation columns in the tables where older docs claim them. Compute derived values in application code or add an explicit migration; do not silently document columns that are absent.

## UI behavior

Transitions control which actions are visible. Mutations are pending-aware, query-invalidated, and produce one outcome toast. Loading, error, empty, stale, and offline/sync states are explicit. Animations use `usePrefersReducedMotion`; labels are FR/EN translated.
