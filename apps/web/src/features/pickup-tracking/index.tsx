import { useMemo, useState } from 'react'
import { Activity, CheckCircle2, Circle, PackagePlus, Truck } from 'lucide-react'
import { Badge, Button } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState, KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import {
  getLivePickupTrack,
  getSitePickupLoad,
  getPickupTrackSummary,
  PICKUP_STAGES,
  type PickupTrackView,
} from './data/pickup-tracking'
import { getPickups } from '@/features/pickups/data/pickups'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'
import { usePickupsStore } from '@/store/pickups-store'

const STATUS_CLASS: Record<PickupTrackView['status'], string> = {
  DRAFT: 'bg-slate-200 text-slate-800',
  VALIDATED: 'bg-sky-100 text-sky-800',
  INPROGRESS: 'bg-amber-100 text-amber-900',
  COMPLETED: 'bg-emerald-600 text-white',
  CANCELLED: 'bg-rose-100 text-rose-900',
}

function StageStepper({ stage }: { stage: number }) {
  return (
    <div className='flex items-center gap-1'>
      {PICKUP_STAGES.map((label, i) => {
        const done = i < stage
        const current = i === stage
        return (
          <div key={label} className='flex flex-1 items-center gap-1'>
            <div className='flex flex-col items-center gap-1'>
              {done ? (
                <CheckCircle2 className='size-4 text-emerald-600' />
              ) : current ? (
                <Truck className='size-4 text-primary' />
              ) : (
                <Circle className='size-4 text-muted-foreground/40' />
              )}
              <span className={`text-[10px] ${done || current ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {label}
              </span>
            </div>
            {i < PICKUP_STAGES.length - 1 && (
              <div className={`mb-4 h-0.5 flex-1 rounded ${i < stage ? 'bg-emerald-500/60' : 'bg-muted'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function LivePickupCard({ pickup }: { pickup: PickupTrackView }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className='rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm'>
      <div className='flex items-center justify-between gap-3'>
        <button
          type='button'
          className='flex items-center gap-2 font-semibold text-primary'
          onClick={() => setExpanded((v) => !v)}
        >
          <span className='relative flex size-2.5'>
            {pickup.stage === 2 && (
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75' />
            )}
            <span className={`relative inline-flex size-2.5 rounded-full ${pickup.stage === 2 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          </span>
          {pickup.reference}
        </button>
        <Badge className={STATUS_CLASS[pickup.status]}>{pickup.status_label}</Badge>
      </div>

      <div className='mt-3 grid grid-cols-2 gap-2 text-sm'>
        <div>
          <p className='text-xs text-muted-foreground'>Source</p>
          <p className='font-medium'>{pickup.source_name}</p>
        </div>
        <div>
          <p className='text-xs text-muted-foreground'>Destination</p>
          <p className='font-medium'>{pickup.destination_name}</p>
        </div>
      </div>

      <div className='mt-1 flex items-center justify-between text-sm'>
        <span className='text-xs text-muted-foreground'>Marketeur</span>
        <span className='font-medium'>{pickup.marketeur_name}</span>
      </div>
      <div className='mt-0.5 flex items-center justify-between text-sm'>
        <span className='text-xs text-muted-foreground'>Quantité</span>
        <span className='font-medium'>{pickup.quantity_label}</span>
      </div>

      <div className='mt-3'>
        <StageStepper stage={pickup.stage} />
      </div>

      {expanded && pickup.started_at && (
        <div className='mt-3 space-y-1 border-t pt-2 text-xs text-muted-foreground'>
          <p>Demandée : {new Date(pickup.requested_at).toLocaleString('fr-FR')}</p>
          <p>Validée : {pickup.validated_at ? new Date(pickup.validated_at).toLocaleString('fr-FR') : '—'}</p>
          <p>Départ : {new Date(pickup.started_at).toLocaleString('fr-FR')}</p>
        </div>
      )}
    </div>
  )
}

export function PickupTrackingPage() {
  const user = useAuthStore((s) => s.user)
  const storeRows = usePickupsStore((s) => s.pickups)
  const scope = useMemo(() => getScope(user), [user])
  const pickupRows = useMemo(() => getPickups(scope, storeRows), [scope, storeRows])
  const live = useMemo(() => getLivePickupTrack(pickupRows), [pickupRows])
  const summary = useMemo(() => getPickupTrackSummary(live), [live])
  const loads = useMemo(() => getSitePickupLoad(pickupRows), [pickupRows])

  return (
    <PageShell>
      <PageHeader
        title='Suivi enlèvements'
        description={`${live.length} enlèvement(s) actif(s) — suivi en direct des approvisionnements Flux 1.`}
        actions={
          <Button asChild className='gap-2'>
            <a href='/pickups'>
              <PackagePlus className='size-4' /> Toutes les requêtes
            </a>
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <KpiTile
          label='En cours'
          value={String(summary.inProgress)}
          icon={<Truck className='size-4 text-amber-500' />}
        />
        <KpiTile
          label='Validées / à démarrer'
          value={String(summary.validated)}
          icon={<Activity className='size-4 text-sky-500' />}
        />
        <KpiTile
          label='Sites actifs'
          value={String(loads.length)}
          icon={<PackagePlus className='size-4 text-emerald-500' />}
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-[1fr_360px]'>
        <SectionCard title='Enlèvements actifs' description='Validés ou en cours de chargement.' >
          {live.length === 0 ? (
            <EmptyState title='Aucun enlèvement actif' description='Aucune requête validée ou en cours pour le moment.' />
          ) : (
            <div className='grid gap-3 md:grid-cols-2'>
              {live.map((p) => (
                <LivePickupCard key={p.id} pickup={p} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title='Volumes par site' description='Sommes chargées / déchargées sur les sites.'>
          <div className='space-y-3'>
            {loads.length === 0 ? (
              <p className='text-sm text-muted-foreground'>Aucune donnée.</p>
            ) : (
              loads.map((site) => (
                <div key={site.site_id} className='rounded-lg border p-3 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='font-medium'>{site.site_name}</span>
                    <span className='text-xs text-muted-foreground'>
                      {site.outbound.toLocaleString('fr-FR')} TM sortie
                    </span>
                  </div>
                  <div className='mt-1 flex items-center justify-between text-xs text-muted-foreground'>
                    <span>{site.inbound.toLocaleString('fr-FR')} TM entrée</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  )
}