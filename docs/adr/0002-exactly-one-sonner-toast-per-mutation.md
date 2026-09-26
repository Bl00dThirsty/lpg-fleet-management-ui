<!-- generated-by: gsd-doc-writer -->
# Exactly one Sonner toast owns each mutation outcome

A mutation outcome — success or failure — is reported by exactly one owner. Either the
calling code handles it explicitly through `runMutation` in
`apps/web/src/hooks/use-toast-feedback.ts`, or the global `QueryClient` mutation
`onError` in `apps/web/src/main.tsx` reports it. Never both.

`runMutation` emits the success toast and, for non-auth failures, the error toast; it
rethrows `401`/`403` so the session-expiry path owns those. The global handler consults
`shouldShowGlobalMutationError`, which suppresses the global toast when the mutation
carries `HANDLED_MUTATION_META` (`meta: { handled: true }`, set by
`useCrud` when `handled: true`), when the error is a `401` session expiry, or on `304`.
There is a single `<Toaster />` mounted in `apps/web/src/routes/__root.tsx`.

The same decision pairs the toast with the pending-state UI contract: while a mutation
runs, the owning control is disabled, exposes busy state, and keeps an accessible name.
`apps/web/src/components/entity-crud/form-ui.tsx` (`SubmitButton`, `Spinner`) is the
canonical shape — `disabled` plus `aria-busy`, a decorative `aria-hidden` spinner, and an
`sr-only` pending label so screen-reader users are told the control is working. Field
validation errors are rendered inline by react-hook-form + zod and are never toasted.

## Considered options

- **A toast per mutation via a wrapper** — rejected: wrappers drift when a caller also
  writes its own error handling, producing duplicate or contradictory toasts.
- **Inline banners instead of toasts** — rejected: destructive and success outcomes need
  a persistent, origin-independent signal that survives navigation within the route.

## Consequences

- Mutations routed through `useCrud` set `handled: true` when the caller uses
  `runMutation`; the global handler then stays quiet.
- A mutation that reports its own toast must not also rely on the global handler for
  the same outcome.
- Any new async control that owns a mutation must disable itself and announce busy state.
