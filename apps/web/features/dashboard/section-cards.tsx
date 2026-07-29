import { TrendingDown, TrendingUp } from 'lucide-react'
import { Badge, Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@lpg/ui'
import { trucksHooks, toursHooks, sitesHooks, declarationsHooks } from '@/lib/api/use-resources'

export function SectionCards() {
  const { data: trucksResult } = trucksHooks.useList()
  const { data: toursResult } = toursHooks.useList()
  const { data: sitesResult } = sitesHooks.useList()
  const { data: declarationsResult } = declarationsHooks.useList()

  const trucks = (trucksResult?.data ?? []) as any[]
  const tours = (toursResult?.data ?? []) as any[]
  const sites = (sitesResult?.data ?? []) as any[]
  const declarations = (declarationsResult?.data ?? []) as any[]

  const activeTours = tours.filter((t: any) => t.status === 'in_progress').length

  const cards = [
    {
      key: 'trucks',
      title: 'Total camions',
      value: trucks.length,
      trend: '+8.2%',
      up: true,
      footer: 'Flotte enregistree',
      detail: 'En hausse ce mois',
    },
    {
      key: 'tours',
      title: 'Tournees actives',
      value: activeTours,
      trend: '+12.5%',
      up: true,
      footer: 'En cours de livraison',
      detail: 'En hausse ce mois',
    },
    {
      key: 'sites',
      title: 'Citernes',
      value: sites.length,
      trend: '-2.4%',
      up: false,
      footer: 'Sites de stockage',
      detail: 'En baisse ce mois',
    },
    {
      key: 'declarations',
      title: 'Declarations',
      value: declarations.length,
      trend: '+24.8%',
      up: true,
      footer: 'Ce mois-ci',
      detail: 'En hausse ce mois',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {cards.map((card) => (
        <Card key={card.key} className="@container/card">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {card.trend}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.detail}
              {card.up ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            </div>
            <div className="text-muted-foreground">{card.footer}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
