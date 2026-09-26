import { isAxiosError } from 'axios'
import { toast } from 'sonner'

export type HandledMutationMeta = {
  handled?: boolean
}

export const HANDLED_MUTATION_META = { handled: true } as const

export type MutationFeedbackContext = {
  meta?: unknown
}

export function isHandledMutationMeta(meta: unknown): boolean {
  return (
    typeof meta === 'object' &&
    meta !== null &&
    'handled' in meta &&
    (meta as HandledMutationMeta).handled === true
  )
}

export function isAuthPolicyError(error: unknown): boolean {
  return isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)
}

export function isSessionExpiryError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 401
}

export function shouldShowGlobalMutationError(
  error: unknown,
  _variables: unknown,
  _context: unknown,
  mutationFunctionContext: unknown,
): boolean {
  const meta =
    typeof mutationFunctionContext === 'object' &&
    mutationFunctionContext !== null &&
    'meta' in mutationFunctionContext
      ? (mutationFunctionContext as MutationFeedbackContext).meta
      : undefined
  if (isHandledMutationMeta(meta)) return false
  if (isSessionExpiryError(error)) return false
  if (isAxiosError(error) && error.response?.status === 304) return false
  return true
}

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false }

export async function runMutation<T>(
  mutation: () => Promise<T>,
  successMessage?: string,
): Promise<MutationResult<T>> {
  try {
    const data = await mutation()
    if (successMessage) toast.success(successMessage)
    return { ok: true, data }
  } catch (error) {
    if (isAuthPolicyError(error)) throw error
    toast.error(extractErrorMessage(error))
    return { ok: false }
  }
}

export function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status
    if (status === 401) return 'Session expirée. Veuillez vous reconnecter.'
    if (status === 403) return 'Accès refusé.'
    if (status === 404) return 'Ressource introuvable.'
    if (status === 409) return 'Conflit avec l’état actuel des données.'
    const title = error.response?.data?.title
    if (typeof title === 'string' && title.length > 0) return title
  }
  if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) {
    return 'Réseau indisponible.'
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return 'Une erreur est survenue. Réessayez.'
}
