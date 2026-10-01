# LPG Fleet Management UI — Master Documentation

> **Audience:** new engineers, AI agents, technical reviewers.
> **Goal:** one entry point that answers "what is this system, who uses it, and where do I look for X".

The **CSPH GPL Traceability System** is a country-scale platform for tracking and tracing LPG distribution in Cameroon. It covers the full chain: filling centers → depots → transporters → delivery tours → client sites. It enforces subsidy accountability, prevents fraud (siphonnage, substitution, falsification), and provides operational visibility for the regulator (CSPH), marketeurs (oil operators), and transporteurs (carriers).

This repo is the **web front-end** for that system. Backend is PostgreSQL 15 + PostGIS + TimescaleDB + Fastify; we speak to it through `@lpg/api-client` (a typed REST + WebSocket wrapper).

---

## 1. Quick orientation

| Need | Read |
|---|---|
| "What does this codebase look like?" | [architecture.md](./architecture.md) |
| "What is a `Tournee` / `Marketeur` / `PickupRequest`?" | [domain-model.md](./domain-model.md) |
| "Who can do what?" | [permissions-and-rbac.md](./permissions-and-rbac.md) |
| "What are the legal status transitions?" | [state-machines.md](./state-machines.md) |
| "Walk me through the EXTERNAL tour flow" | [workflows.md](./workflows.md#flux-2b--external-tour-with-transporter-acknowledgment) |
| "What routes exist? Which role sees what?" | [features-and-routes.md](./features-and-routes.md) |
| "What endpoints does the backend expose?" | [api-endpoints.md](./api-endpoints.md) |
| "What are the 11 mandatory settings?" | [data-and-settings.md](./data-and-settings.md) |

If you only have 60 seconds, read §3 (Roles) and §4 (The two fluxes) below — the rest of the system hangs off them.

---

## 2. The system in 200 words

- **Five organization types** (`org_type`): `REGULATEUR` (CSPH), `DEPOT` (SCDP/SNH), `MARKETEUR` (oil company), `TRANSPORTEUR` (carrier), `CLIENT` (commercial buyer).
- **Two physical products**: `VRAC` (bulk LPG, measured in **TM** — tonnes métriques) and `BOUTEILLES50KG` (50 kg bottles, counted as **btl**).
- **Two main fluxes**:
  - **Flux 1 — Approvisionnement.** Marketeur requests to move product from a depot/filling center to another site. Vehicle is loaded; mission is GPS-tracked.
  - **Flux 2 — Livraison.** Marketeur creates a *tournée* (delivery tour). It is either **INTERNAL** (marketeur's own crew executes) or **EXTERNAL** (transporter must acknowledge and assign their own crew). At each checkpoint the livreur scans bottles or reads the VRAC meter.
- **One evidentiary record**: every scan event is a `scan_events` row in a TimescaleDB hypertable, with 5-year retention, never compressed. This is the legal proof.
- **One regulatory loop**: at month end the marketeur submits a `Declaration` of volume sold. The system reconciles it against tracked volume, computes a `volume_gap`. If the gap exceeds the tolerance (default 2.5%), a `Redressement` is issued.

---

## 3. The eight roles

Defined by `Role` in `packages/types/src/index.ts`. The full hierarchy, sidebar projection, and permission matrix live in [permissions-and-rbac.md](./permissions-and-rbac.md).

| Tier | Role | What they are | Home view |
|---|---|---|---|
| 100 | `SUPERADMIN` | CSPH regulator staff with national scope. | `/dashboard` |
| 80 | `ADMIN` | CSPH staff scoped to a region/marketeur set. | `/dashboard-admin` |
| 60 | `SUPERVISOR` | Technical ops (infra, devices, integrations). | `/dashboard-supervisor` |
| 60 | `INTEGRATEUR` | IoT integration partner (devices, GPS config). | `/overview` |
| 60 | `AGENT` | Field validator (sites, declarations, anomalies). | `/overview` |
| 40 | `MARKETEUR` | Oil-company operator. Owns pickups, tours, declarations. | `/overview` |
| 40 | `TRANSPORTEUR` | Carrier. Acknowledges external tours, owns crew. | `/transporters` |
| 20 | `LIVREUR` | PDA operator. No web UI. (PDA screens deferred.) | — |

`canCreate(actor, target)` requires `HIERARCHY_LEVEL[actor] >= HIERARCHY_LEVEL[target]` — a user can only create subordinates **at or below** their own tier.

MARKETEUR never sees organization-level views (`/marketers`, `/organizations`) per AGENTS.md §4. Their sidebar shows `overview` plus their own fleet/operations.

---

## 4. The two fluxes (one-paragraph each)

**Flux 1 — Approvisionnement** ([full flow](./workflows.md#flux-1--approvisionnement)). MARKETEUR drafts a `PickupRequest` (source site → destination site, requested quantity). System recommends vehicles by capacity. MARKETEUR assigns vehicles. ADMIN or MARKETEUR validates. Mission starts → GPS on. Mission completes with a proof photo (uploaded to MinIO bucket `csph-proofs`).

**Flux 2 — Livraison.** Two sub-modes:
- **Flux 2a — INTERNAL** ([full flow](./workflows.md#flux-2a--internal-delivery-tour)). MARKETEUR creates a tour with `execution_mode=INTERNAL`, picks own vehicle/driver/livreur, status = `PLANNED`. LIVREUR starts on PDA, reaches each checkpoint, scans IN/OUT (bottles) or records a meter reading (VRAC), closes the tour. `delivered_quantity` is computed from scan totals.
- **Flux 2b — EXTERNAL** ([full flow](./workflows.md#flux-2b--external-tour-with-transporter-acknowledgment)). Same as 2a but vehicle/driver/livreur are **NULL** at creation. Status = `PENDINGTRANSPORTERACK`. Transporter sees the tour in their `/transporters/tours-pending` queue, acknowledges, assigns their own crew. If no ack within `tournee.transporter_ack_timeout_hours` (default **4h**), the system auto-creates a `TRANSPORTERNOACK` anomaly.

---

## 5. State machines at a glance

Six finite-state machines are enforced across the system. See [state-machines.md](./state-machines.md) for full diagrams and rules.

| Machine | States | Where it lives |
|---|---|---|
| **Tournee** | `DRAFT → PLANNED → INPROGRESS → CHECKPOINTACTIVE → CLOSED` (INTERNAL) or `DRAFT → PENDINGTRANSPORTERACK → ACKNOWLEDGED → INPROGRESS → …` (EXTERNAL) | `features/tours/data/tour-machine.ts` |
| **PickupRequest** | `DRAFT → VALIDATED → INPROGRESS → COMPLETED` | `features/pickups/` |
| **Site / ClientSite** | `UNASSIGNED → ASSIGNED → ACTIVE → VERIFIED` (auto-promotion by geo confidence & delivery count) | `features/sites/lib/site-status-machine.ts` |
| **Device** | `UNASSIGNED → ASSIGNED → INMISSION` (plus 9 sideline statuses) | `features/devices/` |
| **RFID tag** | `AVAILABLE → ASSIGNEDTOBOTTLE → INTRANSITOUT → INTRANSITIN → AVAILABLE` | `features/rfid-tags/` |
| **Declaration** | `DRAFT → SUBMITTED → RECONCILED → VERIFIED → REDRESSEMENTAPPLIED → (PAID \| WAIVED)` | `features/declarations/`, `features/reconciliations/`, `features/redressements/` |

`CANCELLED` is reachable from early states of Tournee (`DRAFT, PLANNED, PENDINGTRANSPORTERACK, ACKNOWLEDGED`) and Pickup (`DRAFT, VALIDATED`).

---

## 6. The 11 mandatory settings

All business rules read from the `settings` table by `setting_key`. Hardcoded thresholds are forbidden. Source: `packages/mock-data/src/seed/curated/10_system_config.json`. Full list with values in [data-and-settings.md](./data-and-settings.md).

| Key | Default | Used by |
|---|---|---|
| `geo.confidence_auto_verify_threshold` | 80 | Site auto-promotion to ACTIVE |
| `geo.confidence_flag_threshold` | 30 | Manual review flag |
| `device.battery_critical_threshold` | 15 | `BATTERYCRITICAL` anomaly trigger |
| `device.offline_alert_minutes` | 30 | `DEVICEOFFLINE` anomaly trigger |
| `reconciliation.volume_gap_tolerance_percent` | 2.5 | Redressement threshold |
| `tournee.transporter_ack_timeout_hours` | 4 | `TRANSPORTERNOACK` anomaly |
| `tournee.unassigned_alert_hours` | 12 | `TOURNEEUNASSIGNEDTOOLONG` anomaly |
| `audit.retention_years` | 5 | audit_logs, scan_events retention |
| `mfa.enforced_for_roles` | `["ADMIN","SUPERADMIN","SUPERVISOR"]` | MFA enforcement |
| `gps.capture_interval_minutes` | 60 | vehicle_positions capture (restart req.) |
| `report.default_expiry_days` | 30 | report download expiry |

---

## 7. Tech stack at a glance

- **Monorepo**: pnpm workspaces + Turborepo.
- **Web app**: Vite + React 19 + TypeScript (strict), TanStack Router (file-based, static routes only), TanStack Query, Tailwind + shadcn/ui, Recharts.
- **State**: Zustand for UI/role; TanStack Query for server state; localStorage/IndexedDB for offline (PDA).
- **Shared packages**: `@lpg/types` (domain enums & entities), `@lpg/permissions` (CASL-based RBAC), `@lpg/api-client` (REST + WS wrapper), `@lpg/mock-data` (seed fixtures), `@lpg/config` (env, tsconfig), `@lpg/ui` (shared components).
- **Maps**: ArcGIS JavaScript API.
- **Backend (referenced, not in repo)**: PostgreSQL 15 + PostGIS + TimescaleDB, Fastify, MinIO (S3-compatible), Kafka, Prometheus, Grafana.

---

## 8. Conventions (cheat-sheet)

Full rules: `AGENTS.md` at repo root.

- **English** in code, file names, URLs, types. **French** only in `label` strings.
- **UPPERCASE** for every enum value, type, table name. No `snake_case` enum values.
- **Units**: VRAC = **TM**, bottles = **btl**. Never liters, never kg.
- **One file per responsibility.** Feature tree = `features/<domain>/{index.tsx, components/, data/, lib/, utils/}`. No duplicates.
- **Static routes only.** No `$role/$module` dynamic router. Sidebar is permission-gated, not URL-prefixed.
- **Settings-driven, zero hardcoded thresholds.** If you need a number, add a `settings` row.
- **No raw lat/lng floats.** All geo is PostGIS `GEOGRAPHY(POINT, 4326)`.
- **File storage**: MinIO. Database stores URLs, never blobs.

---

## 9. Glossary

| Term | Meaning |
|---|---|
| **Bouteille / btl** | A 50 kg LPG cylinder. Counted individually. |
| **Checkpoint** | A delivery stop on a tour, either a `site` or a `client_site`. |
| **Client site (`client_site`)** | A commercial buyer's premises (separated from `sites` table). |
| **CSPH** | Cameroon LPG regulatory authority. Operates at the SUPERADMIN tier. |
| **Declaration** | Monthly volume self-report submitted by a marketeur. |
| **Flux 1** | Approvisionnement (pickup from depot to site). |
| **Flux 2a / 2b** | Livraison: INTERNAL (marketeur crew) / EXTERNAL (transporter crew). |
| **Livreur** | PDA operator / driver; the lowest-tier user. |
| **Marketeur** | Oil company. The operator that owns pickups, tours, declarations. |
| **MFA** | Multi-factor auth. Enforced for ADMIN/SUPERADMIN/SUPERVISOR. |
| **Reconciliation** | Computed comparison of declared vs tracked volume. |
| **Redressement** | Financial penalty issued when reconciliation gap > tolerance. |
| **Scan event** | A single RFID or VRAC meter reading at a checkpoint. Primary evidentiary record. |
| **Site** | Operational site: filling center, depot, or provisionable point. |
| **TM** | Tonne métrique. The unit for VRAC volume. |
| **Tournee / Tour** | A delivery route with N checkpoints. |
| **Transporter** | Carrier that executes external tours under contract. |
| **VRAC** | Bulk LPG, transported by tank truck. |

---

## 10. Status of this documentation

This is the master entry point. Deep-dive files exist for every section. As code, schema, and TODO.md evolve, **this tree is the contract** — re-read it before working on unfamiliar areas.

If you spot a gap between this doc and the code, the **code is canonical for "what exists"** and **TODO.md is canonical for "what should exist"** — file an issue to reconcile.
