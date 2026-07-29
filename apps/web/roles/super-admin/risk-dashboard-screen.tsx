import { useMemo } from 'react'
import { ShieldAlert, TrendingUp, Users, Building2, Truck, MapPin } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts'
import { PageShell, KpiTile } from '@/components/layout/page'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import { seeds } from '@lpg/mock-data'

const riskSeeds = (seeds as any).risks ?? []
const riskLevelColor: Record<string, string> = {
  FAIBLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  MODERE: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  ELEVE: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  CRITIQUE: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  CRITIQUE_EXTREME: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
}
const riskLevelLabel: Record<string, string> = {
  FAIBLE: 'Faible', MODERE: 'Modéré', ELEVE: 'Élevé', CRITIQUE: 'Critique', CRITIQUE_EXTREME: 'Extrême',
}

const entityIcons: Record<string, typeof Building2> = {
  MARKETEUR: Building2, TRANSPORTEUR: Truck, LIVREUR: Users, SITE: MapPin, TOURNEE: TrendingUp,
}
const entityLabels: Record<string, string> = {
  MARKETEUR: 'Marketeur', TRANSPORTEUR: 'Transporteur', LIVREUR: 'Livreur', SITE: 'Site', TOURNEE: 'Tournée',
}

const historyData = [
  { date: 'Jan', Marketeurs: 42, Transporteurs: 35, Sites: 28, Livreurs: 18 },
  { date: 'Fév', Marketeurs: 38, Transporteurs: 32, Sites: 30, Livreurs: 20 },
  { date: 'Mar', Marketeurs: 45, Transporteurs: 38, Sites: 25, Livreurs: 22 },
  { date: 'Avr', Marketeurs: 52, Transporteurs: 30, Sites: 32, Livreurs: 19 },
  { date: 'Mai', Marketeurs: 48, Transporteurs: 42, Sites: 35, Livreurs: 24 },
  { date: 'Juin', Marketeurs: 55, Transporteurs: 45, Sites: 38, Livreurs: 21 },
  { date: 'Juil', Marketeurs: 50, Transporteurs: 40, Sites: 33, Livreurs: 25 },
]

export function SuperAdminRiskDashboardScreen() {
  const stats = useMemo(() => ({
    total: riskSeeds.length,
    critical: riskSeeds.filter((r: any) => r.level === 'CRITIQUE' || r.level === 'CRITIQUE_EXTREME').length,
    avgScore: Math.round(riskSeeds.reduce((s: number, r: any) => s + (r.score ?? 0), 0) / (riskSeeds.length || 1)),
    trendUp: riskSeeds.filter((r: any) => r.level === 'CRITIQUE' || r.level === 'ELEVE').length > 3,
  }), [])

  const entityBreakdown = useMemo(() => {
    const map = new Map<string, { entityType: string; count: number; avgScore: number; totalScore: number }>()
    for (const r of riskSeeds as any[]) {
      const key = r.entityType
      const entry = map.get(key) ?? { entityType: key, count: 0, avgScore: 0, totalScore: 0 }
      entry.count++
      entry.totalScore += r.score ?? 0
      map.set(key, entry)
    }
    return Array.from(map.values()).map((e) => ({ ...e, avgScore: Math.round(e.totalScore / e.count) }))
  }, [])

  return (
    <PageShell>
      <div className='flex items-center gap-3'>
        <div className='flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'>
          <ShieldAlert className='size-5' />
        </div>
        <div>
          <h1 className='text-xl font-bold tracking-tight'>Scores de Risque</h1>
          <p className='text-sm text-muted-foreground'>Évaluation continue par entité — Modèle v3, fenêtre glissante 30 jours</p>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <KpiTile label='Entités surveillées' value={String(stats.total)} icon={<Building2 className='size-3.5' />} />
        <KpiTile label='Critiques' value={String(stats.critical)} delta={stats.critical > 0 ? `${stats.critical} actifs` : undefined} trend='down' icon={<ShieldAlert className='size-3.5 text-rose-500' />} />
        <KpiTile label='Score moyen' value={`${stats.avgScore}/100`} icon={<TrendingUp className='size-3.5' />} />
        <KpiTile label='Tendance' value={stats.trendUp ? '↑ Hausse' : '→ Stable'} icon={<TrendingUp className='size-3.5' />} />
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Évolution des scores (30 jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={280}>
              <AreaChart data={historyData}>
                <defs>
                  {[{ id: 'c1', color: '#3b82f6' }, { id: 'c2', color: '#f59e0b' }, { id: 'c3', color: '#10b981' }, { id: 'c4', color: '#8b5cf6' }].map((c) => (
                    <linearGradient key={c.id} id={c.id} x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor={c.color} stopOpacity={0.3} />
                      <stop offset='95%' stopColor={c.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray='3 3' className='stroke-muted/40' />
                <XAxis dataKey='date' tick={{ fontSize: 12 }} className='text-muted-foreground' />
                <YAxis tick={{ fontSize: 12 }} className='text-muted-foreground' />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                />
                <Area type='monotone' dataKey='Marketeurs' stroke='#3b82f6' fill='url(#c1)' strokeWidth={2} />
                <Area type='monotone' dataKey='Transporteurs' stroke='#f59e0b' fill='url(#c2)' strokeWidth={2} />
                <Area type='monotone' dataKey='Sites' stroke='#10b981' fill='url(#c3)' strokeWidth={2} />
                <Area type='monotone' dataKey='Livreurs' stroke='#8b5cf6' fill='url(#c4)' strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Score moyen par type d&apos;entité</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={280}>
              <BarChart data={entityBreakdown}>
                <CartesianGrid strokeDasharray='3 3' className='stroke-muted/40' />
                <XAxis dataKey='entityType' tick={{ fontSize: 12 }} tickFormatter={(v) => entityLabels[v] ?? v} className='text-muted-foreground' />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} className='text-muted-foreground' />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                  formatter={(value: number) => [`${value}/100`, 'Score']}
                  labelFormatter={(label: string) => entityLabels[label] ?? label}
                />
                <Bar dataKey='avgScore' radius={[6, 6, 0, 0]} fill='#3b82f6' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Détail des entités à risque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b text-left text-muted-foreground'>
                  <th className='pb-3 font-medium'>Entité</th>
                  <th className='pb-3 font-medium'>Type</th>
                  <th className='pb-3 font-medium'>Score</th>
                  <th className='pb-3 font-medium'>Niveau</th>
                  <th className='pb-3 font-medium'>Modèle</th>
                  <th className='pb-3 font-medium'>Période</th>
                  <th className='pb-3 font-medium'>Détails</th>
                </tr>
              </thead>
              <tbody>
                {(riskSeeds as any[]).map((r: any) => {
                  const EntityIcon = entityIcons[r.entityType] ?? Building2
                  return (
                    <tr key={r.id} className='border-b last:border-0 hover:bg-muted/30'>
                      <td className='py-3'>
                        <div className='flex items-center gap-2'>
                          <EntityIcon className='size-4 text-muted-foreground' />
                          <span className='font-medium'>{r.entityId}</span>
                        </div>
                      </td>
                      <td className='py-3 text-muted-foreground'>{entityLabels[r.entityType] ?? r.entityType}</td>
                      <td className='py-3'>
                        <div className='flex items-center gap-2'>
                          <div className='h-2 w-16 overflow-hidden rounded-full bg-muted'>
                            <div
                              className='h-full rounded-full transition-all'
                              style={{ width: `${r.score}%`, backgroundColor: r.level === 'CRITIQUE' || r.level === 'CRITIQUE_EXTREME' ? '#e11d48' : r.level === 'ELEVE' ? '#f59e0b' : r.level === 'MODERE' ? '#3b82f6' : '#10b981' }}
                            />
                          </div>
                          <span className='tabular-nums font-medium'>{r.score}/100</span>
                        </div>
                      </td>
                      <td className='py-3'>
                        <Badge className={riskLevelColor[r.level] ?? 'bg-muted text-muted-foreground'} variant='secondary'>
                          {riskLevelLabel[r.level] ?? r.level}
                        </Badge>
                      </td>
                      <td className='py-3 text-xs text-muted-foreground font-mono'>{r.modelVersion}</td>
                      <td className='py-3 text-xs text-muted-foreground'>
                        {r.periodStart?.slice(0, 10)} → {r.periodEnd?.slice(0, 10)}
                      </td>
                      <td className='py-3 text-xs text-muted-foreground'>
                        {r.details ? Object.entries(r.details).slice(0, 3).map(([k, v]) => (
                          <span key={k} className='mr-2 rounded bg-muted px-1.5 py-0.5'>{k}: {String(v)}</span>
                        )) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
