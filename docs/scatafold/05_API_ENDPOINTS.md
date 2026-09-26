<!-- generated-by: gsd-doc-writer -->
# 05 — API contract boundary

The repository is a frontend workspace with a typed client and fake adapter. It does not contain the production Fastify backend, so this document does not claim that an endpoint exists merely because it appears in `TODO.md`. Use [`../api-endpoints.md`](../api-endpoints.md) for the current client-facing catalogue and verify backend availability separately.

## Rules for API work

- Backend paths are bare resource paths; the frontend does not add role prefixes. The API base is conventionally `/api/v1` in the target contract.
- Responses use `{ success, message, data, pagination?, filters? }`; the shared types also support `aggregations?` where the current client type allows it.
- Bodies, params, and queries are validated with Zod at the boundary.
- Authorization is effective permission plus site scope. A route guard or sidebar check is not sufficient.
- DELETE on a soft-delete resource sets `deleted_at`; no restore endpoint is documented. The fake adapter mirrors this and excludes deleted rows by default.
- File fields are MinIO URL references, not uploaded bytes or base64.
- Mutations audit, invalidate the resource query key, and expose pending/error feedback. Do not invent an endpoint to make a UI state possible.

## Known current client surface

The typed client in `packages/api-client/src/api.ts` defines resource services and custom actions. The fake adapter supports generic CRUD for the curated collections, list pagination, login by curated profile, and soft delete. The mock collections are explicitly development fixtures, including organizations/markets, users, sites, vehicles, devices, tours, declarations, and anomalies.

The scaffold's intended resource families are:

| Resource family | Contract names to verify in the client/backend |
|---|---|
| Identity | auth, me, users, organizations, custom roles, permissions |
| Site and fleet | sites, client sites, clients, vehicles, drivers, devices, RFID |
| Operations | pickups, tours, checkpoints, scans, transporter contracts |
| Compliance | declarations, reconciliations, redressements, risks |
| Governance | anomalies, notification groups/rules, reports, settings, audit logs |

This table is not an endpoint inventory. It is a guardrail against copying the old aspirational map.

## WebSocket and async resources

The frontend WebSocket client handles the repository's event vocabulary, including `tour:update`, `anomaly:new`, and `device:telemetry`. Events invalidate matching query keys. Report and risk recomputation are polled to terminal states (`READY`/`FAILED`/`EXPIRED` where applicable) and show freshness/pending state. Exact event transport and production URLs require backend verification and must not be invented here.

## Frontend integration checklist

1. Confirm the action exists in `packages/api-client/src/api.ts` or the backend before documenting it as implemented.
2. Add or reuse a typed Zod input; keep server errors separate from field validation.
3. Apply the current `UserScope` in the feature data builder and mutation guard.
4. Use shared Sonner feedback exactly once per outcome, disable while pending, and invalidate the resource key.
5. Surface pending, error, empty, stale, and offline/sync states; honor reduced motion and FR/EN labels.

See [`../architecture.md`](../architecture.md) for the adapter boundary and [`../api-endpoints.md`](../api-endpoints.md) for the maintained client catalogue.
