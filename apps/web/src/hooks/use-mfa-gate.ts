import { useAuthStore } from '@/store/auth-store'
import { isMfaRequired } from '@/lib/security/mfa'

export function useMfaGate() {
  const user = useAuthStore((s) => s.user)
  const required = !!user && isMfaRequired(user.system_role)
  const pending = required && (user.mfa_status ?? 'DISABLED') === 'PENDINGSETUP'
  return { required, pending }
}
