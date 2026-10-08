import { useMemo, useState } from 'react'
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { buildRegionalShareSummary } from '../data/regional-stats'

export function RegionalVolumeShare() {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)
  const { chartData, topSharePercent, regionCards, formattedTotalVolume } = useMemo(
    () => buildRegionalShareSummary(),
    []
  )

  const activeItem = useMemo(
    () => (hoveredCode ? chartData.find((item) => item.code === hoveredCode) : null),
    [hoveredCode, chartData]
  )

  return (
    <Card className='h-full border border-border shadow-sm'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <div className='space-y-1'>
          <CardTitle className='font-manrope text-base font-semibold'>
            Répartition du volume livré par région
          </CardTitle>
          <CardDescription className='text-xs text-muted-foreground'>
            Part de chaque région dans le volume livré (1 mois, 10 régions)
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className='pt-2'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-12 items-center'>
          <div className='lg:col-span-5 xl:col-span-4 flex flex-col items-center justify-center gap-3'>
            <div className='relative flex items-center justify-center size-[210px] shrink-0'>
              <ResponsiveContainer width='100%' height={210}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey='value'
                    nameKey='name'
                    innerRadius={66}
                    outerRadius={92}
                    paddingAngle={3}
                    cornerRadius={4}
                    strokeWidth={0}
                    onMouseEnter={(_, index) => setHoveredCode(chartData[index]?.code ?? null)}
                    onMouseLeave={() => setHoveredCode(null)}
                  >
                    {chartData.map((entry) => {
                      const isHovered = hoveredCode === entry.code
                      const isMuted = hoveredCode !== null && !isHovered
                      return (
                        <Cell
                          key={`cell-${entry.code}`}
                          fill={entry.color}
                          opacity={isMuted ? 0.35 : 1}
                          stroke={isHovered ? 'var(--foreground)' : 'transparent'}
                          strokeWidth={isHovered ? 2 : 0}
                          className='transition-all duration-150 cursor-pointer outline-none'
                        />
                      )
                    })}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          const cx = viewBox.cx
                          const cy = viewBox.cy || 0
                          return (
                            <text
                              x={cx}
                              y={cy}
                              textAnchor='middle'
                              dominantBaseline='middle'
                            >
                              <tspan
                                x={cx}
                                y={cy - 10}
                                className='fill-muted-foreground text-xs font-medium'
                              >
                                {activeItem ? activeItem.name : 'Volume livré'}
                              </tspan>
                              <tspan
                                x={cx}
                                y={cy + 16}
                                className='fill-foreground text-2xl font-bold tracking-tight'
                              >
                                {activeItem ? activeItem.formattedValue : formattedTotalVolume}
                              </tspan>
                            </text>
                          )
                        }
                        return null
                      }}
                    />
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      const item = payload?.[0]?.payload
                      if (active && item) {
                        return (
                          <div className='rounded-md border border-border bg-popover p-2 text-xs shadow-md'>
                            <p className='font-semibold text-foreground'>{item.name}</p>
                            <p className='text-muted-foreground mt-0.5'>
                              {item.formattedValue} ({item.percentage} du total)
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className='flex flex-wrap items-center justify-center gap-2 text-xs'>
              <span className='rounded-md border border-border bg-muted/40 px-2.5 py-1 text-muted-foreground'>
                <strong className='text-foreground'>10/10</strong> régions actives
              </span>
              <span className='rounded-md border border-emerald-500/10 bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-300'>
                <strong>Top 4 : {topSharePercent}</strong> du volume
              </span>
            </div>
          </div>

          <div className='lg:col-span-7 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
            {regionCards.map((r) => {
              const isHovered = hoveredCode === r.code
              const isMuted = hoveredCode !== null && !isHovered
              return (
                <div
                  key={r.code}
                  onMouseEnter={() => setHoveredCode(r.code)}
                  onMouseLeave={() => setHoveredCode(null)}
                  className={cn(
                    'flex flex-col justify-between rounded-md border p-2.5 shadow-2xs transition-all cursor-pointer',
                    isHovered
                      ? 'border-primary/50 bg-primary/5 shadow-xs scale-[1.01]'
                      : isMuted
                        ? 'border-border/60 bg-card opacity-50'
                        : 'border-border bg-card hover:bg-muted/20'
                  )}
                >
                  <div className='flex items-center justify-between text-xs'>
                    <div className='flex items-center gap-1.5 min-w-0'>
                      <span
                        className='h-3 w-1 rounded-full shrink-0 transition-transform'
                        style={{ backgroundColor: r.color }}
                      />
                      <span className='font-semibold text-foreground truncate'>
                        {r.name}
                      </span>
                    </div>
                    <span className='font-bold text-foreground tabular-nums'>
                      {r.formattedVolume}
                    </span>
                  </div>
                  <div className='mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground'>
                    <span className='truncate'>{r.deliveries} livraisons</span>
                    <span className='font-medium text-foreground/80 tabular-nums'>
                      {r.share}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
