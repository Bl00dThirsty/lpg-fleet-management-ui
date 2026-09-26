<!-- generated-by: gsd-doc-writer -->
# CSPH GPL Traceability System — phased scaffold

This directory is the implementation-facing scaffold for the CSPH GPL traceability platform. It is intentionally phase-oriented, but the executable SQL schema is authoritative for table, column, constraint, enum, and status names.

## Source-of-truth order

1. [`../../..//csph_gpl_schema_v6_2.sql`](../../../csph_gpl_schema_v6_2.sql) for database names and constraints.
2. [`../../../TODO.md`](../../../TODO.md) for target workflows and acceptance intent.
3. Current frontend source, `AGENTS.md`, and the canonical docs in [`../`](../) for implemented architecture.
4. Curated fixtures under `packages/mock-data/src/seed/curated/` for development examples, not schema authority.

The current frontend is a Vite/React/TanStack Router application in `apps/web`; this scaffold does not establish a backend deployment or assert that every TODO endpoint exists.

## Phased delivery map

| Phase | Scaffold | Outcome |
|---|---|---|
| 0 | [`01_DATA_MODEL.md`](01_DATA_MODEL.md) | Schema-aligned entities, relationships, and boundaries |
| 1 | [`02_RBAC_ROLES_PERMISSIONS.md`](02_RBAC_ROLES_PERMISSIONS.md) | Hierarchy, effective permissions, scope |
| 2 | [`03_STATE_MACHINES.md`](03_STATE_MACHINES.md) | Exact status lifecycles and guards |
| 3 | [`04_WORKFLOWS_AND_FLUX.md`](04_WORKFLOWS_AND_FLUX.md) | End-to-end business sequences |
| 4 | [`05_API_ENDPOINTS.md`](05_API_ENDPOINTS.md) | Contract boundary without invented endpoints |
| 5 | [`06_ROLE_FEATURES_AND_VIEWS.md`](06_ROLE_FEATURES_AND_VIEWS.md) | Permission-gated frontend views |
| 6 | [`07_MASTER_IMPLEMENTATION_PROMPT.md`](07_MASTER_IMPLEMENTATION_PROMPT.md) | Implementation/audit checklist |
| 7 | [`08_CREATE_FORMS_AND_WORKFLOWS.md`](08_CREATE_FORMS_AND_WORKFLOWS.md) | Form and mutation conventions |

## Cross-cutting frontend contract

- Static routes only under `apps/web/src/routes/_authenticated/<domain>/index.tsx`; no role-prefixed or dynamic role/module router. All roles land on `/overview` after login. `/dashboard` remains a separate national view.
- Features use `features/<domain>/{index.tsx,components,data,lib,utils}`. Pure state machines and business rules live in `lib/` with colocated tests; data/view builders live in `data/`.
- Effective authorization is dual-layer: `system_role` grants OR active `custom_roles`, constrained by site scope. UI guards, store guards, and form scoping are defense in depth; the backend remains authoritative.
- Operational data builders apply `getScope`/`scopeFilter`/`scopeBySiteOrCreator`; MARKETEUR sees its site and own creations, TRANSPORTEUR sees its organization's operational scope, AGENT sees assigned sites, and LIVREUR sees assigned missions.
- Business thresholds are read from `settings` (`packages/mock-data/src/settings.ts`, curated `10_system_config.json`); no embedded geo, battery, offline, SLA, retention, MFA, GPS, or tolerance values.
- VRAC is displayed in **TM**; 50 kg bottles are counted as **btl**.
- Forms use `react-hook-form`, Zod, and shadcn `Form`; validation is inline through `FormMessage`, never toasted. Mutations use the shared toast feedback path with exactly one Sonner outcome per mutation, disable while pending, and invalidate the affected resource query key. WebSocket events invalidate matching query keys too.
- Data-heavy routes expose loading, error, empty, and stale/pending states. Animation must honor `usePrefersReducedMotion`; labels are localized in FR/EN.
- Certificates, proofs, reports, and other binaries belong in MinIO. The database stores URL references only. Deletes on soft-delete tables set `deleted_at`; reads omit deleted rows; no restore endpoint is documented.
- Curated market/organization fixtures are imported into the fake adapter as development seed data. Fixture rows are not a production import contract: fake login selects an `AUTH_FIXTURES` profile by email, and CRUD changes are local in-memory mutations. Features must access data through `@lpg/api-client`, not import curated JSON directly.

## Reading map

Use [`../domain-model.md`](../domain-model.md), [`../data-and-settings.md`](../data-and-settings.md), [`../permissions-and-rbac.md`](../permissions-and-rbac.md), [`../features-and-routes.md`](../features-and-routes.md), [`../architecture.md`](../architecture.md), [`../state-machines.md`](../state-machines.md), and [`../workflows.md`](../workflows.md) for the maintained cross-cutting truth. The scaffold phases point back to those documents when a table is not the right place to repeat frontend conventions.
