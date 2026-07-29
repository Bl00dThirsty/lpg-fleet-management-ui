import { useMemo } from 'react'
import { TriangleAlert, CheckCircle2 } from 'lucide-react'
import { faker } from '@faker-js/faker'
import { PageHeader } from '@/components/layout/page-header'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'

faker.seed(331)

type Row = {
  marketer: string
  declared: number
  scanned: number
  ecart: number
  status: 'ok' | 'watch' | 'fraud'
}

function buildRows(): Row[] {
  return Array.from({ length: 14 }, () => {
    const declared = faker.number.int({ min: 5000, max: 60000 })
    const diff = faker.number.int({ min: -4000, max: 4000 })
    const scanned = declared - diff
    const ecartPct = Math.abs(diff) / declared
    const status: Row['status'] =
      ecartPct > 0.08 ? 'fraud' : ecartPct > 0.03 ? 'watch' : 'ok'
    return {
      marketer: faker.company.name(),
      declared,
      scanned,
      ecart: diff,
      status,
    }
  })
}

export function AgentDeclarationsScreen() {
  const rows = useMemo(() => buildRows(), [])
  const fraud = rows.filter((r) => r.status === 'fraud').length
  const watch = rows.filter((r) => r.status === 'watch').length

  return (
    <PageShell>
      <PageHeader
        title='Déclarations à valider'
        description='Confrontation automatique déclarations vs données PDA (preuve contradictoire).'
        actions={
          <div className='flex gap-2'>
            <Badge variant='outline' className='gap-1 border-rose-500/40 text-rose-600'>
              <TriangleAlert className='size-3.5' /> {fraud} fraudes
            </Badge>
            <Badge variant='outline' className='gap-1'>
              <TriangleAlert className='size-3.5' /> {watch} à surveiller
            </Badge>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Écarts par marketer</CardTitle>
        </CardHeader>
        <CardContent className='divide-y'>
          {rows.map((r, i) => {
            const max = Math.max(r.declared, r.scanned)
            const ecartPct = ((r.ecart / r.declared) * 100).toFixed(1)
            const badge =
              r.status === 'fraud'
                ? 'bg-rose-600 text-white'
                : r.status === 'watch'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
            return (
              <div key={i} className='py-3'>
                <div className='flex items-center justify-between gap-3'>
                  <span className='truncate text-sm font-medium'>{r.marketer}</span>
                  <Badge className={badge}>
                    {r.status === 'fraud'
                      ? 'Écart anormal'
                      : r.status === 'watch'
                        ? 'À investiguer'
                        : 'Conforme'}
                  </Badge>
                </div>
                <div className='mt-2 space-y-1'>
                  <Bar label='Déclaré' value={r.declared} max={max} cls='bg-slate-400' />
                  <Bar
                    label='Scanné'
                    value={r.scanned}
                    max={max}
                    cls='bg-primary'
                  />
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Écart : {r.ecart > 0 ? '+' : ''}
                  {r.ecart.toLocaleString('fr-FR')} kg ({ecartPct}%)
                </p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className='flex justify-end'>
        <Button variant='outline' className='gap-2'>
          <CheckCircle2 className='size-4' /> Valider les déclarations conformes
        </Button>
      </div>
    </PageShell>
  )
}

function Bar({
  label,
  value,
  max,
  cls,
}: {
  label: string
  value: number
  max: number
  cls: string
}) {
  return (
    <div className='flex items-center gap-2'>
      <span className='w-16 shrink-0 text-xs text-muted-foreground'>{label}</span>
      <div className='h-2 flex-1 overflow-hidden rounded-full bg-muted'>
        <div className={`h-full ${cls}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className='w-20 shrink-0 text-right text-xs tabular-nums'>
        {value.toLocaleString('fr-FR')}
      </span>
    </div>
  )
}

