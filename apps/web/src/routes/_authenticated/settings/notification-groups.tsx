import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lpg/ui'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { PageShell, EmptyState } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
import { useAuthStore } from '@/store/auth-store'
import { ROLE_LABELS } from '@/config/rbac/roles'
import type { Role } from '@/config/rbac/roles'
import { hasPermission } from '@lpg/permissions'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  useNotificationGroupsStore,
  type NotificationGroup,
} from '@/features/notifications/notification-groups-store'
import {
  NotificationGroupForm,
  groupToFormValues,
} from '@/features/notifications/notification-group-form'
import type { NotificationGroupFormValues } from '@/features/notifications/notification-group-schema'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/settings/notification-groups')({
  beforeLoad: () => {
    const role = useAuthStore.getState().user?.system_role as Role | undefined
    if (!role || !hasPermission(role, 'notification-groups.write')) {
      throw redirect({ to: '/settings' })
    }
  },
  component: NotificationGroupsPage,
})

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NotificationGroupsPage() {
  const items = useNotificationGroupsStore((s) => s.items)
  const addGroup = useNotificationGroupsStore((s) => s.addGroup)
  const updateGroup = useNotificationGroupsStore((s) => s.updateGroup)
  const deleteGroup = useNotificationGroupsStore((s) => s.deleteGroup)
  const user = useAuthStore((s) => s.user)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<NotificationGroup | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NotificationGroup | null>(null)

  const handleCreate = (values: NotificationGroupFormValues) => {
    addGroup({
      name: values.name,
      targetRoles: values.targetRoles as Role[],
      createdBy: user?.email ?? 'unknown',
    })
    toast.success(`Groupe "${values.name}" créé`)
    setDialogOpen(false)
  }

  const handleUpdate = (values: NotificationGroupFormValues) => {
    if (!editingGroup) return
    updateGroup(editingGroup.id, {
      name: values.name,
      targetRoles: values.targetRoles as Role[],
    })
    toast.success(`Groupe "${values.name}" mis à jour`)
    setEditingGroup(null)
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteGroup(deleteTarget.id)
    toast.success(`Groupe "${deleteTarget.name}" supprimé`)
    setDeleteTarget(null)
  }

  const openEdit = (group: NotificationGroup) => {
    setEditingGroup(group)
    setDialogOpen(true)
  }

  const isEditing = editingGroup !== null

  return (
    <PageShell>
      <PageHeader
        title='Groupes de notification'
        icon={Users}
        description='Créez et gérez des groupes de destinataires pour les notifications.'
        actions={
          <Button
            type='button'
            size='sm'
            onClick={() => {
              setEditingGroup(null)
              setDialogOpen(true)
            }}
          >
            <Plus className='size-4' />
            Créer un groupe
          </Button>
        }
      />

      <Card className='mt-6'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Groupes existants</CardTitle>
          <CardDescription>
            {items.length === 0
              ? 'Aucun groupe de notification créé pour le moment.'
              : `${items.length} groupe${items.length > 1 ? 's' : ''} de notification`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              title='Aucun groupe'
              description='Créez votre premier groupe de notification pour cibler plusieurs rôles à la fois.'
              action={
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setEditingGroup(null)
                    setDialogOpen(true)
                  }}
                >
                  <Plus className='size-4' />
                  Créer un groupe
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Rôles cibles</TableHead>
                  <TableHead>Créé par</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className='w-[100px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className='font-medium'>{group.name}</TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {group.targetRoles.map((role) => (
                          <span
                            key={role}
                            className='inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground'
                          >
                            {ROLE_LABELS[role]}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {group.createdBy}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {formatDate(group.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='size-8'
                          onClick={() => openEdit(group)}
                        >
                          <Pencil className='size-3.5' />
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='size-8 text-destructive'
                          onClick={() => setDeleteTarget(group)}
                        >
                          <Trash2 className='size-3.5' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingGroup(null)
        }}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Modifier le groupe' : 'Créer un groupe de notification'}
            </DialogTitle>
          </DialogHeader>
          <NotificationGroupForm
            defaultValues={isEditing ? groupToFormValues(editingGroup! as NotificationGroup) : undefined}
            onSubmit={isEditing ? handleUpdate : handleCreate}
            onCancel={() => {
              setDialogOpen(false)
              setEditingGroup(null)
            }}
            submitLabel={isEditing ? 'Enregistrer' : 'Créer le groupe'}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title='Supprimer le groupe'
        desc={
          <span>
            Êtes-vous sûr de vouloir supprimer le groupe{' '}
            <strong>{deleteTarget?.name}</strong> ? Cette action est irréversible.
          </span>
        }
        confirmText='Supprimer'
        destructive
        handleConfirm={handleDelete}
      />
    </PageShell>
  )
}
