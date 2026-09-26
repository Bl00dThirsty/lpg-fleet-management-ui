<!-- generated-by: gsd-doc-writer -->
# Design and UX Contract

The UI is an operational tool for CSPH, marketech, transporters, agents, and field teams. The visual system uses Tailwind/shadcn primitives, semantic chart tokens, clear status language, and predictable feedback for data-heavy workflows.

## Component and layout rules

- Use shared primitives from `apps/web/src/components/ui` and `@lpg/ui`; do not fork component paths within a feature.
- Use `components/entity-crud` conventions for forms, tables, row actions, and list states.
- Use the feature pattern `features/<domain>/{index.tsx,components,data,lib,utils}`.
- Keep view-model construction in `data/` and pure rules/state machines in `lib/`.

## Loading, error, and empty states

`resolveListState` distinguishes `loading`, `error`, `empty`, `filtered-empty`, and `ready`. A filtered-empty state must explain that filters removed the rows and offer a clear-filters path. Data-heavy routes provide a route skeleton through `pendingComponent` and use `GeneralError` for route errors.

## Forms and mutations

- Use react-hook-form with zod resolvers and shadcn Form.
- Render field errors inline with `FormMessage`; validation failures are not toast notifications.
- Hide system-derived fields such as `created_by`, timestamps, organization identity, and default status from ordinary users.
- Pending submit/action controls are disabled, expose a busy state, and have an accessible name.
- Exactly one Sonner toast owns each mutation outcome through `runMutation`; use `extractErrorMessage` for the failure message. Do not add a second toast in a component or store.

## Accessibility

- Every control has a visible or programmatic accessible name.
- Use semantic table and form markup, keyboard-operable menus/dialogs, and appropriate focus handling.
- Loading controls communicate pending state without relying on color alone.
- Charts have an accessible title and description/label. Use semantic `CHART_TOKENS` from `components/charts/chart-config.ts` so light and dark themes remain consistent.
- Honor `prefers-reduced-motion` with `usePrefersReducedMotion`; do not animate data transitions when reduced motion is requested.

## Internationalization

All user-facing copy must be available in French and English under `apps/web/public/locales/fr` and `apps/web/public/locales/en`. The i18n resources are wired in `apps/web/src/lib/i18n/config.ts`; French is the fallback. Before completing a change, run `pnpm --filter @lpg/web run i18n:check`.

## Domain presentation

- Display `VRAC` quantities in **TM** and 50 kg bottle quantities in **btl**.
- Keep operational `sites` and commercial `client_sites` visually and linguistically distinct.
- Display settings-derived thresholds with the settings key or a traceable settings label; do not imply that a mock value is a backend guarantee.
- Show async report/recompute freshness and terminal status (`READY`, `FAILED`, `EXPIRED`).

## Scope and security presentation

Navigation is permission-projected through the single `AppSidebar`. Do not use role prefixes to signal access. UI visibility is only one layer: mutation controls, store guards, forms, and the API boundary must also enforce permissions and scope.
