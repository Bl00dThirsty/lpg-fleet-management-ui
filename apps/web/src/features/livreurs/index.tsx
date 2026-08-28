import { getRouteApi } from '@tanstack/react-router'
import { Truck } from 'lucide-react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import { useCallback, useState } from 'react'
import { useMemo } from 'react'
import { LivreursTable } from './components/livreurs-table'
import { LivreurDetailsSheet } from './components/livreur-details-sheet'
import { LivreurEditSheet } from './components/livreur-edit-sheet'
import { getLivreurs } from './data/livreurs'
import type { LivreurView } from './data/livreurs'
import { useUsersStore } from '@/store/users-store'
import { useRoleStore } from '@/store/role-store'
import { hasPermission } from '@lpg/permissions'

const route = getRouteApi('/_authenticated/livreurs/')

export function LivreursPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [detailsLivreur, setDetailsLivreur] = useState<LivreurView | null>(null)
  const [editingLivreur, setEditingLivreur] = useState<LivreurView | null | 'new'>(null)
  const activeRole = useRoleStore((state) => state.activeRole)
  const users = useUsersStore((state) => state.users)
  const canRead = hasPermission(activeRole, 'livreurs.read')
  const livreurs = useMemo(() => (canRead ? getLivreurs(users) : []), [canRead, users])
  const canWrite = hasPermission(activeRole, 'livreurs.write')
  const canManage = hasPermission(activeRole, 'livreurs.manage')

  const handleViewDetails = useCallback((livreur: LivreurView) => {
    setDetailsLivreur(livreur)
  }, [])

  if (!canRead) {
    return (
      <main id='main-content' className='flex-1 p-4 sm:p-6'>
        <Alert variant='destructive'>
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Vous n'avez pas la permission de consulter les livreurs.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <Truck className='h-6 w-6 text-primary' />
          <h1 className='text-2xl font-bold tracking-tight'>Livreurs</h1>
          <Badge variant='outline' className='ml-auto'>
            {livreurs.length}
          </Badge>
          {canWrite ? <Button onClick={() => setEditingLivreur('new')}><Plus className='mr-1 size-4' /> Nouveau livreur</Button> : null}
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <LivreursTable
          data={livreurs}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
          onEdit={setEditingLivreur}
          onDelete={(livreur) => useUsersStore.getState().deleteUser(livreur.id)}
          onToggleStatus={(livreur) => {
            try {
              useUsersStore.getState().setStatus(livreur.id, livreur.status !== 'ACTIVE')
              toast.success(`Livreur ${livreur.email} ${livreur.status === 'ACTIVE' ? 'désactivé' : 'activé'}`)
            } catch (error) {
              toast.error(extractErrorMessage(error))
            }
          }}
          canWrite={canWrite}
          canManage={canManage}
        />
      </section>

      <LivreurDetailsSheet
        livreur={detailsLivreur}
        open={detailsLivreur !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsLivreur(null)
        }}
      />

      <LivreurEditSheet
        livreur={editingLivreur === 'new' ? null : editingLivreur}
        open={editingLivreur !== null}
        onOpenChange={(open) => { if (!open) setEditingLivreur(null) }}
      />
    </main>
  )
}
