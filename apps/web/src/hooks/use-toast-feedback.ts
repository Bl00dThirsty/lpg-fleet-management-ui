import { isAxiosError } from 'axios'

/**
 * Standardized mutation feedback (AGENTS.md §4 "Toasts"): exactly one toast
 * per outcome. `extractErrorMessage` maps a thrown error to a French,
 * user-friendly message (no toast here — callers decide where to surface it).
 */

/** French, user-friendly message for a thrown error (no toast here). */
export function extractErrorMessage(error: unknown): string {
  // Axios errors first: their `message` is a non-empty technical string that
  // would otherwise shadow the API title and the status-mapped French text.
  if (isAxiosError(error)) {
    const title = error.response?.data?.title
    if (typeof title === 'string' && title.length > 0) return title
    const status = error.response?.status
    if (status === 401) return 'Session expirée. Veuillez vous reconnecter.'
    if (status === 403) return 'Accès refusé.'
    if (status === 404) return 'Ressource introuvable.'
    if (status === 409) return 'Conflit avec l’état actuel des données.'
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string' && message.length > 0) return message
  }
  if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) {
    return 'Réseau indisponible.'
  }
  return 'Une erreur est survenue. Réessayez.'
}
