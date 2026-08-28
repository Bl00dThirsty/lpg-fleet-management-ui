import { useState } from 'react'
import { Gauge } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  type RiskScoreView,
  type RiskLevel,
  riskDetailLabel,
  riskEntityLabels,
} from '../data/risk-scores'

const LEVEL_CLASS: Record<RiskLevel, string> = {
  FAIBLE: 'bg-slate-200 text-slate-800',
  MODERE: 'bg-amber-100 text-amber-900',
  ELEVE: 'bg-orange-500 text-white',
  CRITIQUE: 'bg-rose-600 text-white',
  CRITIQUEEXTREME: 'bg-rose-900 text-white',
}

export function RiskDetailSheet({
  risk,
  open,
  onOpenChange,
}: {
  risk: RiskScoreView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
        {risk ? <RiskDetailBody risk={risk} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function RiskDetailBody({ risk }: { risk: RiskScoreView }) {
  const [showAll, setShowAll] = useState(false)
  const entries = Object.entries(risk.details ?? {}).filter(
    ([, value]) => typeof value === 'number' || typeof value === 'string',
  )
  const visible = showAll ? entries : entries.slice(0, 6)

  return (
    <div className='space-y-4'>
      <SheetHeader>
        <div className='flex items-center justify-between gap-2'>
          <SheetTitle className='text-lg'>{risk.entity_name}</SheetTitle>
          <Badge className={LEVEL_CLASS[risk.level]}>{risk.level_label}</Badge>
        </div>
        <SheetDescription>
          {riskEntityLabels[risk.entity_type]} · Période du {risk.period}
        </SheetDescription>
      </SheetHeader>

      <div className='grid grid-cols-2 gap-3'>
        <Card>
          <CardHeader className='pb-1'>
            <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Gauge className='size-4 text-primary' />
              Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold tabular-nums'>{risk.score}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-1'>
            <CardTitle className='text-sm text-muted-foreground'>Modèle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='font-mono text-sm'>{risk.model_version}</p>
            <p className='mt-1 text-xs text-muted-foreground'>
              MAJ {new Date(risk.updated_at).toLocaleDateString('fr-FR')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div>
        <h4 className='mb-2 text-sm font-semibold'>Facteurs de risque</h4>
        {visible.length === 0 ? (
          <p className='text-sm text-muted-foreground'>Aucun facteur détaillé.</p>
        ) : (
          <ul className='space-y-2'>
            {visible.map(([key, value]) => (
              <li
                key={key}
                className='flex items-center justify-between gap-2 rounded-lg border px-3 py-2'
              >
                <span className='text-sm'>{riskDetailLabel(key)}</span>
                <span className='font-mono text-sm tabular-nums'>{String(value)}</span>
              </li>
            ))}
          </ul>
        )}
        {entries.length > 6 && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='mt-2'
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? 'Réduire' : `Afficher les ${entries.length - 6} autres facteurs`}
          </Button>
        )}
      </div>
    </div>
  )
}