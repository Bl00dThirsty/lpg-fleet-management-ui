<!-- generated-by: gsd-doc-writer -->
# AGENTS.md — LPG Fleet Management UI

## Contract

This repository is a **frontend-only** pnpm/Turbo workspace for the CSPH GPL traceability UI. Resolve domain names, columns, and enum values against `../csph_gpl_schema_v6_2.sql`; use `../TODO.md` for intended workflows and acceptance criteria. The current implementation is canonical for what exists.

## Architecture rules

- `apps/web` is the deployable Vite SPA. Routes are static TanStack Router files under `apps/web/src/routes`; there is no role-prefixed or generic dynamic module router.
- Post-login landing is **`/overview` for every role**. Navigation is one `AppSidebar`, projected by `apps/web/src/config/rbac/nav-items.ts` and permission checks from `@lpg/permissions`.
- Use the feature shape `features/<domain>/{index.tsx,components,data,lib,utils}`. Data/view builders live in `data/`; pure state machines and rules live in `lib/` with colocated tests. No parallel duplicate files.
- Shared enums/types come from `@lpg/types`; RBAC and hierarchy helpers come from `@lpg/permissions`; transport comes from `@lpg/api-client`; shared UI comes from `@lpg/ui`.

## Domain and security invariants

- Effective permissions are the union of `system_role` base grants and custom-role grants, then constrained by site/org assignment. Apply RBAC at the control, store guard, form, and API boundary.
- Scope data by actor: regulator organization staff may see organization scope; `AGENT` sees assigned sites; `MARKETEUR` sees its site and created rows; `TRANSPORTEUR` sees its organization's assigned tours/crew; `LIVREUR` sees assigned missions. Use `features/scope`; never infer scope from `system_role` alone.
- Schema enums are uppercase. `VRAC` quantities are **TM** (tonnes métriques), never litres/kg; `BOUTEILLES50KG` is counted as **btl**.
- Business thresholds come from `settings.setting_key`; use the mock accessors for fixtures. Do not hardcode values such as tolerance, SLA, battery, geo, MFA, or retention thresholds.
- Store only MinIO/S3 object URLs for certificates, proofs, contracts, reports, and firmware. Do not put blobs in application data.
- API responses use `{ success, message, data, pagination?, filters? }`. Delete rows through soft delete (`deleted_at`); normal reads exclude deleted rows.
- Invalidate the affected TanStack Query key after every mutation. WebSocket `tour:update`, `anomaly:new`, and `device:telemetry` events invalidate matching resources.
- Async reports and risk recomputation poll until `READY`, `FAILED`, or `EXPIRED`, showing freshness and a pending indicator.

## UI quality contract

- Use react-hook-form + zod + shadcn Form. Show field errors inline; never toast validation errors.
- Exactly **one Sonner toast owns each mutation outcome** through `hooks/use-toast-feedback` (`runMutation` / `extractErrorMessage`). Pending controls are disabled, expose busy state, and have accessible names.
- Data lists distinguish loading, error, empty, and filtered-empty states. Data-heavy routes use `pendingComponent` skeletons and `GeneralError` error components.
- Charts use Recharts with semantic chart tokens and accessible titles/labels. Honor `prefers-reduced-motion`; do not animate data transitions when reduced motion is requested.
- Every user-facing string must exist in both French and English i18n resources (`public/locales/{fr,en}`); run the i18n check before completion.

## Verification

Use only commands present in the package scripts:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm --filter @lpg/web run typecheck
pnpm --filter @lpg/web run test:unit
pnpm --filter @lpg/web run test
pnpm --filter @lpg/web run test:coverage
pnpm --filter @lpg/web run i18n:check
```

Detailed guidance lives in [`docs/`](docs/README.md): architecture, routes, RBAC, data/settings, workflows, state machines, API surface, and domain model. GitHub issues are managed with `gh`; see [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md). Domain exploration guidance is in [`docs/agents/domain.md`](docs/agents/domain.md).

Do not commit unless explicitly requested.
