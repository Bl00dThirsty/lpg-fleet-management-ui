<!-- generated-by: gsd-doc-writer -->
# API Endpoints

This file documents the **frontend API contract**, not an implemented backend. The typed boundary is `packages/api-client/src/api.ts`; the fake adapter powers development. Do not describe an endpoint as backend-complete unless it is implemented outside this repository.

## Conventions

- API-client paths are relative to the configured API base; the product convention is `/api/v1` for the external API.
- Standard response: `{ success, message, data, pagination?, filters? }`.
- Requests use JSON and Zod validation at the UI boundary; the eventual API is expected to validate again.
- Authentication is abstracted by the adapter. The HTTP deployment contract is bearer/session authentication as implemented by that adapter; actual credentials and URLs are not defined in this repository.
- File uploads resolve to MinIO/S3 URLs; the database stores URLs only.
- DELETE is soft delete through `deleted_at` in the fake adapter contract.

## Auth and users

| Method | API-client path | Purpose |
|---|---|---|
| POST | `/auth/login` | Authenticate and return user/session data. |
| POST | `/auth/refresh` | Refresh a session. |
| POST | `/auth/logout` | Revoke a refresh session. |
| GET | `/me` | Current user. |
| GET | `/me/permissions` | Effective role/custom permissions. |
| PATCH | `/me` | Update profile/password fields. |
| POST | `/users/:id/reset-password` | Reset a user password. |

## Resource services

`createResourceService` exposes `list`, `getById`, `create`, `patch`, and `remove` for:

`organizations`, `users`, `sites`, `clients`, `client-sites`, `vehicles`, `drivers`, `devices`, `transporter-contracts`, `pickup-requests`, `delivery-tours`, `checkpoints`, `scan-events`, `rfid-tags`, `declarations`, `reconciliations`, `redressements`, `risk-scores`, `anomalies`, `anomaly-assignments`, `notification-groups`, `notification-group-members`, `notification-rules`, `notifications`, `custom-roles`, `user-site-assignments`, `user-custom-roles`, `permissions`, `regions`, `system-roles`, `settings`, `audit-logs`, and `reports`.

## Explicit domain actions

| Method | Path | Frontend action |
|---|---|---|
| GET | `/sites/nearest?lat=&lng=` | Nearby operational sites. |
| POST | `/sites/:id/verify` | Verify an operational site. |
| POST | `/sites/:id/suspend` | Suspend an operational site. |
| GET | `/vehicles/:id/certificate` | Get certificate reference. |
| POST | `/devices/:id/assign` | Assign a device. |
| PATCH | `/pickup-requests/:id/validate` | Validate a pickup. |
| POST | `/pickup-requests/:id/complete` | Complete a pickup. |
| POST | `/delivery-tours/:id/start` | Start a tour. |
| POST | `/delivery-tours/:id/close` | Close a tour. |
| GET | `/delivery-tours/:id/replay` | Tour checkpoint replay. |
| POST | `/checkpoints/:id/reach` | Reach a checkpoint. |
| POST | `/checkpoints/:id/skip` | Skip a checkpoint with reason. |
| POST | `/scan-events` | Record a scan. |
| POST | `/scan-events/bulk` | Upload a batch of PDA scans. |
| POST | `/declarations/:id/submit` | Submit a declaration. |
| POST | `/declarations/:id/reconcile` | Reconcile a declaration. |
| PATCH | `/reconciliations/:id/verify` | Verify a reconciliation. |
| PATCH | `/redressements/:id/mark-paid` | Mark a redressement paid. |
| PATCH | `/redressements/:id/waive` | Waive a redressement. |
| POST | `/anomalies/:id/assign` | Assign an anomaly. |
| POST | `/anomalies/:id/resolve` | Resolve an anomaly. |
| POST | `/risk-scores/recompute` | Start async risk recomputation. |
| GET | `/system/health` | System health projection. |
| GET | `/system/metrics` | System metrics projection. |

## Cache and real-time behavior

Each mutation calls the invalidation helper for its resource key. WebSocket events `tour:update`, `anomaly:new`, and `device:telemetry` invalidate matching collections. No Kafka implementation is present in this frontend repository.
