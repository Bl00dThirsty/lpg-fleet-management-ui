import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@lpg/ui'

type TrendPoint = {
  /** Display label rendered on the X axis (a date, a label, etc.). */
  label: string
  /** Numeric value to plot. */
  value: number
}

type TrendLineProps = {
  points: ReadonlyArray<TrendPoint>
  /** ChartConfig providing the colour for the single series (key='value'). */
  config: ChartConfig
  /** Optional unit appended to the value in tooltips/axes (e.g. 'TM', 'btl'). */
  unit?: string
  height?: number
  /** Hide the X axis ticks when chart is dense. */
  hideXTicks?: boolean
}

/**
 * Single-series area chart. Use for one metric over time.
 */
export function TrendLine({
  points,
  config,
  unit,
  height = 220,
  hideXTicks,
}: TrendLineProps) {
  return (
    <ChartContainer config={config} className={`h-[${height}px] w-full`}>
      <AreaChart data={points as TrendPoint[]} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='label'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          {...(hideXTicks ? { tick: () => null } : {})}
          stroke='var(--color-muted-foreground)'
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v: number) => v.toLocaleString('fr-FR')}
          stroke='var(--color-muted-foreground)'
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator='line'
              formatter={(v) =>
                typeof v === 'number'
                  ? `${v.toLocaleString('fr-FR')}${unit ? ` ${unit}` : ''}`
                  : String(v)
              }
            />
          }
        />
        <Area
          dataKey='value'
          type='monotone'
          fill='var(--color-value)'
          fillOpacity={0.18}
          stroke='var(--color-value)'
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
