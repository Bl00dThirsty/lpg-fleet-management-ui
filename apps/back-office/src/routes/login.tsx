import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { usePermissions } from '@/context/PermissionsProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import csphLogo from '@/assets/logo-csph-small.png'
import { Role } from '@lpg/permissions'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const MOCK_PROFILES = [
  { id: 'csph-superadmin', role: 'CSPH', orgName: 'CSPH', subRole: 'Superadmin' },
  { id: 'csph-admin-info', role: 'CSPH', orgName: 'CSPH', subRole: 'Admin Info' },
  { id: 'csph-admin-tech', role: 'CSPH', orgName: 'CSPH', subRole: 'Admin Tech' },
  { id: 'csph-superviseur', role: 'CSPH', orgName: 'CSPH', subRole: 'Superviseur' },
  { id: 'marketer-total', role: 'MARKETER', orgName: 'TotalEnergies' },
  { id: 'transporter-translog', role: 'TRANSPORTER', orgName: 'TRANSLOG CAMEROUN' },
]

function LoginPage() {
  const { setSession } = usePermissions()
  const navigate = useNavigate()
  const [selectedProfileId, setSelectedProfileId] = useState<string>('csph-superadmin')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const profile = MOCK_PROFILES.find((p) => p.id === selectedProfileId)
    if (profile) {
      setSession({
        role: profile.role as Role,
        orgName: profile.orgName,
        subRole: profile.subRole,
      })
      navigate({ to: '/' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-4 text-center items-center pb-6">
          <img src={csphLogo} alt="CSPH Logo" className="h-16 w-auto mb-2" />
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">Bienvenue</CardTitle>
            <CardDescription>
              Sélectionnez un profil pour vous connecter
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="contact@lpg-fleet.com"
                  type="email"
                  disabled
                  value="mock-user@lpg-fleet.com"
                />
                <p className="text-xs text-muted-foreground mt-1">L'email est désactivé pour la simulation.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <a href="#" className="text-sm font-medium text-primary hover:underline" onClick={(e) => e.preventDefault()}>
                    Mot de passe oublié ?
                  </a>
                </div>
                <Input id="password" type="password" disabled value="********" />
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="profile">Profil de simulation (Mock)</Label>
                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                  <SelectTrigger id="profile">
                    <SelectValue placeholder="Choisir un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_PROFILES.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.subRole ? `${p.orgName} - ${p.subRole}` : p.orgName} ({p.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" className="w-full h-11 text-base font-medium">
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
