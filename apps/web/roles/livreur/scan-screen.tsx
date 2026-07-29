import { useState } from 'react'
import { ScanLine, ArrowDownToLine, ArrowUpFromLine, WifiOff, Check } from 'lucide-react'
import { faker } from '@faker-js/faker'
import { PageHeader } from '@/components/layout/page-header'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@lpg/ui'

type Scan = {
  id: string
  tag: string
  direction: 'in' | 'out'
  synced: boolean
  at: Date
}

faker.seed(4242)

function randomScan(direction: 'in' | 'out'): Scan {
  return {
    id: faker.string.uuid(),
    tag: `RFID-${faker.string.alphanumeric(8).toUpperCase()}`,
    direction,
    synced: Math.random() > 0.4,
    at: new Date(),
  }
}

export function LivreurScanScreen() {
  const [scans, setScans] = useState<Scan[]>(() =>
    Array.from({ length: 6 }, () => randomScan(Math.random() > 0.5 ? 'in' : 'out'))
  )
  const [online, setOnline] = useState(false)

  const addScan = (direction: 'in' | 'out') =>
    setScans((prev) => [randomScan(direction), ...prev])

  const outCount = scans.filter((s) => s.direction === 'out').length
  const inCount = scans.filter((s) => s.direction === 'in').length
  const pending = scans.filter((s) => !s.synced).length

  return (
    <PageShell>
      <PageHeader
        title='Scan RFID (IN / OUT)'
        description='Scan des bouteilles vides récupérées (IN) et pleines déposées (OUT) — mode local-first.'
        actions={
          <Button
            variant='outline'
            size='sm'
            onClick={() => setOnline((o) => !o)}
            className='gap-2'
          >
            {online ? <Check className='size-4 text-emerald-600' /> : <WifiOff className='size-4' />}
            {online ? 'En ligne' : 'Hors-ligne'}
          </Button>
        }
      />

       <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
         <Card>
           <CardHeader className='pb-2'>
             <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
               <ArrowUpFromLine className='size-4' /> Bouteilles OUT (plein)
             </CardTitle>
           </CardHeader>
           <CardContent className='text-2xl font-bold'>{outCount}</CardContent>
         </Card>
         <Card>
           <CardHeader className='pb-2'>
             <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
               <ArrowDownToLine className='size-4' /> Bouteilles IN (vide)
             </CardTitle>
           </CardHeader>
           <CardContent className='text-2xl font-bold'>{inCount}</CardContent>
         </Card>
         <Card>
           <CardHeader className='pb-2'>
             <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
               <WifiOff className='size-4' /> Non synchronisées
             </CardTitle>
           </CardHeader>
           <CardContent className='text-2xl font-bold'>{pending}</CardContent>
         </Card>
       </div>

      <Tabs defaultValue='out'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <TabsList>
            <TabsTrigger value='out'>OUT (plein)</TabsTrigger>
            <TabsTrigger value='in'>IN (vide)</TabsTrigger>
          </TabsList>
          <div className='flex gap-2'>
            <Button className='gap-2' onClick={() => addScan('out')}>
              <ScanLine className='size-4' /> Scanner pleine
            </Button>
            <Button variant='secondary' className='gap-2' onClick={() => addScan('in')}>
              <ScanLine className='size-4' /> Scanner vide
            </Button>
          </div>
        </div>

        {(['out', 'in'] as const).map((dir) => (
          <TabsContent key={dir} value={dir}>
            <Card>
              <CardContent className='divide-y p-0'>
                {scans
                  .filter((s) => s.direction === dir)
                  .map((s) => (
                    <div key={s.id} className='flex items-center justify-between px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <ScanLine className={`size-4 ${s.direction === 'in' ? 'text-blue-600' : 'text-orange-600'}`} />
                        <div>
                          <p className='text-sm font-medium'>{s.tag}</p>
                          <p className='text-xs text-muted-foreground'>
                            {s.at.toLocaleTimeString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge
                          variant={s.direction === 'in' ? 'default' : 'secondary'}
                          className='text-xs'
                        >
                          {s.direction === 'in' ? 'IN' : 'OUT'}
                        </Badge>
                        <Badge
                          className={
                            s.synced
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500 text-white'
                          }
                        >
                          {s.synced ? 'Synchronisé' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                {scans.filter((s) => s.direction === dir).length === 0 && (
                  <p className='p-4 text-sm text-muted-foreground'>Aucun scan.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </PageShell>
  )
}

