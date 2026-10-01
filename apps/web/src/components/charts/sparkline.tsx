import { Area, AreaChart } from 'recharts'
import type { ChartConfig } from '@lpg/ui'
import { ChartContainer } from '@lpg/ui'

type SparklineProps = {
  values: ReadonlyArray<number>
  config?: ChartConfig
  width?: number
  height?: number
}

/**
 * Tiny inline trend indicator used inside cards. No axes, no tooltip.
 */
export function Sparkline({
  values,
  config,
  width = 80,
  height = 24,
}: SparklineProps) {
  const points = values.map((value, i) => ({ i, value }))
  const cfg: ChartConfig = config ?? {
    value: { label: 'Valeur', color: 'var(--color-chart-1)' },
  }
  return (
    <div style={{ width, height }} className='shrink-0'>
      <ChartContainer config={cfg} className='h-full w-full'>
        <AreaChart data={points} accessibilityLayer margin={{ top: 1, right: 0, bottom: 1, left: 0 }}>
          <Area
            dataKey='value'
            type='monotone'
            fill='var(--color-value)'
            fillOpacity={0.2}
            stroke='var(--color-value)'
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
