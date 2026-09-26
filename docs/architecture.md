<!-- generated-by: gsd-doc-writer -->
# Architecture

## Overview

The application is a frontend-only React SPA organized as a pnpm/Turbo monorepo. `apps/web` renders static TanStack Router routes, feature pages, TanStack Query data access, Zustand UI state, and shadcn/Tailwind components. Shared packages provide domain types, dual-layer permissions, mock fixtures, API adapters, configuration, and UI primitives. The adapter boundary is where an eventual backend would be connected; no backend is implemented in this repository.

## Component diagram

```mermaid
graph TD
  Browser[Browser] --> Router[Static TanStack Router]
  Router --> Sidebar[AppSidebar / RBAC nav projection]
  Router --> Features[Feature pages]
  Features --> Query[TanStack Query hooks]
  Features --> Scope[Actor scope helpers]
  Query --> Client[@lpg/api-client]
  Client --> Adapter[Fake adapter / HTTP adapter]
  Adapter --> Mock[Curated mock data]
  Features --> Permissions[@lpg/permissions]
  Features --> Types[@lpg/types]
  Features --> UI[@lpg/ui + local shadcn primitives]
  Query --> WS[WebSocket event invalidation]
  Features --> Charts[Recharts + reduced motion]
```

## Data flow

1. A static route imports a feature entry point and the authenticated shell renders the permission-projected sidebar.
2. A feature calls the API client through TanStack Query. The fake adapter reads curated fixtures; the HTTP adapter is the seam for a future API.
3. `data/` builders project raw resources into view models. Components render them and use the shared list-state contract for loading, error, empty, and filtered-empty states.
4. Mutations pass through the adapter, enforce store/form guards, invalidate the resource query key, and emit exactly one Sonner outcome toast. WebSocket events invalidate matching tour, anomaly, and device keys.
5. Reports and risk recomputation remain pending until the client observes a terminal `READY`, `FAILED`, or `EXPIRED` state.

## Key abstractions

| Abstraction | Location | Responsibility |
|---|---|---|
| `createApi` | `packages/api-client/src/api.ts` | Typed resource services and domain actions. |
| `createResourceService` | `packages/api-client/src/resource.ts` | Generic list/get/create/patch/remove facade. |
| `ROLE_GRANTS` / `hasPermission` | `packages/permissions/src/index.ts` | Base grants and permission checks. |
| `defineAbilityFor` | `packages/permissions/src/index.ts` | CASL ability projection. |
| `getScope` / `scopeFilter` | `apps/web/src/features/scope/` | Site, organization, and mission data isolation. |
| `resolveListState` | `apps/web/src/components/entity-crud/list-state.ts` | Loading/error/empty/ready state contract. |
| `runMutation` | `apps/web/src/hooks/use-toast-feedback.ts` | One-toast mutation feedback ownership. |
| `tour-machine` | `apps/web/src/features/tours/data/tour-machine.ts` | Tour action and transition validation. |
| `chartConfigFrom` | `apps/web/src/components/charts/chart-config.ts` | Semantic chart token assignment. |
| `usePrefersReducedMotion` | `apps/web/src/hooks/use-prefers-reduced-motion.ts` | Reduced-motion chart behavior. |

## Directory rationale

```text
apps/web/src/routes       static route tree and authenticated shells
apps/web/src/features     one feature tree per business domain
apps/web/src/components   shared layout, tables, forms, charts, and UI primitives
apps/web/src/lib          API, i18n, cookies, security, and shared utilities
apps/web/src/store        Zustand state for UI and local mock resources
packages/types            shared schema-shaped types and enums
packages/permissions      role grants, hierarchy, CASL helpers
packages/api-client       fake/HTTP transport boundary
packages/mock-data        curated seed data and settings accessors
packages/mock-api         mock server support
packages/ui               shared shadcn-style components
docs                      product, domain, UX, and API reference
```

## Runtime and integration boundaries

The frontend uses Vite, React 19, TypeScript, Tailwind CSS 4, TanStack Router/Query/Table, Zustand, i18next, Sonner, Zod, React Hook Form, and Recharts. ArcGIS is used by map features. `VITE_API_MODE` selects the adapter in development. MinIO is a storage contract: the database-facing application keeps only object URLs; the backend implementation is outside this repository.
