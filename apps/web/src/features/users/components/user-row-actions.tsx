import { useState } from 'react'
import {
  Ban,
  CircleCheck,
  KeyRound,
  Lock,
  LockOpen,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  ShieldQuestion,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@lpg/ui'
import { useTranslation } from 'react-i18next'
import { hasPermission } from '@lpg/permissions'
import { useRoleStore } from '@/store/role-store'
import { useUsersStore } from '@/store/users-store'
import type { UserView } from '../data/users'

type UserRowActionsProps = {
  user: UserView
  onEdit: (user: UserView) => void
  onViewDetails: (user: UserView) => void
}

export function UserRowActions({ user, onEdit, onViewDetails }: UserRowActionsProps) {
  const { t } = useTranslation('common')
  const activeRole = useRoleStore((s) => s.activeRole)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const canWrite = hasPermission(activeRole, 'users.write')
  const canDelete = hasPermission(activeRole, 'users.delete')
  const canReset = hasPermission(activeRole, 'users.reset')

  const lockedUntil = useUsersStore(
    (s) => s.users.find((x) => x.id === user.id)?.locked_until,
  )
  const isLocked = lockedUntil !== null && lockedUntil !== undefined

  if (!canWrite && !canDelete && !canReset) return null

  function handleReset() {
    try {
      useUsersStore.getState().resetPassword(user.id)
      toast.success(`Lien de réinitialisation envoyé à ${user.email}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  function handleResetMfa() {
    try {
      useUsersStore.getState().resetMfa(user.id)
      toast.success(`Authentification forte réinitialisée pour ${user.email}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  function handleDelete() {
    try {
      useUsersStore.getState().deleteUser(user.id)
      toast.success(`Utilisateur ${user.email} supprimé`)
      setConfirmDelete(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setConfirmDelete(false)
    }
  }

  function handleToggleLock() {
    if (isLocked) {
      useUsersStore.getState().unlock(user.id)
      toast.success(`Compte ${user.email} déverrouillé`)
    } else {
      useUsersStore.getState().lockUntil(user.id)
      toast.success(`Compte ${user.email} verrouillé (15 min)`)
    }
  }

  function handleToggleActive() {
    const target = !user.status || user.status === 'INACTIVE'
    try {
      useUsersStore.getState().setStatus(user.id, target)
      toast.success(target ? `Compte ${user.email} activé` : `Compte ${user.email} désactivé`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' className='size-8' aria-label='Actions'>
            <MoreHorizontal className='size-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-52'>
          <DropdownMenuItem onSelect={() => onViewDetails(user)}>
            <KeyRound className='mr-2 size-4' />
            Détails
          </DropdownMenuItem>
          {canWrite && (
            <DropdownMenuItem onSelect={() => onEdit(user)}>
              <Pencil className='mr-2 size-4' />
              {t('entityCrud.edit')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {canWrite && (
            <DropdownMenuItem onSelect={handleToggleActive}>
              {user.status === 'ACTIVE' ? (
                <>
                  <Ban className='mr-2 size-4' />
                  Désactiver
                </>
              ) : (
                <>
                  <CircleCheck className='mr-2 size-4' />
                  Activer
                </>
              )}
            </DropdownMenuItem>
          )}
          {canWrite && (
            <DropdownMenuItem onSelect={handleToggleLock}>
              {isLocked ? (
                <>
                  <LockOpen className='mr-2 size-4' />
                  Déverrouiller
                </>
              ) : (
                <>
                  <Lock className='mr-2 size-4' />
                  Verrouiller
                </>
              )}
            </DropdownMenuItem>
          )}
          {canReset && (
            <DropdownMenuItem onSelect={handleReset}>
              <RotateCcw className='mr-2 size-4' />
              Réinitialiser le mot de passe
            </DropdownMenuItem>
          )}
          {canWrite && (
            <DropdownMenuItem onSelect={handleResetMfa}>
              <ShieldQuestion className='mr-2 size-4' />
              Réinitialiser la MFA
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setConfirmDelete(true)}
                className='text-destructive focus:text-destructive'
              >
                <Trash2 className='mr-2 size-4' />
                {t('entityCrud.delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('entityCrud.deleteUserTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('entityCrud.deleteUserDescription', { email: user.email })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('entityCrud.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t('entityCrud.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
