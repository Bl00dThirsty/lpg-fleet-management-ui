import { useMemo, useState } from 'react'
import { Lock, RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import { Badge, Input } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import { getSettingSummary, getSettings, type SettingView } from './data/settings'
import { SettingsTabs } from './components/settings-tabs'

export function SettingsPage() {
  const summary = useMemo(() => getSettingSummary(), [])
  const allSettings = useMemo(() => getSettings(), [])
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allSettings
    return allSettings.filter((s) =>
      [s.key, s.description, s.categoryLabel, s.value].join(' ').toLowerCase().includes(q),
    )
  }, [allSettings, query])

  const grouped = useMemo(() => {
    const map: Record<string, SettingView[]> = {}
    for (const row of filtered) {
      map[row.categoryLabel] = map[row.categoryLabel] ?? []
      map[row.categoryLabel]!.push(row)
    }
    return map
  }, [filtered])

  return (
    <PageShell>
      <SettingsTabs active='settings' />
      <PageHeader
        title='Paramètres globaux'
        description='Règles métier pilotées par configuration (source unique : table settings).'
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <SummaryTile label='Paramètres' value={String(summary.total)} />
        <SummaryTile label='Catégories' value={String(summary.categories)} />
        <SummaryTile label='Chiffrés' value={String(summary.encrypted)} />
      </div>

      <div className='relative w-full sm:w-[360px]'>
        <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Rechercher un paramètre, une règle…'
          className='h-9 ps-9'
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        {Object.entries(grouped).map(([category, rows]) => (
          <SectionCard
            key={category}
            title={category}
            description={`${rows.length} paramètre${rows.length > 1 ? 's' : ''}`}
          >
            <div className='space-y-2'>
              {rows.map((row) => (
                <SettingRow key={row.key} setting={row} />
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
    </PageShell>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className='surface-card p-5'>
      <div className='flex items-center gap-2'>
        <SlidersHorizontal className='size-4 text-primary' />
        <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>{label}</p>
      </div>
      <p className='mt-2 text-3xl font-bold tracking-tight'>{value}</p>
    </div>
  )
}

function SettingRow({ setting }: { setting: SettingView }) {
  return (
    <div className='rounded-md border px-3 py-2'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='min-w-0'>
          <p className='font-mono text-xs font-medium'>{setting.key}</p>
          {setting.description && (
            <p className='mt-0.5 text-xs text-muted-foreground'>{setting.description}</p>
          )}
        </div>
        <div className='flex items-center gap-1.5'>
          {setting.isEncrypted ? (
            <Badge variant='secondary'>
              <Lock className='mr-1 size-3' /> Chiffré
            </Badge>
          ) : (
            <span className='rounded bg-muted px-1.5 py-0.5 font-mono text-xs tabular-nums'>
              {setting.value}
            </span>
          )}
          <Badge variant='outline' className='text-[10px]'>
            {setting.valueType}
          </Badge>
        </div>
      </div>
      {setting.requiresRestart && (
        <div className='mt-1.5 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400'>
          <RotateCcw className='size-3' /> Redémarrage requis
        </div>
      )}
    </div>
  )
}
