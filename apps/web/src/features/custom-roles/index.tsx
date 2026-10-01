import { useMemo, useState } from 'react'
import { Check, Plus, ShieldCheck, UserRound } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { EntityFormSheet, useEntityCrud } from '@/components/entity-crud'
import { CrudRowActions } from '@/components/entity-crud'
import type { CustomRole } from '@lpg/types'
import {
  getCustomRoleAssignmentCount,
  getCustomRoles,
  type CustomRoleView,
} from './data/custom-roles'
import {
  customRoleFields,
  customRoleFromForm,
  customRoleToForm,
} from './data/custom-roles-crud'

export function CustomRolesPage() {
  const crud = useEntityCrud<CustomRole>('customRoles', 'custom-roles', ['custom-roles'])
  const roles = useMemo(() => getCustomRoles(crud.list.data), [crud.list.data])
  const active = useMemo(() => roles.filter((r) => r.isActive).length, [roles])
  const assignments = getCustomRoleAssignmentCount()
  const [expandedId, setExpandedId] = useState<string | null>(roles[0]?.id ?? null)

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      if (crud.editing) {
        await crud.updateMut.mutateAsync({ id: crud.editing.id, patch: customRoleFromForm(values) })
        toast.success('Rôle mis à jour.')
      } else {
        await crud.createMut.mutateAsync(customRoleFromForm(values) as Omit<CustomRole, 'id'>)
        toast.success('Rôle créé.')
      }
      crud.close()
    } catch {
      toast.error('Échec de l’enregistrement.')
    }
  }

  return (
    <PageShell>
      <PageHeader
        title='Rôles personnalisés'
        description='Rôles construits par organisation avec leurs propres jeux de permissions.'
        actions={
          crud.perm.canCreate ? (
            <Button onClick={crud.openCreate}>
              <Plus className='mr-1 h-4 w-4' /> Nouveau rôle
            </Button>
          ) : undefined
        }
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <KpiTile label='Rôles' value={String(roles.length)} />
        <KpiTile label='Rôles actifs' value={String(active)} />
        <KpiTile label='Affectations' value={String(assignments)} />
      </div>

      <SectionCard
        title='Liste des rôles'
        description='Chaque rôle porte un sous-ensemble de permissions et des membres affectés.'
      >
        <div className='space-y-3'>
          {roles.length === 0 && <p className='text-sm text-muted-foreground'>Aucun rôle personnalisé.</p>}
          {roles.map((role) => (
            <CustomRoleCard
              key={role.id}
              role={role}
              expanded={expandedId === role.id}
              onToggle={() => setExpandedId(expandedId === role.id ? null : role.id)}
              onEdit={() => crud.openEdit(role as unknown as CustomRole)}
              onDelete={() => crud.removeMut.mutateAsync(role.id)}
            />
          ))}
        </div>
      </SectionCard>

      <EntityFormSheet
        open={crud.creating || crud.editing !== null}
        onOpenChange={(open) => {
          if (!open) crud.close()
        }}
        title={crud.editing ? 'Modifier le rôle' : 'Nouveau rôle'}
        description={crud.editing ? 'Mettez à jour le rôle et ses permissions.' : 'Créez un rôle personnalisé avec son jeu de permissions.'}
        fields={customRoleFields}
        initial={crud.editing ? customRoleToForm(crud.editing) : null}
        onSubmit={handleSubmit}
        onCancel={crud.close}
        submitting={crud.createMut.isPending || crud.updateMut.isPending}
      />
    </PageShell>
  )
}

function CustomRoleCard({
  role,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  role: CustomRoleView
  expanded: boolean
  onToggle: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <div className='rounded-lg border p-3'>
      <div className='flex w-full items-center justify-between gap-2'>
        <button type='button' onClick={onToggle} className='flex flex-1 items-center justify-between gap-2 text-left'>
          <div className='flex items-center gap-2'>
            <ShieldCheck className='size-4 text-primary' />
            <span className='font-medium'>{role.name}</span>
            <Badge
              variant={role.isActive ? 'default' : 'secondary'}
              className={cn(!role.isActive && 'text-muted-foreground')}
            >
              {role.isActive ? 'Actif' : 'Inactif'}
            </Badge>
            <span className='hidden text-xs text-muted-foreground sm:inline'>{role.orgName}</span>
          </div>
          <span className='text-xs text-muted-foreground'>{role.permissionCount} permissions</span>
        </button>
        <CrudRowActions
          resource='custom-roles'
          itemLabel='ce rôle'
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {expanded && (
        <div className='mt-3 space-y-3 border-t pt-3'>
          <p className='text-sm text-muted-foreground'>{role.description || 'Aucune description.'}</p>

          <div>
            <div className='mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              Permissions ({role.permissionCount})
            </div>
            <div className='flex flex-wrap gap-1.5'>
              {role.permissions.map((code) => (
                <Badge
                  key={code}
                  variant='outline'
                  className='gap-1 font-mono text-xs'
                >
                  <Check className='size-3 text-emerald-600' />
                  {code}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className='mb-1.5 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              <UserRound className='size-3.5' /> Membres ({role.memberCount})
            </div>
            {role.memberCount === 0 ? (
              <p className='text-sm text-muted-foreground'>Aucun membre affecté.</p>
            ) : (
              <ul className='space-y-1'>
                {role.members.map((m) => (
                  <li key={m.userId} className='text-sm'>
                    {m.fullName}
                    {m.siteId && <span className='ml-1 text-xs text-muted-foreground'>{m.siteId}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
