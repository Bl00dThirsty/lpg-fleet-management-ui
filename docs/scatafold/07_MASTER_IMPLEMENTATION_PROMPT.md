<!-- generated-by: gsd-doc-writer -->
# 07 — Master implementation and audit prompt

You are auditing or extending the CSPH GPL traceability frontend and its contract with a PostgreSQL/PostGIS/TimescaleDB domain. Use [`../../../csph_gpl_schema_v6_2.sql`](../../../csph_gpl_schema_v6_2.sql), [`../../../TODO.md`](../../../TODO.md), [`AGENTS.md`](../../../AGENTS.md), and the current source as the evidence set. This is a prompt for engineering work, not a declaration that the production backend is present.

## Non-negotiable rules

1. Preserve SQL names, columns, constraints, enum values, and units. Use `GEOMETRY(POINT, 4326)` for v6.2, TM for VRAC, and `btl` for 50 kg bottles.
2. Use static routes and the feature-folder pattern. Every role lands on `/overview`; do not add role-prefixed or dynamic module routes.
3. Use dual-layer RBAC: `system_role` base grants OR active custom roles, constrained by site scope and hierarchy. Enforce in UI, store, and form.
4. Apply `getScope`/scope helpers to operational builders. MARKETEUR has no organization view.
5. Read all business thresholds from `settings` through the existing accessors; do not embed 4, 12, 15, 30, 2.5, 5, 60, 80, or another default in business code.
6. Use `react-hook-form` + Zod + shadcn Form with inline `FormMessage`; never toast field validation. Use one Sonner outcome per mutation, pending state, optimistic rollback where appropriate, and query invalidation.
7. Use MinIO URL references for files, soft delete for rows with `deleted_at`, and explicit query states. Honor FR/EN and reduced motion.
8. Treat curated market/organization fixtures as fake-adapter seed data, not a production import API. Access them through `@lpg/api-client`; do not import JSON from features.
9. Do not invent backend endpoints, columns, permissions, statuses, or WebSocket events. Mark unverified infrastructure claims as verification items.

## Phased audit sequence

### Phase 0 — inventory

Read the schema, TODO, AGENTS, current route tree, feature folders, permissions package, API client, fake adapter, and canonical docs. Identify columns and endpoints that are in the schema but absent from the frontend, and frontend behavior that is not backed by a verified backend.

### Phase 1 — identity and scope

Verify role hierarchy, effective permission resolution, custom roles, MFA settings, hierarchy checks, and site scope. Test denied navigation, denied mutations, and out-of-scope site data.

### Phase 2 — data and state

Implement one pure machine per domain where needed. Keep exact enum strings. Test internal/external tour paths, checkpoint destination exclusivity, contract derived status, device thresholds, RFID location rules, and compliance transitions.

### Phase 3 — frontend routes and forms

Create only static feature routes. Mirror the reference screens. Use scoped view builders, RHF/Zod/Form, inline errors, pending buttons, and one-toast feedback. Add loading, error, empty, stale, and offline/sync states.

### Phase 4 — data layer and real-time behavior

Check query keys and resource invalidation after every mutation. Wire only verified WebSocket events; use matching invalidation. Poll async report/risk resources to terminal states.

### Phase 5 — verification

Run the repository's typecheck, unit/browser tests, lint, build, and i18n coverage checks where applicable. Do not claim a backend endpoint or production infrastructure result from frontend code alone.

## Definition of done

- Schema, TODO, and frontend disagreements are documented rather than silently normalized.
- No stale role-prefixed route or `GEOGRAPHY` claim remains in the scaffold.
- No nonexistent schema column, enum value, permission, or backend endpoint is presented as fact.
- Current frontend concerns—scope, settings, forms, toasts, query states, i18n, reduced motion, MinIO, soft delete, and fixture semantics—are covered.
- Canonical docs remain the cross-linking source of truth.
