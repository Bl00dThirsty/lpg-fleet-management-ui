<!-- generated-by: gsd-doc-writer -->
# State Machines

The SQL enums are authoritative. The frontend machines validate which action buttons to expose; the eventual backend remains authoritative for accepted transitions.

## Delivery tour

States: `DRAFT`, `PLANNED`, `PENDINGTRANSPORTERACK`, `ACKNOWLEDGED`, `INPROGRESS`, `CHECKPOINTACTIVE`, `CLOSED`, `CANCELLED`.

```text
INTERNAL:   DRAFT → PLANNED → INPROGRESS → CHECKPOINTACTIVE → CLOSED
EXTERNAL:   DRAFT → PENDINGTRANSPORTERACK → ACKNOWLEDGED → INPROGRESS → CHECKPOINTACTIVE → CLOSED
Early states may branch to CANCELLED.
```

`INTERNAL` requires the marketeur's own crew. `EXTERNAL` starts without a crew, requires an active contract, and the transporter must assign crew from its own organization. `LIVREUR` starts and closes execution. The implementation is `features/tours/data/tour-machine.ts`; no step may be skipped.

Settings drive acknowledgement and unassigned-tour alerts: `tournee.transporter_ack_timeout_hours` and `tournee.unassigned_alert_hours`.

## Pickup request

States: `DRAFT`, `VALIDATED`, `INPROGRESS`, `COMPLETED`, `CANCELLED`.

```text
DRAFT → VALIDATED → INPROGRESS → COMPLETED
  └──────────────→ CANCELLED
```

Validation requires a quantity and appropriate vehicle assignment. Completion requires a proof URL from the storage boundary. Capacity recommendations use TM for VRAC and btl for bottles.

## Site and client site

States: `UNASSIGNED`, `ASSIGNED`, `ACTIVE`, `VERIFIED`, `SUSPENDED`, `REJECTED`.

```text
UNASSIGNED → ASSIGNED → ACTIVE → VERIFIED
                         ↓
              SUSPENDED / REJECTED
```

Geo promotion uses `geo.confidence_flag_threshold` and `geo.confidence_auto_verify_threshold`, plus delivery evidence. The same enum is used for operational `sites` and commercial `client_sites`, but the tables and data scopes are different.

## Device

States: `UNASSIGNED`, `ASSIGNED`, `INMISSION`, `OFFLINE`, `PENDINGSYNC`, `SYNCING`, `SYNCED`, `SYNCFAILED`, `MAINTENANCE`, `DEPLOYED`, `REMOVED`, `LOST`.

Registration leads to assignment and mission use; telemetry can produce offline/sync/maintenance/removed/lost conditions. Battery and offline alerts are settings-driven.

## RFID tag

States: `AVAILABLE`, `ASSIGNEDTOBOTTLE`, `INTRANSITOUT`, `INTRANSITIN`, `LOST`, `BLOCKED`.

A tag is associated with an operational site or a client site, never both simultaneously. Scan direction is `IN` or `OUT`.

## Declaration, reconciliation, redressement

- Declaration: `DRAFT → SUBMITTED → RECONCILED → DISPUTED`.
- Reconciliation: `PENDING → VERIFIED → REDRESSEMENTAPPLIED`.
- Redressement: `ISSUED → PAID` or `ISSUED → WAIVED`.
- The reconciliation tolerance is `reconciliation.volume_gap_tolerance_percent`.

## Async resources

Reports and risk recomputation move through backend processing and are polled by the frontend until `READY`, `FAILED`, or `EXPIRED`. The UI must show pending progress and freshness rather than treating a request as synchronously complete.
