import { useMemo } from 'react'
import { AlertTriangle, Search, ServerCog } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { AnomaliesTable } from './components/anomalies-table'
import { getAnomalies, getAnomalySummary, type AnomalyTrack } from './data/anomalies'

export function AnomaliesPage({ track = 'ALL' }: { track?: AnomalyTrack }) {
  const { t } = useTranslation('common')
  const rows = useMemo(() => getAnomalies(track), [track])
  const summary = useMemo(() => getAnomalySummary(rows), [rows])
  const trackTitles: Record<AnomalyTrack, string> = {
    ALL: t('anomalies.titleAll'),
    INVESTIGATION: t('anomalies.titleInvestigation'),
    TECHNICAL: t('anomalies.titleTechnical'),
  }
  const trackDescriptions: Record<AnomalyTrack, string> = {
    ALL: t('anomalies.descriptionAll', { defaultValue: 'Fraude, écarts de volume et incidents techniques détectés par la plateforme.' }),
    INVESTIGATION: t('anomalies.descriptionInvestigation', { defaultValue: 'Soupçons de fraude, siphonnage, détournement — à investiguer.' }),
    TECHNICAL: t('anomalies.descriptionTechnical', { defaultValue: 'Incidents IoT, GPS, PDA et infrastructure — à résoudre.' }),
  }

  return (
    <PageShell>
      <PageHeader
        title={trackTitles[track]}
        description={trackDescriptions[track]}
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
  const { t } = useTranslation('common')
  const tabs: { id: AnomalyTrack; label: string; href: string; icon: typeof AlertTriangle }[] = [
    { id: 'ALL', label: t('anomalies.all'), href: '/anomalies', icon: AlertTriangle },
    { id: 'INVESTIGATION', label: t('anomalies.investigation'), href: '/anomalies/investigation', icon: Search },
    { id: 'TECHNICAL', label: t('anomalies.technical'), href: '/anomalies/technical', icon: ServerCog },
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