import { Pie, PieChart } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lpg/ui'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@lpg/ui'
import { trucksHooks } from '@/lib/api/use-resources'

const chartConfig = {
  available: { label: 'Disponible', color: 'var(--chart-1)' },
  in_transit: { label: 'En transit', color: 'var(--chart-2)' },
  maintenance: { label: 'Maintenance', color: 'var(--chart-3)' },
  inactive: { label: 'Inactif', color: 'var(--chart-4)' },
} satisfies ChartConfig

const statusLabels: Record<string, string> = {
  available: 'Disponible',
  in_transit: 'En transit',
  maintenance: 'Maintenance',
  inactive: 'Inactif',
}

export function ChartPie() {
  const { data: trucksResult } = trucksHooks.useList()
  const trucks = (trucksResult?.data ?? []) as any[]

  const chartData = Object.entries(
    trucks.reduce(
      (acc: Record<string, number>, t: any) => {
        const status = t.status ?? 'unknown'
        acc[status] = (acc[status] ?? 0) + 1
        return acc
      },
      {}
    )
  ).map(([status, count]) => ({ status, count, fill: `var(--color-${status})` }))

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Statut de la flotte</CardTitle>
        <CardDescription>Repartition des camions par etat</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => statusLabels[value] ?? value}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              outerRadius={110}
              paddingAngle={3}
              strokeWidth={0}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
