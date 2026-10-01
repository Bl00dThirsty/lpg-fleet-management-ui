# 02 — RBAC, Roles, Permissions & Scoping

## Role Hierarchy

```
SUPERADMIN
   └── ADMIN
        └── SUPERVISOR / AGENT / INTEGRATEUR   (peer level, distinct functional tracks)
             └── MARKETEUR / TRANSPORTEUR       (peer level, org-facing actors)
                  └── LIVREUR                   (field executor, lowest level)
```

Rule (from `TODO.md`, enforced at the `system_roles.hierarchy_level` / `max_subordinate_level` columns): **a user may only create or assign subordinates at or below their own hierarchy level.** `can_create_subroles` and `can_assign_roles` on `system_roles` gate whether a role can perform user-management actions at all.

## The Two Peer Tracks (why SUPERVISOR/AGENT/INTEGRATEUR are parallel, not sequential)

| Role | Track | Focus |
|---|---|---|
| **SUPERVISOR** | Technical/Infra | Prometheus/Grafana, device health, Kafka lag, system metrics, TECHNICAL-category anomalies |
| **AGENT** | Investigation/Field | Marketeur oversight, site verification visits, declarations review, INVESTIGATION-category anomalies, reconciliation verification |
| **INTEGRATEUR** | Device provisioning | GPS/PDA/RFID device lifecycle, IMEI/firmware registry, certificate/API-key management |

This maps directly to the **dual-track anomaly system** (`anomaly_category`: INVESTIGATION vs TECHNICAL) — AGENT owns one, SUPERVISOR owns the other.

## Effective Permission Resolution

Per `TODO.md §0` and confirmed by the `custom_roles`/`user_custom_roles`/`user_site_assignments` tables in the live schema:

```
effective_permissions(user, resource, action) =
    base_permissions(user.system_role)               -- from system_role_permissions
    OR custom_role_permissions(user)                  -- from user_custom_roles → custom_roles.permissions_json
  FILTERED BY
    user_site_assignments(user)                       -- if the resource is site-scoped
```

- **`system_role`** (enum on `users`) is the coarse, built-in layer — resolved via `system_role_permissions` join to `permissions`.
- **`custom_roles`** (org-scoped, JSONB) is the fine-grained override/addition layer. Seed example: `cr-0001-sctm-transport` grants `{"tours.read": true, "tours.write": true, "transporters.read": true, "reports.read": true}` to a specific SCTM user, further scoped to one `site_id` via `user_custom_roles.site_id`.
- **Permission code convention** (inferred from seed data): `resource.action`, e.g. `tours.read`, `sites.verify`, `audit-logs.export`, `reconciliations.read`.
- **No endpoint should authorize on `system_role` alone** — every protected route must also check custom-role permissions and site scope. This is a hard requirement, not an optimization.

`custom_roles.is_active` can be toggled off without deleting the row (seed shows `cr-0003-csph-audit` disabled) — inactive custom roles must be excluded from effective-permission computation but retained for audit history.

## Role-by-Role Summary

| Role | Org type typically attached | Primary responsibilities | Key tables it writes to |
|---|---|---|---|
| **SUPERADMIN** | CSPH (REGULATEUR) or none | Full system control: orgs, settings, all users, risk model config, global reports | everything |
| **ADMIN** | CSPH or MARKETEUR/TRANSPORTEUR org admin | Org-scoped user mgmt, site verification approval, redressement issuance, settings (non-global) | users, sites, redressements, settings (org-scoped) |
| **SUPERVISOR** | CSPH | Infra/technical monitoring, technical anomaly resolution, manual risk recompute | anomalies (TECHNICAL), monitoring_metrics (read), risk_scores (trigger) |
| **AGENT** | CSPH, regionally scoped via user_site_assignments | Field verification, declaration review, reconciliation verification, investigation anomalies, marketeur password resets | client_sites (verify), reconciliations (verify), anomalies (INVESTIGATION) |
| **INTEGRATEUR** | CSPH | Device provisioning/lifecycle, RFID bulk import, integration auth | devices, rfid_tags, integration_auth, device_status_history |
| **MARKETEUR** | MARKETEUR org | Fleet, drivers, pickups, tours (internal/external), declarations, client relationships | vehicles, drivers, pickup_requests, delivery_tours, declarations, transporter_contracts, clients/client_sites |
| **TRANSPORTEUR** | TRANSPORTEUR org | Acknowledge external tours, provide own fleet/crew, execute deliveries | delivery_tours (acknowledge), vehicles, drivers |
| **LIVREUR** | attached to MARKETEUR or TRANSPORTEUR org via `drivers.user_id` or `delivery_tours.livreur_user_id` | Field execution: start tour, reach/complete checkpoints, scan RFID/meter, capture photos, offline sync | checkpoints, scan_events |

## MFA Policy

- `settings.mfa.enforced_for_roles` = `ADMIN, SUPERADMIN, SUPERVISOR` (default, JSON-encoded in the seed, comma-string in the SQL default — **note the format inconsistency between the JSON seed `["ADMIN","SUPERADMIN","SUPERVISOR"]` and the SQL default `'ADMIN,SUPERADMIN,SUPERVISOR'`**; standardize on one encoding, likely JSON array, before implementation).
- Users in one of those roles must complete MFA setup (`user_mfa`, `mfa_type` ∈ TOTP/SMS/EMAIL) before performing sensitive actions; `users.mfa_status` tracks DISABLED → PENDINGSETUP → ENABLED (LOCKED after repeated failures).
- `settings.session.mfa_grace_minutes` (15) — window to complete an MFA challenge after primary login before the session is invalidated.

## Account Security

- `users.failed_login_count`, `users.locked_until` — driven by `settings.auth.max_failed_login_attempts` (5) and `settings.auth.lockout_duration_minutes` (30).
- `users.must_change_password` — forces a password change flow on next login (e.g., after admin-issued temporary password / AGENT password reset for marketeur staff).
- `user_sessions` tracks IP, geo (country/city/point), MFA-verification state per session; `settings.session.expiry_minutes` (480 = 8h) bounds session lifetime.

## Site & Org Scoping

- `user_site_assignments(user_id, site_id, is_primary)` — determines which operational `sites` a user (typically AGENT, SUPERVISOR, or org staff) can see/act on. A user can have multiple assignments; `is_primary` marks their home site.
- **Org-level scoping** is implicit via `users.org_id` — a MARKETEUR-role user's queries for vehicles/tours/declarations are always filtered to `org_id = users.org_id` (or, for ADMIN/SUPERADMIN, un-scoped or CSPH-wide).
- **Gap to note:** live schema's `user_site_assignments` scopes only to `sites`, not `client_sites` — if AGENT users need per-client-site scoping (e.g. "AGENT X only reviews these 12 client sites"), that scoping mechanism does not currently exist in the DB and needs a design decision (new join table, or reuse via a `site_type` discriminator).

## Custom Role / Permission Catalog (seed-derived)

Observed permission codes actually in use (`10_system_config.json`):
`tours.read`, `tours.write`, `transporters.read`, `reports.read`, `sites.read`, `sites.verify`, `anomalies.read`, `scans.read`, `audit-logs.read`, `audit-logs.export`, `reports.export`, `reconciliations.read`.

Recommended full catalog to seed into `permissions` (module.action pattern), one row per resource × action, covering every table in `01_DATA_MODEL.md`: `organizations.*`, `users.*`, `sites.*` (+`.verify`, `.suspend`), `client-sites.*` (+`.verify`, `.suspend`), `clients.*`, `vehicles.*` (+`.certificate`), `drivers.*`, `devices.*` (+`.assign`, `.sync`), `rfid-tags.*`, `pickups.*` (+`.validate`, `.start`, `.complete`), `tours.*` (+`.send-to-transporter`, `.acknowledge`, `.start`, `.close`, `.cancel`), `checkpoints.*` (+`.reach`, `.complete`, `.skip`), `scans.*` (+`.bulk`), `contracts.*` (`read`, `write`, `create`, `delete`, `manage`, `validate`, `suspend`), `declarations.*` (+`.submit`, `.reconcile`), `reconciliations.*` (+`.verify`), `redressements.*` (+`.mark-paid`, `.waive`), `anomalies.*` (+`.assign`, `.resolve`), `notification-groups.*`, `notification-rules.*`, `risks.*` (+`.recompute`), `reports.*` (+`.download`), `settings.*`, `audit-logs.*`, `custom-roles.*`.

### Transporter contract responsibilities

| Role | Contract responsibilities | Permission codes |
|---|---|---|
| MARKETEUR | Declares, edits, supplies PDF proof, deletes, and manages the primary contract for its organization. | `contracts.create`, `contracts.write`, `contracts.delete`, `contracts.manage` |
| TRANSPORTEUR | Reads contracts involving its organization and accepts them; acceptance sets `transporter_accepted_at` and is limited to its own organization. | `contracts.read`, `contracts.validate` |
| ADMIN / SUPERADMIN | Reads contracts and may suspend or reactivate them. | `contracts.read`, `contracts.suspend` |
