<!-- generated-by: gsd-doc-writer -->
# LPG Fleet — CSPH GPL Traceability Platform (UI)

[![DeepWiki](https://img.shields.io/badge/DeepWiki-Ask%20AI-2563eb)](https://deepwiki.com/menoc61/lpg-fleet-management-ui) [![GitHub](https://img.shields.io/badge/GitHub-menoc61%2Flpg--fleet--management--ui-181717)](https://github.com/menoc61/lpg-fleet-management-ui) [![Vite](https://img.shields.io/badge/Vite-8c4aff?logo=vite&logoColor=white)](https://vite.dev/) [![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/) [![pnpm](https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

Frontend-only web UI for the CSPH Cameroon GPL traceability platform: operational oversight of LPG supply, delivery tours, fleet, sites, compliance, risk, and reporting.

> This repository contains the SPA and mock adapter, not the Fastify/PostgreSQL/MinIO backend. The eventual API is reached through `@lpg/api-client`; development uses `VITE_API_MODE=mock`.

## Quick start

```bash
pnpm install
pnpm dev
```

Open the Vite URL printed by the development server. Authentication and sample data are supplied by the current mock adapter. The post-login landing route is `/overview` for every role.

## Architecture

- **Workspace:** pnpm 9 + Turborepo.
- **Web app:** `apps/web`, Vite + React 19 + TypeScript.
- **Routing:** static TanStack Router files; no role-prefixed or generic dynamic module router.
- **Server state:** TanStack Query with resource-key invalidation after mutations and WebSocket event invalidation.
- **Local state:** Zustand for UI/local mock state.
- **UI:** Tailwind CSS 4, shadcn-style primitives, Sonner, accessible forms and charts.
- **Charts:** Recharts with semantic chart tokens and reduced-motion support.
- **Shared packages:** `@lpg/types`, `@lpg/permissions`, `@lpg/api-client`, `@lpg/mock-data`, `@lpg/mock-api`, `@lpg/config`, and `@lpg/ui`.

## Product rules

- RBAC is dual-layer: `system_role` grants plus custom-role grants, constrained by organization/site scope.
- `MARKETEUR` works on its own site and created rows; `TRANSPORTEUR` sees its organization's assigned operational data; `AGENT` sees assigned sites; `LIVREUR` sees assigned missions.
- `VRAC` is measured in **TM** (tonnes métriques), never litres or kg. `BOUTEILLES50KG` is counted in **btl**.
- Business thresholds come from `settings.setting_key`; no tolerance, SLA, battery, geo, MFA, or retention threshold is hardcoded in a feature.
- MinIO/S3 files are referenced by URL only.
- API responses use `{ success, message, data, pagination?, filters? }`.
- Deletes are soft via `deleted_at`; normal reads exclude deleted rows.
- Every user-facing string is present in both French and English resources under `apps/web/public/locales/{fr,en}`.

## Canonical market data

The curated `market.json` merge represents **10 existing organizations plus 204 `UNASSIGNED`/unverified operational sites**. Those 204 rows are `sites`, not `client_sites`; operational sites and commercial delivery destinations remain separate domain resources.

## Verification

Root commands:

```bash
pnpm build
pnpm lint
pnpm format
```

Web commands:

```bash
pnpm --filter @lpg/web run typecheck
pnpm --filter @lpg/web run test:unit
pnpm --filter @lpg/web run test
pnpm --filter @lpg/web run test:coverage
pnpm --filter @lpg/web run i18n:check
```

The detailed documentation index is [`docs/README.md`](docs/README.md). The standing implementation contract is [`AGENTS.md`](AGENTS.md).

## Documentation

- [Design and UX contract](docs/DESIGN.md)
- [Architecture](docs/architecture.md)
- [Features and static routes](docs/features-and-routes.md)
- [Permissions and scope](docs/permissions-and-rbac.md)
- [Data and settings](docs/data-and-settings.md)
- [Workflows](docs/workflows.md)
- [State machines](docs/state-machines.md)
- [API-client endpoints](docs/api-endpoints.md)
- [Domain model](docs/domain-model.md)
- [Domain glossary](CONTEXT.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## License

This government project is proprietary and **All Rights Reserved**. Copyright © 2026 DTA Innotech Lab. Authorized use is limited to approved government, regulatory, operational, audit, maintenance, and contracted activities. See [`LICENSE`](LICENSE) and [`SECURITY.md`](SECURITY.md).
