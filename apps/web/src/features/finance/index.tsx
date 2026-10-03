import { useMemo } from 'react'
import { ChartCard, CompositionBar, StatusDistribution, TrendLine, chartConfigFrom } from '@/components/charts'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell } from '@/components/layout/page'
import {
  getFinanceSummary,
  getFlaggedReconciliations,
  getMarketeurImpactRows,
  getMonthlyTrend,
  getRedressementStatusRows,
} from './data/finance'
import { FinanceKpis, FinanceSecondaryStats } from './components/finance-kpis'
import { FlaggedReconciliations } from './components/flagged-reconciliations'
import { MarketeurBreakdownTable } from './components/marketeur-breakdown-table'

export function FinancePage() {
  const summary = useMemo(() => getFinanceSummary(), [])
  const monthly = useMemo(() => getMonthlyTrend(), [])
  const statusRows = useMemo(() => getRedressementStatusRows(), [])
  const marketeurRows = useMemo(() => getMarketeurImpactRows(), [])
  const flagged = useMemo(() => getFlaggedReconciliations(), [])

  const statusData = statusRows.map((r) => ({ key: r.status, label: r.statusLabel, value: r.count }))
  const statusConfig = chartConfigFrom(statusRows.map((r) => ({ key: r.status, label: r.statusLabel })))

  const impactData = marketeurRows.map((r) => ({ label: r.marketeur, value: r.subsidyImpact }))
  const impactConfig = chartConfigFrom(
    marketeurRows.map((r) => ({ key: r.marketeur, label: r.marketeur })),
  )
  const gapData = marketeurRows.map((r) => ({ label: r.marketeur, value: r.volumeGap }))
  const gapConfig = chartConfigFrom(
    marketeurRows.map((r) => ({ key: r.marketeur, label: r.marketeur })),
  )

  return (
    <PageShell>
      <PageHeader
        title='Indicateurs financiers'
        description='Impact des écarts de volume sur les subventions et gestion des redressements.'
      />

      <FinanceKpis summary={summary} monthly={monthly} />
      <FinanceSecondaryStats summary={summary} />

      <div className='grid gap-4 lg:grid-cols-3'>
        <ChartCard
          title='Écart moyen mensuel'
          description='Écart absolu déclaré vs tracé par période (TM).'
          className='lg:col-span-2'
        >
          <TrendLine
            points={monthly.map((p) => ({ label: p.label, value: p.gap }))}
            config={chartConfigFrom([{ key: 'value', label: 'Écart' }])}
            unit=' TM'
            height={240}
          />
        </ChartCard>

        <ChartCard
          title='Redressements par statut'
          description='Répartition des redressements émis, payés et annulés.'
        >
          <StatusDistribution data={statusData} config={statusConfig} height={240} />
        </ChartCard>
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        <ChartCard
          title='Impact subventions par marketeur'
          description='Subvention à recouvrer, agrégée par organisation.'
        >
          <CompositionBar data={impactData} config={impactConfig} horizontal unit=' XAF' height={240} />
        </ChartCard>

        <ChartCard
          title='Écart de volume par marketeur'
          description='Écart absolu déclaré vs tracé (TM).'
        >
          <CompositionBar data={gapData} config={gapConfig} horizontal unit=' TM' height={240} />
        </ChartCard>

        <FlaggedReconciliations rows={flagged} />
      </div>

      <MarketeurBreakdownTable rows={marketeurRows} />
    </PageShell>
  )
}