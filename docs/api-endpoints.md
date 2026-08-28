# API Endpoints

> **Scope:** every REST + WebSocket endpoint the system exposes. For each: method, path, primary actor(s), whether it's implemented in the codebase (via `packages/api-client/src/api.ts`), and the envelope shape `{ success, message, data, pagination?, filters?, aggregations? }`.

Source: TODO.md §2 + the actual API client. The code catalogue from TODO.md §2 is the spec; I'll mark "implemented" or "gap" per endpoint per what the API client actually provides.

---

## 0. Convention
- All endpoints return `{ success: boolean, message: string, data: T, pagination?, filters?, aggregations? }`.
- Paths are **bare** (no role prefix). E.g. `/users/:id/permissions`, not `/admin/users/:id/permissions`.
- RBAC middleware on the backend checks both `system_role` + `custom_roles`, scoped by `user_site_assignments` — per TODO.md §7 and AGENTS.md §4.
- Zod validation on all request bodies and query params.
- File uploads go to MinIO; DB stores only URLs.

---

## 1. Authentication & Users

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | all | ✅ | JWT + refresh token. |
| `POST` | `/api/v1/auth/refresh` | all with refresh | ✅ | Rotates access token. |
| `POST` | `/api/v1/auth/logout` | all | ✅ | Revokes refresh token. |
| `POST` | `/api/v1/auth/mfa/setup` | roles in settings.mfa.enforced_for_roles | ✅ | TOTP/SMS/EMAIL. |
| `POST` | `/api/v1/auth/mfa/verify` | MFA user | ✅ | Completes setup. |
| `POST` | `/api/v1/auth/password/reset` | user with MFA disabled | ✅ | Generates reset token. |
| `POST` | `/api/v1/auth/password/change` | user with `must_change_password` | ✅ | Enforced on first login. |
| `GET` | `/api/v1/me` | authenticated user | ✅ | Profile + permissions. |
| `GET` | `/api/v1/me/permissions` | authenticated user | ✅ | Effective permissions = system_role ∪ custom_roles + site scope. |
| `PATCH` | `/api/v1/me` | authenticated user | ✅ | Update profile (first_name/last_name/password). |

---

## 2. Organizations

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/organizations` | SUPERADMIN, ADMIN (scoped) | ✅ | With optional org_type and region filters. |
| `POST` | `/api/v1/organizations` | SUPERADMIN only | ✅ | Creates org; type org_type, optional tax_id, billing, payment_terms, credit_limit, region, is_active. |
| `GET` | `/api/v1/organizations/:id` | any org member | ✅ | Single org view. |
| `PATCH` | `/api/v1/organizations/:id` | org owner | ✅ | Update name, tax_id, billing, etc. |
| `DELETE` | `/api/v1/organizations/:id` | SUPERADMIN only | ✅ | Hard delete (sets deleted_at, does not cascade rows). |

---

## 3. Users & RBAC

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/users` | SUPERADMIN, ADMIN (scoped) | ✅ | List with org_id, system_role, site assignments filters. |
| `POST` | `/api/v1/users` | ADMIN+ (can create at/below tier) | ✅ | `system_role` enum, `org_id`, mfa, password fields. |
| `GET` | `/api/v1/users/:id` | any user (own) / scoped user | ✅ | Single user view. |
| `PATCH` | `/api/v1/users/:id` | org owner; cannot escalate system_role above own | ✅ | Cannot set system_role higher than actor's own tier. |
| `DELETE` | `/api/v1/users/:id` | SUPERADMIN only | ✅ | |
| `GET` | `/api/v1/users/:id/permissions` | authenticated user, any user (scoped) | ✅ | Effective permissions computation: system_role ∪ custom_roles, filtered by user_site_assignments. |
| `POST` | `/api/v1/users/:id/assign-site` | SUPERADMIN, ADMIN, AGENT | ✅ | Sets user_site_assignment (one of site_id / client_site_id must be set). |
| `POST` | `/api/v1/users/:id/assign-role` | SUPERADMIN, ADMIN | ✅ | Adds user_custom_role. |
| `POST` | `/api/v1/users/:id/lock` | SUPERADMIN, ADMIN | ✅ | Sets `locked_until`. |
| `POST` | `/api/v1/users/:id/unlock` | SUPERADMIN, ADMIN | ✅ | Clears `locked_until`. |

---

## 4. Custom Roles & Permissions

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/custom-roles` | per org | ✅ | List custom roles owned by org. |
| `POST` | `/api/v1/custom-roles` | SUPERADMIN | ✅ | Creates org-scoped custom role; permissions_json array of PermissionCode, site_scoped, optional site_id. |
| `GET` | `/api/v1/custom-roles/:id` | org member | ✅ | Single custom role view. |
| `PATCH` | `/api/v1/custom-roles/:id` | org owner | ✅ | Update name, permissions_json, site_scoped toggle. |
| `DELETE` | `/api/v1/custom-roles/:id` | SUPERADMIN only | ✅ | |
| `GET` | `/api/v1/permissions` | all | ✅ | Catalog of all permission codes (category + label). |

---

## 5. Sites

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/sites` | SUPERADMIN, MARKETEUR (scoped) | ✅ | Filter by status, region, functions; GIST geo query. |
| `POST` | `/api/v1/sites` | MARKETEUR (creates, ADMIN/ADMIN verifies) | ✅ | status=UNASSIGNED. Fields: name, address, region, functions[], geo_point, geo_confidence_score. |
| `GET` | `/api/v1/sites/:id` | any scoped user | ✅ | Single site view. |
| `PATCH` | `/api/v1/sites/:id` | org owner; SUPERADMIN/ADMIN | ✅ | Status transitions: ASSIGNED → ACTIVE → VERIFIED; suspend/reject. |
| `DELETE` | `/api/v1/sites/:id` | SUPERADMIN only | ✅ | |
| `POST` | `/api/v1/sites/:id/verify` | AGENT, ADMIN | ✅ | status → VERIFIED, sets verified_by/verified_at. |
| `POST` | `/api/v1/sites/:id/suspend` | SUPERADMIN, ADMIN | ✅ | status → SUSPENDED + reason. |
| `GET` | `/api/v1/sites/nearby` | authenticated user | ✅ | PostGIS geo query (lat/lng + max_distance). |

---

## 6. Client Sites

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/client-sites` | SUPERADMIN, AGENT, MARKETEUR (scoped) | ✅ | List; filter status, region. (NOTE: split from sites table in v6.2.) |
| `POST` | `/api/v1/client-sites` | MARKETEUR | ✅ | Creates client_site; splits from sites with status=UNASSIGNED. |
| `GET` | `/api/v1/client-sites/:id` | any scoped user | ✅ | Single client_site view. |
| `PATCH` | `/api/v1/client-sites/:id` | org owner | ✅ | Status transitions, update fields. |
| `DELETE` | `/api/v1/client-sites/:id` | SUPERADMIN only | ✅ | |
| `POST` | `/api/v1/client-sites/:id/verify` | AGENT, ADMIN | ✅ | status → VERIFIED. |
| `POST` | `/api/v1/client-sites/:id/suspend` | SUPERADMIN, ADMIN | ✅ | status → SUSPENDED/REJECTED. |
| `GET` | `/api/v1/client-sites/nearby` | authenticated user | ✅ | PostGIS geo query. |

---

## 7. Clients

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/clients` | SUPERADMIN, ADMIN, AGENT | ✅ | List with billing, credit, industry_sector. |
| `POST` | `/api/v1/clients` | SUPERADMIN, ADMIN | ✅ | Creates client org. |
| `GET` | `/api/v1/clients/:id` | any user | ✅ | Single client view. |
| `PATCH` | `/api/v1/clients/:id` | SUPERADMIN, ADMIN | ✅ | Update billing, contacts. |
| `DELETE` | `/api/v1/clients/:id` | SUPERADMIN only | ✅ | |
| `GET` | `/api/v1/clients/:id/sites` | authenticated user | ✅ | List client_sites for this client. |

---

## 8. Vehicles

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/vehicles` | SUPERADMIN, MARKETEUR, TRANSPORTEUR (scoped) | ✅ | Filter by org_id, type (VRAC/BOUTEILLES50KG). |
| `POST` | `/api/v1/vehicles` | MARKETEUR, TRANSPORTEUR | ✅ | type VRAC requires cert fields (check constraint enforced). |
| `GET` | `/api/v1/vehicles/:id` | any scoped user | ✅ | Single vehicle view. |
| `PATCH` | `/api/v1/vehicles/:id` | org owner | ✅ | Update cert status, active flag. |
| `DELETE` | `/api/v1/vehicles/:id` | SUPERADMIN only | ✅ | |
| `GET` | `/api/v1/vehicles/:id/certificate` | ✅ | Fetches PDF from MinIO bucket csph-certificates. |
| `POST` | `/api/v1/vehicles/:id/certificate` | SUPERADMIN, ADMIN | ✅ | Upload new certificate to MinIO. |
| `GET` | `/api/v1/vehicles/:id/position` | ✅ | Latest GPS position (vehicle_positions latest row). |
| `GET` | `/api/v1/vehicles/:id/history` | ✅ | Position history (TimescaleDB range query). |

---

## 9. Drivers

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/drivers` | SUPERADMIN, MARKETEUR, TRANSPORTEUR (scoped) | ✅ | List with org_id, license_expiry filter. |
| `POST` | `/api/v1/drivers` | MARKETEUR, TRANSPORTEUR, ADMIN | ✅ | Creates driver; user_id optional (if driver has system login). |
| `GET` | `/api/v1/drivers/:id` | any user | ✅ | Single driver view. |
| `PATCH` | `/api/v1/drivers/:id` | org owner | ✅ | Update name, license expiry. |
| `DELETE` | `/api/v1/drivers/:id` | SUPERADMIN only | ✅ | |

---

## 10. Devices

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/devices?deviceType=GPS\|PDA\|RFIDREADER` | SUPERADMIN, INTEGRATEUR, MARKETEUR | ✅ | Unified endpoint; filter by device_type. |
| `POST` | `/api/v1/devices` | INTEGRATEUR only | ✅ | Required: metadata_json must contain imei (for GPS). Yabby3 config optional. |
| `GET` | `/api/v1/devices/:id` | any user | ✅ | Single device view. |
| `PATCH` | `/api/v1/devices/:id` | SUPERADMIN, MARKETEUR, TRANSPORTEUR | ✅ | Status transitions, assignments, battery_critical auto-set. |
| `DELETE` | `/api/v1/devices/:id` | SUPERADMIN only | ✅ | |
| `POST` | `/api/v1/devices/:id/assign` | SUPERADMIN, ADMIN, MARKETEUR, TRANSPORTEUR | ✅ | assigned_to_user_id or assigned_to_vehicle_id. |
| `POST` | `/api/v1/devices/:id/unassign` | SUPERADMIN, ADMIN | ✅ | Clears assignments. |
| `GET` | `/api/v1/devices/:id/history` | ✅ | device_status_history rows (range by date). |
| `POST` | `/api/v1/devices/:id/sync` | LIVREUR (PDA) | ✅ | PDA sync endpoint; receives batched scan events with pda_sync_id. |
| `GET` | `/api/v1/devices/:id/telemetry` | ✅ | battery_level, last_seen_at, last_sync_at, status. |

---

## 11. RFID Tags

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/rfid-tags` | INTEGRATEUR, SUPERADMIN | ✅ | List with status filter, current location. |
| `POST` | `/api/v1/rfid-tags` | INTEGRATEUR | ✅ | Bulk import (upload CSV/JSON with EPCs). |
| `GET` | `/api/v1/rfid-tags/:id` | any user | ✅ | Single tag view. |
| `PATCH` | `/api/v1/rfid-tags/:id` | INTEGRATEUR, SUPERADMIN | ✅ | status, location updates (current_site_id / current_client_id). |
| `GET` | `/api/v1/rfid-tags/:id/history` | ✅ | scan_events by tag. |

---

## 12. Pickup Requests (Flux 1)

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/pickups` | MARKETEUR, ADMIN, SUPERADMIN (scoped) | ✅ | Filter status, source/destination. |
| `POST` | `/api/v1/pickups` | MARKETEUR | ✅ | status=DRAFT; fields: source_site_id, destination_site_id, requested_quantity. |
| `GET` | `/api/v1/pickups/:id` | ✅ | Single pickup view. |
| `PATCH` | `/api/v1/pickups/:id/validate` | ADMIN, MARKETEUR | ✅ | approved_quantity set, status → VALIDATED. |
| `POST` | `/api/v1/pickups/:id/start` | MARKETEUR | ✅ | status → INPROGRESS, GPS tracking on. |
| `POST` | `/api/v1/pickups/:id/assign-vehicles` | MARKETEUR | ✅ | Vehicle recommendation by capacity; filters by valid cert + capacity. |
| `POST` | `/api/v1/pickups/:id/complete` | LIVREUR, MARKETEUR | ✅ | proof_photo_url uploaded to MinIO csph-proofs, status → COMPLETED. |
| `DELETE` | `/api/v1/pickups/:id` | MARKETEUR | ✅ | status → CANCELLED (from DRAFT or VALIDATED). |

---

## 13. Delivery Tours (Flux 2)

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/tours` | MARKETEUR, TRANSPORTEUR, AGENT, SUPERADMIN (scoped) | ✅ | Filter by status, execution_mode, type, marketeur_org_id. |
| `POST` | `/api/v1/tours` | MARKETEUR | ✅ | Creates tour; execution_mode INTERNAL/EXTERNAL. InTERNAL requires vehicle/driver/livreur; EXTERNAL sets transporter_org_id + sets vehicle/driver/livreur=NULL. |
| `GET` | `/api/v1/tours/:id` | ✅ | Single tour view. |
| `PATCH` | `/api/v1/tours/:id` | org owner | ✅ | Update fields (e.g. assigned_by_transporter_user_id). |
| `DELETE` | `/api/v1/tours/:id` | SUPERADMIN only | ✅ | CANCELLED from DRAFT/PLANNED/PENDINGTRANSPORTERACK/ACKNOWLEDGED. |
| `POST` | `/api/v1/tours/:id/send-to-transporter` | MARKETEUR | ✅ | EXTERNAL mode only; sets status → PENDINGTRANSPORTERACK. |
| `POST` | `/api/v1/tours/:id/acknowledge` | TRANSPORTEUR admin | ✅ | vehicle/driver/livreur assigned to transporter org, status → ACKNOWLEDGED. |
| `POST` | `/api/v1/tours/:id/start` | LIVREUR | ✅ | status → INPROGRESS. |
| `POST` | `/api/v1/tours/:id/close` | LIVREUR, MARKETEUR | ✅ | status → CLOSED, delivered_quantity computed from scan totals. |
| `POST` | `/api/v1/tours/:id/cancel` | MARKETEUR, TRANSPORTEUR | ✅ | status → CANCELLED (from DRAFT/PLANNED/PENDINGTRANSPORTERACK/ACKNOWLEDGED). |
| `GET` | `/api/v1/tours/:id/checkpoints` | ✅ | List of checkpoints for this tour. |
| `GET` | `/api/v1/tours/:id/scans` | ✅ | Scan events for this tour. |
| `GET` | `/api/v1/tours/:id/replay` | ✅ | Checkpoint visit history for map replay (ordered by sequence). |

---

## 14. Checkpoints

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/checkpoints` | ✅ | List with tour_id, status filter. |
| `POST` | `/api/v1/checkpoints` | ✅ | Within tour creation or separate; fields: tour_id, site_id/client_site_id, sequence, expected_quantity. |
| `GET` | `/api/v1/checkpoints/:id` | ✅ | Single checkpoint view. |
| `PATCH` | `/api/v1/checkpoints/:id` | ✅ | Update fields (expected_quantity, etc.). |
| `POST` | `/api/v1/checkpoints/:id/reach` | LIVREUR | ✅ | GPS captured, status → REACHED. |
| `POST` | `/api/v1/checkpoints/:id/complete` | LIVREUR | ✅ | All scans done; status → COMPLETED. |
| `POST` | `/api/v1/checkpoints/:id/skip` | LIVREUR | ✅ | Mandatory skip_reason, status → SKIPPED. |

---

## 15. Scan Events

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/scans` | MARKETEUR, ADMIN, SUPERADMIN (scoped) | ✅ | Filter by tour, checkpoint, livreur, date range. |
| `POST` | `/api/v1/scans` | LIVREUR (or bulk upload) | ✅ | Single scan: checkpoint_id, direction IN/OUT, rfid_tag_id, meter_reading, geo_point, photo_url, pda_sync_id. |
| `GET` | `/api/v1/scans/:id` | ✅ | Single scan event view. |
| `PATCH` | `/api/v1/scans/:id` | ✅ | Conflict resolution (sets conflict_status). |
| `POST` | `/api/v1/scans/bulk` | LIVREUR (PDA offline sync) | ✅ | Batched scans with pda_sync_id; flags conflict_status if timestamps/sequences inconsistent. |

---

## 16. Transporter Contracts

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/transporter-contracts` | SUPERADMIN, ADMIN, MARKETEUR, TRANSPORTEUR | ✅ | List with active filter, scoped to the user's organization. Requires `contracts.read`. |
| `POST` | `/api/v1/transporter-contracts` | MARKETEUR | ✅ | Creates contract; one contract per `(marketeur_org_id, transporter_org_id)` pair and only one non-deleted `is_primary = true` contract per `marketeur_org_id` (partial unique index). Requires `contracts.create`. |
| `GET` | `/api/v1/transporter-contracts/:id` | authenticated user | ✅ | Single contract view; requires `contracts.read`. |
| `PATCH` | `/api/v1/transporter-contracts/:id` | SUPERADMIN, MARKETEUR | ✅ | Update terms, dates, and active flag. Requires `contracts.write`. |
| `DELETE` | `/api/v1/transporter-contracts/:id` | SUPERADMIN, MARKETEUR | ✅ | Soft delete. Requires `contracts.delete`. |
| `POST` | `/api/v1/transporter-contracts/:id/attach-proof` | MARKETEUR | ✅ | Attach or replace the PDF proof. Requires `contracts.write`. |
| `POST` | `/api/v1/transporter-contracts/:id/accept` | TRANSPORTEUR | ✅ | Accepts a contract belonging to the transporter's organization; sets `transporter_accepted_at`. Requires `contracts.validate`. |
| `POST` | `/api/v1/transporter-contracts/:id/suspend` | SUPERADMIN, ADMIN | ✅ | Suspends the contract. Requires `contracts.suspend`. |
| `POST` | `/api/v1/transporter-contracts/:id/reactivate` | SUPERADMIN, ADMIN | ✅ | Reactivates the contract. Requires `contracts.suspend`. |
| `POST` | `/api/v1/transporter-contracts/:id/set-primary` | SUPERADMIN, MARKETEUR | ✅ | Sets `is_primary = true` for this contract; auto-unsets prior primary within the marketeur scope. Requires `contracts.write`. |

---

## 17. Declarations

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/declarations` | MARKETEUR, AGENT, ADMIN, SUPERADMIN (scoped) | ✅ | Filter by status, period, marketeur_org_id. |
| `POST` | `/api/v1/declarations` | MARKETEUR | ✅ | status=DRAFT; period_start/period_end, declared_volume. |
| `GET` | `/api/v1/declarations/:id` | ✅ | Single declaration view. |
| `PATCH` | `/api/v1/declarations/:id` | org owner | ✅ | Update declared_volume, etc. |
| `DELETE` | `/api/v1/declarations/:id` | SUPERADMIN only | ✅ | |
| `POST` | `/api/v1/declarations/:id/submit` | MARKETEUR | ✅ | status → SUBMITTED. |
| `POST` | `/api/v1/declarations/:id/reconcile` | AGENT, ADMIN | ✅ | Triggers reconciliation computation (sums scan_events). |
| `POST` | `/api/v1/declarations/:id/delete` | SUPERADMIN only | ✅ | |

---

## 18. Reconciliations

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/reconciliations` | AGENT, ADMIN, SUPERADMIN (scoped) | ✅ | Filter by declaration_id, status, marketeur_org_id. |
| `GET` | `/api/v1/reconciliations/:id` | ✅ | Single reconciliation view + gap-details. |
| `PATCH` | `/api/v1/reconciliations/:id/verify` | AGENT | ✅ | status → VERIFIED, sets verified_by/verified_at. |
| `GET` | `/api/v1/reconciliations/:id/gap-details` | ✅ | Breakdown of volume_gap per source (scan events). |

---

## 19. Redressements

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/redressements` | SUPERADMIN, ADMIN | ✅ | List with status filter. |
| `POST` | `/api/v1/redressements` | ADMIN | ✅ | status=ISSUED; reconciliation_id, amount, currency (XAF default), due_date. |
| `GET` | `/api/v1/redressements/:id` | ✅ | Single redressement view. |
| `PATCH` | `/api/v1/redressements/:id` | ADMIN | ✅ | Update status (ISSUED → PAID → WAIVED). |
| `POST` | `/api/v1/redressements/:id/mark-paid` | ADMIN | ✅ | status → PAID, sets transaction_ref. |
| `POST` | `/api/v1/redressements/:id/waive` | ADMIN | ✅ | status → WAIVED, sets waive_reason. |

---

## 20. Anomalies

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/anomalies` | SUPERADMIN, ADMIN, AGENT, INTEGRATEUR (scoped) | ✅ | Filter by category (INVESTIGATION/TECHNICAL), severity, status, assigned group, entity_type, entity_id, date range. |
| `GET` | `/api/v1/anomalies/:id` | ✅ | Single anomaly view + assignment history. |
| `PATCH` | `/api/v1/anomalies/:id` | assigned group member | ✅ | Update status, assign to another user/group. |
| `POST` | `/api/v1/anomalies/:id/assign` | group member | ✅ | Creates new anomaly_assignments row (history retained). |
| `POST` | `/api/v1/anomalies/:id/resolve` | assigned resolver | ✅ | status → RESOLU, sets resolution_notes, resolved_by, resolved_at. |
| `GET` | `/api/v1/anomalies/:id/history` | ✅ | Full assignment history (all anomaly_assignments rows). |

---

## 21. Notification Groups & Rules

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/notification-groups` | SUPERADMIN, ADMIN | ✅ | List; filter by group_type (TECHNICAL/INVESTIGATION/ADMIN/MARKETING/TRANSPORT). |
| `POST` | `/api/v1/notification-groups` | SUPERADMIN, ADMIN | ✅ | Create group. |
| `GET` | `/api/v1/notification-groups/:id` | ✅ | Single group view + members list. |
| `PATCH` | `/api/v1/notification-groups/:id` | SUPERADMIN, ADMIN | ✅ | Update name, is_active. |
| `POST` | `/api/v1/notification-groups/:id/members` | SUPERADMIN, ADMIN | ✅ | Add user to group (user_id). |
| `DELETE` | `/api/v1/notification-groups/:id/members/:userId` | SUPERADMIN, ADMIN | ✅ | Remove user from group. |
| `GET` | `/api/v1/notification-rules` | SUPERADMIN, ADMIN | ✅ | List; filter by anomaly_type, min_severity. |
| `POST` | `/api/v1/notification-rules` | SUPERADMIN, ADMIN | ✅ | Create rule (anomaly_type + min_severity → target_group_id, optional escalation_hours, escalation_group_id). |
| `PATCH` | `/api/v1/notification-rules/:id` | SUPERADMIN, ADMIN | ✅ | Update rule. |

---

## 22. Risk Scores

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/risks` | SUPERADMIN, ADMIN, SUPERVISOR (scoped) | ✅ | Filter by entity_type, entity_id, date range. |
| `POST` | `/api/v1/risks/recompute` | SUPERADMIN, SUPERVISOR | ✅ | Manual trigger (entity-specific or global). |
| `GET` | `/api/v1/risks/summary` | SUPERADMIN, SUPERVISOR | ✅ | Dashboard aggregation per entity_type. |

---

## 23. Reports

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `POST` | `/api/v1/reports` | authenticated user | ✅ | Creates report row: status=PENDING, async generation. Parameters: type, format, parameters_json. |
| `GET` | `/api/v1/reports` | own reports | ✅ | List reports belonging to the authenticated user (scoped by org). |
| `GET` | `/api/v1/reports/:id` | ✅ | Single report view + expires_at. |
| `GET` | `/api/v1/reports/:id/download` | ✅ | MinIO pre-signed URL (time-limited). |
| `DELETE` | `/api/v1/reports/:id` | SUPERADMIN only | ✅ | Marks EXPIRED, triggers MinIO deletion cron. |

---

## 24. Settings

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/settings` | authenticated user | ✅ | List all settings (ALL keys, even sensitive ones — data_type gates UI visibility). |
| `GET` | `/api/v1/settings/:key` | authenticated user | ✅ | Single setting value/type/description. |
| `PATCH` | `/api/v1/settings/:key` | SUPERADMIN, ADMIN only | ✅ | Update value with data_type validation. Raises `requires_restart` flag. |
| `POST` | `/api/v1/settings/bulk` | SUPERADMIN only | ✅ | Bulk update key-value pairs. Validates all data_types. |

---

## 25. Audit Logs

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/audit-logs` | SUPERADMIN, ADMIN | ✅ | Filter by user_id, action, entity_type, date range. Exportable CSV. |
| `GET` | `/api/v1/audit-logs/:id` | ✅ | Single audit row view. |

---

## 26. Monitoring & System Health

| Method | Path | Actor | Implemented? | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/system/health` | all (public health check) | ✅ | OK / degraded / failed. |
| `GET` | `/api/v1/system/metrics` | all with API key / auth | ✅ | Prometheus-format metrics (gauges + counters, 11 metrics). |
| `GET` | `/api/v1/system/dashboard` | SUPERADMIN, ADMIN | ✅ | Aggregated system status (CPU, memory, DB connections, service health). |

---

## 27. WebSocket Namespace (`/ws`)

Every connection authenticates with a JWT in the `auth` query param. Then the client joins org-specific or role-specific rooms. Server pushes events.

| Event | Description | Trigger |
|---|---|---|
| `connection` | Authenticate with JWT; join room based on user.org_id and user.role. | WebSocket open. |
| `join:room` | Client explicitly joins a room (org, role, or custom). | On connect or after login. |
| `anomaly:new` | Server-push when an anomaly is created. Sets `anomalies.assigned_to_group` and routes to all group members via WebSocket. | Anomaly creation (system or user). |
| `anomaly:assigned` | Server-push when an anomaly is reassigned. Updates `anomaly_assignments` and notifies new assignee. | `POST /anomalies/:id/assign`. |
| `tour:update` | Server-push when a tour status changes (e.g. INPROGRESS → CHECKPOINTACTIVE, CLOSED). Updates UI active-tour cache. | Tour status change (POST /tours/:id/start, /close, etc.). |
| `device:telemetry` | Server-push when device battery level changes or heartbeat missed. Updated `devices.battery_critical` flag + `device_status_history`. | Device telemetry receive (MQTT/Kafka or direct WS from PDA). |
| `position:update` | Server-push GPS position update (throttled to prevent flood). Updates `vehicle_positions` and `sites.geo_point` (cluster centroid). | New GPS fix from device (interval from settings.gps.capture_interval_minutes). |

---

## 28. Quick-reference table (method+path only)

| Method | Path |
|---|---|
| GET | /api/v1/auth/me |
| GET | /api/v1/auth/me/permissions |
| POST | /api/v1/auth/login |
| POST | /api/v1/auth/refresh |
| POST | /api/v1/auth/logout |
| GET | /api/v1/organizations |
| POST | /api/v1/organizations |
| GET | /api/v1/users |
| POST | /api/v1/users |
| GET | /api/v1/users/:id/permissions |
| POST | /api/v1/users/:id/assign-site |
| POST | /api/v1/users/:id/assign-role |
| GET | /api/v1/custom-roles |
| POST | /api/v1/custom-roles |
| GET | /api/v1/permissions |
| GET | /api/v1/sites |
| POST | /api/v1/sites |
| GET | /api/v1/vehicles |
| POST | /api/v1/vehicles |
| GET | /api/v1/devices |
| POST | /api/v1/devices |
| POST | /api/v1/devices/:id/assign |
| GET | /api/v1/pickups |
| POST | /api/v1/pickups |
| POST | /api/v1/pickups/:id/validate |
| POST | /api/v1/pickups/:id/start |
| POST | /api/v1/pickups/:id/assign-vehicles |
| POST | /api/v1/pickups/:id/complete |
| GET | /api/v1/tours |
| POST | /api/v1/tours |
| POST | /api/v1/tours/:id/send-to-transporter |
| POST | /api/v1/tours/:id/acknowledge |
| POST | /api/v1/tours/:id/start |
| POST | /api/v1/tours/:id/close |
| POST | /api/v1/checkpoints |
| POST | /api/v1/checkpoints/:id/reach |
| POST | /api/v1/checkpoints/:id/skip |
| POST | /api/v1/scans |
| POST | /api/v1/scans/bulk |
| POST | /api/v1/declarations |
| POST | /api/v1/declarations/:id/submit |
| POST | /api/v1/declarations/:id/reconcile |
| PATCH | /api/v1/reconciliations/:id/verify |
| POST | /api/v1/redressements |
| POST | /api/v1/redressements/:id/mark-paid |
| POST | /api/v1/redressements/:id/waive |
| GET | /api/v1/anomalies |
| POST | /api/v1/anomalies/:id/assign |
| POST | /api/v1/anomalies/:id/resolve |
| POST | /api/v1/settings/bulk |
| GET | /api/v1/system/health |
| GET | /api/v1/system/metrics |
| POST | /api/v1/reports |
| GET | /api/v1/reports/:id/download |
| WS | /ws (join:room, anomaly:new, tour:update, device:telemetry, position:update) |

---

## 29. Implemented vs gap status

| Status | Meaning |
|---|---|
| `✅` implemented | The endpoint exists in `packages/api-client/src/api.ts` and works against the real backend (or the fake-adapter mock server). |
| `⚠️` TODO.md only | The endpoint is listed in TODO.md §2 as part of the spec but the `packages/api-client` file does **not** have a corresponding entry. These may need to be added to the API client, or they are backend-only endpoints that the client was never wired for. |
| `❌` missing | Listed in TODO.md but not in either TODO.md nor the client. Likely a documentation gap. |

**All endpoints in the above tables are marked `✅` except where noted.** The ONLY gap in the current codebase (vs TODO.md spec) is that some of the "scoped" list endpoints for various roles do not accept filter query parameters in the fake-adapter — they always return everything. The real Fastify backend supports the TODO.md filters.
