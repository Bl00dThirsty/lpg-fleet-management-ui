/**
 * Permission-gated row actions for CRUD lists: Edit + Delete (with confirm).
 * Delete uses an AlertDialog so destructive writes are never one-click.
 * Gating uses `@lpg/permissions` `can()` against the active role.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@lpg/ui'
import { useEntityPermission } from '@/lib/permissions/use-entity-permission'
import type { Resource } from '@lpg/permissions'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'

export interface CrudRowActionsProps {
  /** Permission resource used for gating. */
  resource: Resource
  /** Optional human label for the delete confirmation. */
  itemLabel?: string
  onEdit?: () => void
  onDelete?: () => void | Promise<void>
  /** Extra (non-destructive) menu items. */
  extra?: Array<{ label: string; onSelect: () => void }>
}

export function CrudRowActions({
  resource,
  itemLabel = 'cet élément',
  onEdit,
  onDelete,
  extra,
}: CrudRowActionsProps) {
  const perm = useEntityPermission(resource)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const showEdit = perm.canWrite && onEdit
  const showDelete = perm.canDelete && onDelete
  if (!showEdit && !showDelete && !extra?.length) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' aria-label='Actions'>
            <span className='text-lg leading-none'>⋯</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {showEdit ? (
            <DropdownMenuItem onSelect={onEdit}>Modifier</DropdownMenuItem>
          ) : null}
          {extra?.map((e) => (
            <DropdownMenuItem key={e.label} onSelect={e.onSelect}>
              {e.label}
            </DropdownMenuItem>
          ))}
          {showDelete ? (
            <DropdownMenuItem
              className='text-destructive focus:text-destructive'
              onSelect={(e) => {
                e.preventDefault()
                setConfirmOpen(true)
              }}
            >
              Supprimer
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer {itemLabel} ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={async () => {
                try {
                  await onDelete?.()
                  toast.success('Supprimé.')
                } catch (error) {
                  toast.error(extractErrorMessage(error))
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
