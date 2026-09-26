<!-- generated-by: gsd-doc-writer -->
# Workflows

These are the implemented frontend interaction contracts. Endpoint names are API-client contracts; the backend itself is not in this repository.

## Organization and user onboarding

1. An authorized administrator creates an organization through the organization feature.
2. The organization owner creates users and assigns `system_role`, custom roles, and site assignments.
3. The UI checks `canCreate` so a user can only create roles at or below their hierarchy tier.
4. If the role appears in `mfa.enforced_for_roles`, sensitive navigation is gated behind MFA setup.
5. Effective permissions combine role and custom-role grants and are then scope-filtered.

Feature areas: `features/organizations`, `features/users`, `features/custom-roles`.

## Operational site verification

1. A site is created as an operational `sites` row with PostGIS-shaped coordinates, functions, and `UNASSIGNED` status.
2. Delivery/scan activity supplies evidence for geo confidence and delivery count.
3. Geo thresholds come from settings; the UI explains the result and flags low-confidence records.
4. An authorized agent/admin verifies, suspends, or rejects the site with a reason.
5. Operational `sites` and commercial `client_sites` remain separate resources.

The canonical fixture includes 204 `UNASSIGNED`/unverified operational sites, not 204 `client_sites`.

## Vehicle and certificate lifecycle

1. A permitted organization creates a `VRAC` or `BOUTEILLES50KG` vehicle.
2. VRAC capacity is TM; bottle capacity is btl. The schema requires the corresponding certificate fields for VRAC.
3. Certificate files are uploaded through the storage boundary; the application keeps only the returned URL.
4. Certificate expiry is surfaced as a fleet/compliance condition. The backend is responsible for authoritative blocking or anomaly generation.

## Device lifecycle

1. An integrator registers GPS, PDA, or RFID reader metadata.
2. An authorized actor assigns a device to a user or vehicle.
3. Telemetry updates device state, battery, and last-seen information.
4. Settings drive critical battery and offline thresholds.
5. `device:telemetry` invalidates device and map queries.

## Flux 1 — approvisionnement

1. MARKETEUR creates a pickup request with source/destination sites and TM or btl quantity.
2. The pickup wizard recommends active vehicles with the correct capacity; pickup source functions are settings-driven.
3. An authorized actor assigns vehicles and validates the request.
4. The mission starts and is tracked, then completes with a proof URL.
5. The state follows `DRAFT → VALIDATED → INPROGRESS → COMPLETED`, with `CANCELLED` available from early states.

## Flux 2a — internal delivery tour

1. MARKETEUR creates an `INTERNAL` tour with its own vehicle, driver, and livreur and ordered checkpoints.
2. The tour becomes `PLANNED`.
3. The assigned livreur starts it, reaches checkpoints, and records bottle scans or VRAC meter readings.
4. The assigned actor closes it when checkpoint work is complete.

## Flux 2b — external delivery tour

1. MARKETEUR creates an `EXTERNAL` tour using a transporter with an `ACTIVE` contract.
2. The tour is sent to `PENDINGTRANSPORTERACK`.
3. TRANSPORTEUR acknowledges by assigning its own organization's vehicle, driver, and livreur; status becomes `ACKNOWLEDGED`.
4. The livreur starts, records checkpoints, and closes the tour.
5. The acknowledgement and unassigned windows are read from settings.

## Declaration and reconciliation

1. MARKETEUR submits a declaration with volume in TM.
2. The system compares declared and tracked volume and calculates the gap.
3. The configured tolerance decides whether the result is within tolerance or requires investigation/redressement.
4. Authorized agents/admins verify or resolve the compliance result.
5. Risk recomputation and report generation are asynchronous and polled to terminal status.

## Interaction requirements

All create/edit forms use react-hook-form, zod, and shadcn Form. Inline errors are not toasts. Each mutation has one Sonner outcome toast. Loading, error, empty, and filtered-empty states are distinct; pending controls are disabled and expose accessible busy state.
