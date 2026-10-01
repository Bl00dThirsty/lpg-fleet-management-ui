import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@lpg/ui'

type CompositionDatum = {
  label: string
  value: number
}

type CompositionBarProps = {
  data: ReadonlyArray<CompositionDatum>
  config: ChartConfig
  /** When true, render bars horizontally (long labels). */
  horizontal?: boolean
  unit?: string
  height?: number
}

/**
 * Single-series bar chart. Useful for "Top N" cut of a dataset.
 */
export function CompositionBar({
  data,
  config,
  horizontal,
  unit,
  height = 260,
}: CompositionBarProps) {
  return (
    <ChartContainer config={config} className={`h-[${height}px] w-full`}>
      <BarChart
        data={data as CompositionDatum[]}
        accessibilityLayer
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ left: horizontal ? 80 : 12, right: 16, top: 8, bottom: 8 }}
      >
        <CartesianGrid vertical={!horizontal} horizontal={horizontal} />
        {horizontal ? (
          <>
            <XAxis
              type='number'
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => v.toLocaleString('fr-FR')}
              stroke='var(--color-muted-foreground)'
            />
            <YAxis
              type='category'
              dataKey='label'
              tickLine={false}
              axisLine={false}
              width={72}
              stroke='var(--color-muted-foreground)'
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              stroke='var(--color-muted-foreground)'
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) => v.toLocaleString('fr-FR')}
              stroke='var(--color-muted-foreground)'
            />
          </>
        )}
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v) =>
                typeof v === 'number'
                  ? `${v.toLocaleString('fr-FR')}${unit ? ` ${unit}` : ''}`
                  : String(v)
              }
            />
          }
        />
        <Bar
          dataKey='value'
          fill='var(--color-value)'
          radius={[4, 4, 0, 0]}
          {...(horizontal ? { radius: [0, 4, 4, 0] } : {})}
        />
      </BarChart>
    </ChartContainer>
  )
}
