import { useState } from 'react'
import type { DeliveryTour } from '@lpg/types'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@/components/ui/select'
import { buildDeliveryFlowSeries, type DeliveryFlowUnit } from '../data/delivery-flow'
const config = { planned: { label: 'À livrer', color: 'var(--chart-1)' }, delivered: { label: 'Livré', color: 'var(--chart-2)' } }
export function LpgDeliveryFlow({ tours }: { tours: DeliveryTour[] }) {
  const [unit, setUnit] = useState<DeliveryFlowUnit>('VRAC')
  const chartData = buildDeliveryFlowSeries(tours, unit)
  const suffix = unit === 'VRAC' ? 'TM' : 'btl'
  return <Card>
    <CardHeader className='flex flex-wrap items-start justify-between gap-3 sm:flex-row'>
      <div className='flex flex-col gap-1'><CardTitle>Planification et livraisons</CardTitle><CardDescription>Par date de départ prévue, sinon réelle · période et filtres sélectionnés</CardDescription></div>
      <Select value={unit} onValueChange={value => setUnit(value as DeliveryFlowUnit)}><SelectTrigger aria-label='Unité du graphique' className='w-48'><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value='VRAC'>Vrac (TM)</SelectItem><SelectItem value='BOUTEILLES50KG'>Bouteilles 50 kg (btl)</SelectItem></SelectGroup></SelectContent></Select>
    </CardHeader>
    <CardContent>
      <div className='mb-4 flex flex-wrap gap-6 text-sm'><span>À livrer : <strong>{chartData.reduce((n,p)=>n+p.planned,0).toLocaleString('fr-FR')} {suffix}</strong></span><span>Livré : <strong>{chartData.reduce((n,p)=>n+p.delivered,0).toLocaleString('fr-FR')} {suffix}</strong></span></div>
      {chartData.length ? <ChartContainer config={config} className='h-72 w-full'><BarChart data={chartData} accessibilityLayer><CartesianGrid vertical={false}/><XAxis dataKey='label' tickFormatter={v=>String(v).slice(5).split('-').reverse().join('/')} tickLine={false}/><YAxis tickFormatter={v=>v+' '+suffix} width={70}/><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey='planned' fill='var(--color-planned)' radius={[4,4,0,0]} maxBarSize={36}/><Bar dataKey='delivered' fill='var(--color-delivered)' radius={[4,4,0,0]} maxBarSize={36}/></BarChart></ChartContainer> : <p className='py-12 text-center text-sm text-muted-foreground'>Aucune tournée pour ce produit sur cette période.</p>}
    </CardContent>
  </Card>
}
