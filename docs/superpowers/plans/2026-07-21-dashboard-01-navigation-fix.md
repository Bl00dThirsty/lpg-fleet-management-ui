# Dashboard-01 Integration + Navigation Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix sidebar navigation bugs (active highlighting, collapsible state), enhance dashboard with shadcn dashboard-01 patterns, and add missing UI components.

**Architecture:** Incremental enhancement of the existing TanStack Router + shadcn sidebar system. Navigation fixes use `useLocation()`/`useMatch()` for active route detection. Dashboard adopts dashboard-01's CardAction + gradient KPI cards. New components (Drawer, @dnd-kit) added to @lpg/ui.

**Tech Stack:** React 19.2, TanStack Router 1.168, Tailwind CSS v4, shadcn/ui (new-york-v4), Lucide React icons, Recharts

## Global Constraints

- Preserve TanStack Router file-based routing and all 7 role sidebar configs
- Do NOT merge `develop` into `@lpg/web` — port selectively
- Do NOT break Vercel deploy config (`VITE_API_MODE=fake`, SPA rewrite)
- All edits go through `@lpg/ui` package for shared components
- Keep all existing tests passing (`pnpm test` → 51/51)

---

### File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/web/components/layout/nav-main.tsx` | Modify | Active route detection + collapsible sync |
| `apps/web/components/layout/app-sidebar.tsx` | Modify | Pass pathname to NavMain |
| `apps/web/components/layout/breadcrumbs.tsx` | Modify | Accept module labels from registry |
| `apps/web/lib/breadcrumbs.ts` | Modify | Map dynamic segments to labels |
| `apps/web/features/dashboard/section-cards.tsx` | Modify | dashboard-01 CardAction + gradient pattern |
| `apps/web/features/dashboard/index.tsx` | Modify | Remove multislect filters, align with dashboard-01 layout |
| `packages/ui/src/components/ui/badge.tsx` | Modify | Add success/warning variants |
| `packages/ui/src/components/ui/drawer.tsx` | Create | New shadcn Drawer component |
| `packages/ui/src/index.ts` | Modify | Export Drawer |
| `apps/web/components/layout/app-header.tsx` | Modify | SiteHeader pattern (page title inline) |

---

### Task 1: Add success + warning badge variants

**Files:**
- Modify: `packages/ui/src/components/ui/badge.tsx`

**Interfaces:**
- Produces: `Badge` variant `"success"` (green), `"warning"` (amber) available to all consumers

- [ ] **Step 1: Add variants to badgeVariants CVA**

```tsx
// In badgeVariants cva, add to variants.variant:
success:
  'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
warning:
  'border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/components/ui/badge.tsx
git commit -m "feat(ui): add success and warning badge variants"
```

---

### Task 2: Add Drawer component to @lpg/ui

**Files:**
- Create: `packages/ui/src/components/ui/drawer.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Produces: `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerFooter`, `DrawerTitle`, `DrawerDescription`, `DrawerClose`

- [ ] **Step 1: Install vaul dependency**

```bash
pnpm add vaul --filter @lpg/ui
```

- [ ] **Step 2: Create drawer.tsx**

```tsx
import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { cn } from '../../lib/utils'

function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80',
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          'group/drawer-content fixed z-50 flex h-auto flex-col bg-background',
          'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b',
          'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t',
          'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:max-w-sm data-[vaul-drawer-direction=right]:border-l sm:data-[vaul-drawer-direction=right]:max-w-md data-[vaul-drawer-direction=right]:rounded-l-lg',
          'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:max-w-sm data-[vaul-drawer-direction=left]:border-r sm:data-[vaul-drawer-direction=left]:max-w-md data-[vaul-drawer-direction=left]:rounded-r-lg',
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('font-semibold text-foreground', className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
```

- [ ] **Step 3: Export from @lpg/ui index**

Add to `packages/ui/src/index.ts` after the dialog export:
```ts
export * from './components/ui/drawer'
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/ui/drawer.tsx packages/ui/src/index.ts packages/ui/package.json pnpm-lock.yaml
git commit -m "feat(ui): add Drawer component (vaul)"
```

---

### Task 3: Fix NavMain active link detection + collapsible sync

**Files:**
- Modify: `apps/web/components/layout/nav-main.tsx`
- Modify: `apps/web/components/layout/app-sidebar.tsx`

**Interfaces:**
- Consumes: `useLocation()` from `@tanstack/react-router` for pathname
- Produces: Nav items highlight correctly based on current route; collapsible groups auto-expand when a child is active

- [ ] **Step 1: Rewrite nav-main.tsx with route-aware active state**

```tsx
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Link, useLocation, useMatch } from '@tanstack/react-router'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@lpg/ui'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@lpg/ui'

interface NavSubItem {
  title: string
  url: string
}

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  badge?: number | string
  items?: NavSubItem[]
}

interface NavGroup {
  title: string
  items: NavItem[]
}

function useIsActive(url: string): boolean {
  const match = useMatch({ from: url as never })
  return match !== false
}

function groupHasActiveChild(items: NavItem[]): boolean {
  return items.some((item) => {
    if (item.items && item.items.length > 0) {
      return item.items.some((sub) => {
        try {
          return useIsActive(sub.url)
        } catch {
          return false
        }
      })
    }
    try {
      return useIsActive(item.url)
    } catch {
      return false
    }
  })
}

function NavGroupComponent({ group }: { group: NavGroup }) {
  const isGroupActive = groupHasActiveChild(group.items)

  return (
    <SidebarGroup key={group.title}>
      <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => {
          const hasSub = item.items && item.items.length > 0

          if (!hasSub) {
            const active = (() => {
              try { return useIsActive(item.url) } catch { return false }
            })()

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={active}
                >
                  <Link to={item.url as never}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isGroupActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items!.map((sub) => {
                      const subActive = (() => {
                        try { return useIsActive(sub.url) } catch { return false }
                      })()

                      return (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild isActive={subActive}>
                            <Link to={sub.url as never}>
                              <span>{sub.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <NavGroupComponent key={group.title} group={group} />
      ))}
    </>
  )
}
```

Wait -- the `useIsActive` pattern with try/catch inside a component body is fragile. Let me use `useMatchRoute` from TanStack Router instead, which is designed for this.

Let me check: TanStack Router has `useMatchRoute` which returns a function you can call to check if a route matches.

Actually, looking at the TanStack Router docs more carefully:
- `useMatch` returns the match object or false for a specific route
- `useMatchRoute` returns a function `matchRoute` that takes `{ to, fuzzy }` and returns true/false

The issue with `useMatch` is it needs to be called unconditionally (React hooks rules). The approach with wrapping in try/catch doesn't work.

The correct approach is to use `useMatchRoute`:
```ts
const matchRoute = useMatchRoute()
const isActive = matchRoute({ to: url, fuzzy: true })
```

This doesn't violate hooks rules because `matchRoute` is a function, not a hook.

Let me rewrite:

```tsx
import { useMatchRoute } from '@tanstack/react-router'

function NavGroupComponent({ group }: { group: NavGroup }) {
  const matchRoute = useMatchRoute()
  
  const isGroupActive = group.items.some((item) => {
    if (item.items?.length) {
      return item.items.some((sub) => matchRoute({ to: sub.url, fuzzy: true }))
    }
    return matchRoute({ to: item.url, fuzzy: true })
  })

  return (
    <SidebarGroup key={group.title}>
      <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => {
          const hasSub = item.items && item.items.length > 0

          if (!hasSub) {
            const active = matchRoute({ to: item.url, fuzzy: true })
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={active}
                >
                  <Link to={item.url as never}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isGroupActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items!.map((sub) => {
                      const subActive = matchRoute({ to: sub.url, fuzzy: true })
                      return (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild isActive={subActive}>
                            <Link to={sub.url as never}>
                              <span>{sub.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
```

This is clean and correct. Let me finalize the plan steps.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/layout/nav-main.tsx
git commit -m "fix(nav): active link detection and collapsible sync via useMatchRoute"
```

---

### Task 4: Fix breadcrumbs for dynamic route segments

**Files:**
- Modify: `apps/web/lib/breadcrumbs.ts`

**Interfaces:**
- Produces: Human-readable labels for dynamic segments like `$role`, `$module`, `$truckId`, `$marketerId`, `$transporterId`, `$siteId`, `$fleetName`

- [ ] **Step 1: Update LABELS and generateBreadcrumbs**

```ts
import { ROLE_LABELS } from '@/config/rbac/roles'
import { roleFromSlug } from '@/config/rbac/sidebar-by-role'
import { MODULE_REGISTRY } from '@/config/modules/registry'

export type Breadcrumb = { label: string; to: string }

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  trucks: 'Camions',
  transporters: 'Transporteurs',
  marketers: 'Marketeurs',
  routes: 'Tournées',
  activity: 'Activité',
  'trip-tracking': 'Suivi camions',
  settings: 'Paramètres',
  profile: 'Profil',
  'notification-groups': 'Groupes de notification',
  vehicles: 'Véhicules',
  cylinders: 'Citernes',
  maintenance: 'Entretien',
  tracking: 'Suivi',
  drivers: 'Chauffeurs',
  reports: 'Rapports',
}

function resolveSegmentLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]

  const role = roleFromSlug(segment)
  if (role) return ROLE_LABELS[role] ?? segment

  return segment
}

export function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: Breadcrumb[] = []
  let acc = ''
  for (const seg of segments) {
    acc += `/${seg}`
    crumbs.push({ label: resolveSegmentLabel(seg), to: acc })
  }
  return crumbs
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/breadcrumbs.ts
git commit -m "fix(breadcrumbs): map dynamic route segments to human-readable labels"
```

---

### Task 5: Enhance SectionCards with dashboard-01 pattern

**Files:**
- Modify: `apps/web/features/dashboard/section-cards.tsx`

**Interfaces:**
- Consumes: `trucksHooks`, `toursHooks`, `sitesHooks`, `declarationsHooks` from `@/lib/api/use-resources`
- Produces: 4 KPI cards with gradient backgrounds, CardAction badges, container queries

- [ ] **Step 1: Rewrite section-cards.tsx**

```tsx
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Badge, Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@lpg/ui'
import { trucksHooks, toursHooks, sitesHooks, declarationsHooks } from '@/lib/api/use-resources'

export function SectionCards() {
  const { data: trucksResult } = trucksHooks.useList()
  const { data: toursResult } = toursHooks.useList()
  const { data: sitesResult } = sitesHooks.useList()
  const { data: declarationsResult } = declarationsHooks.useList()

  const trucks = (trucksResult?.data ?? []) as any[]
  const tours = (toursResult?.data ?? []) as any[]
  const sites = (sitesResult?.data ?? []) as any[]
  const declarations = (declarationsResult?.data ?? []) as any[]

  const activeTours = tours.filter((t: any) => t.status === 'in_progress').length

  const cards = [
    {
      key: 'trucks',
      title: 'Total camions',
      value: trucks.length,
      trend: '+8.2%',
      up: true,
      footer: 'Flotte enregistree',
      detail: 'En hausse ce mois',
    },
    {
      key: 'tours',
      title: 'Tournees actives',
      value: activeTours,
      trend: '+12.5%',
      up: true,
      footer: 'En cours de livraison',
      detail: 'En hausse ce mois',
    },
    {
      key: 'sites',
      title: 'Citernes',
      value: sites.length,
      trend: '-2.4%',
      up: false,
      footer: 'Sites de stockage',
      detail: 'En baisse ce mois',
    },
    {
      key: 'declarations',
      title: 'Declarations',
      value: declarations.length,
      trend: '+24.8%',
      up: true,
      footer: 'Ce mois-ci',
      detail: 'En hausse ce mois',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {cards.map((card) => (
        <Card key={card.key} className="@container/card">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {card.trend}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.detail}
              {card.up ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            </div>
            <div className="text-muted-foreground">{card.footer}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/features/dashboard/section-cards.tsx
git commit -m "feat(dashboard): adopt dashboard-01 CardAction + gradient KPI card pattern"
```

---

### Task 6: Install dashboard-01 block and dependencies

**Files:**
- No source changes -- runs shadcn CLI to add the block for reference
- Adds `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`, `@dnd-kit/utilities`

- [ ] **Step 1: Run shadcn add for dashboard-01**

```bash
npx shadcn@latest add dashboard-01
```

This will install the dashboard-01 block files into the project and prompt for dependency installation.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add shadcn dashboard-01 block and dnd-kit dependencies"
```

---

### Task 7: Polish AppHeader with dashboard-01 SiteHeader pattern

**Files:**
- Modify: `apps/web/components/layout/app-header.tsx`

- [ ] **Step 1: Add page title and cleaner separator layout**

```tsx
import { useEffect, useState, useMemo } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useLocation } from '@tanstack/react-router'
import { useTheme } from '@/context/theme-provider'
import { Button, cn, Separator, SidebarTrigger } from '@lpg/ui'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { NotificationCenter } from '@/features/notifications/notification-center'
import { CommandPalette } from '@/features/command-palette/command-palette'
import { generateBreadcrumbs } from '@/lib/breadcrumbs'

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pageTitle = useMemo(() => {
    const crumbs = generateBreadcrumbs(pathname)
    return crumbs.length > 0 ? crumbs[crumbs.length - 1].label : ''
  }, [pathname])

  return (
    <header
      className={cn(
        'flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height,border-color,background-color,box-shadow] duration-200 ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12',
        scrolled
          ? 'border-border bg-background/90 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/80'
          : 'border-transparent bg-background'
      )}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumbs pathname={pathname} />
        <span className="ml-1 text-base font-medium text-muted-foreground">
          {pageTitle}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <CommandPalette />
          <NotificationCenter />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Changer le theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/layout/app-header.tsx
git commit -m "feat(header): adopt dashboard-01 SiteHeader pattern with inline page title"
```

---

### Task 8: Verify with lint + typecheck + tests

- [ ] **Step 1: Run lint**

```bash
npx turbo run lint --filter @lpg/web
```
Expected: No errors

- [ ] **Step 2: Run typecheck**

```bash
npx turbo run typecheck --filter @lpg/web
```
Expected: No errors

- [ ] **Step 3: Run tests**

```bash
pnpm test
```
Expected: 51/51 tests passing

- [ ] **Step 4: Commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: fix lint/typecheck/test issues from dashboard-01 integration"
```
