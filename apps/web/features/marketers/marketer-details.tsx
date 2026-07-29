import { getRouteApi } from '@tanstack/react-router'
import { Building2, ArrowLeft } from 'lucide-react'
import { Button } from '@lpg/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lpg/ui'
import { getMarketerById } from './marketers'
import { MarketerOverview } from './components/marketer-overview'
import { MarketerSites } from './components/marketer-sites'
import { MarketerBulkRoutes } from './components/marketer-bulk-routes'
import { MarketerCylindersRoutes } from './components/marketer-cylinders-routes'
import { EmptyState, PageShell } from '@/components/layout/page'

const route = getRouteApi('/_authenticated/marketers/$marketerId')

export function MarketerDetailsPage() {
  const { marketerId } = route.useParams()
  const navigate = route.useNavigate()
  const marketer = getMarketerById(marketerId)

  if (!marketer) {
    return (
      <PageShell>
        <EmptyState
          title='Marketer non trouvé'
          description='Ce marketer n’existe pas ou plus.'
          action={
            <Button variant='outline' onClick={() => navigate({ to: '/marketers' })}>
              Retour à la liste
            </Button>
          }
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3 min-w-0'>
          <Button
            variant='ghost'
            size='icon'
            className='shrink-0'
            onClick={() => navigate({ to: '/marketers' })}
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div className='flex items-center gap-2 min-w-0'>
            <div className='shrink-0 p-2 bg-primary/10 rounded-lg'>
              <Building2 className='h-6 w-6 text-primary' />
            </div>
            <div className='min-w-0'>
              <h1 className='text-xl sm:text-2xl font-bold tracking-tight truncate'>{marketer.name}</h1>
              <p className='text-xs sm:text-sm text-muted-foreground truncate'>{marketer.region} • {marketer.contactEmail}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue='overview' className='w-full'>
        <div className='overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0'>
          <TabsList className='inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-4 lg:w-[600px]'>
            <TabsTrigger value='overview' className='whitespace-nowrap text-xs sm:text-sm'>Vue d'ensemble</TabsTrigger>
            <TabsTrigger value='sites' className='whitespace-nowrap text-xs sm:text-sm'>Sites & Depots</TabsTrigger>
            <TabsTrigger value='bulk' className='whitespace-nowrap text-xs sm:text-sm'>Tournees Vrac</TabsTrigger>
            <TabsTrigger value='cylinders' className='whitespace-nowrap text-xs sm:text-sm'>Tournees 50 kg</TabsTrigger>
          </TabsList>
        </div>
        <div className='mt-4'>
          <TabsContent value='overview' className='m-0'>
            <MarketerOverview marketer={marketer} />
          </TabsContent>
          <TabsContent value='sites' className='m-0'>
            <MarketerSites marketer={marketer} />
          </TabsContent>
          <TabsContent value='bulk' className='m-0'>
            <MarketerBulkRoutes marketer={marketer} />
          </TabsContent>
          <TabsContent value='cylinders' className='m-0'>
            <MarketerCylindersRoutes marketer={marketer} />
          </TabsContent>
        </div>
      </Tabs>
    </PageShell>
  )
}
