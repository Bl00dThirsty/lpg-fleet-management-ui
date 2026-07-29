import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRoleStore } from '@/store/role-store'
import { Button, Card, CardContent, Input, Label } from '@lpg/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lpg/ui'
import { PasswordInput } from '@/components/password-input'
import csphLogo from '@/assets/logo-csph-small.png'
import { toast } from 'sonner'
import { ROLES, ROLE_LABELS, type Role } from '@/config/rbac/roles'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const activeRole = useRoleStore((s) => s.activeRole)
  const setActiveRole = useRoleStore((s) => s.setActiveRole)
  const navigate = useNavigate()
  const [email, setEmail] = useState('superadmin@lpg.cm')
  const [password, setPassword] = useState('password')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      navigate({ to: '/' })
    } catch {
      toast.error('Echec de la connexion. Verifiez vos identifiants.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-5">
      <div className="hidden lg:flex lg:col-span-2 bg-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-2">
            <img src={csphLogo} alt="CSPH" className="h-10 w-auto" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">CSPH</h2>
            <p className="text-muted-foreground max-w-xs leading-relaxed">
              Console de gestion de flotte. Connectez-vous pour acceder a votre espace de travail.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CSPH. Tous droits reserves.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 lg:col-span-3 bg-background">
        <Card className="w-full max-w-md border shadow-sm">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-center mb-6 lg:hidden">
              <img src={csphLogo} alt="CSPH" className="h-12 w-auto" />
            </div>

            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
              <p className="text-sm text-muted-foreground">
                Connectez-vous a la console de gestion de flotte
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={activeRole} onValueChange={(v) => setActiveRole(v as Role)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selectionner un role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@exemple.cm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <a
                    href="/forgot-password"
                    className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Mot de passe oublie ?
                  </a>
                </div>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
