### Task 4: Migrate pickups wizard to RHF+zod (visual cleanup)

**Files:**
- Modify: `apps/web/src/features/pickups/components/pickups-create-wizard.tsx`

**Interfaces:**
- Consumes: existing `pickupWizardSchema` (zod), `@lpg/ui` primitives.
- Produces: the wizard uses RHF + shadcn Form with inline errors (replacing raw `<input>`/`<select>` + manual classes), keeping the two-step flow + vehicle recommendation cards.

- [ ] **Step 1: Rewrite field rendering**

Use `FormField`/`Controller` + `FormMessage` for `type`, `requested_quantity`, `source_site_id`, `destination_site_id`. Keep the existing `superRefine` site-difference rule. Render inline errors as `FormMessage` instead of the manual `<ul>`.

- [ ] **Step 2: Keep vehicle selection step**

Step 2 (recommendVehicles cards) stays; convert to `Controller` or plain state — it's a selection not a text input.

- [ ] **Step 3: Verify build + tests**

Run: `pnpm --filter @lpg/web exec tsc --noEmit -p tsconfig.app.json` and `pnpm --filter @lpg/web run test:unit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/pickups/components/pickups-create-wizard.tsx
git commit -m "feat(pickups): wizard on RHF + zod with inline errors"
```

---

