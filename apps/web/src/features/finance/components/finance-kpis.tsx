import { Link } from '@tanstack/react-router'
import { ArrowRight, Banknote, Hourglass, Receipt, Scale, ScrollText, TrendingUp } from 'lucide-react'
import { MetricCardWithChart } from '@/components/charts'
import type { FinanceMonthlyPoint, FinanceSummary } from '../data/finance'

type FinanceKpisProps = {
  summary: FinanceSummary
  monthly: FinanceMonthlyPoint[]
}

/**
 * Headline subsidy/volume metrics for the finance dashboard. Each card carries
 * a sparkline over the declaration periods and links to the reconciliation area.
 */
export function FinanceKpis({ summary, monthly }: FinanceKpisProps) {
  const cards = [
    {
      id: 'subsidy',
      icon: Banknote,
      label: 'Impact subventions',
      value: summary.subsidyImpactLabel,
      sparkline: monthly.map((p) => p.subsidyImpact),
    },
    {
      id: 'declared',
      icon: Scale,
      label: 'Volume déclaré',
      value: summary.declaredVolumeLabel,
      sparkline: monthly.map((p) => p.declared),
    },
    {
      id: 'redressements',
      icon: ScrollText,
      label: 'Redressements',
      value: summary.redressementCount.toLocaleString('fr-FR'),
      sparkline: [summary.issuedCount, summary.paidCount, summary.waivedCount],
    },
    {
      id: 'gap',
      icon: TrendingUp,
      label: 'Écart moyen',
      value: `${summary.gapPercentage.toFixed(1)}%`,
      sparkline: monthly.map((p) => p.gap),
    },
  ]

  return (
    <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {cards.map((card) => (
        <MetricCardWithChart
          key={card.id}
          label={card.label}
          icon={card.icon}
          value={card.value}
          sparkline={card.sparkline}
          actions={
            <Link
              to='/reconciliations'
              className='text-muted-foreground transition-colors hover:text-foreground'
              aria-label={`Ouvrir ${card.label}`}
            >
              <ArrowRight className='size-4' />
            </Link>
          }
          className='rounded-2xl border-border/60 shadow-none'
        />
      ))}
    </section>
  )
}

const secondaryTiles = [
  {
    id: 'collection-rate',
    icon: Receipt,
    label: 'Taux de recouvrement',
    value: (summary: FinanceSummary) => `${summary.collectionRate.toFixed(0)}%`,
    hint: (summary: FinanceSummary) => `${summary.paidCount} payé(s) sur ${summary.issuedCount} émis`,
  },
  {
    id: 'outstanding',
    icon: Hourglass,
    label: 'À recouvrer',
    value: (summary: FinanceSummary) => summary.outstandingLabel,
    hint: (summary: FinanceSummary) => `${summary.issuedCount} redressement(s) émis`,
  },
  {
    id: 'flagged',
    icon: Scale,
    label: 'Écarts flaggés',
    value: (summary: FinanceSummary) => summary.flaggedCount.toLocaleString('fr-FR'),
    hint: () => 'au-dessus de la tolérance',
  },
  {
    id: 'pending',
    icon: Hourglass,
    label: 'Réconciliations en attente',
    value: (summary: FinanceSummary) => summary.pendingCount.toLocaleString('fr-FR'),
    hint: () => 'à vérifier',
  },
]

export function FinanceSecondaryStats({ summary }: { summary: FinanceSummary }) {
  return (
    <section className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {secondaryTiles.map((tile) => (
        <div
          key={tile.id}
          className='rounded-2xl border border-border/60 bg-card p-4 shadow-none'
        >
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <tile.icon className='size-4 text-primary' />
            <span>{tile.label}</span>
          </div>
          <p className='mt-2 text-2xl font-semibold tabular-nums leading-none'>
            {tile.value(summary)}
          </p>
          <p className='mt-1.5 text-xs text-muted-foreground'>{tile.hint(summary)}</p>
        </div>
      ))}
    </section>
  )
}
