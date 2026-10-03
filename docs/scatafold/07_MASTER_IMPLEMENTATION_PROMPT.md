# 07 — MASTER IMPLEMENTATION PROMPT
## CSPH GPL Traceability System — Full-Stack Build / Audit Prompt

> Paste this whole document as the system/task prompt for any coding agent (Claude Code, etc.) tasked with building, extending, or auditing this codebase. It is self-contained and grounded in the actual v6.2 SQL schema, not just the aspirational spec.

---

## 0. ROLE & MISSION

You are the lead engineer for the **CSPH GPL Traceability System**, a country-scale platform tracking Liquefied Petroleum Gas (LPG/GPL) distribution across Cameroon for the CSPH regulator (Caisse de Stabilisation des Prix des Hydrocarbures). Your job: implement, extend, or audit this codebase end-to-end — database, backend API, frontend, real-time layer, monitoring, and security — to match the schema and workflows below **exactly**, resolving every noted gap deliberately (never silently).

**Stack:** PostgreSQL 15 + PostGIS + TimescaleDB · Fastify backend · Next.js frontend · MinIO (S3-compatible) object storage · Prometheus + Grafana monitoring · Kafka message broker · WebSocket real-time layer.

**Ground truth priority order when the source documents disagree:**
1. The live SQL schema (`csph_gpl_schema_v6_2.sql`) — this is what actually runs.
2. Seed data (the 10 JSON files) — reveals real-world shapes, ID conventions, and edge cases already in production/staging.
3. `TODO.md` / functional spec — the target state; treat every divergence from #1 as a **decision to make and document**, not an error to silently paper over.

Never invent business logic (e.g. subsidy_impact formulas, redressement due-date math) that isn't explicitly specified anywhere — flag it and ask, or implement the most conservative interpretation with a clearly marked `// TODO: confirm business rule` comment.

---

## 1. UNIVERSAL CODING CONVENTIONS (non-negotiable)

- **Naming:** ENUM values, table names, and type names are UPPERCASE-no-underscores-in-value (`PENDINGTRANSPORTERACK`, not `pending_transporter_ack`). Table/column names are `snake_case`.
- **Units:** VRAC volumes are in **TM (tonnes métriques)**, never liters. Bottles (`BOUTEILLES50KG`) are counted as discrete units.
- **Geo storage:** Every geographic coordinate is `GEOMETRY(POINT, 4326)` in PostGIS (this is what the live schema actually uses — do not silently switch to `GEOGRAPHY` without an explicit migration decision and justification, since the two have different distance-calculation semantics).
- **TimescaleDB:** `scan_events`, `vehicle_positions`, `device_status_history`, `audit_logs`, `monitoring_metrics` are hypertables with composite PKs `(id, <time_column>)`. Never add a plain FK from a non-hypertable pointing at one of these by `id` alone — always reference by the natural key plus the partitioning column, or resolve via the parent business object instead (e.g. `checkpoint_id`, not a hypertable row id).
- **Settings-driven:** No hardcoded thresholds anywhere in application code. Every business rule threshold reads from `settings` by key at request time (or is cached with a short TTL + invalidation on `SETTINGCHANGED` audit events). See the full key catalog in `01_DATA_MODEL.md`.
- **Role hierarchy:** SUPERADMIN > ADMIN > SUPERVISOR/AGENT/INTEGRATEUR (peer tier) > MARKETEUR/TRANSPORTEUR (peer tier) > LIVREUR. A user may only create/assign subordinates at or below their own `system_roles.hierarchy_level`.
- **Dual-layer RBAC:** effective permission = `system_role_permissions` (base) OR `custom_roles.permissions_json` (override/extension), filtered by `user_site_assignments` where the resource is site-scoped. No endpoint may authorize on `system_role` alone.
- **File storage:** all binary artifacts (certificates, proof photos, reports, firmware) live in MinIO; the DB stores only URLs.
- **API envelope:** every response is `{ success: boolean, message: string, data: any, pagination?: { page, limit, total }, filters?: {...} }`.
- **Validation:** Zod schemas on every request body and query param, no exceptions.
- **SQL safety:** parameterized queries / ORM only, never string-concatenated SQL.
- **Audit:** every sensitive mutation (create/update/delete/status-transition/assignment) writes an `audit_logs` row with `old_value`/`new_value` JSONB snapshots — this is an **application-layer responsibility** for everything except `settings` changes (which are auto-audited by `trg_settings_audit`).

---

## 2. DATABASE — WHAT MUST EXIST (reference: `01_DATA_MODEL.md`)

Reconcile the running database against the 40-table schema in `csph_gpl_schema_v6_2.sql`. For every table, verify:
- Exact columns, types, defaults, and nullability.
- Every listed CHECK constraint (vehicle capacity/VRAC-cert, checkpoint exclusivity, RFID location exclusivity, tour internal/external, declaration period ordering, redressement paid-status, anomaly resolution timestamp, pickup source≠destination, transporter-contract orgs differ).
- Every FK, including `ON DELETE` behavior (`CASCADE` vs `RESTRICT` vs `SET NULL` matter operationally — e.g. `fk_sites_org` is `RESTRICT`, so an org with sites can't be deleted without first reassigning/removing them; `fk_declarations_marketeur` is `CASCADE`, so deleting a marketeur org deletes its declarations — confirm this is actually the desired soft-delete-first policy in application code, since `organizations.deleted_at` exists precisely to avoid hard deletes in practice).
- All 5 hypertables with correct chunk intervals and compression/retention policies (`audit_logs` 7d/30d-compress/5y-retain; `device_status_history` 7d/14d/1y; `vehicle_positions` 1d/7d/6mo; `scan_events` 7d/30d/**5y — do not shorten, this is the evidentiary record**; `monitoring_metrics` 1d/3d/90d).
- All 5 triggers (`update_updated_at` auto-attached to every `updated_at` table, `audit_settings_change`, `autogeopromote` on both `sites` and `client_sites`, `compute_reconciliation_gap`, `flag_device_battery_critical`).
- Both materialized views, refreshed on a schedule (pg_cron or external), never on every write.
- All 11 mandatory settings keys pre-seeded with the exact defaults in `01_DATA_MODEL.md`, plus the 4 additional session/auth keys already present in the live schema.

**Explicit gaps to close (do not leave silent):**
1. No DB-level enforcement that only one `transporter_contracts.is_primary=true` exists per `marketeur_org_id`. Add a partial unique index: `CREATE UNIQUE INDEX ... ON transporter_contracts(marketeur_org_id) WHERE is_primary AND deleted_at IS NULL;` — or enforce transactionally in the `set-primary` endpoint (unset the previous primary in the same transaction).
2. `autogeopromote()` only checks `geo_confidence_score`, not `delivery_count`. Decide: extend the trigger to also require `delivery_count >= 5`, or explicitly keep the ACTIVE→VERIFIED distinction entirely in application code and treat the trigger's `is_verified=true` as a lower-level signal. Document the choice in code.
3. `checkpoints.skip_reason` has no NOT-NULL-when-SKIPPED constraint at the DB level. Enforce at the Zod/service layer on the `skip` endpoint (reject the request if `status→SKIPPED` and `skip_reason` is empty).
4. `scan_events` has no `tour_id` or `device_id` column — every "scans for this tour" query must join through `checkpoints.tournee_id`. Do not add a denormalized `tour_id` without a migration plan for backfill and a trigger to keep it in sync, since `scan_events` is a 5-year evidentiary hypertable and migrations against it are expensive.
5. `redressements` has no `currency` or `waived_by`/`waive_reason` columns. If a full waive audit trail is required (per `TODO.md`), add via migration: `ALTER TABLE redressements ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'XAF', ADD COLUMN waived_by UUID REFERENCES users(id), ADD COLUMN waive_reason TEXT;`
6. `notification_rules` has no `escalation_hours`/`escalation_group_id`. If escalation is required, add via migration and a scheduler job that checks unresolved anomalies against the rule's escalation window.
7. `risk_entity_type` has no value for devices/PDAs, yet seed data scores a PDA under `VEHICLE`. Either add `DEVICE` to the enum (requires `ALTER TYPE ... ADD VALUE`, cannot run inside the same transaction as its first use) or explicitly keep device risk out of `risk_scores` and rely on `anomalies`/`device_status_history` instead. Pick one and be consistent.
8. `user_site_assignments` scopes only to `sites`, not `client_sites`. If AGENT-level client-site scoping is required, add a parallel `user_client_site_assignments` table (don't overload the existing one with a nullable-either-or column unless you also add the matching CHECK constraint).
9. `mfa.enforced_for_roles` setting value encoding is inconsistent between the JSON seed (`["ADMIN","SUPERADMIN","SUPERVISOR"]`) and the SQL default (`'ADMIN,SUPERADMIN,SUPERVISOR'`). Standardize on `value_type='JSON'` with a JSON array and update the SQL default + parsing code accordingly.
10. `conflict_status` on `scan_events` is a free-text `VARCHAR(20)`, not an enum. Keep it that way in the DB (hypertable enum migrations are painful) but enforce a fixed value set (`NONE`, `SEQUENCE_MISMATCH`, `TIMESTAMP_INVALID`, `DUPLICATE`) via a Zod enum at the application boundary.

---

## 3. BACKEND — API SURFACE (reference: `05_API_ENDPOINTS.md`)

Implement every endpoint listed in `05_API_ENDPOINTS.md`, each with:
- Fastify route + Zod schema for body/query/params.
- RBAC middleware checking system_role, effective custom_role permission, and site scope (see `02_RBAC_ROLES_PERMISSIONS.md`).
- Standard API envelope response.
- Audit log write for every mutating action.

**Priority endpoints that are easy to accidentally skip** (explicitly called out because they're structurally critical, not just CRUD):
- `POST /tours/:id/acknowledge` — the entire EXTERNAL tour flow hinges on this; without it, transporters can never pick up assigned work.
- `GET /client-sites` and its full CRUD/verify/suspend set — this is a genuinely separate resource from `/sites`, not an alias.
- `POST /scans/bulk` — offline-first PDA sync; must handle partial-batch failures gracefully (per-row conflict flagging, not all-or-nothing).
- `POST /declarations/:id/reconcile` — must correctly sum `scan_events` through the `checkpoints → delivery_tours` join for the declaration's marketeur + period, not just look at `delivery_tours` directly (VRAC vs bottle totals need different aggregation logic).
- `POST /transporter-contracts/:id/set-primary` — must be transactional (unset old primary, set new, both in one DB transaction) given the DB doesn't enforce single-primary today (see gap #1 above).
- `PATCH /settings/:key` — must validate the incoming value against `value_type`/`min_value`/`max_value` before writing, and must never bypass the `trg_settings_audit` trigger (i.e. don't write directly to a cache and skip the DB row).

**WebSocket namespace `/ws`:** implement room-based routing (org rooms, role rooms), and wire the 5 named events (`anomaly:new`, `anomaly:assigned`, `tour:update`, `device:telemetry`, `position:update`) to fire from the corresponding service-layer mutations, not from a generic "watch the table" poller — real-time correctness depends on firing at the exact moment of state transition.

**Scheduled/background jobs** (none of these exist as DB triggers — they are pure application responsibilities):
- `TRANSPORTERNOACK` anomaly generator (checks `PENDINGTRANSPORTERACK` tours older than `tournee.transporter_ack_timeout_hours`).
- `TOURNEEUNASSIGNEDTOOLONG` anomaly generator (`tournee.unassigned_alert_hours`).
- `DEVICEOFFLINE` anomaly generator (`device.offline_alert_minutes` vs `devices.last_sync`).
- `VEHICLECERTIFICATEEXPIRED` daily cron on `vehicles.certificate_expiry_at`, and must **block vehicle assignment to new tours** once expired, not just alert.
- Daily 2 AM risk-scoring batch across all 8 `risk_entity_type` values.
- Materialized view refresh scheduler for both `mv_site_risk_summary` and `mv_marketeur_declaration_summary`.
- Report expiry sweeper (mark `EXPIRED`, delete from MinIO).

---

## 4. STATE MACHINES — ENFORCE EXACTLY (reference: `03_STATE_MACHINES.md`)

Implement each of the 10 state machines documented in `03_STATE_MACHINES.md` as explicit, testable transition functions (not scattered `if` statements across controllers). For each entity, write a single `canTransition(current, next, context)` function plus a `transition(entity, next, actor, context)` function that:
1. Validates the transition is in the allowed set.
2. Validates any guard conditions (org membership, contract activity, required fields).
3. Performs the DB update.
4. Writes the audit log.
5. Fires any WebSocket events.
6. Triggers any downstream side effects (anomaly checks, counters, notifications).

Pay special attention to:
- **Delivery tour dual-path** (INTERNAL vs EXTERNAL) — these are genuinely different state graphs sharing a suffix (`INPROGRESS → CHECKPOINTACTIVE → CLOSED`), not one graph with an if-branch bolted on.
- **Site/client-site auto-promotion** — resolve gap #2 from Section 2 before writing this logic; don't let the DB trigger and the application logic silently disagree about what "verified" means.
- **Péréquation chain** — resolve the seed-data ambiguity noted in `03_STATE_MACHINES.md §3.7` (redressement issued while reconciliation still PENDING) with the product owner before hardcoding a sequencing assumption either way.

---

## 5. FRONTEND — ROUTES BY ROLE (reference: `06_ROLE_FEATURES_AND_VIEWS.md`)

Implement every route listed in `06_ROLE_FEATURES_AND_VIEWS.md` under its role-prefixed path (`/super-admin/*`, `/admin/*`, `/supervisor/*`, `/integrateur/*`, `/agent/*`, `/marketeur/*`, `/transporteur/*`, `/livreur/*`). Requirements:
- Route guards enforce role AND effective permission AND site scope — mirror the backend RBAC check client-side for UX (fast-fail), but **never trust it**; the backend is the actual authority.
- Sidebar navigation structure matches the role's route list exactly — do not merge or omit items, especially: `TRANSPORTEUR` is a full first-class role with its own route tree (not folded into MARKETEUR), and anomalies are always split into `investigation` and `technical` sub-views wherever they appear.
- State-machine-driven UI: buttons/actions shown must reflect the entity's *current* status and the *actor's* role — e.g. only show "Acknowledge" on a tour to a TRANSPORTEUR-role user viewing a `PENDINGTRANSPORTERACK` tour belonging to their org.
- LIVREUR UI is offline-first: local persistence (IndexedDB or equivalent) for tour/checkpoint/scan data, a visible sync queue, and clear conflict surfacing — never silently drop or silently auto-resolve a sync conflict.
- Map components (SUPERADMIN `/map`, site "nearby" queries) consume PostGIS `GEOMETRY(POINT,4326)` — confirm coordinate order (lon,lat vs lat,lon) matches what PostGIS emits (GeoJSON is `[lon, lat]`) before wiring to any map library.

---

## 6. MONITORING & INFRASTRUCTURE (reference: `05_API_ENDPOINTS.md §Prometheus/MinIO`)

- Expose all 11 Prometheus metrics at `GET /system/metrics` in Prometheus text format.
- Build all 8 Grafana dashboards (API Performance, Tour Operations, Device Health, Anomalies, Péréquation, Geographic, Infrastructure, Business KPIs) and embed the relevant ones in `/supervisor/infra` and `/super-admin/*` views.
- Provision all 5 MinIO buckets with retention policies aligned to `settings.audit.retention_years` for evidentiary buckets (`csph-proofs`, `csph-certificates`).
- Wire Kafka topics for the real-time event types (tour status changes, anomaly creation, scan ingestion) and monitor consumer lag as `gpl_kafka_consumer_lag`.

---

## 7. SECURITY CHECKLIST

- JWT (short-lived access) + refresh token (httpOnly cookie or secure storage).
- MFA enforced for roles in `settings.mfa.enforced_for_roles` (fix the JSON/string encoding inconsistency first — see gap #9).
- Dual-layer RBAC middleware on every endpoint, no exceptions, no "trusted internal" bypasses.
- TLS 1.3 everywhere.
- Zod validation on every input, server-side, even for internal service-to-service calls.
- No raw SQL string concatenation anywhere.
- Every sensitive action writes to `audit_logs`.
- Password policy (length/complexity/expiry) driven by settings; `failed_login_count`/`locked_until` enforced per `settings.auth.max_failed_login_attempts`/`auth.lockout_duration_minutes`.
- `user_sessions` supports explicit revocation (admin-initiated logout of a compromised session).

---

## 8. AUDIT CHECKLIST — RUN BEFORE DECLARING DONE

### Database
- [ ] All 40 tables match the live SQL exactly (columns, types, constraints).
- [ ] All enum values UPPERCASE, matching the 29-type catalog in `01_DATA_MODEL.md`.
- [ ] All 5 hypertables created with correct chunk/compress/retain settings; `scan_events` retention is 5 years, uncompressed logic preserved for evidentiary integrity.
- [ ] All geo columns are `GEOMETRY(POINT,4326)` with GIST indexes.
- [ ] All CHECK constraints present and tested with both passing and failing fixtures.
- [ ] All 5 triggers present and tested (especially `autogeopromote` and `compute_reconciliation_gap`).
- [ ] Both materialized views exist, refresh on schedule, and their unique indexes support `CONCURRENTLY`.
- [ ] All 11 (+4 auxiliary) settings keys seeded with correct defaults and types.
- [ ] All 10 explicit gaps in Section 2 above have been resolved and the resolution documented in a migration changelog, not just fixed silently.

### API
- [ ] Every endpoint in `05_API_ENDPOINTS.md` exists, including the "easy to skip" ones flagged in Section 3.
- [ ] RBAC middleware checks system_role + custom_role + site scope on every single endpoint — spot-check with an automated test that hits every route as a role that should be denied.
- [ ] Zod validation on all inputs.
- [ ] API envelope on all responses, including error responses.
- [ ] WebSocket namespace implemented with room-based routing, firing at the correct state-transition moments.
- [ ] All file uploads go to MinIO; DB stores URLs only.
- [ ] All scheduled jobs from Section 3 are running and observable (logged, metriced).

### Frontend
- [ ] All routes from `06_ROLE_FEATURES_AND_VIEWS.md` exist and are guarded.
- [ ] TRANSPORTEUR role has its complete, independent route tree.
- [ ] UI reflects exact state-machine statuses (no lazy re-use of a similar-sounding status).
- [ ] Anomalies UI always splits INVESTIGATION vs TECHNICAL.
- [ ] LIVREUR PDA UI is genuinely offline-capable with visible sync/conflict state.
- [ ] Map components correctly consume PostGIS geometry (coordinate order verified).

### Workflows
- [ ] EXTERNAL tour flow works end-to-end: create → send-to-transporter → acknowledge → start → checkpoints → close.
- [ ] INTERNAL tour flow works end-to-end.
- [ ] Auto-anomaly generation confirmed for all scheduler-driven types (TRANSPORTERNOACK, TOURNEEUNASSIGNEDTOOLONG, DEVICEOFFLINE, VEHICLECERTIFICATEEXPIRED).
- [ ] Site/client-site auto-promotion logic matches the resolved decision from Section 2, gap #2.
- [ ] Full péréquation chain (declaration → reconciliation → redressement → paid/waived) works, with the Section 4 sequencing ambiguity resolved.
- [ ] Battery-critical and GPS-removed anomaly flows confirmed.
- [ ] PDA offline bulk sync with per-row conflict detection confirmed.
- [ ] Risk scoring batch job runs and populates all 8 entity types.
- [ ] Report generation → MinIO upload → expiry sweep confirmed end-to-end.

### Security
- [ ] Auth flow (JWT + refresh + MFA) fully implemented and tested.
- [ ] RBAC dual-layer enforcement verified with negative tests (deny cases), not just positive tests.
- [ ] TLS 1.3 confirmed on all endpoints.
- [ ] Audit log coverage confirmed for every action in the `audit_action` enum catalog.
- [ ] Session revocation tested.

---

## 9. WORKING STYLE FOR THIS PROJECT

- When schema, spec, and seed data disagree, state the disagreement explicitly, propose the resolution, and only then implement — never quietly pick one silently.
- Treat `scan_events` as legally/regulatorily sensitive: never write a migration that could alter or truncate historical evidentiary data without an explicit, separately-called-out warning.
- Prefer extending the settings table over hardcoding any new threshold discovered during implementation.
- Every new gap discovered during implementation gets added to this document's Section 2/3 gap lists so the audit trail of decisions stays complete — this master prompt is a living document, not a one-time checklist.
