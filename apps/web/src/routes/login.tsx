import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRoleStore } from '@/store/role-store'
import { Button, Card, CardContent, Label } from '@lpg/ui'
import { fakeProfiles, type FakeProfile } from '@lpg/mock-data'
import { UserPicker } from '@/components/login/user-picker'
import { PasswordInput } from '@/components/password-input'
import csphLogo from '@/assets/logo-csph-small.png'
import { toast } from 'sonner'
import type { Role } from '@/config/rbac/roles'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const setActiveRole = useRoleStore((s) => s.setActiveRole)
  const navigate = useNavigate()
  const [selectedUserId, setSelectedUserId] = useState<string>(fakeProfiles[0]!.id)
  const [password, setPassword] = useState('password')
  const [submitting, setSubmitting] = useState(false)

  const selectedUser: FakeProfile =
    fakeProfiles.find((u) => u.id === selectedUserId) ?? fakeProfiles[0]!

  // Keep the active role in sync with the chosen user so nav visibility matches
  // the persona being simulated.
  useEffect(() => {
    setActiveRole(selectedUser.system_role as Role)
  }, [selectedUser.system_role, setActiveRole])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(selectedUser.email, password)
      navigate({ to: '/' })
    } catch {
      toast.error('Échec de la connexion. Vérifiez vos identifiants.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='grid min-h-screen lg:grid-cols-5'>
      <div className='hidden lg:flex lg:col-span-2 bg-muted relative overflow-hidden'>
        <div className='absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]' />
        <div className='relative z-10 flex flex-col justify-between p-10 w-full'>
          <div className='flex items-center gap-2'>
            <img src={csphLogo} alt='CSPH' className='h-10 w-auto' />
          </div>
          <div className='space-y-3'>
            <h2 className='text-3xl font-bold tracking-tight text-foreground'>CSPH</h2>
            <p className='text-muted-foreground max-w-xs leading-relaxed'>
              Console de gestion de flotte. Connectez-vous pour accéder à votre
              espace de travail.
            </p>
          </div>
          <p className='text-sm text-muted-foreground'>
            &copy; {new Date().getFullYear()} CSPH. Tous droits réservés.
          </p>
        </div>
      </div>

      <div className='flex items-center justify-center p-8 lg:col-span-3 bg-background'>
        <Card className='w-full max-w-md border shadow-sm'>
          <CardContent className='pt-8 pb-8'>
            <div className='flex justify-center mb-6 lg:hidden'>
              <img src={csphLogo} alt='CSPH' className='h-12 w-auto' />
            </div>

            <div className='space-y-1 mb-6'>
              <h1 className='text-2xl font-bold tracking-tight'>Connexion</h1>
              <p className='text-sm text-muted-foreground'>
                Sélectionnez un compte de démonstration pour vous connecter
              </p>
            </div>

            <form onSubmit={handleLogin} className='space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='user'>Utilisateur</Label>
                <UserPicker
                  users={fakeProfiles}
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>Mot de passe</Label>
                <PasswordInput
                  id='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className='text-xs text-muted-foreground'>
                  Mode démo — n'importe quel mot de passe est accepté.
                </p>
              </div>

              <Button type='submit' className='w-full' disabled={submitting}>
                {submitting ? 'Connexion…' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}