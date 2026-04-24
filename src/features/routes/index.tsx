import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import {
  getKeySites,
  siteTypeLabels,
  siteTypeOptions,
  sites,
} from '@/features/sites/data/sites'

const routeSignals = [
  'Variation du niveau GPL entre chargement, trajet et livraison',
  'Visualisation des points de chargement et de dechargement sur la carte',
  'Suivi de la quantite livree chez les marketers et centres emplisseurs',
]

export function RoutesPage() {
  const keySites = getKeySites()

  return (
    <Main className='space-y-6'>
      <section className='space-y-3'>
        <Badge variant='outline'>Operations</Badge>
        <div className='space-y-1'>
          <h1 className='text-3xl font-semibold tracking-tight'>
            Tournees GPL
          </h1>
          <p className='text-muted-foreground max-w-3xl'>
            Cette feature pilotera les trajets de livraison de bout en bout,
            depuis le point de chargement jusqu'au site de livraison, avec le
            suivi de la variation du niveau GPL pendant la tournee.
          </p>
        </div>
      </section>

      <section className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Perimetre fonctionnel</CardTitle>
            <CardDescription>
              Ce module doit sortir la logique de tournee du simple detail
              camion.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            {routeSignals.map((signal) => (
              <div
                key={signal}
                className='rounded-lg border px-4 py-3 text-foreground'
              >
                {signal}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sites prioritaires</CardTitle>
            <CardDescription>
              Premier referentiel metier a poser sur la carte.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            {keySites.map((site) => (
              <div
                key={site.id}
                className='rounded-lg border px-4 py-3 text-foreground'
              >
                <p className='font-medium'>{site.name}</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {site.city} - {siteTypeLabels[site.type]}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ordre de construction recommande</CardTitle>
          <CardDescription>
            Base saine avant l'integration des vraies donnees terrain.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-3'>
          <div className='rounded-lg border px-4 py-4'>
            <p className='text-sm font-medium'>1. Sites</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Modeliser Bipaga, SCDP Douala, SCDP Yaounde et les centres.
            </p>
          </div>
          <div className='rounded-lg border px-4 py-4'>
            <p className='text-sm font-medium'>2. Tournees</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Relier camion, origine, destination, waypoints et statut.
            </p>
          </div>
          <div className='rounded-lg border px-4 py-4'>
            <p className='text-sm font-medium'>3. Telemetrie GPL</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Suivre la baisse du niveau GPL sur la duree du trajet.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seed logistique disponible</CardTitle>
          <CardDescription>
            Les donnees seed de sites sont deja mutualisees dans la feature
            `sites`.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-2 xl:grid-cols-5'>
          {siteTypeOptions.map((option) => {
            const total = sites.filter((site) => site.type === option.value)
              .length

            return (
              <div key={option.value} className='rounded-lg border px-4 py-4'>
                <p className='text-sm font-medium'>{option.label}</p>
                <p className='mt-1 text-2xl font-semibold'>{total}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </Main>
  )
}
