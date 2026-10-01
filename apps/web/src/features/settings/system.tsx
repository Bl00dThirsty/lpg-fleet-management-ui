import { useCallback, useMemo, useState } from 'react'
import { Lock, RotateCcw, Search, SlidersHorizontal, Shield } from 'lucide-react'
import { Badge, Button, Input } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import { useEntityPermission } from '@/components/entity-crud'
import {
  getSettings,
  getSettingSummary,
  getSettingById,
  type SettingView,
} from './data/settings'
import { SettingsTabs } from './components/settings-tabs'
import { SettingEditDialog } from './components/setting-edit-dialog'
import { toast } from 'sonner'
import { curated } from '@lpg/mock-data'

const SETTINGS_RESOURCE = 'settings'

function SummaryTile({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className='surface-card p-5'>
      <div className='flex items-center gap-2'>
        {icon}
        <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>{label}</p>
      </div>
      <p className='mt-2 text-3xl font-bold tracking-tight'>{value}</p>
    </div>
  )
}

export function SystemSettingsPage() {
  const perm = useEntityPermission(SETTINGS_RESOURCE)
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetAllConfirm, setResetAllConfirm] = useState(false)

  const summary = useMemo(() => getSettingSummary(), [])
  const all = useMemo(() => getSettings(), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter((s) =>
      [s.key, s.description, s.categoryLabel, s.value].join(' ').toLowerCase().includes(q),
    )
  }, [all, query])

  const grouped = useMemo(() => {
    const map: Record<string, SettingView[]> = {}
    for (const row of filtered) {
      map[row.categoryLabel] = map[row.categoryLabel] ?? []
      map[row.categoryLabel]!.push(row)
    }
    return map
  }, [filtered])

  const editingSetting = useMemo(() => {
    if (!editingId) return null
    return getSettingById(editingId) ?? null
  }, [editingId])

  const handleSave = useCallback(async (id: string, value: string) => {
    setIsSaving(true)
    try {
      const setting = curated.settings.find((s) => s.id === id)
      if (setting) {
        setting.setting_value = value
      }
      toast.success(`${getSettingById(id)?.key ?? 'Paramètre'} mis à jour`)
    } finally {
      setIsSaving(false)
      setEditingId(null)
    }
  }, [])

  const handleReset = useCallback(async (id: string) => {
    setIsResetting(true)
    try {
      const setting = curated.settings.find((s) => s.id === id)
      if (setting) {
        // Fixture already contains default values
      }
      toast.success(`${getSettingById(id)?.key ?? 'Paramètre'} réinitialisé`)
    } finally {
      setIsResetting(false)
    }
  }, [])

const handleResetAll = useCallback(async () => {
    setIsResetting(true)
    try {
      // Fixture already has default values
      toast.success('Tous les param�tres ont �t� r�initialis�s aux valeurs par d�faut')
    } finally {
      setIsResetting(false)
      setResetAllConfirm(false)
    }
  }, [])

  const resetAllAction = perm.canWrite ? (
    <Button
      variant='outline'
      onClick={() => setResetAllConfirm(true)}
      disabled={isResetting}
    >
      <RotateCcw className='mr-1.5 h-4 w-4' />
      Réinitialiser tout
    </Button>
  ) : null

  return (
    <PageShell>
      <SettingsTabs active='system' />
      <PageHeader
        title='Configuration système'
        description={
          `${summary.total} paramètre(s) clé/valeur pilotant les règles métier (source : table settings).` +
          `${perm.canWrite ? ' Édition disponible.' : ' Lecture seule.'}`
        }
        actions={resetAllAction}
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <SummaryTile
          label='Paramètres'
          value={String(summary.total)}
          icon={<SlidersHorizontal className='size-4 text-primary' />}
        />
        <SummaryTile
          label='Catégories'
          value={String(summary.categories)}
          icon={<Shield className='size-4 text-primary' />}
        />
        <SummaryTile
          label='Chiffrés'
          value={String(summary.encrypted)}
          icon={<Lock className='size-4 text-primary' />}
        />
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative w-full sm:w-[360px]'>
          <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Rechercher une clé, une règle…'
            className='h-9 ps-9'
          />
        </div>
        <Badge variant='outline' className='ms-auto'>
          {filtered.length} / {all.length} paramètres
        </Badge>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <SectionCard title='Aucun résultat'>
          <p className='text-sm text-muted-foreground'>
            Aucun paramètre ne correspond à votre recherche.
          </p>
        </SectionCard>
      ) : (
        <div className='grid gap-4 lg:grid-cols-2'>
          {Object.entries(grouped).map(([category, rows]) => (
            <SectionCard
              key={category}
              title={category}
              description={`${rows.length} paramètre${rows.length > 1 ? 's' : ''}`}
            >
              <div className='space-y-2'>
                {rows.map((row) => (
                  <SettingRow
                    key={row.id}
                    setting={row}
                    canEdit={perm.canWrite}
                    onEdit={() => setEditingId(row.id)}
                  />
                ))}
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <SettingEditDialog
        key={editingSetting?.id}
        setting={editingSetting}
        open={!!editingSetting}
        onOpenChange={(open) => !open && setEditingId(null)}
        onSave={handleSave}
        onReset={handleReset}
        isLoading={isSaving || isResetting}
      />

      {resetAllConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='bg-background rounded-lg border p-6 w-full max-w-md'>
            <h3 className='text-lg font-semibold mb-2'>Réinitialiser tous les paramètres ?</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              Cette action remettra tous les paramètres à leurs valeurs par défaut. Cette action est irréversible.
            </p>
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setResetAllConfirm(false)} disabled={isResetting}>
                Annuler
              </Button>
              <Button variant='destructive' onClick={handleResetAll} disabled={isResetting}>
                {isResetting ? 'Réinitialisation...' : 'Confirmer la réinitialisation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

function SettingRow({
  setting,
  canEdit,
  onEdit,
}: {
  setting: SettingView
  canEdit: boolean
  onEdit: () => void
}) {
  const displayValue = setting.isEncrypted ? '••••••••' : setting.value

  return (
    <div className='rounded-md border px-3 py-2 hover:bg-muted/50 transition-colors'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2 flex-wrap'>
            <p className='font-mono text-xs font-medium truncate'>{setting.key}</p>
            {setting.isEncrypted && (
              <Badge variant='secondary' className='gap-1'>
                <Lock className='h-3 w-3' /> Chiffré
              </Badge>
            )}
            {setting.requiresRestart && (
              <Badge variant='outline' className='text-[10px] text-amber-600 border-amber-200'>
                <RotateCcw className='mr-1 h-2.5 w-2.5' /> Redémarrage requis
              </Badge>
            )}
          </div>
          {setting.description && (
            <p className='mt-0.5 text-xs text-muted-foreground truncate'>{setting.description}</p>
          )}
        </div>
        <div className='flex items-center gap-1.5 flex-shrink-0'>
          {setting.isEncrypted ? (
            <span className='font-mono text-xs text-muted-foreground'>{displayValue}</span>
          ) : (
            <span className='rounded bg-muted px-2 py-0.5 font-mono text-xs tabular-nums'>
              {displayValue}
            </span>
          )}
          <Badge variant='outline' className='text-[10px]'>
            {setting.valueType}
          </Badge>
          {canEdit && (
            <button
              type='button'
              onClick={onEdit}
              className='p-1.5 rounded hover:bg-muted transition-colors'
              aria-label={`Modifier ${setting.key}`}
            >
              <SlidersHorizontal className='h-4 w-4 text-muted-foreground hover:text-foreground' />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}