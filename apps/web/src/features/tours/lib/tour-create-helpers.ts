/**
 * Pure helpers for the tour creation dialog (Phase 3 items 3.5 – 3.7).
 *
 * 3.5 — Units: the dialog works in TM (VRAC) / btl (bouteilles 50 kg) and the
 * backend expects the same unit, so `toRequestedQuantity` is an explicit
 * pass-through. `delivered_quantity` feeds the subsidy reconciliation and
 * must never be scaled.
 *
 * 3.6 — Driver resolution: the user-LIST projection carries no roles (see
 * `mapBackendPersonToUser` in @lpg/api-client/http-adapter.ts — every list
 * row falls back to `system_role: 'LIVREUR'`), so the dialog must resolve
 * roles from the GET /users/{id} detail projection (`roles` array of
 * `{ roleCode }` / strings, or the mapped `role_codes`). DRIVER is its own
 * backend role, distinct from LIVREUR — never conflate them.
 *
 * 3.7 — Checkpoint payloads: the tour-service `CreateCheckpointDto` accepts
 * exactly one of `siteId` / `clientSiteId` plus `sequence` (>= 1,
 * UNIQUE per tour). Payloads are camelCase because the HTTP adapter passes
 * checkpoint bodies through untouched. There is NO quantity column on
 * checkpoints server-side, so the per-row planned quantity stays a local
 * planning aid and is never submitted.
 */

/** 3.5 — TM/btl pass-through. The backend expects TM, the dialog enters TM. */
export function toRequestedQuantity(quantity: number): number {
  return Number(quantity)
}

/**
 * 3.6 — Extract role codes from a user row, whatever the projection:
 * list rows (snake_case `role_codes` / `system_role`, usually empty) or
 * detail rows (camelCase `roles`: strings or `{ roleCode }` objects —
 * the `user_role_assignments` shape served by GET /users/{id}).
 * Returns upper-cased codes, deduplicated. Never invents: unknown rows → [].
 */
export function extractUserRoleCodes(row: unknown): string[] {
  if (!row || typeof row !== 'object') return []
  const rec = row as Record<string, unknown>
  const out: string[] = []
  const push = (value: unknown) => {
    if (typeof value === 'string') {
      const code = value.trim().toUpperCase()
      if (code.length > 0 && !out.includes(code)) out.push(code)
    }
  }

  const snake = rec['role_codes']
  if (Array.isArray(snake)) {
    for (const v of snake) push(v)
  }
  push(rec['system_role'])

  const roles = rec['roles']
  if (Array.isArray(roles)) {
    for (const r of roles) {
      if (typeof r === 'string') {
        push(r)
      } else if (r && typeof r === 'object') {
        const o = r as Record<string, unknown>
        push(o['roleCode'])
        push(o['role_code'])
        push(o['code'])
      }
    }
  }
  push(rec['systemRole'])
  return out
}

export type CheckpointDestinationKind = 'SITE' | 'CLIENT_SITE'

export interface CheckpointDraftRow {
  kind: CheckpointDestinationKind
  destinationId: string
  sequence: number
  plannedQuantity: number
}

export interface CheckpointPayload {
  siteId?: string
  clientSiteId?: string
  sequence: number
}

/**
 * 3.7 — Build the POST /tours/{id}/checkpoints body for one operator row.
 * Exactly one destination (chk_checkpoint_exclusive), sequence >= 1, and the
 * sequence is always the operator-entered value — never generated here.
 * Throws a French, row-scoped error so the serial submit can stop on it.
 */
export function buildCheckpointPayload(row: CheckpointDraftRow): CheckpointPayload {
  const sequence = Math.trunc(Number(row.sequence))
  if (!Number.isFinite(sequence) || sequence < 1) {
    throw new Error(
      `Séquence invalide « ${String(row.sequence)} » — la séquence commence à 1 et ne doit pas être inventée.`,
    )
  }
  const destinationId = row.destinationId?.trim() ?? ''
  if (!destinationId) {
    throw new Error(`Point n°${sequence} : choisissez une destination (site ou site client).`)
  }
  if (row.kind === 'SITE') {
    return { siteId: destinationId, sequence }
  }
  return { clientSiteId: destinationId, sequence }
}

/** 3.7 — Default sequence for a new row: max(entered) + 1, editable. */
export function nextCheckpointSequence(rows: readonly { sequence: number }[]): number {
  let max = 0
  for (const r of rows) {
    const s = Math.trunc(Number(r.sequence))
    if (Number.isFinite(s) && s > max) max = s
  }
  return max + 1
}
