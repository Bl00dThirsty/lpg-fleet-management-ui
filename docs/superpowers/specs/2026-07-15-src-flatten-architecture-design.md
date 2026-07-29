# LPG Fleet Management UI — Architecture Refactor (src-flatten + package extraction)

**Date:** 2026-07-15
**Status:** Implemented (all waves green: `pnpm --filter @lpg/web build`)
**Branch:** `develop`

## Goal

Restructure `apps/web` to be shallow, stable, maintainable and scalable, following an
industry-standard Turborepo layout. Decisions (confirmed with the user):

1. **No `src/` folder** — app code lives directly in `apps/web/`.
2. **Shared code only in `packages/`** — extract only what ≥2 apps share (UI kit, domain
   types, RBAC/permissions, config, api-client). Web-specific feature views, the module
   registry engine, routes and role entry points stay in the app.
3. **Roles share features per context** — each `roles/<role>/` folder is the explicit,
   traceable entry point that composes shared feature components with role-specific context.
   Uniform CRUD list screens stay config-driven via `MODULE_REGISTRY`; bespoke screens are
   explicit files.
4. **Strong typing, not literal OOP** — use well-typed interfaces as the contract between
   layers. No forced classes in React components.
5. **TanStack Table** is the table engine for all data grids.

## Target layout

```
lpg-fleet-management-ui/
├─ apps/
│  ├─ web/
│  │  ├─ routes/                # TanStack Router file-based routes
│  │  ├─ roles/<role>/          # per-role entry points (the "context")
│  │  ├─ features/<feature>/    # web-specific feature views (flat)
│  │  ├─ module/                # registry-driven screen engine
│  │  ├─ context/  styles/  assets/  main.tsx
│  │  ├─ vite.config.ts  tsconfig.app.json  routeTree.gen.ts
│  └─ driver/                   # (untouched; has a pre-existing missing tsconfig — separate issue)
└─ packages/
   ├─ ui/            @lpg/ui          design system (shadcn + data-table + layout + hooks)
   ├─ types/         @lpg/types       domain interfaces
   ├─ permissions/   @lpg/permissions RBAC roles + permission matrix + CASL abilities
   ├─ config/        @lpg/config      runtime/env config (ARCGIS_API_KEY, API_BASE_URL)
   └─ api-client/    @lpg/api-client  axios envelope client + typed data services
```

## Package boundary (extract only what is shared)

 - `@lpg/ui` ← `components/ui` (shadcn primitives) + `components/data-table` (TanStack Table
   engine) + `components/date-picker` + `lib/utils` (`cn`, page-number/initials helpers,
   `exportToExcel`/`exportToJson`) + `hooks/use-mobile` + `hooks/use-table-url-state`.
   Internal code uses **relative imports only** (no `@/` alias) so the package is independently
   type-checkable. Re-exports a single barrel (`@lpg/ui`); `sonner`'s `Toaster` takes `theme`
   as a prop (no app-context dependency).
 - `@lpg/types` ← all domain interfaces (Role, OrgType, ApiEnvelope, …).
 - `@lpg/permissions` ← roles + permission matrix + CASL abilities + `Role` metadata
   (`ROLES`, `ROLE_LABELS`, `ROLE_DESCRIPTIONS`). Single source of truth for RBAC; the app's
   `config/rbac/roles.ts` is now a thin re-export.
 - `@lpg/config` ← env/runtime config (`ARCGIS_API_KEY`, `API_BASE_URL`, `getEnv`).
 - `@lpg/api-client` ← axios envelope client (`apiClient` + `request<T>`).

 **Stays in `apps/web`:** `features/*` views, `module/` registry engine, `config/modules`
 registry, `config/rbac/sidebar-by-role.ts` (UI layout per role), `routes/`, `roles/`,
 `context/`, `styles/`.

## Role feature-sharing model

Hybrid, favoring **explicit + traceable** (enterprise-standard, AI-agent friendly):
- Shared feature views live once (in `features/`, built on the `@lpg/ui` `DataTable`).
- Each `roles/<role>/` folder is the explicit entry point — declares which features/screens
  the role owns and passes role-specific *context* (columns, filters, permissions, labels).
 - Uniform CRUD list screens stay config-driven via `MODULE_REGISTRY`; each role opts in.
 - Bespoke screens (scan, map, infra, pda, declarations, supply, delivery-tours, missions)
   are explicit files under the role.
 - `roles/manifest.ts` is the **single, typed, AI-navigable contract** mapping each `Role` to
   its bespoke screens + the module keys they are registered under. `module/custom-screens.tsx`
   consumes `buildCustomScreenRegistry()` from the manifest (no duplicated registry).
 - Each `roles/<role>/index.ts` barrel re-exports the role's screens (explicit entry point).
 - `@lpg/types` interfaces flow through props everywhere.

## Implementation waves (each keeps `pnpm --filter @lpg/web build` green)

1. **Remove `src/`:** move files up, re-point vite `@` alias → `.`, tsconfig `paths` `@/*`
   → `./*` + `include` → `.`, tanstackRouter `routesDirectory` → `./routes`,
   `generatedRouteTree` → `./routeTree.gen.ts`, drop `src/` in vitest coverage excludes.
2. **Extract `@lpg/ui`:** move `components/ui`, `components/data-table`, `components/layout`,
   `lib/utils` (`cn`), `hooks/use-mobile` into `@lpg/ui`; re-point imports.
3. **Finalize shared packages:** move `config/rbac` → `@lpg/permissions`, domain types →
   `@lpg/types`, env config → `@lpg/config`, add `@lpg/api-client` data services; re-point.
4. **Normalize `roles/<role>/`:** ensure each role folder is an explicit, documented entry
   point composing shared features + role context.
5. **Final verification** + documentation.

## Risks / notes

- `apps/driver` has a pre-existing missing `tsconfig.json` and is out of scope; it blocks
  repo-wide `pnpm build` but not `pnpm --filter @lpg/web build`.
- Removing `src/` is the highest-risk change; done atomically in Wave 1 with an immediate
  build check.
- All domain types use interfaces only (no classes) per user direction.
