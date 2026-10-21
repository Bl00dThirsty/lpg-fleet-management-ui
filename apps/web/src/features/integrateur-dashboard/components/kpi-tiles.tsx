import { Radio, WifiOff, CheckCircle2 } from 'lucide-react'
import { KpiTile } from '@/components/layout/page'
import type { IntegrateurKpis } from '../lib/integrateur-dashboard'

export function KpiTiles({ kpis }: { kpis: IntegrateurKpis }) {
  return (
    <div className='grid gap-4 sm:grid-cols-3'>
      <KpiTile label='Total appareils' value={String(kpis.total)} icon={<Radio className='size-4 text-blue-600' />} />
      <KpiTile label='Opérationnels' value={String(kpis.operational)} icon={<CheckCircle2 className='size-4 text-emerald-600' />} />
      <KpiTile label='Hors ligne' value={String(kpis.offline)} icon={<WifiOff className='size-4 text-rose-600' />} />
    </div>
  )
}
