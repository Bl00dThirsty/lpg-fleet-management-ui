# CSPH GPL Traceability System — Documentation Set

**Schema version:** v6.2 (PostgreSQL 15 + PostGIS + TimescaleDB)
**Domain:** National LPG/GPL (bottled 50kg + vrac) distribution traceability under CSPH (Caisse de Stabilisation des Prix des Hydrocarbures) regulation, Cameroon.
**Source of truth used for these docs:** `csph_gpl_schema_v6_2.sql` (authoritative, executable DDL) cross-referenced against `TODO.md` (target functional/API/UX spec) and the 10 seed JSON files.

> ⚠️ **Important divergence note:** `TODO.md` describes an *aspirational* target (e.g. `GEOGRAPHY` columns, `full_name`, `BIGSERIAL` ids, `mfa_enabled` boolean, extra enum values like `NONE`/`SEQUENCE_MISMATCH` for `conflict_status`, extra columns like `expected_quantity`, `terms_json`, `escalation_hours`). The **actual v6.2 SQL** uses `GEOMETRY(POINT,4326)`, `first_name`/`last_name`, `UUID` PKs, `mfa_status` enum, free-text `conflict_status VARCHAR(20)`, and does **not** have `expected_quantity`, `terms_json`, or `escalation_hours`/`escalation_group_id`. Every doc below is grounded in the real SQL first and flags TODO.md deltas explicitly as **"TODO.md target, not yet in schema."**

## Document Map

| File | Purpose |
|---|---|
| `00_README.md` | This index |
| `01_DATA_MODEL.md` | Full entity catalog: every table, column, type, constraint, enum, relationship (ERD in prose + Mermaid) |
| `02_RBAC_ROLES_PERMISSIONS.md` | Role hierarchy, permission model, `user_site_assignments` scoping, custom roles, MFA |
| `03_STATE_MACHINES.md` | Every status enum as a state machine: sites, client_sites, delivery_tours, checkpoints, pickup_requests, devices, rfid_tags, declarations→reconciliations→redressements, anomalies |
| `04_WORKFLOWS_AND_FLUX.md` | End-to-end business flows (Flux 1 Approvisionnement, Flux 2a/2b Livraison, Péréquation, Anomaly routing, Risk scoring, Reporting) |
| `05_API_ENDPOINTS.md` | Full REST + WebSocket route map, grounded in schema, cross-checked vs TODO.md |
| `06_ROLE_FEATURES_AND_VIEWS.md` | Per-role screen/feature breakdown: what each of the 8 system roles can see and do |
| `07_MASTER_IMPLEMENTATION_PROMPT.md` | Deep, single master prompt to hand to a coding agent (Claude Code / other) to implement or audit the full system |

## System Snapshot (from seed data)

- **10 regions** of Cameroon (Adamaoua → Sud-Ouest)
- **15 organizations**: 1 REGULATEUR (CSPH), 7 MARKETEUR, 1 DEPOT (SCDP), 2 TRANSPORTEUR, 4 CLIENT
- **8 `system_role` values**: SUPERADMIN, ADMIN, SUPERVISOR, INTEGRATEUR, AGENT, MARKETEUR, LIVREUR, TRANSPORTEUR
- **40 tables**, **~62 FK relationships**, **29 enum types** (per the project's own dbdiagram.io validation pass)
- **5 TimescaleDB hypertables**: `audit_logs`, `device_status_history`, `vehicle_positions`, `scan_events`, `monitoring_metrics`
- **11 settings-driven thresholds** (no hardcoded business rules)
- **2 materialized views**: `mv_site_risk_summary`, `mv_marketeur_declaration_summary` (explicitly labeled as *proposals* in the SQL comments — verify against original design intent before relying on them)

## Reading Order

1. Start with `01_DATA_MODEL.md` to understand the shape of the data.
2. Read `02_RBAC_ROLES_PERMISSIONS.md` to understand *who* can act.
3. Read `03_STATE_MACHINES.md` and `04_WORKFLOWS_AND_FLUX.md` to understand *what happens, in what order*.
4. Read `05_API_ENDPOINTS.md` and `06_ROLE_FEATURES_AND_VIEWS.md` for the concrete surface area.
5. Use `07_MASTER_IMPLEMENTATION_PROMPT.md` as the operational prompt for any implementation/audit session.
