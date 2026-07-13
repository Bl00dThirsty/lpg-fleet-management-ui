import { getRouteApi } from '@tanstack/react-router'
import { Truck as TruckIcon, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getTransporterById } from './data/transporters'
import { TransporterOverview } from './components/transporter-overview'
import { TransporterTrucksList } from './components/transporter-trucks-list'
import { TransporterHistory } from './components/transporter-history'

const route = getRouteApi('/_authenticated/transporters/$transporterId')

export function TransporterDetailsPage() {
  const { transporterId } = route.useParams()
  const navigate = route.useNavigate()
  const transporter = getTransporterById(transporterId)

  if (!transporter) {
    return (
      <main className='flex-1 p-4 sm:p-6'>
        <div className='flex flex-col items-center justify-center h-[50vh] space-y-4'>
          <h2 className='text-2xl font-bold'>Transporter non trouvé</h2>
          <Button variant='outline' onClick={() => navigate({ to: '/transporters' })}>
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
            onClick={() => navigate({ to: '/transporters' })}
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div className='flex items-center gap-2 min-w-0'>
            <div className='shrink-0 p-2 bg-primary/10 rounded-lg'>
              <TruckIcon className='h-6 w-6 text-primary' />
            </div>
            <div className='min-w-0'>
              <h1 className='text-xl sm:text-2xl font-bold tracking-tight truncate'>{transporter.name}</h1>
              <p className='text-xs sm:text-sm text-muted-foreground truncate'>{transporter.region} • {transporter.contactEmail}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue='overview' className='w-full'>
        <div className='overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0'>
          <TabsList className='inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-3 lg:w-[450px]'>
            <TabsTrigger value='overview' className='whitespace-nowrap text-xs sm:text-sm'>Vue d'ensemble</TabsTrigger>
            <TabsTrigger value='trucks' className='whitespace-nowrap text-xs sm:text-sm'>Camions</TabsTrigger>
            <TabsTrigger value='history' className='whitespace-nowrap text-xs sm:text-sm'>Historique Tournées</TabsTrigger>
          </TabsList>
        </div>
        <div className='mt-4'>
          <TabsContent value='overview' className='m-0'>
            <TransporterOverview transporter={transporter} />
          </TabsContent>
          <TabsContent value='trucks' className='m-0'>
            <TransporterTrucksList transporter={transporter} />
          </TabsContent>
          <TabsContent value='history' className='m-0'>
            <TransporterHistory transporter={transporter} />
          </TabsContent>
        </div>
      </Tabs>
    </main>
  )
}
