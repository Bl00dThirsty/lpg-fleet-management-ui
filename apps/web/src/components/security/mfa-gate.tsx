import { useMfaGate } from '@/hooks/use-mfa-gate'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthStore } from '@/store/auth-store'

/**
 * MFA setup gate (AGENTS.md §4 "MFA awareness"): when the authenticated
 * user's role is in `mfa.enforced_for_roles` and their `mfa_status` is
 * `PENDINGSETUP`, block the app until setup is completed (the backend
 * owns the actual TOTP/SMS enrollment; this screen is the frontend gate).
 */
export function MfaGate() {
  const { pending } = useMfaGate()
  const logout = useAuthStore((s) => s.logout)

  if (!pending) return null

  return (
    <div className='fixed inset-0 z-50 grid place-items-center bg-background/90 backdrop-blur-sm'>
      <Card className='w-full max-w-md border shadow-lg'>
        <CardHeader>
          <CardTitle>Configuration MFA requise</CardTitle>
          <CardDescription>
            Votre rôle exige l&apos;authentification multifacteur avant toute action sensible.
            Contactez votre administrateur pour finaliser l&apos;activation.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex justify-end gap-2'>
          <Button variant='ghost' onClick={logout}>
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
