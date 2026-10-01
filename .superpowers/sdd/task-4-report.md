# Task 4 Report — Tour creation wizard (4 steps) — Plan 5

## Status: DONE (working tree, NOT committed)

## What was done

### 1. `apps/web/src/features/tours/components/tour-create-schema.ts` (new)
Zod schemas for the wizard (zod v4):
- `checkpointRowSchema` — site XOR client_site (`chk_checkpoint_exclusive`), positive
  `expected_quantity`, integer `sequence >= 1`.
- `step1Schema` — marketeur org, source site, `execution_mode`, `type`, positive
  `requested_quantity`.
- `step2Schema` — superRefine: INTERNAL → vehicle + driver + livreur required
  (`chk_tournee_internal`); EXTERNAL → transporter required (`chk_tournee_external`).
- `step3Schema` — `checkpoints` min 1; superRefine: checkpoint `site_id` cannot equal the
  tour source site (source ≠ destination) and total checkpoint quantity cannot exceed
  `requested_quantity`.
- `tourCreateSchema` — combined schema used as the RHF `zodResolver` (validates all rules
  on final submit), built from the same `baseTourSchema` via `pick()` so step + full
  schemas stay consistent.
- Units throughout are TM / btl, never liters/kg.

### 2. `apps/web/src/features/tours/components/tour-create-wizard.tsx` (new)
`TourCreateWizard({ open, onOpenChange, onCreated })` — a 4-step Dialog following the RHF +
zod + shadcn `Form`/`FormField`/`FormMessage` pattern from `notification-group-form.tsx` and
the multi-step Dialog pattern from `pickups-create-wizard.tsx`.

- **Step indicator** (numbered dots, done/active states) + Back/Next/Annuler footer.
- **Step 1 — Type & quantité:** execution-mode toggle cards (INTERNAL/EXTERNAL), type
  select (VRAC/BOUTEILLES50KG), quantity number input with dynamic TM/btl unit suffix,
  marketeur (autofilled from `getScope` — fixed for scoped roles, editable for org-view
  régulateurs) and source site select (first active marketeur site default).
- **Step 2 — Équipage / transporteur:** INTERNAL → vehicle/driver/livreur selects filtered
  by the marketeur's org + `is_active`; EXTERNAL → transporter select built from active
  `transporter_contracts` of the marketeur's org (deduped, shows contract reference).
- **Step 3 — Points de livraison:** dynamic checkpoint rows via `useFieldArray` with a
  Site / Site client toggle, destination select (site options exclude the source site),
  expected quantity, add/remove with sequence renumbering; root-level `checkpoints` error
  rendered inline.
- **Step 4 — Récapitulatif:** summary of all fields; submit calls
  `useToursStore.getState().createTour(draft)`; on success `onCreated(created)` +
  `toast.success` + close + reset; on error inline message + `toast.error`.
- Validation: each "Suivant" runs the matching step schema via `safeParse(getValues())` and
  maps issues into RHF error state (`form.setError`, so `FormMessage` renders); final submit
  uses `form.handleSubmit` + the combined `tourCreateSchema`.
- Form resets with scope-derived defaults every time the dialog opens.

### 3. `apps/web/src/features/tours/index.tsx` (modified)
- Added a "Nouvelle tournée" header action in `PageHeader.actions`, gated by
  `hasPermission(activeRole, 'tours.create')` (`useRoleStore`).
- Renders `<TourCreateWizard>` wired to local `wizardOpen` state.

## Verification
- Typecheck: `pnpm --filter @lpg/web exec tsc --noEmit -p tsconfig.app.json` → PASS (clean).
- Lint (3 changed files): `eslint` → 0 errors. One warning
  `react-hooks/incompatible-library` on `form.watch` (React-Compiler/RHF known
  incompatibility; repo baseline already tolerates warnings, e.g. react-refresh on
  `notification-group-form.tsx`). No new errors.
- Full unit suite: `pnpm --filter @lpg/web run test:unit` → 84 files / 422 tests pass.
- Tours-focused: tours-store + tour-machine + tour-activity + scope tests → 101 tests pass.

## Concerns
- **List page still renders static fixtures.** `tours/index.tsx` reads `getTourActivity`
  (static `delivery_tours`), so a store-created tour is NOT visible in the page list — same
  pre-existing split as `performAction`/`tour-actions.tsx`. The wizard writes to the store
  (canonical runtime source); making the list/detail views store-backed is out of this
  brief's scope and is flagged for the final integration commit. The page's `onCreated` is
  therefore a documented no-op.
- **VRAC certificate:** `createTour` → `validateTour` rejects a VRAC vehicle without a
  valid certificate. The wizard does not pre-filter vehicle options by certificate; the
  store error surfaces inline + toast. A certificate-filtered vehicle select could be added
  as UX polish.
- Step schemas duplicate the crew/transporter and source≠destination rules (the quantity
  overrun rule is shared via `addQuantityOverrunIssues`); kept explicit for clarity.
- `task-4-report.md` previously held Plan 3 Task 4's report; overwritten per instruction.

## Commits
- None (per instruction — working tree only).
