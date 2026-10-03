import { useMemo } from 'react'
import { MapPinned } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { getGpsTrackSummary, getGpsTracks, type GpsTrackView } from './data/gps-tracking'

export function GpsTrackingPage() {
  const tracks = useMemo(() => getGpsTracks(), [])
  const summary = useMemo(() => getGpsTrackSummary(), [])

  return (
    <PageShell>
      <PageHeader
        title='Tracking GPS'
        description='Position des dispositifs GPS et des véhicules associés.'
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <KpiTile label='Dispositifs GPS' value={String(summary.total)} />
        <KpiTile label='Localisés' value={String(summary.located)} />
        <KpiTile label='Sans position' value={String(summary.unlocated)} />
      </div>

      <SectionCard title='Positions' description='Dernière position connue de chaque dispositif GPS.'>
        <div className='space-y-2'>
          {tracks.map((track) => (
            <GpsRow key={track.id} track={track} />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

function GpsRow({ track }: { track: GpsTrackView }) {
  const located = track.position != null
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'>
      <div className='flex min-w-0 items-center gap-2'>
        <MapPinned className={located ? 'size-4 shrink-0 text-primary' : 'size-4 shrink-0 text-muted-foreground'} />
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{track.serial}</p>
          <p className='truncate text-xs text-muted-foreground'>
            {track.vehiclePlate || 'Véhicule —'} / {track.orgName || 'Orga —'}
          </p>
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-1.5'>
        <span className='font-mono text-xs text-muted-foreground'>
          {located ? `${track.lat}, ${track.lng}` : 'Aucune position'}
        </span>
        {track.lastSync && (
          <Badge variant='secondary'>{track.lastSync.slice(0, 10)}</Badge>
        )}
      </div>
    </div>
  )
}