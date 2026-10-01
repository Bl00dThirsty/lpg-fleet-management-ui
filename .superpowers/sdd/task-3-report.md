# Task 3 + Task 4 Report — Plan 6 (forms overhaul)

**Status:** COMPLETE — no commit (working tree only).

## Task 3 — Shared SubmitButton + FormSection (+ Spinner)

### What was built

New file `apps/web/src/components/entity-crud/form-ui.tsx` exporting three components:

- `Spinner({ className })` — no `Spinner` exists in `components/ui` (verified by grep); added a small one using `Loader2` from `lucide-react` (confirmed available in `apps/web` + `@lpg/ui` deps) with `animate-spin`, exported from `form-ui.tsx`.
- `SubmitButton({ pending, children, ...props })` — thin wrapper over `@lpg/ui` `Button`, `type='submit'`, `disabled={pending || disabled}`, renders `<Spinner>` when `pending`.
- `FormSection({ title, children })` — `animate-in fade-in slide-in-from-bottom-1 duration-200` wrapper. Verified these utilities exist: the app is Tailwind v4 + `tw-animate-css` (in `apps/web/package.json`), and `animate-in`/`fade-in`/`slide-in-from-*` are already used across `apps/web/src/components/ui/*` (dialog, popover, select, etc.). No custom CSS file needed.

### Wiring into EntityForm

- `field-config.ts`: added optional `section?: string` to `FieldConfig` (used only as a group key; nothing else changed).
- `entity-form.tsx`: fields are grouped by `field.section ?? 'Informations'` via a `useMemo`, each group rendered in a `FormSection`; the footer submit button now uses `SubmitButton pending={submitting}`.
  - Note: the plain `Button` "Enregistrement…" label was replaced by a spinner + static label — small intentional visual change.

## Task 4 — Pickups wizard on RHF + zod

`apps/web/src/features/pickups/components/pickups-create-wizard.tsx` rewritten:

- Replaced the raw `<input>`/`<select>` + `inputClass` and the manual `safeParse` → red `<ul>` error list with `useForm<PickupWizardValues>` + `zodResolver(pickupWizardSchema)` and shadcn `FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` for `type`, `requested_quantity`, `marketeur_org_id`, `source_site_id`, `destination_site_id`. Errors render inline (French messages straight from the schema) via `FormMessage`.
- Step 1 advance uses `await form.trigger()` (validates the whole schema incl. the `superRefine` site-difference rule — unchanged, not edited). Valid → step 2.
- Step 2 (vehicle recommendation cards) is untouched — still plain-state `selectedVehicles` toggles; the "Créer la requête" button stays disabled until ≥1 vehicle selected. Submit path preserved exactly: `usePickupsStore.getState().createPickup({ marketeur_org_id, source_site_id, destination_site_id, requested_quantity })` (same 4-field `PickupDraft` payload as before — `type` is collected but not sent, unchanged behavior) + `toast.success`/`toast.error` + `onCreated(created, selectedVehicles)` + `reset()`.
- Swapped to `@lpg/ui` `Input`/`Select` (matches `entity-form.tsx` conventions); kept the two-column type/quantity row, full-width selectors, and step-2 layout/classes to avoid visual regressions.
- Default values computed lazily per mount/reset (`defaultValues()` + `form.reset(defaultValues())`), preserving the original's `useState`-initializer/reset semantics for the MARKETEUR org.

## Tests

- No pickups-wizard UI test exists — only `features/pickups/lib/vehicle-recommendation.test.ts` (untouched, still passing).
- `entity-form.test.ts` only covers the pure `applyTransforms` fn — unaffected by the FormSection/SubmitButton wiring.

## Verification (all run from repo root)

- `pnpm --filter @lpg/web exec tsc --noEmit -p tsconfig.app.json` → PASS (no errors).
- `pnpm --filter @lpg/web exec eslint src/components/entity-crud/form-ui.tsx src/components/entity-crud/entity-form.tsx src/features/pickups/components/pickups-create-wizard.tsx` → 0 errors, 1 warning.
- `pnpm --filter @lpg/web run test:unit` → 84 files, 422 tests PASS.

## Concerns

1. **eslint warning (only 1):** `react-hooks/incompatible-library` on `form.watch(...)` in the wizard. This is a warning, not an error, and is the exact same pre-existing pattern in `features/tours/components/tour-create-wizard.tsx` (verified) — accepted codebase convention.
2. **Prettier not verifiable:** `prettier --check` fails with "Cannot find package '@trivago/prettier-plugin-sort-imports'" even on untouched files (`src/store/auth-store.ts`) — pre-existing environment issue (missing plugin dep), not caused by these changes.
3. **FormSection heading:** entity sheets that don't set `field.section` now render a single "Informations" heading (per brief's "else wrap all in one section"). Minor visual addition; easy to drop if unwanted.
4. **SubmitButton label change:** EntityForm footer now shows spinner + static label instead of "Enregistrement…" while pending.
5. **SubmitButton unused elsewhere:** currently only consumed by EntityForm; exported for reuse by later tasks.

Report path: `.superpowers/sdd/task-3-report.md` (covers both Task 3 and Task 4).
