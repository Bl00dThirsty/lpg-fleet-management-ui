import { Radio, WifiOff, Activity } from 'lucide-react'
import { KpiTile } from '@/components/layout/page'
import type { IntegrateurKpis } from '../data/integrateur-dashboard'

export function KpiTiles({ kpis }: { kpis: IntegrateurKpis }) {
  return (
    <div className='grid gap-4 sm:grid-cols-3'>
      <KpiTile
        label='Total appareils'
        value={String(kpis.total)}
        icon={<Radio className='size-4 text-blue-600' />}
      />
      <KpiTile
        label='En mission'
        value={String(kpis.inMission)}
        icon={<Activity className='size-4 text-emerald-600' />}
      />
      <KpiTile
        label='Hors ligne'
        value={String(kpis.offline)}
        icon={<WifiOff className='size-4 text-rose-600' />}
      />
    </div>
  )
}
