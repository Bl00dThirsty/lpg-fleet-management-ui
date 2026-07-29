import * as React from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lpg/ui'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@lpg/ui'
import { toursHooks } from '@/lib/api/use-resources'

const chartConfig = {
  completed: { label: 'Terminees', color: 'var(--chart-1)' },
  planned: { label: 'Planifiees', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function ChartLine() {
  const { data: toursResult } = toursHooks.useList()
  const tours = (toursResult?.data ?? []) as any[]

  const chartData = React.useMemo(() => {
    if (!tours.length) return []
    const byDateCompleted = new Map<string, number>()
    const byDatePlanned = new Map<string, number>()
    tours.forEach((t: any) => {
      const date = t.scheduledDate?.split('T')[0] ?? t.createdAt?.split('T')[0]
      if (!date) return
      if (t.status === 'completed') {
        byDateCompleted.set(date, (byDateCompleted.get(date) ?? 0) + 1)
      } else {
        byDatePlanned.set(date, (byDatePlanned.get(date) ?? 0) + 1)
      }
    })
    const allDates = new Set([...byDateCompleted.keys(), ...byDatePlanned.keys()])
    return Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        completed: byDateCompleted.get(date) ?? 0,
        planned: byDatePlanned.get(date) ?? 0,
      }))
  }, [tours])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolution des tournees</CardTitle>
        <CardDescription>Tournees planifiees vs terminees par jour</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
              }
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Line
              dataKey="planned"
              type="monotone"
              stroke="var(--color-planned)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="completed"
              type="monotone"
              stroke="var(--color-completed)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
