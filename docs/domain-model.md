<!-- generated-by: gsd-doc-writer -->
# Domain Model

The canonical SQL schema is `../csph_gpl_schema_v6_2.sql`; shared TypeScript shapes live in `packages/types`. SQL naming wins when the two differ.

## Organizations and people

`organizations.org_type` is `REGULATEUR`, `DEPOT`, `MARKETEUR`, `TRANSPORTEUR`, or `CLIENT`. Users have an uppercase `system_role`: `SUPERADMIN`, `ADMIN`, `SUPERVISOR`, `INTEGRATEUR`, `AGENT`, `MARKETEUR`, `LIVREUR`, or `TRANSPORTEUR`. `user_site_assignments` scopes users to an operational `site` or a commercial `client_site`; custom roles provide additional JSONB permissions.

## Sites and geography

Operational `sites` represent filling centres, warehouses, and provisionable points. Their `site_function` values are `CENTREEMPLISSEUR`, `ENTREPOT`, and `POINTAPPROVISIONABLE`. Commercial `clients` own `client_sites`, which are delivery destinations and remain a separate table.

`Region` values are `ADAMAOUA`, `CENTRE`, `EST`, `EXTREMENORD`, `LITTORAL`, `NORD`, `NORDOUEST`, `OUEST`, `SUD`, and `SUDOUEST`. Schema coordinates use PostGIS geography/geometry points, not raw latitude/longitude columns. Site status is `UNASSIGNED`, `ASSIGNED`, `ACTIVE`, `VERIFIED`, `SUSPENDED`, or `REJECTED`.

The canonical market merge contains 10 existing organizations and 204 `UNASSIGNED`/unverified operational sites. It does not turn those 204 records into `client_sites`.

## Fleet and devices

`vehicles` are `VRAC` or `BOUTEILLES50KG`. VRAC capacity is `max_volume` in TM; bottle capacity is `max_bottle_count` in btl. VRAC certificate fields are required by schema constraints and the certificate URL points to MinIO.

`drivers` belong to an organization and may optionally link to a user. `devices` are `GPS`, `PDA`, or `RFIDREADER` with the schema's twelve uppercase statuses. GPS metadata includes IMEI. `rfid_tags` use `AVAILABLE`, `ASSIGNEDTOBOTTLE`, `INTRANSITOUT`, `INTRANSITIN`, `LOST`, and `BLOCKED`.

## Supply and delivery

`pickup_requests` move product between operational sites. Quantities are TM for VRAC and btl for 50 kg bottles. Status is `DRAFT`, `VALIDATED`, `INPROGRESS`, `COMPLETED`, or `CANCELLED`.

`delivery_tours` use `INTERNAL` or `EXTERNAL` execution and statuses `DRAFT`, `PLANNED`, `PENDINGTRANSPORTERACK`, `ACKNOWLEDGED`, `INPROGRESS`, `CHECKPOINTACTIVE`, `CLOSED`, and `CANCELLED`. Internal tours use the marketeur's crew. External tours require an active marketeur-transporter contract and transporter-owned crew. `checkpoints` target either a `site` or `client_site`; `scan_events` are the evidence record.

## Compliance and risk

Declarations use `DRAFT`, `SUBMITTED`, `RECONCILED`, and `DISPUTED`. Reconciliation compares declared and tracked volume; the gap is evaluated against the configured tolerance. Redressements use `ISSUED`, `PAID`, and `WAIVED`. Risk levels are `FAIBLE`, `MODERE`, `ELEVE`, `CRITIQUE`, and `CRITIQUEEXTREME`. Anomalies are classified as `INVESTIGATION` or `TECHNICAL` and use schema-defined types.

## Cross-cutting rules

- Business thresholds are settings keys, never component constants.
- MinIO stores files; application/database records store URLs only.
- Deletes are soft via `deleted_at` and reads exclude deleted rows.
- API payloads use the standard success/message/data envelope.
- Server state is cached by TanStack Query; local Zustand state is not a second database.
