<!-- generated-by: gsd-doc-writer -->
# 01 — Data model and schema boundaries

The canonical schema is [`../../../csph_gpl_schema_v6_2.sql`](../../../csph_gpl_schema_v6_2.sql). This phase keeps the scaffold's domain catalog while correcting the names that matter for implementation.

## Conventions

- SQL identifiers are `snake_case`; enum values and enum-backed type names are UPPERCASE without snake-case values.
- Coordinates are `GEOMETRY(POINT, 4326)` in v6.2, not `GEOGRAPHY`.
- UUID is the normal primary key. Hypertable primary keys include the time column.
- Rows with `deleted_at` use soft delete. Reads must exclude non-null `deleted_at`.
- `contract_document_url`, certificates, proofs, and report `file_url` are MinIO URL references; binary data is not stored in PostgreSQL.
- `VRAC` quantities are TM; `BOUTEILLES50KG` quantities are bottle counts (`btl`).

## Bounded contexts

| Context | Tables | Frontend owner |
|---|---|---|
| Identity and access | `organizations`, `users`, `settings`, `permissions`, `system_roles`, `system_role_permissions`, `user_mfa`, `integration_auth`, `user_sessions`, `audit_logs`, `custom_roles`, `user_custom_roles`, `user_site_assignments` | users, settings, custom roles |
| Sites and clients | `sites`, `clients`, `client_sites` | sites, clients |
| Fleet and devices | `vehicles`, `drivers`, `devices`, `device_status_history`, `vehicle_positions`, `rfid_tags` | trucks/vehicles, drivers, devices, RFID |
| Supply and delivery | `transporter_contracts`, `pickup_requests`, `pickup_request_vehicles`, `delivery_tours`, `checkpoints`, `scan_events` | pickups, tours, contracts |
| Compliance | `declarations`, `reconciliations`, `redressements`, `risk_scores` | declarations, reconciliations, redressements, risks |
| Anomalies and notifications | `anomalies`, `anomaly_assignments`, `notification_groups`, `notification_group_members`, `notification_rules` | anomalies, notifications |
| Reporting and monitoring | `reports`, `monitoring_metrics` | reports, system metrics |

The current frontend repository contains the application and mock adapter, not the production backend. The schema describes persistence; API route availability must be checked in the backend or `packages/api-client`, never inferred from this table.

## Key exact columns and constraints

- `sites` and `client_sites` use `status site_status` and `functions`/`region` as defined in SQL. `client_sites` links directly to `organizations.client_org_id`; it has no `clients.id` FK.
- `vehicles`: `max_volume` is for VRAC, `max_bottle_count` for bottled loads; `chk_vehicle_capacity` requires exactly one. `chk_vehicle_vrac_cert` requires `certificate_number` and `certificate_expiry_at` for VRAC. The SQL does not require `certificate_url` in that check.
- `devices`: `last_sync`, `last_known_position`, `config_json`, and `metadata_json` are the exact fields. GPS requires `metadata_json->>'imei'`.
- `transporter_contracts`: exact fields include `contract_document_url` and `transporter_accepted_at`; status is derived in application code, not stored. `deleted_at` derives `CANCELLED`; an inactive contract derives `SUSPENDED`; proof/acceptance/date fields derive the remaining statuses.
- `delivery_tours`: `transporter_org_id`, assignment fields, `type`, `status`, and quantity fields are exact. `checkpoints` uses `tournee_id`, `sequence`, `expected_arrival`, and `actual_arrival`; it has no `expected_quantity` column in v6.2.
- `scan_events`: exact fields are `checkpoint_id`, `livreur_user_id`, `rfid_tag_id`, `direction`, `geo_point`, `timestamp`, `meter_reading`, `photo_url`, `pda_sync_id`, and `conflict_status`. There is no `tour_id` or `device_id`; reach a tour through `checkpoints.tournee_id`. `conflict_status` is `VARCHAR(20)`, not an enum.
- `reconciliations`: `tracked_bottles_out`, `tracked_bottles_in`, `volume_gap`, and `subsidy_impact` exist; `gap_percentage` does not. The application computes percentages from `volume_gap` and `declarations.declared_volume`.
- `redressements`: v6.2 has `amount`, `issued_at`, `due_date`, `paid_at`, and `transaction_ref`; it does not have `currency`, `waived_by`, or `waive_reason`.
- `anomalies.assigned_to_group` is the enum `notification_group_type`, not a UUID FK. Notification rules map anomaly type/severity to a concrete group.
- `notification_rules` has no escalation columns in v6.2.

## Time-series tables

`audit_logs`, `device_status_history`, `vehicle_positions`, `scan_events`, and `monitoring_metrics` are hypertables in the SQL. Chunk/compression/retention policies must be verified against the actual migration, not copied from older documentation. `scan_events` is the evidentiary scan stream; preserve its retention and join path when changing schema.

## Frontend data boundary

`packages/types` is the shared type source. Feature `data/` builders receive API rows and the current `UserScope`; they do not import curated JSON or re-declare domain entities. Fake-adapter fixture imports are development data only. See [`../data-and-settings.md`](../data-and-settings.md) and [`../domain-model.md`](../domain-model.md) for the maintained settings, units, and entity contracts.
