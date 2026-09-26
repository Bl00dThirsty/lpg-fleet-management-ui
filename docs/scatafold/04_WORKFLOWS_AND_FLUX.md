<!-- generated-by: gsd-doc-writer -->
# 04 — Workflows and business flux

These flows are implementation sequences over the schema and the current frontend. They do not create backend endpoints or replace [`../workflows.md`](../workflows.md).

## Flux 0 — onboarding and access

Create an organization, then a user within the permitted hierarchy. The service applies `users.org_id` and site assignments. Active custom roles add or refine permissions; MFA is driven by `mfa.enforced_for_roles`. The frontend uses static routes and a scoped user session; fake mode may select a curated `AUTH_FIXTURES` profile, which is not production authentication.

## Flux 1 — pickup

A MARKETEUR creates a pickup for distinct `source_site_id` and `destination_site_id` with a positive requested quantity. Vehicle assignment uses the `pickup_request_vehicles` join and the scoped fleet. Validation sets the approved quantity and moves the lifecycle to `VALIDATED`; execution is `INPROGRESS`; completion is `COMPLETED`. The v6.2 pickup table has no proof-photo column, so proof storage cannot be asserted from the schema.

## Flux 2a — INTERNAL tour

The MARKETEUR creates an INTERNAL tour with its own vehicle, driver, and livreur, then creates ordered checkpoints. Each checkpoint references exactly one `site_id` or `client_site_id`. The LIVREUR starts the tour, reaches checkpoints, records scans, and completes or skips them. The exact `tournee_status` sequence is in [`03_STATE_MACHINES.md`](03_STATE_MACHINES.md). `scan_events` connects to a tour through `checkpoints.tournee_id`; it has no `tour_id` column.

## Flux 2b — EXTERNAL tour

The MARKETEUR selects a transporter with a derived `ACTIVE` contract. The tour enters `PENDINGTRANSPORTERACK`. The TRANSPORTEUR acknowledges only with its own vehicle, driver, and livreur, producing `ACKNOWLEDGED`; execution then joins the INTERNAL checkpoint path. `contracts.*` permissions and site/organization scope are enforced at every layer. The contract status is derived from proof, acceptance, activity, dates, and `deleted_at`; `is_active` alone is insufficient.

## Flux 3 — declarations and redressement

A MARKETEUR submits a declaration for a valid period. Reconciliation aggregates the period's tracked volume from the relevant scan stream, writes `tracked_volume`, and lets the database calculate `volume_gap = declared_volume - tracked_volume`. The app computes percentage, subsidy impact, and tolerance decisions; `reconciliation.volume_gap_tolerance_percent` is the threshold. Verification and redressement transitions must follow the schema and the resolved product rule; the SQL does not define a stored gap percentage or a redressement due-date setting.

## Flux 4 — anomalies and risk

Detection may be a database signal, scheduler, ingestion event, or user observation. The service writes the exact `anomaly_type`, category, severity, polymorphic entity, evidence, and enum group. Notification rules resolve a concrete group. Assignment history is append-only. Risk scores use the eight SQL entity types; device risk has no `DEVICE` entity type, so the fixture use of `VEHICLE` for a PDA is a data-modeling issue, not a new enum.

## Flux 5 — reports and notifications

Reports are asynchronous resources with `PENDING`, `GENERATING`, `READY`, `FAILED`, and `EXPIRED` states. Files are stored in MinIO and referenced by URL. WebSocket events such as `tour:update`, `anomaly:new`, and `device:telemetry` invalidate matching query keys. The notification center and sound respect user preferences.

## Cross-cutting UI rules

Every operational data builder uses the current scope. Forms use react-hook-form/Zod/shadcn Form with inline `FormMessage` errors. Mutations use one Sonner outcome, pending state, cache invalidation, and optimistic rollback where low risk. FR/EN labels, query loading/error/empty/stale states, and reduced motion are required concerns.
