<!-- generated-by: gsd-doc-writer -->
# Documentation — LPG Fleet Management UI

This is the frontend documentation set for the CSPH GPL traceability UI. The repository contains the pnpm/Turbo Vite SPA and mock adapter; it does **not** contain the Fastify/PostgreSQL/MinIO backend implementation.

## Start here

| Topic | Guide |
|---|---|
| UI structure and packages | [architecture.md](./architecture.md) |
| Routes and feature ownership | [features-and-routes.md](./features-and-routes.md) |
| Roles, permissions, and scope | [permissions-and-rbac.md](./permissions-and-rbac.md) |
| Domain entities and units | [domain-model.md](./domain-model.md) |
| Settings, mock data, storage | [data-and-settings.md](./data-and-settings.md) |
| Pickup, tour, reconciliation workflows | [workflows.md](./workflows.md) |
| Legal/frontend state graphs | [state-machines.md](./state-machines.md) |
| API-client contract and endpoint surface | [api-endpoints.md](./api-endpoints.md) |
| UX and accessibility requirements | [DESIGN.md](./DESIGN.md) |

### Governance and contribution (repository root)

| Topic | Guide |
|---|---|
| Setup, feature workflow, commands, review checklist | [../CONTRIBUTING.md](../CONTRIBUTING.md) |
| Reporting a vulnerability, threat model, secret handling | [../SECURITY.md](../SECURITY.md) |
| Canonical domain vocabulary (glossary only) | [../CONTEXT.md](../CONTEXT.md) |
| Architecture decisions and their trade-offs | [adr/](./adr/) |

The canonical domain sources are `../csph_gpl_schema_v6_2.sql` and `../TODO.md`. The canonical current implementation is the code in this repository. When they differ, document the code as implemented and link the schema/TODO requirement as future or target behavior.

## Current product shape

This is a React 19 + Vite SPA using pnpm workspaces, Turbo, TanStack Router, TanStack Query, TanStack Table, Zustand for local UI state, Tailwind/shadcn-style primitives, Sonner, i18next, and Recharts. Shared packages provide types, permissions, API adapters, curated mock data, and UI primitives.

Authentication and HTTP behavior are abstracted by `@lpg/api-client`; development uses the fake adapter and `VITE_API_MODE=mock`. The UI must not imply that a backend is implemented here.

## Canonical operating rules

- All authenticated users land on `/overview`; `/dashboard` is a permission-gated national view, not a role-prefix landing.
- Routes are static. `AppSidebar` visibility comes from `config/rbac/nav-items.ts` and `requires` permission codes.
- Effective RBAC combines `system_role` and custom roles, with site/org scope.
- Operational site fixtures are canonical in the curated `market.json` merge: **10 existing organizations plus 204 `UNASSIGNED`/unverified operational sites**. These are `sites`, not `client_sites`.
- Use TM for VRAC and btl for 50 kg bottles. Keep French and English translations complete.
- Use one Sonner toast per mutation outcome; inline validation is not toasted. Pending controls must be disabled and accessible.
- Distinguish loading, error, empty, and filtered-empty lists. Charts must respect reduced-motion preferences.

## Verification

The root scripts are `pnpm dev`, `pnpm build`, `pnpm lint`, and `pnpm format`. Web-specific scripts include `typecheck`, `test:unit`, `test`, `test:coverage`, and `i18n:check`; use the `pnpm --filter @lpg/web run <script>` form documented in the root README.
