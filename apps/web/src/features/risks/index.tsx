import { useMemo, useState } from 'react'
import { AlertOctagon, FileWarning, Gauge } from 'lucide-react'
import { MetricCardWithChart, ChartCard, StatusDistribution, CompositionBar, chartConfigFrom } from '@/components/charts'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import { RiskScoresTable } from './components/risk-scores-table'
import { RiskDetailSheet } from './components/risk-detail-sheet'
import {
  getRiskScores,
  getRiskSummary,
  getRiskByEntityType,
  type RiskScoreView,
} from './data/risk-scores'

export function RiskScoresPage() {
  const rows = useMemo(() => getRiskScores(), [])
  const summary = useMemo(() => getRiskSummary(rows), [rows])
  const byType = useMemo(() => getRiskByEntityType(rows), [rows])
  const [selected, setSelected] = useState<RiskScoreView | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const levelData = [
    { key: 'FAIBLE', label: 'Faible', value: summary.faible },
    { key: 'MODERE', label: 'Modéré', value: summary.modere },
    { key: 'ELEVE', label: 'Élevé', value: summary.eleve },
    { key: 'CRITIQUE', label: 'Critique', value: summary.critique },
  ]
  const levelConfig = chartConfigFrom(levelData.map(({ key, label }) => ({ key, label })))

  const typeData = byType.map((t) => ({ label: t.entity_label, value: t.count }))
  const typeConfig = chartConfigFrom(byType.map((t) => ({ key: t.entity_type, label: t.entity_label })))

  const openDetails = (row: RiskScoreView) => {
    setSelected(row)
    setSheetOpen(true)
  }

  return (
    <PageShell>
      <PageHeader
        title='Scores de risque'
        description='Modèle CSPH-RISK — notation des marketeurs, transporteurs, sites et véhicules.'
      />
      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCardWithChart
          label='Entités notées'
          value={summary.total.toLocaleString('fr-FR')}
          icon={FileWarning}
          sparkline={byType.map((t) => t.count)}
          className='rounded-2xl border-border/60 shadow-none'
        />
        <MetricCardWithChart
          label='Score moyen'
          value={summary.average.toLocaleString('fr-FR')}
          icon={Gauge}
          sparkline={byType.map((t) => t.average)}
          className='rounded-2xl border-border/60 shadow-none'
        />
        <MetricCardWithChart
          label='Risque élevé'
          value={summary.eleve.toLocaleString('fr-FR')}
          sparkline={[summary.faible, summary.modere, summary.eleve, summary.critique]}
          className='rounded-2xl border-border/60 shadow-none'
        />
        <MetricCardWithChart
          label='Risque critique'
          value={summary.critique.toLocaleString('fr-FR')}
          icon={AlertOctagon}
          sparkline={[summary.faible, summary.modere, summary.eleve, summary.critique]}
          className='rounded-2xl border-border/60 shadow-none'
        />
      </section>

      <div className='grid gap-4 lg:grid-cols-3'>
        <ChartCard
          title='Répartition par niveau'
          description='Mix de risque global sur la période courante.'
        >
          <StatusDistribution data={levelData} config={levelConfig} height={220} />
        </ChartCard>
        <ChartCard
          title='Entités par type'
          description='Nombre d’entités notées par catégorie.'
          className='lg:col-span-2'
        >
          <CompositionBar data={typeData} config={typeConfig} height={220} />
        </ChartCard>
      </div>

      <SectionCard>
        <RiskScoresTable rows={rows} onViewDetails={openDetails} />
      </SectionCard>

      <RiskDetailSheet risk={selected} open={sheetOpen} onOpenChange={setSheetOpen} />
    </PageShell>
  )
}