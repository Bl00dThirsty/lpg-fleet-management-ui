# Design: Unified LPG-orange shell + page system for @lpg/web

**Date:** 2026-07-20
**Branch:** refactor/apps-web-architecture
**Author:** opencode (per user request to redesign/optimize all interfaces, unify the shell, and fix the broken sidebar)

## Context

The `@lpg/web` app currently has a shared shell (`SidebarProvider` + `AppSidebar` + `AppHeader` + `Main`/`Outlet`) but **two page systems that do not share a visual language**:

1. **Static feature pages** — `dashboard`, `trucks`, `transporters`, `routes`, `marketers`, `activity`. Each hand-rolls its own `<main>` with a slate gradient background (`bg-gradient-to-b from-slate-50 via-white to-slate-100 ...`), a `PageHeader`, and inconsistent card treatments.
2. **RBAC dynamic system** — `$role/$module` routes rendering `RoleDashboard` (KPI cards + nav-link cards) and `ModuleScreen` (DataTable), driven by `MODULE_REGISTRY` + mock data, plus 8 bespoke role screens (`map`, `infra`, `supply`, `missions`, `scan`, `pda`, `declarations`).

The shell uses `bg-muted/20` while pages use a slate gradient — a visible mismatch.

### Why the sidebar "is not working"

The `SUPER_ADMIN` nav group mixes two link shapes:
- `item('SUPER_ADMIN', 'overview', ...)` → URL `/super-admin/overview` (RBAC dynamic route)
- Hardcoded `{ title: 'Tableau de bord', url: '/dashboard' }` (static feature page)

`checkIsActive()` in `components/layout/nav-group.tsx` compares the raw `href` to `item.url`. Cross-system links never match, so active-state highlighting is wrong and navigation feels broken. Additionally, `getSidebarData` returns **only** RBAC `item()` links for most roles, so the static feature pages aren't represented in the nav for non-admin roles at all.

### User decisions (brainstorming)
- **Scope:** Unify the shell + both page systems into one cohesive product.
- **Direction:** Polished LPG-orange system (keep the existing brand orange, mature spacing/surfaces, calmer "control room" feel).
- **Nav model:** Unified per-role sidebar — static feature pages and RBAC modules live in the *same* nav tree with correct active-state across both.
- **Depth:** Build shared primitives and migrate pages to use them.
- **Constraints:** Follow the existing folder structure. Code must be secure, scalable, optimized.

## Part 1 — Design tokens & surface system

Keep `styles/theme.css` (primary `oklch(0.689 0.225 42.66)`, LPG gas-orange) unchanged. Add a new file `apps/web/styles/surfaces.css` (imported from the existing entry, same pattern as `theme.css`/`index.css`) defining:

- `--surface-page`: page canvas → `oklch(... muted/30)` equivalent of `bg-muted/30` (replaces the per-page slate gradient everywhere).
- `--surface-card`: `bg-card` + `border-border/60` + `shadow-sm` + `rounded-xl`.
- `--surface-raised`: for sticky toolbars/headers.
- `--accent-soft`: `primary/8` tint for hover/selection backgrounds.
- A `.page` utility class: `flex-1 space-y-6 p-4 sm:p-6` + the page surface, so pages stop hand-rolling `<main>`.

Typography helpers (no new fonts — reuse Inter/Manrope from `@theme`):
- `.data-label`: uppercase, tracked, `text-xs text-muted-foreground`.
- `.data-value`: `text-2xl font-semibold tracking-tight`.

Used consistently for KPI and telemetry figures across pages.

## Part 2 — Sidebar & navigation (the fix)

### Config (file: `apps/web/config/rbac/sidebar-by-role.ts`)
Extend `SidebarData`/`NavItem` so every role's `navGroups` may contain **both**:
- static feature links: `{ title, url, icon }`
- RBAC module links via the existing `item(role, module, title, icon, badge)` helper (produces `/${roleSlug(role)}/${module}`)

One shape, one source of truth. For `SUPER_ADMIN`, fold the hardcoded `/dashboard`, `/routes`, `/activity/trip-tracking`, `/trucks`, `/transporters`, `/marketers` links into the same groups as the `item()` links (or a clearly labelled group), so all are represented and consistent.

### Active-state (file: `apps/web/components/layout/nav-group.tsx`)
Rewrite `checkIsActive(href, item, mainNav)` to normalize:
- strip query string from both sides,
- exact match,
- path-segment prefix match: `/routes` is active on `/routes/$id` and `/routes` (use `href.split('/')[1] === item.url.split('/')[1]` style comparison, already partially present — generalize it),
- child-nav match (existing).

This makes active highlighting work identically for both static (`/dashboard`) and RBAC (`/super-admin/overview`) links.

`NavGroup` / `SidebarMenuLink` already render any `NavLink { title, url, icon }` — no structural change needed there; only the config + `checkIsActive` change.

## Part 3 — Shared primitives (new, following `@lpg/ui` colocation)

New file **`apps/web/components/layout/page.tsx`** (colocated with `app-sidebar.tsx`, `main.tsx`, `page-header.tsx`):
- `PageShell` — the single `<main id="main-content" className="page ...">` wrapper using the Part 1 surface.
- `KpiTile` — `{ label, value, delta?, trend? }`, uses `.data-label`/`.data-value`, trend colors `emerald-600` (up) / `rose-600` (down) — same convention already in `module/role-dashboard.tsx`.
- `SectionCard` — `Card` + `CardHeader` + `CardContent` with the unified `--surface-card`.
- `EmptyState` — consistent empty/error copy: active voice, no apology, single clear action (per frontend writing guidance).

### Migration (no folder moves)
Refactor to use the primitives:
- `apps/web/module/role-dashboard.tsx` → `PageShell` + `KpiTile` + `SectionCard`.
- `apps/web/module/module-screen.tsx` → `PageShell` + `SectionCard` (DataTable stays inside).
- Static pages: `apps/web/features/dashboard/index.tsx`, `apps/web/features/routes/index.tsx`, `apps/web/features/marketers/index.tsx` (+ `marketer-details.tsx`), `apps/web/features/trucks/index.tsx`, `apps/web/features/transporters/index.tsx`, `apps/web/features/activity/trip-tracking-layout.tsx` → replace hand-rolled `<main>` + slate gradient with `PageShell`/`SectionCard`.

Result: the duplicated slate-gradient `<main>` disappears from ~8 files → one source. No behavior change.

## Part 4 — Security, scalability, optimization

- **Secure:** no new secrets/keys. Reuse existing `getCookie`/`lib/cookies` for sidebar persistence. All links use TanStack `<Link to=...>` (type-safe routing, no `dangerouslySetInnerHTML`, no `eval`). Mock data stays in `@lpg/mock-data` (no PII).
- **Scalable:** navigation is fully data-driven from `sidebar-by-role.ts` + `MODULE_REGISTRY`. Adding a page = one config entry, zero sidebar code. Primitives are presentational and reused.
- **Optimized:** one surface class replaces repeated gradient utilities (smaller CSS). `checkIsActive` is O(1) per item. No new runtime dependencies. Existing `@lpg/ui` `Card`/`DataTable` reused (no bundle bloat). Tests remain 51/51 (restyle/migrate only, no logic regression).

## Part 5 — Verification
- `pnpm turbo run build --filter @lpg/web` (typecheck + bundle) passes and regenerates `routeTree.gen.ts`.
- `pnpm exec vitest run` → 51/51.
- Manual: sidebar active-state highlights correctly for both `/dashboard` (static) and `/super-admin/overview` (RBAC) style links; switching role swaps the nav tree.

## Out of scope
- Rewiring static-data features onto the live `@lpg/mock-data` backend.
- Redesigning the 8 bespoke role screens' internal layouts (map/infra/supply/etc.) — only their outer `<main>`/surface is unified via `PageShell`.
- Any new feature beyond unification.

## Risks
- `checkIsActive` is shared by all nav rendering — changing it must be verified against both link types (covered by Part 5 manual check).
- A static page might rely on `fluid`/custom padding from its old `<main>`; `PageShell` exposes a `className` passthrough + `fluid` prop to preserve such cases.
