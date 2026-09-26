<!-- generated-by: gsd-doc-writer -->
# 08 — Create forms and creation workflows

This phase follows schema dependencies, but it does not add fields that v6.2 does not have. Forms are implemented with `react-hook-form`, Zod, and shadcn Form. Field errors render inline with `FormMessage`; submit controls show pending state; the mutation path emits exactly one Sonner outcome and invalidates the resource query.

## Layer 0 — reference data

Regions are seeded reference data: `ADAMAOUA`, `CENTRE`, `EST`, `EXTREMENORD`, `LITTORAL`, `NORD`, `NORDOUEST`, `OUEST`, `SUD`, `SUDOUEST`.

## Layer 1 — organization and access

- **Organization:** `name`, `type` (`REGULATEUR`, `DEPOT`, `MARKETEUR`, `TRANSPORTEUR`, `CLIENT`), optional registration/tax fields. Counters and soft-delete metadata are system-managed.
- **User:** `email`, temporary-password flow, `first_name`, `last_name`, `system_role`, optional `org_id`. Enforce hierarchy and organization/site scope. Do not invent `full_name`, `phone`, `mfa_enabled`, or role-prefixed routes.
- **Custom role:** `org_id`, unique `name`, JSONB `permissions_json`; inactive roles do not contribute effective permissions.
- **Assignments:** `user_site_assignments` uses `user_id`, `site_id`, and `is_primary`; it has no `client_site_id` column. `user_custom_roles` may carry an optional `site_id`.
- **MFA:** user_mfa fields are system-generated; enforce roles from `mfa.enforced_for_roles`.

## Layer 2 — sites, clients, and fleet

- **Site:** `org_id`, `region`, unique-per-org `name`, non-empty `functions[]`, optional address/geo point, and system default `UNASSIGNED` status.
- **Client:** one profile per CLIENT organization through `clients.org_id`; optional billing/contact fields.
- **Client site:** `client_org_id`, region/name, optional address/contact/geo, optional `current_marketeur_org_id`, system default `UNASSIGNED`. There is no `clients.id` FK in v6.2.
- **Vehicle:** unique `license_plate`, `type`, `org_id`, conditional `max_volume` for VRAC or `max_bottle_count` for bottled loads, and conditional VRAC certificate number/expiry. `certificate_url` is a MinIO URL, not a binary field. There is no `home_site_id` or `current_device_id` in v6.2; do not add a form for either without a migration.
- **Driver:** `first_name`, `last_name`, unique `license_number`, `org_id`, optional `user_id`.
- **Device:** unique serial, device type, optional firmware/org/config/metadata; GPS metadata must contain `imei`. Assignment is a separate action.
- **RFID import:** `tag_id` is required and unique; optional `bottle_serial` must match the SQL pattern; location may be one site or one client site, or null while in transit. Import fixtures are development data, not a production bulk-import contract.
- **Contract:** marketeur and transporter org IDs must differ; dates, PDF URL, and primary flag are user/API-managed. Derived status is application logic; external tours require `ACTIVE`.

## Layer 3 — operational creation

- **Pickup:** `marketeur_org_id`, distinct source/destination `sites`, positive requested quantity; vehicles are selected through the join table. `approved_quantity` and status are workflow-managed. No pickup proof-photo column exists in v6.2.
- **Delivery tour:** `marketeur_org_id`, `execution_mode`, `type`, and positive requested quantity. INTERNAL requires vehicle/driver/livreur; EXTERNAL requires transporter and leaves those assignment fields empty until acknowledgment. Ordered checkpoints use `tournee_id`, `sequence`, and exactly one `site_id` or `client_site_id`.
- **Checkpoint execution:** reaching sets `actual_arrival`/status; skipping requires a non-empty application-level `skip_reason`; scans record the exact schema fields. VRAC uses `meter_reading`; bottle scans use `rfid_tag_id` and `direction`.

## Layer 4 — compliance and governance

- **Declaration:** marketeur, valid period, non-negative declared volume, and system status; submission records the submitting user.
- **Reconciliation:** triggered/service-created from a declaration; tracked values are computed, `volume_gap` is trigger-computed, and percentage/subsidy impact are application calculations. Do not add `gap_percentage` to the form.
- **Redressement:** reconciliation, non-negative amount, required due date, and system `ISSUED`; the v6.2 schema has no currency or waive-reason field.
- **Anomaly:** system detection supplies the exact enum type/category/severity/entity/evidence/group. Assignments append history. Notification rules use the exact group FK in `notification_rules`.
- **Report/settings:** report type is a schema string convention, not a new enum. Settings edits validate the existing `value_type` and numeric bounds and go through the settings mutation path.

## Form and data rules

Auto-collected org, user, timestamps, and status fields are hidden or system-managed. MARKETEUR and TRANSPORTEUR fields are scoped: never allow a MARKETEUR to select another organization's site or a TRANSPORTEUR to assign a livreur outside its organization. Use FR/EN labels, reduced-motion-aware components, and explicit pending/error/empty/stale/sync states. MinIO holds files; the database stores URLs. DELETE is soft delete.

## Build order

1. Organization and scoped user/access setup.
2. Site or client-site destination.
3. Vehicle, driver, device, and RFID inventory as applicable.
4. Contract if external delivery is required.
5. Pickup or tour, followed by checkpoints and scans.
6. Declaration → reconciliation → redressement.
7. Reports, anomalies, and notifications.

See [`../architecture.md`](../architecture.md), [`../workflows.md`](../workflows.md), and [`../data-and-settings.md`](../data-and-settings.md) for current frontend implementation details.
