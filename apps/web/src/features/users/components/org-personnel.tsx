import { useMemo, useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntityFormSheet, useEntityPermission } from '@/components/entity-crud'
import { field, type FieldConfig } from '@/components/entity-crud'
import { getCreatableRoles } from '@lpg/permissions'
import type { Role } from '@lpg/permissions'
import { useAuthStore } from '@/store/auth-store'
import { useUsersStore } from '@/store/users-store'
import { ROLE_LABELS } from '@/config/rbac/roles'
import { userToView, userStatusLabel } from '../data/users'

/**
 * Personnel of a single organisation: lists its users and, when the actor may
 * create users, offers an "Ajouter du personnel" form scoped to that org.
 * Shared by the marketeur/transporteur/dépôt detail views.
 */
export function OrgPersonnel({ orgId, orgName }: { orgId: string; orgName?: string }) {
  const users = useUsersStore((s) => s.users)
  const perm = useEntityPermission('users')
  const [formOpen, setFormOpen] = useState(false)

  const personnel = useMemo(
    () => users.filter((u) => u.org_id === orgId).map(userToView),
    [users, orgId],
  )

  const authRole = (useAuthStore.getState().user?.system_role ?? 'LIVREUR') as Role
  const creatableRoles = useMemo(
    () => getCreatableRoles(authRole).map((role) => ({ label: ROLE_LABELS[role] ?? role, value: role })),
    [authRole],
  )

  const fields: FieldConfig[] = useMemo(
    () => [
      field.text('first_name', 'Prénom', { required: true }),
      field.text('last_name', 'Nom', { required: true }),
      field.email('email', 'Email', { required: true }),
      field.select('system_role', 'Rôle', creatableRoles, { required: true }),
      field.switchField('is_active', 'Compte actif'),
      field.text('org_id', 'Organisation', { hidden: true, defaultValue: orgId }),
    ],
    [creatableRoles, orgId],
  )

  function handleSubmit(values: Record<string, unknown>) {
    try {
      useUsersStore.getState().createUser({
        email: String(values.email),
        first_name: String(values.first_name),
        last_name: String(values.last_name),
        system_role: values.system_role as Role,
        org_id: orgId,
        is_active: Boolean(values.is_active),
        mfa_status: 'DISABLED',
      })
      toast.success('Personnel ajouté.')
      setFormOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible d’ajouter ce personnel.')
    }
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between gap-2 space-y-0'>
        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
          <Users className='size-4 text-primary' />
          Personnel {orgName ? `— ${orgName}` : ''}
        </CardTitle>
        {perm.canCreate && (
          <Button variant='outline' size='sm' onClick={() => setFormOpen(true)}>
            <UserPlus className='mr-1 size-4' /> Ajouter du personnel
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {personnel.length === 0 ? (
          <p className='text-sm text-muted-foreground'>Aucun utilisateur rattaché à cette organisation.</p>
        ) : (
          <ul className='divide-y'>
            {personnel.map((user) => (
              <li key={user.id} className='flex items-center justify-between gap-2 py-2.5'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{user.fullName}</p>
                  <p className='truncate text-xs text-muted-foreground'>{user.email}</p>
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <Badge variant='secondary' className='text-xs'>
                    {user.roleLabel}
                  </Badge>
                  <Badge variant='outline' className='text-xs'>
                    {userStatusLabel(user.status)}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <EntityFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title='Ajouter du personnel'
        description='Créez un compte utilisateur rattaché à cette organisation.'
        fields={fields}
        onSubmit={handleSubmit}
        onCancel={() => setFormOpen(false)}
      />
    </Card>
  )
}