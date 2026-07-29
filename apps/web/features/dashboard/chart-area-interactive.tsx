import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@lpg/ui'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@lpg/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lpg/ui'
import { Button } from '@lpg/ui'
import { declarationsHooks } from '@/lib/api/use-resources'

const chartConfig = {
  declarations: {
    label: 'Declarations',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState('90d')
  const { data: declarationsResult } = declarationsHooks.useList()

  const declarations = (declarationsResult?.data ?? []) as any[]

  const chartData = React.useMemo(() => {
    if (!declarations.length) return []
    const byDate = new Map<string, number>()
    declarations.forEach((d: any) => {
      const date = d.declaredAt?.split('T')[0] ?? d.createdAt?.split('T')[0]
      if (date) byDate.set(date, (byDate.get(date) ?? 0) + 1)
    })
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, declarations: count }))
  }, [declarations])

  const filteredData = React.useMemo(() => {
    if (!chartData.length) return []
    const referenceDate = new Date(chartData[chartData.length - 1].date)
    let days = 90
    if (timeRange === '30d') days = 30
    if (timeRange === '7d') days = 7
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - days)
    return chartData.filter((item) => new Date(item.date) >= startDate)
  }, [chartData, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Declarations</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Volume des 3 derniers mois</span>
          <span className="@[540px]/card:hidden">3 derniers mois</span>
        </CardDescription>
        <div className="flex items-center gap-2">
          <div className="hidden gap-1 @[540px]/card:flex">
            {(['90d', '30d', '7d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setTimeRange(range)}
              >
                {range === '90d' ? '3 mois' : range === '30d' ? '30 jours' : '7 jours'}
              </Button>
            ))}
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 @[540px]/card:hidden"
              size="sm"
              aria-label="Periode"
            >
              <SelectValue placeholder="3 mois" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">3 mois</SelectItem>
              <SelectItem value="30d" className="rounded-lg">30 jours</SelectItem>
              <SelectItem value="7d" className="rounded-lg">7 jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDeclarations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-declarations)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-declarations)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
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
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
                  }
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="declarations"
              type="natural"
              fill="url(#fillDeclarations)"
              stroke="var(--color-declarations)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
