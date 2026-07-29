import { useState } from 'react'
import { ListChecks, MapPin, PackageCheck, PackageX, CheckCircle2, ScanLine } from 'lucide-react'
import { faker } from '@faker-js/faker'
import { PageHeader } from '@/components/layout/page-header'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, ScrollArea } from '@lpg/ui'

faker.seed(808)

type Mission = {
  id: string
  client: string
  city: string
  bottles: number
  status: 'todo' | 'running' | 'done'
  out: number
  inn: number
}

function buildMissions(): Mission[] {
  const statuses: Mission['status'][] = ['todo', 'running', 'done', 'running', 'todo', 'done']
  return Array.from({ length: 8 }, (_, i) => {
    const bottles = faker.number.int({ min: 4, max: 36 })
    return {
      id: `MIS-${1000 + i}`,
      client: faker.company.name(),
      city: faker.location.city(),
      bottles,
      status: statuses[i % statuses.length],
      out: Math.round(bottles * faker.number.float({ min: 0.6, max: 1 })),
      inn: faker.number.int({ min: 0, max: bottles }),
    }
  })
}

const STATUS_CLS: Record<Mission['status'], string> = {
  todo: 'bg-slate-500 text-white',
  running: 'bg-sky-500 text-white',
  done: 'bg-emerald-600 text-white',
}

export function LivreurMissionsScreen() {
  const [missions, setMissions] = useState<Mission[]>(buildMissions)
  const [selectedId, setSelectedId] = useState(missions[0]?.id)
  const selected = missions.find((m) => m.id === selectedId) ?? missions[0]

  const done = missions.filter((m) => m.status === 'done').length
  const running = missions.filter((m) => m.status === 'running').length

  const markDone = (id: string) =>
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'done' as const } : m))
    )

  return (
    <main
      id='main-content'
      className='flex h-[calc(100vh-3.5rem)] flex-col space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <PageHeader
        title='Missions du jour'
        description='Liste des missions de tournée journalière et checkpoints à visiter.'
        actions={
          <div className='flex gap-2'>
            <Badge variant='outline' className='gap-1'>{running} en cours</Badge>
            <Badge variant='outline' className='gap-1'>{done}/{missions.length} terminées</Badge>
          </div>
        }
      />

      <div className='grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[22rem_1fr]'>
        <ScrollArea className='surface-card p-2'>
          <div className='space-y-2'>
            {missions.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={
                  'w-full rounded-xl border p-3 text-left transition-colors ' +
                  (m.id === selected?.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/60')
                }
              >
                <div className='flex items-center justify-between'>
                  <span className='flex items-center gap-2 text-sm font-medium'>
                    <ListChecks className='size-4 text-muted-foreground' />
                    {m.id}
                  </span>
                  <Badge className={STATUS_CLS[m.status]}>
                    {m.status === 'todo' ? 'À faire' : m.status === 'running' ? 'En cours' : 'Terminée'}
                  </Badge>
                </div>
                <p className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
                  <MapPin className='size-3' /> {m.client} · {m.city}
                </p>
                <p className='mt-1 text-xs'>
                  {m.bottles} bouteilles · {m.out} OUT / {m.inn} IN
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>

        {selected && (
          <Card className='flex flex-col overflow-hidden'>
            <CardHeader className='flex-row items-center justify-between space-y-0'>
              <div>
                <CardTitle className='text-base'>{selected.id}</CardTitle>
                <p className='text-xs text-muted-foreground'>
                  {selected.client} · {selected.city}
                </p>
              </div>
              <Badge className={STATUS_CLS[selected.status]}>
                {selected.status === 'todo' ? 'À faire' : selected.status === 'running' ? 'En cours' : 'Terminée'}
              </Badge>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col gap-4'>
              <div className='grid grid-cols-3 gap-3'>
                <Tile icon={PackageCheck} label='OUT (plein)' value={selected.out} />
                <Tile icon={PackageX} label='IN (vide)' value={selected.inn} />
                <Tile icon={ListChecks} label='Bouteilles' value={selected.bottles} />
              </div>

              <div className='surface-sunken p-4'>
                <p className='text-sm font-medium'>Détail commande</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Scanner les bouteilles pleines déposées (OUT) et vides récupérées (IN) au
                  moyen du PDA. La preuve photographique du BL est requise.
                </p>
              </div>

              <div className='mt-auto flex items-center justify-between border-t pt-3'>
                <span className='text-xs text-muted-foreground'>
                  {selected.status === 'done' ? 'Mission clôturée' : 'En attente de scan'}
                </span>
                {selected.status !== 'done' ? (
                  <div className='flex gap-2'>
                    <Button size='sm' variant='secondary' className='gap-2'>
                      <ScanLine className='size-4' /> Scanner
                    </Button>
                    <Button size='sm' className='gap-2' onClick={() => markDone(selected.id)}>
                      <CheckCircle2 className='size-4' /> Marquer terminé
                    </Button>
                  </div>
                ) : (
                  <Badge variant='outline'>Clôturée</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

function Tile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className='surface-sunken p-3'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon className='size-4' />
        {label}
      </div>
      <p className='mt-1 text-sm font-bold'>{value}</p>
    </div>
  )
}
