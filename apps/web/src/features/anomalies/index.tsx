import { useMemo } from 'react'
import { AlertTriangle, Search, ServerCog } from 'lucide-react'
import { Button } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { AnomaliesTable } from './components/anomalies-table'
import { getAnomalies, getAnomalySummary, type AnomalyTrack } from './data/anomalies'

const TRACK_TITLES: Record<AnomalyTrack, string> = {
  ALL: 'Anomalies',
  INVESTIGATION: 'Anomalies — Piste Investigation',
  TECHNICAL: 'Anomalies — Piste Technique',
}

const TRACK_DESCRIPTIONS: Record<AnomalyTrack, string> = {
  ALL: 'Fraude, écarts de volume et incidents techniques détectés par la plateforme.',
  INVESTIGATION: 'Soupçons de fraude, siphonnage, détournement — à investiguer.',
  TECHNICAL: 'Incidents IoT, GPS, PDA et infrastructure — à résoudre.',
}

export function AnomaliesPage({ track = 'ALL' }: { track?: AnomalyTrack }) {
  const rows = useMemo(() => getAnomalies(track), [track])
  const summary = useMemo(() => getAnomalySummary(rows), [rows])

  return (
    <PageShell>
      <PageHeader
        title={TRACK_TITLES[track]}
        description={TRACK_DESCRIPTIONS[track]}
        actions={<TrackTabs track={track} />}
      />
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <KpiTile label='Total' value={String(summary.total)} icon={<AlertTriangle className='size-4 text-primary' />} />
        <KpiTile label='Nouvelles' value={String(summary.nouveau)} />
        <KpiTile label='En cours' value={String(summary.encours)} />
        <KpiTile label='Critiques' value={String(summary.critiques)} icon={<AlertTriangle className='size-4 text-rose-500' />} />
      </div>
      <SectionCard>
        <AnomaliesTable rows={rows} />
      </SectionCard>
    </PageShell>
  )
}

function TrackTabs({ track }: { track: AnomalyTrack }) {
  const tabs: { id: AnomalyTrack; label: string; href: string; icon: typeof AlertTriangle }[] = [
    { id: 'ALL', label: 'Toutes', href: '/anomalies', icon: AlertTriangle },
    { id: 'INVESTIGATION', label: 'Investigation', href: '/anomalies/investigation', icon: Search },
    { id: 'TECHNICAL', label: 'Technique', href: '/anomalies/technical', icon: ServerCog },
  ]
  return (
    <div className='flex items-center gap-1 rounded-lg bg-muted p-1'>
      {tabs.map((tab) => {
        const active = tab.id === track
        return (
          <Button
            key={tab.id}
            asChild
            variant={active ? 'default' : 'ghost'}
            size='sm'
            className='gap-1.5'
          >
            <a href={tab.href}>
              <tab.icon className='size-3.5' />
              {tab.label}
            </a>
          </Button>
        )
      })}
    </div>
  )
}