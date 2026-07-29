# Shadcn Blocks Integration — Design Spec

## Theme: Claude +
- Source: tweakcn.com/r/themes/cmdght103000n04lh3e2ae93r
- Font families: Outfit (sans), Geist Mono (mono)
- Primary: warm amber (oklch(0.617 0.138 39))
- Radius: 1rem
- Background: warm cream (oklch(0.982 0.005 95))
- Sidebar: warm beige (oklch(0.966 0.008 99))
- Full palette in theme.json above

## Changes

### 1. Theme (theme.css)
Replace all :root and .dark CSS variables with the Claude + palette.
Keep our `--surface-*` and utility classes in surfaces.css.
Update fonts: install @fontsource/outfit + geist-mono.

### 2. Sidebar (sidebar-07 inspiration)
Adapt shadcn sidebar-07 block patterns into our existing AppSidebar:
- Add a collapsible "Insights" / widgets section below nav groups
- Calendar/date picker widget
- Keep our `AppSidebar`, `AppTitle`, `NavGroup` components intact
- Use the new theme's --sidebar colors

### 3. Login (login-02 integration)
Rebuild routes/login.tsx with login-02 block layout:
- Centered card with gradient side panel
- Email + password form (existing auth flow preserved)
- "Terms & Conditions" checkbox required before login
- "Mot de passe oublié ?" link
- CSPH logo branding

### 4. Tables — Bulk Actions + Ergonomic
Add DataTableBulkActions to: Marketers, Routes, Transporters, ModuleScreen tables.
Each gets role-appropriate bulk actions.
Add DataTablePagination to tables missing it.
Ensure all tables have:
- Row selection (checkbox column)
- Column sorting (DataTableColumnHeader)
- Column visibility toggle
- Faceted filters where applicable
- URL-synced state (useTableUrlState)

### 5. Charts
Install shadcn chart primitives (chart.tsx, chart-tooltip.tsx, chart-legend.tsx, chart-style.tsx) using recharts.
Add to packages/ui/src/components/ui/.
Export from @lpg/ui.

### 6. Mock API
Add pagination meta (total, page, limit) to all list endpoints.
Ensure all resource endpoints return the correct entity shapes.

### 7. Data Fetching
Use TanStack Query throughout. Optimize queries to fetch only needed fields.
Add query key factory for consistency.

## Non-Goals
- No route restructuring
- No auth flow changes (keep JWT mock + Zustand)
- No sidebar-role config changes
- No breaking changes to existing table column definitions
