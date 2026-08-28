### Task 3: Shared SubmitButton + FormSection + animation

**Files:**
- Create: `apps/web/src/components/entity-crud/form-ui.tsx`
- Create: `apps/web/src/components/entity-crud/form-ui.css` (or use Tailwind keyframes)

**Interfaces:**
- Produces: `SubmitButton({ pending, children, className })` (spinner + disabled); `FormSection({ title, children })` (fade/slide-in on mount, staggered).

- [ ] **Step 1: Implement**

```tsx
export function SubmitButton({ pending, children, ...props }: React.ComponentProps<'button'> & { pending?: boolean }) {
  return (
    <Button type='submit' disabled={pending || props.disabled} {...props}>
      {pending ? <Spinner className='size-4 animate-spin' /> : null}
      {children}
    </Button>
  )
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='animate-in fade-in slide-in-from-bottom-1 duration-200 space-y-3'>
      <h3 className='text-sm font-semibold text-foreground'>{title}</h3>
      {children}
    </div>
  )
}
```

Check whether a `Spinner` component exists in `components/ui`; if not, add one (or reuse `Loader2` from lucide).

- [ ] **Step 2: Use `FormSection` in `EntityForm`**

Group fields by `field.section` if present (optional FieldConfig enhancement); else wrap all in one section.

- [ ] **Step 3: Verify build**

Run: `pnpm --filter @lpg/web exec tsc --noEmit -p tsconfig.app.json`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/entity-crud/form-ui.tsx
git commit -m "feat(forms): shared submit spinner and form section animation"
```

---

