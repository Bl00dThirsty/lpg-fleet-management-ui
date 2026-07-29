import { useState } from 'react'
import { ShieldCheck, Plus, Trash2, Save, Users, Building2 } from 'lucide-react'
import { PageShell } from '@/components/layout/page'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@lpg/ui'
import { seeds } from '@lpg/mock-data'

const roleSeeds = (seeds as any)['custom-roles'] ?? []
const userSeeds = (seeds as any).users ?? []
const orgSeeds = (seeds as any).organizations ?? []

const RESOURCES = ['tours', 'declarations', 'pickups', 'deliveries', 'scans', 'checkpoints', 'vehicles', 'drivers', 'sites', 'organizations', 'users', 'anomalies', 'reports', 'pda', 'rfid-tags', 'notification-groups']
const ACTIONS = ['create', 'read', 'update', 'delete'] as const
const actionLabels: Record<string, string> = { create: 'Créer', read: 'Lire', update: 'Modifier', delete: 'Supprimer' }

type RoleData = { id: string; orgId: string; name: string; description?: string; permissions: { can: { action: string; resource: string }[] } | { can: string[] }; isActive?: boolean }

function normalizePerms(role: RoleData): Set<string> {
  const perms = new Set<string>()
  if (Array.isArray(role.permissions.can)) {
    for (const p of role.permissions.can) {
      if (typeof p === 'string') {
        const [action, resource] = p.split(':')
        if (action && resource) perms.add(`${action}:${resource}`)
      } else {
        perms.add(`${p.action}:${p.resource}`)
      }
    }
  }
  return perms
}

export function SuperAdminCustomRolesScreen() {
  const [roles, setRoles] = useState<RoleData[]>(roleSeeds as RoleData[])
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null)
  const [editingPerms, setEditingPerms] = useState<Set<string>>(new Set())
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleOrg, setNewRoleOrg] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const togglePerm = (action: string, resource: string) => {
    const key = `${action}:${resource}`
    setEditingPerms((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const saveRole = () => {
    if (selectedRole) {
      const updated: RoleData = {
        ...selectedRole,
        permissions: { can: Array.from(editingPerms).map((p) => {
          const [action, resource] = p.split(':')
          return { action, resource }
        }) },
      }
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setSelectedRole(null)
    }
  }

  const createRole = () => {
    if (!newRoleName.trim() || !newRoleOrg) return
    const newRole: RoleData = {
      id: `crol-${Date.now()}`,
      orgId: newRoleOrg,
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || undefined,
      permissions: { can: [] },
      isActive: true,
    }
    setRoles((prev) => [...prev, newRole])
    setNewRoleName('')
    setNewRoleOrg('')
    setNewRoleDesc('')
    setDialogOpen(false)
  }

  const deleteRole = (id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id))
    if (selectedRole?.id === id) setSelectedRole(null)
  }

  const getOrgName = (orgId: string) => {
    const org = orgSeeds.find((o: any) => o.id === orgId)
    return org?.name ?? orgId
  }

  return (
    <PageShell>
      <div className='flex items-center gap-3'>
        <div className='flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'>
          <ShieldCheck className='size-5' />
        </div>
        <div>
          <h1 className='text-xl font-bold tracking-tight'>Rôles Personnalisés</h1>
          <p className='text-sm text-muted-foreground'>Permissions granulaires par organisation — Contrôle d&apos;accès régional (CASL)</p>
        </div>
        <div className='ml-auto'>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className='gap-2'><Plus className='size-4' /> Nouveau rôle</Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-md'>
              <DialogHeader>
                <DialogTitle>Créer un rôle personnalisé</DialogTitle>
              </DialogHeader>
              <div className='space-y-4'>
                <div>
                  <Label className='mb-1.5 block text-sm'>Nom du rôle</Label>
                  <Input placeholder='Ex: Chef de dépôt' value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
                </div>
                <div>
                  <Label className='mb-1.5 block text-sm'>Organisation</Label>
                  <Select value={newRoleOrg} onValueChange={setNewRoleOrg}>
                    <SelectTrigger><SelectValue placeholder='Sélectionner une organisation' /></SelectTrigger>
                    <SelectContent>
                      {orgSeeds.map((o: any) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className='mb-1.5 block text-sm'>Description</Label>
                  <Input placeholder='Description du rôle...' value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} />
                </div>
                <Button onClick={createRole} className='w-full' disabled={!newRoleName || !newRoleOrg}>
                  <Plus className='mr-2 size-4' /> Créer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle className='text-base'>Rôles définis ({roles.length})</CardTitle>
          </CardHeader>
          <CardContent className='space-y-1'>
            {roles.length === 0 ? (
              <p className='py-8 text-center text-sm text-muted-foreground'>Aucun rôle défini</p>
            ) : (
              roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    setSelectedRole(role)
                    setEditingPerms(normalizePerms(role))
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                    selectedRole?.id === role.id ? 'bg-primary/10 ring-1 ring-primary/20' : ''
                  }`}
                >
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>{role.name}</p>
                    <p className='truncate text-xs text-muted-foreground'>
                      <Building2 className='mr-1 inline size-3' />
                      {getOrgName(role.orgId)}
                    </p>
                  </div>
                  <div className='ml-2 flex items-center gap-1'>
                    {role.isActive !== false ? (
                      <Badge variant='outline' className='border-emerald-500/50 text-emerald-600 text-[10px]'>Actif</Badge>
                    ) : (
                      <Badge variant='outline' className='border-muted text-muted-foreground text-[10px]'>Inactif</Badge>
                    )}
                    <Button variant='ghost' size='icon' className='size-7' onClick={(e) => { e.stopPropagation(); deleteRole(role.id) }}>
                      <Trash2 className='size-3.5 text-muted-foreground' />
                    </Button>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className='lg:col-span-2'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-base'>
              {selectedRole ? `Permissions — ${selectedRole.name}` : 'Sélectionnez un rôle'}
            </CardTitle>
            {selectedRole && (
              <Button size='sm' className='gap-2' onClick={saveRole}>
                <Save className='size-4' /> Enregistrer
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className='flex flex-col items-center gap-2 py-12 text-muted-foreground'>
                <ShieldCheck className='size-8 opacity-20' />
                <p className='text-sm'>Sélectionnez un rôle à gauche pour éditer ses permissions</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b'>
                      <th className='pb-3 text-left font-medium text-muted-foreground'>Ressource</th>
                      {ACTIONS.map((action) => (
                        <th key={action} className='pb-3 text-center font-medium text-muted-foreground'>{actionLabels[action]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RESOURCES.map((resource) => (
                      <tr key={resource} className='border-b last:border-0 hover:bg-muted/20'>
                        <td className='py-3'>
                          <span className='font-medium'>{resource}</span>
                        </td>
                        {ACTIONS.map((action) => {
                          const key = `${action}:${resource}`
                          const checked = editingPerms.has(key)
                          return (
                            <td key={action} className='py-3 text-center'>
                              <Switch
                                checked={checked}
                                onCheckedChange={() => togglePerm(action, resource)}
                                className='scale-75'
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Assignations utilisateur-rôle</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            Les assignations sont gérées via l&apos;API <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>/user-custom-roles</code>.
            Chaque utilisateur peut avoir plusieurs rôles personnalisés, éventuellement limités à un site spécifique (portée régionale).
          </p>
          <div className='mt-4 grid gap-2 sm:grid-cols-2'>
            {((seeds as any)['user-custom-roles'] ?? []).map((ucr: any) => {
              const user = userSeeds.find((u: any) => u.id === ucr.userId) as any
              const role = roles.find((r) => r.id === ucr.customRoleId)
              return (
                <div key={ucr.id} className='flex items-center gap-3 rounded-lg border p-3 text-sm'>
                  <Users className='size-4 text-muted-foreground' />
                  <div className='flex-1'>
                    <p className='font-medium'>{user?.firstName} {user?.lastName}</p>
                    <p className='text-xs text-muted-foreground'>{role?.name ?? ucr.customRoleId}</p>
                  </div>
                  {ucr.siteId && (
                    <Badge variant='outline' className='text-[10px]'>Site: {ucr.siteId}</Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
