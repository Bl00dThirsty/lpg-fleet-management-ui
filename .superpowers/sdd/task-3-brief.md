# Task 3: Fix NavMain active link detection + collapsible sync

**Files:**
- Modify: `apps/web/components/layout/nav-main.tsx`
- Modify: `apps/web/components/layout/app-sidebar.tsx` (no changes needed — NavMain gets location from useMatchRoute directly)

**Interfaces:**
- Consumes: `useMatchRoute()` from `@tanstack/react-router` for pathname matching
- Produces: Nav items highlight correctly based on current route; collapsible groups auto-expand when a child is active

## Implementation

Replace `apps/web/components/layout/nav-main.tsx` with a version that:

1. Imports `useMatchRoute` from `@tanstack/react-router` (remove unused `useLocation`)
2. Uses `const matchRoute = useMatchRoute()` inside each component that needs route matching
3. Computes `isActive` for each nav item using `matchRoute({ to: item.url, fuzzy: true })`
4. Computes `isGroupActive` for collapsible groups by checking if any child item matches the current route
5. Sets `defaultOpen={isGroupActive}` on `Collapsible` components
6. Removes the static `isActive` prop usage — compute it dynamically instead

### Key patterns:

- `matchRoute({ to: url, fuzzy: true })` returns boolean
- For a group, check if any item (or sub-item) matches: `group.items.some(item => item.items?.length ? item.items.some(sub => matchRoute({ to: sub.url, fuzzy: true })) : matchRoute({ to: item.url, fuzzy: true }))`
- For individual items: `matchRoute({ to: item.url, fuzzy: true })`
- For sub-items: `matchRoute({ to: sub.url, fuzzy: true })`

### Badge rendering:
Preserve existing badge display: if `item.badge` exists, show it as `<span className="ml-auto text-xs text-muted-foreground">{item.badge}</span>` inside the SidebarMenuButton alongside the title.

### Current file to modify:
`apps/web/components/layout/nav-main.tsx` — currently 102 lines. Keep same structure but make route-aware.

## Global Constraints
- Preserve TanStack Router file-based routing and all 7 role sidebar configs
- Do NOT break Vercel deploy config
- All edits go through @lpg/ui package for shared components
- Keep all existing tests passing
