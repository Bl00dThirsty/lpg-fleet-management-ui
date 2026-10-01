import { Cell, Pie, PieChart } from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@lpg/ui'

export type StatusDatum = {
  key: string
  label: string
  value: number
}

type StatusDistributionProps = {
  data: ReadonlyArray<StatusDatum>
  config: ChartConfig
  height?: number
  /** When true, the chart sits inside a small donut (`innerRadius=60`). */
  donut?: boolean
}

/**
 * Distribution chart for enum-style categories (status, severity, role).
 * Slices carry their key into the config so colors are stable per key.
 */
export function StatusDistribution({
  data,
  config,
  height = 260,
  donut = true,
}: StatusDistributionProps) {
  if (data.every((d) => d.value === 0)) {
    return (
      <div className='flex h-[160px] items-center justify-center text-sm text-muted-foreground'>
        Aucun élément à répartir.
      </div>
    )
  }
  const total = data.reduce((acc, d) => acc + d.value, 0)
  return (
    <ChartContainer config={config} className={`h-[${height}px] w-full`}>
      <PieChart accessibilityLayer>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v) => {
                if (typeof v !== 'number') return String(v)
                const pct = total > 0 ? Math.round((v / total) * 100) : 0
                return `${v.toLocaleString('fr-FR')} (${pct}%)`
              }}
              nameKey='key'
              labelKey='label'
            />
          }
        />
        <Pie
          data={data as StatusDatum[]}
          dataKey='value'
          nameKey='key'
          innerRadius={donut ? 60 : 0}
          outerRadius={Math.min(height / 2 - 16, 110)}
          strokeWidth={2}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={`var(--color-${d.key})`} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey='key' />}
          verticalAlign='bottom'
        />
      </PieChart>
    </ChartContainer>
  )
}
