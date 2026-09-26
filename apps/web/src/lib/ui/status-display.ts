/**
 * Status display factory (AGENTS.md §3 — single source of truth for status UI).
 *
 * Every feature that surfaces a status (DRAFT, ACTIVE, EXPIRED, …) used to
 * declare two parallel maps by hand:
 *
 *   const STATUS_LABELS: Record<Status, string> = { ACTIVE: 'Actif', … }
 *   const STATUS_CLASSES: Record<Status, string> = { ACTIVE: 'bg-emerald-100', … }
 *
 * With 12+ features that meant the labels and the CSS classes could drift
 * independently, and Tailwind class strings leaked across the data/UI seam.
 *
 * `makeStatusDisplay` closes that seam: one call returns a typed object with
 * `label(status)`, `classes(status)`, and a guard `isKnown(status)`. The
 * underlying tables live in the calling feature, but the contract that
 * "labels and classes stay aligned for the same key" is now enforced by the
 * type system.
 *
 * Why this matters:
 *  - One module, N call sites → one deletion site when the status enum
 *    changes (the deletion test passes: removing `makeStatusDisplay`
 *    concentrates the logic into 12 hand-rolled maps).
 *  - The classes constant is typed against the same `Status` union as the
 *    labels, so the compiler catches missing rows.
 *  - Adding i18n is a one-line change inside `label()` rather than 12 edits.
 */

export interface StatusDisplay<K extends string> {
  /** The full set of status keys this display understands. */
  readonly keys: readonly K[]
  /** Render the French (or current locale) label for a status. */
  label(status: K): string
  /** Return the Tailwind class string for a status. */
  classes(status: K): string
  /** Defensive check used by callers that receive `status: string` from a wire shape. */
  isKnown(status: string): status is K
}

export interface StatusDisplayInput<K extends string> {
  labels: Record<K, string>
  classes: Record<K, string>
}

export function makeStatusDisplay<K extends string>(
  input: StatusDisplayInput<K>,
): StatusDisplay<K> {
  const keys = Object.keys(input.labels) as K[]
  const labelMap = input.labels
  const classMap = input.classes

  return {
    keys,
    label(status: K): string {
      return labelMap[status]
    },
    classes(status: K): string {
      return classMap[status]
    },
    isKnown(status: string): status is K {
      return Object.prototype.hasOwnProperty.call(labelMap, status)
    },
  }
}
