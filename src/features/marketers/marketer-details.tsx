import { getRouteApi } from '@tanstack/react-router'
import { Building2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMarketerById } from './data/marketers'
import { MarketerOverview } from './components/marketer-overview'
import { MarketerSites } from './components/marketer-sites'
import { MarketerBulkRoutes } from './components/marketer-bulk-routes'
import { MarketerCylindersRoutes } from './components/marketer-cylinders-routes'

const route = getRouteApi('/_authenticated/marketers/$marketerId')

export function MarketerDetailsPage() {
  const { marketerId } = route.useParams()
  const navigate = route.useNavigate()
  const marketer = getMarketerById(marketerId)

  if (!marketer) {
    return (
      <main className='flex-1 p-4 sm:p-6'>
        <div className='flex flex-col items-center justify-center h-[50vh] space-y-4'>
          <h2 className='text-2xl font-bold'>Marketer non trouvé</h2>
          <Button variant='outline' onClick={() => navigate({ to: '/marketers' })}>
            Retour à la liste
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4'>
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
            <TabsTrigger value='sites' className='whitespace-nowrap text-xs sm:text-sm'>Sites & Dépôts</TabsTrigger>
            <TabsTrigger value='bulk' className='whitespace-nowrap text-xs sm:text-sm'>Tournées Vrac</TabsTrigger>
            <TabsTrigger value='cylinders' className='whitespace-nowrap text-xs sm:text-sm'>Tournées 50 kg</TabsTrigger>
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
    </main>
  )
}
