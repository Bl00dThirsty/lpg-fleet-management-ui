import type { MfaStatus } from '@lpg/types'
import { makeStatusDisplay } from './status-display'

/**
 * Shared MFA status display (was previously duplicated between
 * `features/users/data/users.ts` and `features/livreurs/data/livreurs.ts`).
 *
 * Centralising the labels and class strings here closes the seam: any future
 * state added to `MfaStatus` is caught by the type system in exactly one
 * place, not in every feature that mirrors the map.
 */

const MFA_STATUS_LABELS: Record<MfaStatus, string> = {
  DISABLED: 'Désactivé',
  PENDINGSETUP: 'En attente de configuration',
  ENABLED: 'Activé',
  LOCKED: 'Verrouillé',
}

const MFA_STATUS_CLASSES: Record<MfaStatus, string> = {
  DISABLED: 'bg-slate-100 text-slate-700',
  PENDINGSETUP: 'bg-amber-100 text-amber-800',
  ENABLED: 'bg-emerald-100 text-emerald-800',
  LOCKED: 'bg-rose-100 text-rose-800',
}

export const mfaStatusDisplay = makeStatusDisplay<MfaStatus>({
  labels: MFA_STATUS_LABELS,
  classes: MFA_STATUS_CLASSES,
})
