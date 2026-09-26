<!-- generated-by: gsd-doc-writer -->
# 06 — Role features and views

The maintained inventory is [`../features-and-routes.md`](../features-and-routes.md). The current application uses static TanStack Router files, a single permission-gated `AppSidebar`, and `/overview` as the landing route for every role.

## Navigation rules

- A route is a file under `apps/web/src/routes/_authenticated/<domain>/index.tsx`; it imports a feature page from `features/<domain>/`.
- Do not create `/admin/*`, `/marketeur/*`, or `$role/$module` route trees. Role changes visibility, not URL shape.
- `AppSidebar` projects `ROLE_NAV_DECL` through `requires` permission codes in `config/rbac/nav-items.ts`.
- MARKETEUR does not receive organization-level views. TRANSPORTEUR receives its own contract/fleet/mission operations. LIVREUR is represented by the field/offline workflow rather than a separate web route tree.
- `/overview` is personalized by actor and scope. `/dashboard` is a distinct national dashboard, not the universal landing route.

## Role views by responsibility

| Role | View families |
|---|---|
| SUPERADMIN | Overview, dashboard, map, organizations, sites, fleet, operations, compliance, risks, reports, settings, audit |
| ADMIN | Scoped users, verification, pickups, declarations, reconciliations, anomalies, reports, audit |
| SUPERVISOR | System health, metrics, device/GPS health, technical anomalies, risk monitoring, recompute |
| INTEGRATEUR | Devices, RFID, GPS configuration, assignments, maintenance, firmware, integrations |
| AGENT | Assigned sites/client sites, declarations, investigations, reconciliations, visits, password resets |
| MARKETEUR | Overview, scoped fleet, drivers, pickups, tours, contracts, clients, declarations, performance, reports |
| TRANSPORTEUR | Overview, tours, contracts, vehicles, drivers, livreurs, performance |
| LIVREUR | Assigned missions, checkpoints, scans, photos, sync/conflict status in the field experience |

## Feature-folder requirements

Each domain owns one folder with `index.tsx`, `components/`, `data/`, `lib/`, and `utils/` as applicable. Data builders apply `getScope`; no feature imports curated market JSON directly. Pure transitions and thresholds belong in `lib/`, and tests live beside them. Shared types come from `@lpg/types`; shared permissions come from `@lpg/permissions`.

## UX contract

Route-heavy pages include skeleton/pending and `GeneralError` handling where data is loaded. Forms use shadcn Form with inline errors. Mutations are permission-gated, scoped, pending-aware, and cache-invalidating. Sonner reports one outcome per mutation, never validation errors. Labels and errors support FR/EN. Reduced motion is honored by animation components.

## Reference implementations

Use `/trucks`, `/transporters`, `/marketers`, `/tours`, `/tour-tracking`, and `/dashboard` as the current structural references. Do not infer feature folders from the old role-prefixed route lists in earlier scaffold revisions.
