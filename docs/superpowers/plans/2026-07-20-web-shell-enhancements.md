# Web Shell Enhancements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user menu + logout, a notification center, LPG-themed sonner toasts, a command palette + breadcrumbs + profile page, and fix the sidebar (solid surface + working collapse) in `@lpg/web`, touching `@lpg/ui` only for the sidebar surface and sonner theming.

**Architecture:** All new feature state lives in small Zustand stores (notifications, command-palette open state). The header (`app-header.tsx`) gains a user dropdown, a notification popover, and a command-palette trigger; `@lpg/ui` exposes its already-built `command` primitive and themes sonner/sidebar tokens. Everything stays client-side (no backend endpoints exist; consistent with `fake`/`mock` API modes). Route tree regenerates automatically via `@tanstack/router-plugin` on build.

**Tech Stack:** React 19, TanStack Router 1.168, TanStack Query 5.99, Zustand 5, `@lpg/ui` (shadcn-style primitives: dropdown-menu, popover, scroll-area, command, sonner, sidebar, avatar, badge), sonner 2, Vitest 4 browser mode, Tailwind v4 (`@theme` tokens).

## Global Constraints

- `noUnusedLocals: true` and `noUnusedParameters: true` are ON in `apps/web/tsconfig.app.json` — any unused import or variable FAILS the build. Remove imports you stop using.
- Build command: `pnpm turbo run build --filter @lpg/web` (runs `tsc -b && vite build`). Run from repo root.
- Test command: `pnpm exec vitest run` — MUST be run from `apps/web` (root has no test script). Keep the existing **51** tests green; this plan adds 3 pure-logic tests (→ 54).
- `@lpg/ui` is consumed from **source** (`packages/ui/src/index.ts`); edits apply directly. Its "build" is `tsc --noEmit` and is not part of the web build graph, but `tsc -b` over `@lpg/web` will typecheck the imported `@lpg/ui` source.
- Sonner is the single toaster: it is already mounted in `apps/web/routes/__root.tsx` via `@lpg/ui`'s `<Toaster />`. `richColors` stays OFF; we style toasts ourselves.
- Data layer: Zustand + TanStack Query. No network calls for these features (fake/mock backend; no notification API).
- New route files are auto-picked up by `@tanstack/router-plugin` during `vite build`/`vite dev`; no manual route-tree edit needed, but run the build to regenerate `routeTree.gen.ts`.

---

### Task 1: Sidebar — solid surface + working collapse

**Files:**
- Modify: `apps/web/styles/theme.css` (`:root` and `.dark` `--sidebar` token)
- Modify: `apps/web/components/layout/app-sidebar.tsx`
- Modify: `apps/web/components/layout/app-title.tsx`

**Interfaces:**
- Consumes: `Sidebar` from `@lpg/ui` (already `bg-sidebar` + `border-e` for non-inset variant).
- Produces: a solid, bordered, full-height sidebar whose collapse is visually obvious.

- [ ] **Step 1: Give `--sidebar` a distinct solid surface (theme.css)**

In `apps/web/styles/theme.css`, change the `--sidebar` line inside `:root` (line 27) and add a `.dark` override.

`:root` block — replace:
```css
  --sidebar: var(--background);
```
with:
```css
  --sidebar: oklch(0.978 0.01 70);
```

`.dark` block — add after `--ring: oklch(0.735 0.225 42.66);` (line 55):
```css
  --sidebar: oklch(0.2 0.012 60);
```

- [ ] **Step 2: Switch the sidebar to the bordered full-height variant (app-sidebar.tsx)**

In `apps/web/components/layout/app-sidebar.tsx`, change line 17:
```tsx
    <Sidebar collapsible='icon' variant='inset'>
```
to:
```tsx
    <Sidebar collapsible='icon' variant='sidebar'>
```
(The non-inset container already applies `border-e border-sidebar-border` and the inner uses `bg-sidebar`, giving a solid full-height panel with a right border.)

- [ ] **Step 3: De-duplicate the toggle (app-title.tsx)**

The header already has a canonical `SidebarTrigger`. Remove the redundant custom toggle button from the sidebar title so there is a single toggle source. Rewrite `apps/web/components/layout/app-title.tsx` to:
```tsx
import { Link } from '@tanstack/react-router'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@lpg/ui'

export function AppTitle({
  subtitle,
  href = '/trucks',
}: {
  subtitle?: string
  href?: string
}) {
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='gap-0 py-0 hover:bg-transparent active:bg-transparent'
          asChild
        >
          <div>
            <Link
              to={href}
              onClick={() => setOpenMobile(false)}
              className='grid flex-1 text-start text-sm leading-tight'
            >
              <span className='truncate font-bold'>LPG Fleet</span>
              <span className='truncate text-xs'>
                {subtitle ?? 'Tracking & delivery ops'}
              </span>
            </Link>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
```
(This drops the now-unused `Button`, `cn`, `Menu`, `X` imports — required by `noUnusedLocals`.)

- [ ] **Step 4: Typecheck the sidebar change**

Run: `cd apps/web && pnpm exec tsc --noEmit`
Expected: no errors referencing `app-sidebar.tsx` / `app-title.tsx`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/styles/theme.css apps/web/components/layout/app-sidebar.tsx apps/web/components/layout/app-title.tsx
git commit -m "fix(web): solid bordered sidebar surface + single collapse toggle"
```

---

### Task 2: User menu + logout

**Files:**
- Modify: `apps/web/components/layout/app-header.tsx`
- Modify: `apps/web/main.tsx` (logout on 401)

**Interfaces:**
- Consumes: `useAuthStore` (`logout`), `useQueryClient` (`clear`), `useNavigate` (`@tanstack/react-router`), `@lpg/ui` `DropdownMenu*`, `Avatar*`, `Button`, `Link` (`@tanstack/react-router`), `LogOut` (lucide-react).
- Produces: a user dropdown with Profile link + Log out; `handleLogout` clears session, query cache, and navigates to `/login`.

- [ ] **Step 1: Add the logout handler + avatar dropdown to the header**

In `apps/web/components/layout/app-header.tsx`:
1. Add imports:
```tsx
import { LogOut } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'
```
and extend the existing `@lpg/ui` import to include `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator` (already imported as a group in `role-switcher.tsx`, but `app-header.tsx` currently imports `Avatar, AvatarFallback, AvatarImage, Button, Input` — add the dropdown parts there).

2. Inside `AppHeader`, add state/handlers after `const { resolvedTheme, setTheme } = useTheme()`:
```tsx
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    queryClient.clear()
    navigate({ to: '/login' })
  }
```

3. Replace the trailing static text + avatar block (current lines 59–69):
```tsx
          <div className='hidden text-right text-sm md:block'>
            <p className='font-medium'>Admin CSPH</p>
            <p className='text-xs text-muted-foreground'>Centre de pilotage</p>
          </div>

          <Avatar className='size-9 rounded-full border bg-white p-0.5'>
            <AvatarImage src={csphLogo} alt='CSPH' className='object-contain' />
            <AvatarFallback className='bg-primary/10 text-sm font-semibold text-primary'>
              CS
            </AvatarFallback>
          </Avatar>
```
with the dropdown:
```tsx
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='relative size-9 rounded-full p-0'
                aria-label='Menu utilisateur'
              >
                <Avatar className='size-9 rounded-full border bg-white'>
                  <AvatarImage src={csphLogo} alt='CSPH' className='object-contain' />
                  <AvatarFallback className='bg-primary/10 text-sm font-semibold text-primary'>
                    CS
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-60'>
              <DropdownMenuLabel className='font-normal'>
                <div className='flex flex-col gap-0.5'>
                  <p className='text-sm font-medium'>
                    {user?.email?.split('@')[0] ?? 'Utilisateur'}
                  </p>
                  <p className='text-xs text-muted-foreground'>{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to='/settings/profile'>Profil</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className='text-rose-600 focus:text-rose-600'
              >
                <LogOut className='size-4' />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
```
(Remove the now-unused `Input` import if `Input` is no longer referenced — note the search input is replaced in Task 6; if you do Task 6 first, `Input` is already gone. If doing this task standalone, keep `Input` only if still used.)

- [ ] **Step 2: Log out on 401 in main.tsx**

In `apps/web/main.tsx`, inside `queryCache.onError` (lines 52–63), update the `401` branch to also clear the session:
```tsx
        if (error.response?.status === 401) {
          toast.error('Session expired.')
          useAuthStore.getState().logout()
          router.navigate({ to: '/login' })
        }
```
(`useAuthStore` is already imported in `main.tsx`.)

- [ ] **Step 3: Typecheck**

Run: `cd apps/web && pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/layout/app-header.tsx apps/web/main.tsx
git commit -m "feat(web): user menu with profile link and logout"
```

---

### Task 3: Notification store + seed (TDD)

**Files:**
- Create: `apps/web/features/notifications/notifications-store.ts`
- Test: `apps/web/features/notifications/notifications-store.test.ts`

**Interfaces:**
- Consumes: `zustand` `create`.
- Produces: `useNotificationsStore`, `selectUnreadCount`, types `AppNotification`, `NotificationLevel`. Consumed by Task 4 (UI) and Task 6 (command palette "mark all read").

- [ ] **Step 1: Write the failing test**

Create `apps/web/features/notifications/notifications-store.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { useNotificationsStore, selectUnreadCount } from './notifications-store'

describe('notifications store', () => {
  it('seeds with some unread items', () => {
    const state = useNotificationsStore.getState()
    expect(state.items.length).toBeGreaterThan(0)
    expect(selectUnreadCount(state)).toBeGreaterThan(0)
  })

  it('markRead marks a single item read', () => {
    const id = useNotificationsStore.getState().items[0].id
    useNotificationsStore.getState().markRead(id)
    const updated = useNotificationsStore.getState().items.find((n) => n.id === id)
    expect(updated?.read).toBe(true)
  })

  it('markAllRead clears all unread', () => {
    useNotificationsStore.getState().markAllRead()
    expect(selectUnreadCount(useNotificationsStore.getState())).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && pnpm exec vitest run features/notifications/notifications-store.test.ts`
Expected: FAIL — `Cannot find module './notifications-store'`.

- [ ] **Step 3: Implement the store**

Create `apps/web/features/notifications/notifications-store.ts`:
```ts
import { create } from 'zustand'

const now = Date.now()

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error'

export type AppNotification = {
  id: string
  title: string
  body: string
  ts: number
  level: NotificationLevel
  read: boolean
}

type NotificationsState = {
  items: AppNotification[]
  markRead: (id: string) => void
  markAllRead: () => void
  addNotification: (
    n: Omit<AppNotification, 'id' | 'read' | 'ts'> & { ts?: number }
  ) => void
}

const seed: AppNotification[] = [
  {
    id: 'n1',
    title: 'Nouvelle tournée planifiée',
    body: 'TRP-2404 ajoutée pour Tradex.',
    ts: now - 1000 * 60 * 5,
    level: 'info',
    read: false,
  },
  {
    id: 'n2',
    title: 'Alerte réserve Bonabéri',
    body: 'Niveau critique à 31% de capacité.',
    ts: now - 1000 * 60 * 42,
    level: 'warning',
    read: false,
  },
  {
    id: 'n3',
    title: 'Livraison terminée',
    body: 'TRP-2398 livrée (11 050 kg).',
    ts: now - 1000 * 60 * 90,
    level: 'success',
    read: true,
  },
  {
    id: 'n4',
    title: 'Anomalie détectée',
    body: 'Perte non comptabilisée sur TRP-2402.',
    ts: now - 1000 * 60 * 180,
    level: 'error',
    read: true,
  },
]

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: seed,
  markRead: (id) =>
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllRead: () =>
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
  addNotification: (n) =>
    set((s) => ({
      items: [
        {
          ...n,
          id: crypto.randomUUID(),
          ts: n.ts ?? Date.now(),
          read: false,
        },
        ...s.items,
      ],
    })),
}))

export const selectUnreadCount = (s: NotificationsState) =>
  s.items.filter((n) => !n.read).length
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/web && pnpm exec vitest run features/notifications/notifications-store.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/features/notifications/notifications-store.ts apps/web/features/notifications/notifications-store.test.ts
git commit -m "feat(web): notifications store with seed + mark-read"
```

---

### Task 4: Notification center UI (popover in header)

**Files:**
- Create: `apps/web/features/notifications/notification-center.tsx`
- Modify: `apps/web/components/layout/app-header.tsx` (replace decorative Bell)

**Interfaces:**
- Consumes: `useNotificationsStore`, `selectUnreadCount` (Task 3); `EmptyState` from `@/components/layout/page`; `@lpg/ui` `Popover*`, `Button`, `ScrollArea`, `cn`.
- Produces: `<NotificationCenter />` rendered in the header (replacing the static Bell).

- [ ] **Step 1: Build the notification center component**

Create `apps/web/features/notifications/notification-center.tsx`:
```tsx
import {
  Bell,
  CheckCheck,
  CircleCheck,
  CircleX,
  Info,
  TriangleAlert,
} from 'lucide-react'
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  cn,
} from '@lpg/ui'
import {
  useNotificationsStore,
  selectUnreadCount,
  type NotificationLevel,
} from './notifications-store'
import { EmptyState } from '@/components/layout/page'

const LEVEL_ICON: Record<NotificationLevel, typeof Info> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
}

const LEVEL_CLASS: Record<NotificationLevel, string> = {
  info: 'text-muted-foreground',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  error: 'text-rose-600',
}

export function NotificationCenter() {
  const items = useNotificationsStore((s) => s.items)
  const unread = useNotificationsStore(selectUnreadCount)
  const markRead = useNotificationsStore((s) => s.markRead)
  const markAllRead = useNotificationsStore((s) => s.markAllRead)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='relative rounded-full text-muted-foreground'
          aria-label='Notifications'
        >
          <Bell className='size-4' />
          {unread > 0 && (
            <span className='absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white'>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 p-0'>
        <div className='flex items-center justify-between border-b p-3'>
          <p className='text-sm font-semibold'>Notifications</p>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 gap-1 text-xs'
            onClick={markAllRead}
            disabled={unread === 0}
          >
            <CheckCheck className='size-3.5' />
            Tout lire
          </Button>
        </div>
        {items.length === 0 ? (
          <EmptyState
            title='Aucune notification'
            description='Vous êtes à jour.'
          />
        ) : (
          <ScrollArea className='max-h-80'>
            <ul className='divide-y'>
              {items.map((n) => {
                const Icon = LEVEL_ICON[n.level]
                return (
                  <li key={n.id}>
                    <button
                      type='button'
                      onClick={() => markRead(n.id)}
                      className={cn(
                        'flex w-full items-start gap-3 p-3 text-start',
                        !n.read && 'bg-primary/5'
                      )}
                    >
                      <Icon className={cn('mt-0.5 size-4 shrink-0', LEVEL_CLASS[n.level])} />
                      <span className='min-w-0'>
                        <span className='block truncate text-sm font-medium'>{n.title}</span>
                        <span className='block text-xs text-muted-foreground'>{n.body}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Wire it into the header**

In `apps/web/components/layout/app-header.tsx`:
1. Add import: `import { NotificationCenter } from '@/features/notifications/notification-center'`
2. Replace the existing decorative Bell block (current lines 31–40):
```tsx
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='relative rounded-full text-muted-foreground'
            aria-label='Notifications'
          >
            <Bell className='size-4' />
            <span className='absolute top-2 right-2 size-1.5 rounded-full bg-rose-500' />
          </Button>
```
with:
```tsx
          <NotificationCenter />
```
3. Remove the now-unused `Bell` import (line 1) if `Bell` is no longer referenced anywhere in the file.

- [ ] **Step 3: Typecheck**

Run: `cd apps/web && pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/features/notifications/notification-center.tsx apps/web/components/layout/app-header.tsx
git commit -m "feat(web): notification center popover with unread badge"
```

---

### Task 5: Sonner theming

**Files:**
- Modify: `packages/ui/src/components/ui/sonner.tsx`
- Modify: `apps/web/styles/surfaces.css` (toast styling)
- Create: `apps/web/lib/toast.ts`
- Modify: `apps/web/main.tsx` (use shared toast helper)

**Interfaces:**
- Consumes: `@lpg/ui` `Toaster` (in `__root.tsx`, unchanged). `sonner` package.
- Produces: LPG-themed toasts; `lib/toast.ts` helper used by new + migrated call sites.

- [ ] **Step 1: Theme the `@lpg/ui` Toaster**

In `packages/ui/src/components/ui/sonner.tsx`, set surface tokens and keep `richColors` off:
```tsx
import { Toaster as Sonner, ToasterProps } from 'sonner'

export function Toaster({ theme, ...props }: ToasterProps) {
  return (
    <Sonner
      theme={theme ?? 'system'}
      richColors={false}
      className='toaster group'
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
```
(Using `var(--popover)` keeps the token valid even where `surfaces.css` is not loaded.)

- [ ] **Step 2: Add LPG toast accents in surfaces.css**

Append to `apps/web/styles/surfaces.css`:
```css
/* Sonner toasts — LPG accent */
[data-sonner-toast][data-type='success'] {
  border-color: color-mix(in oklch, var(--primary) 55%, var(--border));
}
[data-sonner-toast][data-type='success'] [data-icon] {
  color: var(--primary);
}
[data-sonner-toast][data-type='error'] {
  border-color: color-mix(in oklch, var(--destructive) 55%, var(--border));
}
[data-sonner-toast][data-type='error'] [data-icon] {
  color: var(--destructive);
}
[data-sonner-toast][data-type='warning'] {
  border-color: color-mix(in oklch, var(--accent) 60%, var(--border));
}
```

- [ ] **Step 3: Create a shared toast helper**

Create `apps/web/lib/toast.ts`:
```ts
import { toast as sonnerToast, type ExternalToast } from 'sonner'

export const toast = (message: string, data?: ExternalToast) =>
  sonnerToast(message, { duration: 5000, ...data })

export const toastSuccess = (message: string, data?: ExternalToast) =>
  sonnerToast.success(message, { duration: 4000, ...data })

export const toastError = (message: string, data?: ExternalToast) =>
  sonnerToast.error(message, { duration: 6000, ...data })

export const toastInfo = (message: string, data?: ExternalToast) =>
  sonnerToast.info(message, { duration: 4000, ...data })
```

- [ ] **Step 4: Migrate main.tsx toasts to the helper**

In `apps/web/main.tsx`:
1. Replace `import { toast } from 'sonner'` (line 10) with `import { toastError } from '@/lib/toast'`.
2. Replace the three toast calls:
   - `toast.error('Content not modified!')` → `toastError('Content not modified!')`
   - `toast.error('Session expired.')` → `toastError('Session expired.')`
   - `toast.error('Internal server error.')` → `toastError('Internal server error.')`

- [ ] **Step 5: Typecheck**

Run: `cd apps/web && pnpm exec tsc --noEmit`
Expected: no errors (and `@lpg/ui` sonner still compiles under its own `tsc --noEmit`).

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/ui/sonner.tsx apps/web/styles/surfaces.css apps/web/lib/toast.ts apps/web/main.tsx
git commit -m "feat(web): LPG-themed sonner toasts + shared helper"
```

---

### Task 6: Command palette (Cmd/Ctrl+K)

**Files:**
- Modify: `packages/ui/src/index.ts` (export `command`)
- Create: `apps/web/features/command-palette/command-items.ts`
- Create: `apps/web/features/command-palette/command-palette-store.ts`
- Create: `apps/web/features/command-palette/command-palette.tsx`
- Modify: `apps/web/components/layout/authenticated-layout.tsx` (mount + shortcut)
- Modify: `apps/web/components/layout/app-header.tsx` (search opens palette)
- Test: `apps/web/features/command-palette/command-items.test.ts`

**Interfaces:**
- Consumes: `@lpg/ui` `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`; `getSidebarData` (Task 1 context); `useRoleStore`; `useTheme`; `useNotificationsStore`; `useAuthStore`; `useQueryClient`; `useNavigate`.
- Produces: `<CommandPalette />` mounted in the authenticated layout, opened via Cmd/Ctrl+K or the header search; `getNavCommandItems()` (tested pure builder).

- [ ] **Step 1: Export the command primitive from @lpg/ui**

In `packages/ui/src/index.ts`, add after the `collapsible` line (line 20):
```ts
export * from './components/ui/command'
```

- [ ] **Step 2: Write the failing test for the nav builder**

Create `apps/web/features/command-palette/command-items.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { getNavCommandItems } from './command-items'
import { getSidebarData } from '@/config/rbac/sidebar-by-role'

describe('getNavCommandItems', () => {
  it('returns one entry per leaf nav link with its group', () => {
    const items = getNavCommandItems(getSidebarData('SUPER_ADMIN'))
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((i) => typeof i.href === 'string' && i.href.startsWith('/'))).toBe(true)
    expect(items.some((i) => i.group === 'Applications métier')).toBe(true)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd apps/web && pnpm exec vitest run features/command-palette/command-items.test.ts`
Expected: FAIL — `Cannot find module './command-items'`.

- [ ] **Step 4: Implement the builder + store**

Create `apps/web/features/command-palette/command-items.ts`:
```ts
import { type SidebarData } from '@/components/layout/types'

export type CommandEntry = {
  group: string
  label: string
  href?: string
}

export function getNavCommandItems(sidebar: SidebarData): CommandEntry[] {
  const out: CommandEntry[] = []
  for (const g of sidebar.navGroups) {
    for (const it of g.items) {
      if ('url' in it && it.url) {
        out.push({ group: g.title, label: it.title, href: it.url })
      }
    }
  }
  return out
}
```

Create `apps/web/features/command-palette/command-palette-store.ts`:
```ts
import { create } from 'zustand'

type CommandPaletteState = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
```

- [ ] **Step 5: Implement the command palette UI**

Create `apps/web/features/command-palette/command-palette.tsx`:
```tsx
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@lpg/ui'
import { useCommandPaletteStore } from './command-palette-store'
import { getNavCommandItems } from './command-items'
import { getSidebarData } from '@/config/rbac/sidebar-by-role'
import { useRoleStore } from '@/store/role-store'
import { useTheme } from '@/context/theme-provider'
import { useNotificationsStore } from '@/features/notifications/notifications-store'
import { useAuthStore } from '@/store/auth-store'

export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open)
  const setOpen = useCommandPaletteStore((s) => s.setOpen)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activeRole = useRoleStore((s) => s.activeRole)
  const { setTheme, resolvedTheme } = useTheme()
  const markAllRead = useNotificationsStore((s) => s.markAllRead)
  const logout = useAuthStore((s) => s.logout)

  const navItems = getNavCommandItems(getSidebarData(activeRole))

  const run = (fn: () => void) => {
    fn()
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Rechercher ou exécuter une commande...' />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading='Navigation'>
          {navItems.map((it) => (
            <CommandItem
              key={it.href}
              value={`${it.group} ${it.label}`}
              onSelect={() =>
                run(() => navigate({ to: it.href as never }))
              }
            >
              {it.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading='Actions'>
          <CommandItem onSelect={() => run(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))}>
            Basculer le thème
          </CommandItem>
          <CommandItem onSelect={() => run(() => markAllRead())}>
            Marquer les notifications comme lues
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => {
                logout()
                queryClient.clear()
                navigate({ to: '/login' })
              })
            }
          >
            Se déconnecter
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

- [ ] **Step 6: Mount + global shortcut in the authenticated layout**

In `apps/web/components/layout/authenticated-layout.tsx`:
1. Add imports:
```tsx
import { useEffect } from 'react'
import { CommandPalette } from '@/features/command-palette/command-palette'
import { useCommandPaletteStore } from '@/features/command-palette/command-palette-store'
```
2. Add a keydown effect inside `AuthenticatedLayout`:
```tsx
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        useCommandPaletteStore.getState().toggle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
```
3. Render `<CommandPalette />` just before `{children ?? <Outlet />}`:
```tsx
        <AppHeader />
        <CommandPalette />
        {children ?? <Outlet />}
```

- [ ] **Step 7: Make the header search open the palette**

In `apps/web/components/layout/app-header.tsx`:
1. Add import: `import { useCommandPaletteStore } from '@/features/command-palette/command-palette-store'`
2. Replace the search `Input` block (current lines 14–27) with a button styled like the input:
```tsx
          <div className='hidden flex-1 md:flex'>
            <button
              type='button'
              onClick={() => useCommandPaletteStore.getState().setOpen(true)}
              className='flex w-full max-w-md items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm text-muted-foreground shadow-none transition-colors hover:border-primary/40'
            >
              <Search className='size-4' />
              <span>Rechercher un camion, une tournee, un depot...</span>
              <span className='ms-auto flex items-center gap-1 rounded-md border bg-muted/70 px-1.5 py-1 text-[10px] font-medium'>
                <span>Ctrl</span>
                <span>K</span>
              </span>
            </button>
          </div>
```
3. Remove the now-unused `Input` import (line 3) if no longer referenced.

- [ ] **Step 8: Run the test and typecheck**

Run: `cd apps/web && pnpm exec vitest run features/command-palette/command-items.test.ts`
Expected: PASS.
Run: `cd apps/web && pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add packages/ui/src/index.ts apps/web/features/command-palette apps/web/components/layout/authenticated-layout.tsx apps/web/components/layout/app-header.tsx
git commit -m "feat(web): command palette (Cmd/Ctrl+K) with nav + actions"
```

---

### Task 7: Breadcrumbs

**Files:**
- Create: `apps/web/lib/breadcrumbs.ts`
- Create: `apps/web/components/layout/breadcrumbs.tsx`
- Modify: `apps/web/components/layout/app-header.tsx` (add `<Breadcrumbs />`)
- Test: `apps/web/lib/breadcrumbs.test.ts`

**Interfaces:**
- Consumes: `useLocation` (`@tanstack/react-router`); `buildBreadcrumbs` (pure).
- Produces: `<Breadcrumbs />` shown in the header; `buildBreadcrumbs(pathname)` (tested pure builder).

- [ ] **Step 1: Write the failing test**

Create `apps/web/lib/breadcrumbs.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { buildBreadcrumbs } from './breadcrumbs'

describe('buildBreadcrumbs', () => {
  it('builds crumbs with accumulated hrefs', () => {
    const crumbs = buildBreadcrumbs('/super-admin/overview')
    expect(crumbs).toEqual([
      { label: expect.any(String), href: '/super-admin' },
      { label: expect.any(String), href: '/super-admin/overview' },
    ])
  })

  it('falls back to a capitalized segment when no label exists', () => {
    const crumbs = buildBreadcrumbs('/foo/bar')
    expect(crumbs[0].label).toBe('Foo')
    expect(crumbs[1].label).toBe('Bar')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && pnpm exec vitest run lib/breadcrumbs.test.ts`
Expected: FAIL — `Cannot find module './breadcrumbs'`.

- [ ] **Step 3: Implement the pure builder**

Create `apps/web/lib/breadcrumbs.ts`:
```ts
const LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  trucks: 'Camions',
  transporters: 'Transporteurs',
  marketers: 'Marketeurs',
  routes: 'Tournées',
  settings: 'Paramètres',
  profile: 'Profil',
  activity: 'Activité',
  'trip-tracking': 'Suivi camions',
  overview: 'Vue d’ensemble',
  finance: 'Indicateurs financiers',
  organizations: 'Organisations & sites',
  users: 'Utilisateurs',
  anomalies: 'Anomalies & fraude',
  reports: 'Rapports',
  map: 'Carte',
}

export type Breadcrumb = { label: string; href: string }

export function buildBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: Breadcrumb[] = []
  let acc = ''
  for (const seg of segments) {
    acc += `/${seg}`
    const label = LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
    crumbs.push({ label, href: acc })
  }
  return crumbs
}
```

- [ ] **Step 4: Implement the Breadcrumbs component**

Create `apps/web/components/layout/breadcrumbs.tsx`:
```tsx
import { Fragment } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { buildBreadcrumbs } from '@/lib/breadcrumbs'

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const crumbs = buildBreadcrumbs(pathname)
  if (crumbs.length === 0) return null
  return (
    <nav aria-label='Fil d’Ariane' className='hidden items-center gap-1 text-sm md:flex'>
      {crumbs.map((c, i) => (
        <Fragment key={c.href}>
          {i > 0 && <ChevronRight className='size-3.5 text-muted-foreground' />}
          <Link to={c.href as never} className='text-muted-foreground hover:text-foreground'>
            {c.label}
          </Link>
        </Fragment>
      ))}
    </nav>
  )
}
```

- [ ] **Step 5: Add Breadcrumbs to the header**

In `apps/web/components/layout/app-header.tsx`:
1. Add import: `import { Breadcrumbs } from '@/components/layout/breadcrumbs'`
2. Inside the header layout, add `<Breadcrumbs />` right after the `RoleSwitcher` (so it sits between the role switcher and the search on `md+`):
```tsx
          <RoleSwitcher />
          <Breadcrumbs />
```

- [ ] **Step 6: Run the test and typecheck**

Run: `cd apps/web && pnpm exec vitest run lib/breadcrumbs.test.ts`
Expected: PASS.
Run: `cd apps/web && pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/breadcrumbs.ts apps/web/lib/breadcrumbs.test.ts apps/web/components/layout/breadcrumbs.tsx apps/web/components/layout/app-header.tsx
git commit -m "feat(web): breadcrumbs derived from route path"
```

---

### Task 8: Profile page (route)

**Files:**
- Create: `apps/web/routes/_authenticated/settings/profile.tsx`

**Interfaces:**
- Consumes: `createFileRoute` (`@tanstack/react-router`); `PageShell`, `SectionCard` from `@/components/layout/page`; `useAuthStore`; `useRoleStore`; `ROLE_LABELS`; `@lpg/ui` `Avatar*`, `Badge`; `csphLogo` asset.
- Produces: the `/_authenticated/settings/profile` route, auto-added to `routeTree.gen.ts` on build.

- [ ] **Step 1: Create the profile route**

Create `apps/web/routes/_authenticated/settings/profile.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage, Badge } from '@lpg/ui'
import { PageShell, SectionCard } from '@/components/layout/page'
import { useAuthStore } from '@/store/auth-store'
import { useRoleStore } from '@/store/role-store'
import { ROLE_LABELS } from '@/config/rbac/roles'
import csphLogo from '@/assets/logo-csph-small.png'

export const Route = createFileRoute('/_authenticated/settings/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const activeRole = useRoleStore((s) => s.activeRole)

  return (
    <PageShell fluid>
      <div className='space-y-6 p-4 sm:p-6'>
        <div>
          <h1 className='text-xl font-semibold tracking-tight'>Profil</h1>
          <p className='text-sm text-muted-foreground'>Vos informations de compte.</p>
        </div>
        <SectionCard title='Compte'>
          <div className='flex items-center gap-4'>
            <Avatar className='size-14 rounded-full border bg-white'>
              <AvatarImage src={csphLogo} alt='CSPH' className='object-contain' />
              <AvatarFallback className='bg-primary/10 text-primary'>
                {user?.email?.charAt(0).toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className='font-medium'>{user?.email}</p>
              <Badge variant='secondary' className='mt-1'>
                {ROLE_LABELS[activeRole]}
              </Badge>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  )
}
```

- [ ] **Step 2: Regenerate the route tree + typecheck**

Run: `cd apps/web && pnpm exec tsc --noEmit`
Expected: `routeTree.gen.ts` regenerated by the router plugin; no type errors for the new `/settings/profile` route.

- [ ] **Step 3: Commit**

```bash
git add apps/web/routes/_authenticated/settings/profile.tsx apps/web/routeTree.gen.ts
git commit -m "feat(web): profile page route"
```

---

### Task 9: Final verification (build + full test suite)

**Files:** none new — verification only.

- [ ] **Step 1: Run the full build**

Run: `pnpm turbo run build --filter @lpg/web`
Expected: `✓ built` for `@lpg/web`; no `tsc` errors (catches any `noUnusedLocals`/`noUnusedParameters` regressions).

- [ ] **Step 2: Run the full test suite**

Run: `cd apps/web && pnpm exec vitest run`
Expected: **54 passed (51 existing + 3 new)** — `Test Files 12 passed`, no failures.

- [ ] **Step 3: Fix anything that fails, then re-run both commands until green**

If a build or test fails, fix the offending file, amend the relevant task commit (or add a fixup commit), and re-run Steps 1–2.

- [ ] **Step 4: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(web): address build/test gaps from shell enhancements"
```

---

## Self-review notes (already applied)

- **Spec coverage:** (1) sidebar fix → Tasks 1; (2) user menu + logout → Task 2; (3) notification center → Tasks 3–4; (4) sonner theming → Task 5; (5) command palette + breadcrumbs + profile → Tasks 6–8. Final verification Task 9.
- **Placeholders:** none — every step has concrete code/commands/expected output.
- **Type consistency:** `useNotificationsStore`, `selectUnreadCount`, `getNavCommandItems`, `useCommandPaletteStore`, `buildBreadcrumbs` names/signatures match across tasks. `CommandEntry.href` is `string | undefined`, handled with `it.href as never` in the palette.
- **No backend:** all features are client-side (Zustand seeds / stores); consistent with `fake`/`mock` modes.
- **Playwright caveat:** browsers are not installed, so live browser probing is unavailable; verification relies on `tsc --noEmit` + Vitest browser tests (which use the bundled chromium) + build.
