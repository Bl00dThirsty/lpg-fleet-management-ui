import { useEffect, useMemo, useState } from 'react'
import { hasEffectivePermission } from '@lpg/permissions'
import { Plus, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import { useToursStore } from '@/store/tours-store'
import { useAuthStore } from '@/store/auth-store'
import { TourActiveHeader } from '@/features/tours/components/tour-active-header'
import { TourDetailView } from '@/features/tours/components/tour-detail-view'
import { ToursTable } from '@/features/tours/components/tours-table'
import { useNavigate } from '@tanstack/react-router'
import { useTourLiveRefresh } from '@/features/tours/lib/use-tour-live-refresh'
import type { Role } from '@/config/rbac/roles'

export function PickupsPage({
  role,
  marketerId,
}: {
  role: Role
  marketerId?: string
}) {
  const navigate = useNavigate()
  const [detailId, setDetailId] = useState<string>()
  const [filter, setFilter] = useState('ALL')
  const rows = useToursStore((s) => s.tours)
  const checkpoints = useToursStore((s) => s.checkpoints)
  const loading = useToursStore((s) => s.loading)
  const error = useToursStore((s) => s.error)
  const user = useAuthStore((s) => s.user)
  const userId = user?.id
  const trips = useMemo(
    () =>
      useToursStore
        .getState()
        .views('ALL', 'PICKUP')
        .filter(
          (t) =>
            t.mission_kind === 'PICKUP' &&
            (!marketerId ||
              rows.find((r) => r.id === t.id)?.marketeur_org_id === marketerId)
        ),
    [rows, checkpoints, marketerId]
  )
  const filtered = trips.filter(
    (t) => filter === 'ALL' || t.pickup_status === filter
  )
  const selected = trips.find((t) => t.id === detailId)
  useEffect(() => {
    void useToursStore.getState().fetchTours(true)
  }, [userId])

  useTourLiveRefresh()
  return (
    <PageShell>
      <PageHeader
        title={selected ? `Enlèvement ${selected.reference}` : 'Enlèvements'}
        description='Flux 1 — planification, équipage, réception et bons d’enlèvement.'
        actions={
          <div className='flex gap-2'>
            <Button
              variant='outline'
              disabled={loading}
              onClick={() => useToursStore.getState().fetchTours(true)}
            >
              <RefreshCw
                className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </Button>
            {hasEffectivePermission(
              role,
              'pickups.create',
              user?.custom_roles
            ) && (
              <Button onClick={() => navigate({ to: '/pickups/new' })}>
                <Plus className='mr-2 size-4' />
                Planifier un enlèvement
              </Button>
            )}
          </div>
        }
      />
      {error && (
        <p role='alert' className='text-destructive'>
          {error}
        </p>
      )}
      {selected ? (
        <>
          <Button
            variant='ghost'
            className='w-fit'
            onClick={() => setDetailId(undefined)}
          >
            <ArrowLeft className='mr-2 size-4' />
            Tous les enlèvements
          </Button>
          <TourDetailView trip={selected} />
        </>
      ) : (
        <>
          {filtered[0] && (
            <TourActiveHeader
              trip={filtered[0]}
              trips={filtered}
              onSelectTrip={setDetailId}
            />
          )}
          <SectionCard>
            <div className='mb-4 flex flex-wrap gap-2'>
              {(
                [
                  ['ALL', 'Tous'],
                  ['VALIDATED', 'Planifiés'],
                  ['INPROGRESS', 'En cours'],
                  ['COMPLETED', 'Terminés'],
                  ['CANCELLED', 'Annulés'],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  variant={filter === value ? 'default' : 'outline'}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {loading && !trips.length ? (
              <p role='status'>Chargement des enlèvements…</p>
            ) : (
              <ToursTable
                rows={filtered}
                missionKind='PICKUP'
                onOpenDetails={(row) => setDetailId(row.id)}
              />
            )}
          </SectionCard>
        </>
      )}
    </PageShell>
  )
}
