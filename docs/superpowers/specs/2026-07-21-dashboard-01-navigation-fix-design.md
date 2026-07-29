# Spec: Dashboard-01 Integration + Navigation Fix

**Date:** 2026-07-21
**Status:** Approved

## Problem

1. **Active page not highlighting** in sidebar -- `NavMain` does not compute active state from current route
2. **Sidebar collapsible menus misbehaving** -- expand/collapse state not synced with route
3. **Dashboard UI dated** -- KPI cards use custom `KpiTile`/`SectionCard` instead of shadcn `Card`+`CardAction` pattern
4. **No status badge system** -- the dashboard-01 block demonstrates better status display with `Badge` + icon patterns

## Solution: Hybrid Enhancement

Fix navigation bugs while adopting dashboard-01 patterns, preserving existing TanStack Router + RBAC sidebar system.

### Section 1: Navigation Fixes

**Active link detection (NavMain):**
- Use TanStack Router's `useLocation()` and `useMatch()` to determine active route
- Propagate `isActive` to each `SidebarMenuButton`
- Handle nested routes (`/$role/$module`) correctly

**Collapsible state sync:**
- Set `defaultOpen` on collapsible groups based on whether current path falls within that group
- Use `useLocation().pathname` to compute open state per group

**Breadcrumbs:**
- Fix path resolution for dynamic routes (`$role`, `$module`, `$truckId`, etc.)
- Map to human-readable labels using sidebar data and module registry

### Section 2: Dashboard Enhancement

**SectionCards rewrite:**
- Adopt dashboard-01's `CardAction` pattern for trend badges
- Use `@container` breakpoints (`@xl/main:grid-cols-2 @5xl/main:grid-cols-4`)
- Gradient background from primary/5 to card surface
- Keep TanStack Query data fetching, replace custom KpiTile with `Card`

**Status style display:**
- Badge variants: `success` (green), `warning` (amber), `destructive` (red), `outline` (neutral)
- Icon + text badge pattern from dashboard-01 for trend indicators
- Apply consistently across trucks, transporters, marketers tables

### Section 3: Layout Polish

**AppHeader → SiteHeader pattern:**
- Add page title inline next to breadcrumbs (dashboard-01 pattern)
- Cleaner separator positioning

**Sidebar:**
- Add `min-w-8` + primary-colored Quick Create button pattern if role-appropriate
- Ensure tooltips work correctly in `collapsible="icon"` mode

### Section 4: New shadcn Components

- `Drawer` -- for detail sheets (already have Sheet, Drawer is better for data tables)
- `@dnd-kit/core` + `@dnd-kit/sortable` -- for draggable data table rows
- Update `Badge` to support `success`/`warning` variants if missing

### Section 5: Vercel Best Practices Applied

| Rule | Application |
|------|-------------|
| `architecture-compound-components` | Extract sidebar nav into compound component (SidebarNav.Group, SidebarNav.Item) |
| `state-lift-state` | Lift active-route state into sidebar provider context |
| `patterns-explicit-variants` | Create explicit status badge variants instead of mapping strings |
| `rerender-simple-expression-in-memo` | Avoid unnecessary memo on simple primitives in nav items |
| `bundle-barrel-imports` | Use direct imports from `@lpg/ui` specific paths |

## Files Affected

- `apps/web/components/layout/nav-main.tsx` -- active state, collapsible sync
- `apps/web/components/layout/app-sidebar.tsx` -- pass active route context
- `apps/web/components/layout/app-header.tsx` -- site-header pattern, page title
- `apps/web/components/layout/breadcrumbs.tsx` -- dynamic route labels
- `apps/web/features/dashboard/section-cards.tsx` -- card-action pattern
- `apps/web/features/dashboard/index.tsx` -- layout alignment with dashboard-01
- `packages/ui/src/components/ui/badge.tsx` -- success/warning variants
- `packages/ui/src/components/ui/drawer.tsx` -- new component (from shadcn)
- `packages/ui/src/components/ui/card.tsx` -- add CardAction export
- `apps/web/lib/breadcrumbs.ts` -- fix dynamic segment resolution

## Non-Goals

- NOT replacing TanStack Router with another router
- NOT rewriting all 7 role sidebar configs
- NOT adding DnD everywhere (only where useful)
- NOT breaking Vercel deploy config
