import { useState } from 'react'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@lpg/ui'
import { MoreHorizontal, MapPin } from 'lucide-react'
import { useEntityPermission } from '@/lib/permissions/use-entity-permission'
import { canTransition, type SiteRole, type SiteRow, type TransitionRequest } from '../lib/site-status-machine'

export function SiteActionsMenu({
  row,
  role,
  onAction,
  onDelete,
  onOpenMap,
}: {
  row: SiteRow
  role: SiteRole
  onAction: (req: TransitionRequest) => void
  onDelete?: () => void
  onOpenMap?: () => void
}) {
  const perm = useEntityPermission('sites')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const verify = canTransition(row, role, { kind: 'verify' })
  const suspend = canTransition(row, role, { kind: 'suspend', reason: 'Suspendu via UI' })
  const reject = canTransition(row, role, { kind: 'reject', reason: 'Rejeté via UI' })
  const reassign = canTransition(row, role, { kind: 'reassign' })

  const noActions = !verify.ok && !suspend.ok && !reject.ok && !reassign.ok

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' aria-label='Actions'>
            <MoreHorizontal className='size-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {onOpenMap ? (
            <DropdownMenuItem onSelect={onOpenMap}>
              <MapPin className='mr-2 size-4' />
              Ouvrir sur la carte
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          {verify.ok ? (
            <DropdownMenuItem onSelect={() => onAction({ kind: 'verify' })}>
              Vérifier
            </DropdownMenuItem>
          ) : null}
          {suspend.ok ? (
            <DropdownMenuItem
              onSelect={() => onAction({ kind: 'suspend', reason: 'Suspendu via UI' })}
            >
              Suspendre
            </DropdownMenuItem>
          ) : null}
          {reject.ok ? (
            <DropdownMenuItem
              onSelect={() => onAction({ kind: 'reject', reason: 'Rejeté via UI' })}
            >
              Rejeter
            </DropdownMenuItem>
          ) : null}
          {reassign.ok ? (
            <DropdownMenuItem onSelect={() => onAction({ kind: 'reassign' })}>
              Réassigner
            </DropdownMenuItem>
          ) : null}
          {perm.canDelete && onDelete ? (
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
          {noActions && !(perm.canDelete && onDelete) ? (
            <DropdownMenuItem disabled>Aucune action disponible</DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer le site {row.id} ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={() => {
                onDelete?.()
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
