import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const kpis = [
  {
    title: 'GPL transporte',
    description: 'Quantite totale de GPL en circulation par les flottes.',
  },
  {
    title: 'GPL en reserve',
    description: 'Volume disponible dans les depots et points de stockage.',
  },
  {
    title: 'Vue par flotte',
    description: 'Comparaison des volumes transportes par entreprise.',
  },
  {
    title: 'Vue par site',
    description: 'Lecture des stocks et mouvements par depot ou centre.',
  },
]

export function DashboardPage() {
  return (
    <Main className='space-y-6'>
      <section className='space-y-3'>
        <Badge variant='outline'>Pilotage</Badge>
        <div className='space-y-1'>
          <h1 className='text-3xl font-semibold tracking-tight'>
            Tableau de bord global
          </h1>
          <p className='text-muted-foreground max-w-3xl'>
            Cette page portera la vision de synthese sur les volumes de GPL
            transportes par les flottes et sur les quantites disponibles en
            reserve.
          </p>
        </div>
      </section>

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader>
              <CardTitle className='text-base'>{kpi.title}</CardTitle>
              <CardDescription>{kpi.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Bloc metier attendu</CardTitle>
            <CardDescription>
              Ce module ne doit pas dupliquer les details camion.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='rounded-lg border px-4 py-3'>
              Indicateurs globaux sur le GPL transporte
            </div>
            <div className='rounded-lg border px-4 py-3'>
              Reserve disponible par site ou depot
            </div>
            <div className='rounded-lg border px-4 py-3'>
              Repartition des volumes par flotte
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regle d'architecture</CardTitle>
            <CardDescription>
              Le dashboard consomme des donnees agregees, il ne les fabrique pas
              dans la page.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='rounded-lg border px-4 py-3'>
              `sites` gere le referentiel geographique
            </div>
            <div className='rounded-lg border px-4 py-3'>
              `routes` gere la logique de tournee et de livraison
            </div>
            <div className='rounded-lg border px-4 py-3'>
              `dashboard` consomme les agregats de synthese
            </div>
          </CardContent>
        </Card>
      </section>
    </Main>
  )
}
