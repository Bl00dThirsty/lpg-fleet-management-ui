# Design: Web shell enhancements — logout, notification center, sonner theming, command palette, sidebar fix

**Date:** 2026-07-20
**Branch:** `refactor/apps-web-architecture`
**App:** `@lpg/web` (`apps/web`)
**Packages touched:** `@lpg/ui` (sidebar surface, sonner theming)

## Goal

Mature the `@lpg/web` shell into a polished, cohesive LPG-orange system by
delivering five enhancements the user requested:

1. User menu + **logout** (currently `useAuthStore.logout()` exists but has no UI entry point).
2. **Notification center** (the header `Bell` is currently decorative — static dot, no panel).
3. **Sonner theming** (sonner is already installed and mounted; standardize + theme it to LPG).
4. **Command palette + extras** (Cmd/Ctrl+K palette, breadcrumbs, profile page).
5. **Sidebar fix** ("transparent background" + broken show/hide), raised in `@lpg/ui`.

All work stays client-side (the app runs in `VITE_API_MODE=fake`/`mock`; there is no
backend notification endpoint), consistent with the existing architecture
(Zustand + TanStack Query data layer, `@lpg/api-client` adapter, shared `@lpg/ui`).

## Current-state findings (verified)

- **Auth/logout:** `apps/web/store/auth-store.ts` exposes `logout()` (clears user +
  tokens + status). `PermissionsProvider` re-exposes it. The header shows a static
  "Admin CSPH" avatar with no menu and no logout control.
- **Notifications:** `app-header.tsx` `Bell` button has no `onClick` and no panel.
- **Sonner:** `sonner` is a dependency. `apps/web/routes/__root.tsx` mounts
  `<Toaster />` from `@lpg/ui`, and `@lpg/ui/src/components/ui/sonner.tsx` is already a
  sonner wrapper (so `toast()` calls DO render — no duplication). It uses `--normal-bg`/
  `--normal-border` = popover tokens with no LPG accent.
- **Command palette:** `@lpg/ui` already ships `command.tsx` (cmdk), `dialog.tsx`,
  `popover.tsx`, `scroll-area.tsx`, `dropdown-menu.tsx`. The header already shows a
  `Ctrl K` hint on a non-functional search input.
- **Sidebar (root cause):**
  - `theme.css`: `--sidebar: var(--background)` → white in light mode.
  - `app-sidebar.tsx` uses `variant='inset'`: the inner panel is white-on-white page
    with no border/shadow → reads as "transparent" (same class of bug AGENTS.md already
    flagged: "transparent background should have nothing to do with it").
  - Collapse logic works (`toggleSidebar` toggles `open` + cookie), but because the
    collapsed panel is white-on-white with no distinct surface/border, the state change
    is imperceptible → "show/hide not working".
  - Two toggle controls exist (`header.tsx` `SidebarTrigger` + `app-title.tsx` custom
    `ToggleSidebar`); harmless but redundant.

## Design

### 1. Sidebar fix (`@lpg/ui` + `apps/web`)

- **App:** in `app-sidebar.tsx`, change `<Sidebar collapsible='icon' variant='inset'>`
  → `<Sidebar collapsible='icon' variant='sidebar'>` (default). The non-inset container
  already applies `border-e border-sidebar-border` and `bg-sidebar`, producing a solid
  full-height panel with a right border.
- **`@lpg/ui` tokens:** set `--sidebar` to a distinct **solid** LPG-tinted raised surface
  (e.g. a warm neutral `surface-raised`-style token) instead of `var(--background)`, so
  the panel is clearly separated from the page in both light and dark modes. Keep
  `--sidebar-foreground`, `--sidebar-border`, `--sidebar-accent*` mapped to existing
  theme tokens.
- **Collapse visibility:** with a solid bordered panel, `collapsible='icon'` visibly
  shrinks to an icon rail (border preserved) — show/hide is now obvious.
- **De-duplicate toggle:** keep `SidebarTrigger` in `header.tsx` as the single source;
  remove the redundant custom `ToggleSidebar` in `app-title.tsx` (or keep it calling the
  same `toggleSidebar` — verify it does not double-toggle).

### 2. User menu + logout (`apps/web/components/layout/app-header.tsx`)

- Replace the static avatar + text block with a `DropdownMenu` whose trigger is the
  `Avatar`. Populate from `useAuthStore((s) => s.user)` (email, role label).
- Menu items:
  - Header row: user name (derived from email) + email + role label.
  - **Profile** → `navigate({ to: '/settings/profile' })`.
  - Separator.
  - **Log out** → `handleLogout()`.
- `handleLogout`:
  1. `useAuthStore.getState().logout()` (clears session/tokens).
  2. `queryClient.clear()` (drop cached queries so re-login starts fresh).
  3. `navigate({ to: '/login' })`.
  - Reuse `apiAdapter.setOnUnauthorized` (already calls `logout()` on 401); add the
    navigation there too so expired sessions land on `/login`.

### 3. Notification center (`apps/web/features/notifications`)

- `apps/web/store/notifications-store.ts` (Zustand, no persistence):
  - State: `items: Notification[]` seeded from a local mock seed
    (`features/notifications/notifications-seed.ts`), `unreadCount` derived.
  - `Notification = { id, title, body, ts: number, level: 'info'|'success'|'warning'|'error', read: boolean }`.
  - Actions: `markRead(id)`, `markAllRead()`, `addNotification(n)` (optional, for future
    toasts→notifications bridge).
- `apps/web/features/notifications/notification-center.tsx`:
  - `Bell` button (in `app-header.tsx`) opens a `Popover` (use `Sheet` on mobile via
    `useIsMobile`) containing:
    - Header: "Notifications" + unread count + "Tout marquer comme lu".
    - `ScrollArea` list of items (icon by `level`, title, body, relative time).
    - Empty state when no items (reuse `EmptyState` primitive).
    - Unread **badge** on the bell (count > 0).
  - Theme via existing surface tokens; consistent with the rest of the shell.

### 4. Sonner theming

- Single source of truth already: `@lpg/ui` `Toaster` in `__root.tsx`. No second toaster.
- **Theme to LPG:** in `@lpg/ui/src/components/ui/sonner.tsx`, set
  `--normal-bg: var(--surface-raised)`, `--normal-border: var(--border)`,
  `--normal-text: var(--foreground)`, and add a small `#sonner`/`[data-sonner-toast]`
  stylesheet block (in `apps/web/styles/surfaces.css` or a dedicated `sonner.css`)
  styling success/error states with `var(--primary)` accents. `richColors` stays OFF —
  we drive toast color ourselves via CSS for full control over the LPG look.
- `apps/web/lib/toast.ts`: thin re-export of `sonner`'s `toast` with LPG defaults
  (duration, class) so every call site is consistent. Migrate existing `toast.*` usages
  in `main.tsx`, `show-submitted-data.tsx`, `routes/login.tsx`, trucks actions to the
  shared helper where it reduces duplication (non-blocking; keep working as-is if lower
  risk).

### 5. Command palette + extras

- **Command palette** (`apps/web/features/command-palette/command-palette.tsx`):
  - `Dialog` + `@lpg/ui` `Command` (cmdk). Global `Cmd/Ctrl+K` listener (ignore when
    typing in inputs/while a modifier-less state). Open state in a small Zustand store or
    local state lifted to `AuthenticatedLayout`.
  - Content: navigation group built from `getSidebarData(activeRole).navGroups` (title +
    href), and an "Actions" group (Toggle theme, Open notifications, Log out).
  - Selecting a nav item `navigate`s and closes the palette.
  - Wire the existing header search `Ctrl K` hint to open the palette (replace the dead
    input or make the input open the palette on focus/Enter).
- **Breadcrumbs** (`apps/web/components/layout/breadcrumbs.tsx`):
  - Derive from TanStack Router `useMatches()` / `useLocation()`; render in `header.tsx`
    left of the title on `md+`. Map route IDs → human labels via a small lookup.
- **Profile page** (`apps/web/routes/settings/profile.tsx` + route registration):
  - Lightweight read-only-ish view of the authenticated user (name/email/role) using
    `useAuthStore`. Reuses `PageShell`/`SectionCard` primitives. No backend write.

## Architecture / boundaries

- New feature code lives under `apps/web/features/{notifications,command-palette}` and
  `apps/web/components/layout` (breadcrumbs). Stores under `apps/web/store`.
- `@lpg/ui` changes are limited to: sidebar surface token + sonner theming. No new
  primitives needed (all exist).
- All new React components are small, single-purpose, and independently testable.

## Data flow

- Notifications: local Zustand store, seeded once at module load (client-only).
- Logout: auth store → query cache clear → router navigation.
- Command palette: router navigation + theme/logout actions.
- No network calls added (consistent with `fake`/`mock` modes).

## Error handling

- Logout is synchronous and cannot fail; navigation is guarded by router auth checks.
- Notification store failures are non-critical (seed fallback to `[]`).
- Command palette shortcut is a no-op when already open or when focus is in a text field.

## Testing / verification

- `pnpm turbo run build --filter @lpg/web` must pass (catches `noUnusedLocals` /
  `noUnusedParameters` which are ON in `tsconfig.app.json`).
- `pnpm exec vitest run` (run inside `apps/web`) must stay **51/51**; add focused browser
  tests for the notification store (mark read / unread count) and command-palette open if
  the test env allows.
- **Constraint:** Playwright browsers are NOT installed, so no live browser probing.
  Verification is via typecheck/build + Vitest browser tests + code reasoning.
- Manual runtime checks to call out for the user: sidebar collapse visual, notification
  popover, palette shortcut, logout → /login.

## Out of scope (YAGNI)

- Real backend notification API / websockets.
- Server-driven command palette items.
- Editable profile writes (display only).

## Files touched

- `apps/web/components/layout/app-header.tsx` (avatar menu, bell → popover, breadcrumbs slot)
- `apps/web/components/layout/app-sidebar.tsx` (`variant='sidebar'`)
- `apps/web/components/layout/app-title.tsx` (de-dup toggle)
- `apps/web/components/layout/breadcrumbs.tsx` (new)
- `apps/web/components/layout/header.tsx` (breadcrumbs slot)
- `apps/web/features/notifications/notification-center.tsx` (new)
- `apps/web/features/notifications/notifications-store.ts` (new)
- `apps/web/features/notifications/notifications-seed.ts` (new)
- `apps/web/features/command-palette/command-palette.tsx` (new)
- `apps/web/store/notifications-store.ts` (new, alias of above)
- `apps/web/lib/toast.ts` (new)
- `apps/web/routes/settings/profile.tsx` (new) + `routeTree.gen.ts` regen
- `apps/web/styles/surfaces.css` (sonner toast styling)
- `packages/ui/src/components/ui/sonner.tsx` (LPG theme tokens)
- `packages/ui/src/components/ui/sidebar.tsx` (`--sidebar` solid surface)
- `apps/web/styles/theme.css` (`--sidebar` token value)
