import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lpg/ui'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@lpg/ui'
import { toursHooks } from '@/lib/api/use-resources'

const chartConfig = {
  count: { label: 'Tournees', color: 'var(--primary)' },
} satisfies ChartConfig

const statusLabels: Record<string, string> = {
  planned: 'Planifiee',
  in_progress: 'En cours',
  completed: 'Terminee',
  cancelled: 'Annulee',
}

export function ChartBar() {
  const { data: toursResult } = toursHooks.useList()
  const tours = (toursResult?.data ?? []) as any[]

  const chartData = Object.entries(
    tours.reduce(
      (acc: Record<string, number>, t: any) => {
        const status = t.status ?? 'unknown'
        acc[status] = (acc[status] ?? 0) + 1
        return acc
      },
      {}
    )
  ).map(([status, count]) => ({ status, count }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournees par statut</CardTitle>
        <CardDescription>Repartition des tournees actives et terminees</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="status"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => statusLabels[value] ?? value}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => statusLabels[value] ?? value}
                />
              }
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
