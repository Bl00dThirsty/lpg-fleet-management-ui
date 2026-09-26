import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Info, Lock, Pencil, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@lpg/ui'
import { curated } from '@lpg/mock-data'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import { useEntityPermission } from '@/components/entity-crud'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { LongText } from '@/components/long-text'
import { runMutation } from '@/hooks/use-toast-feedback'
import { SettingsTabs } from './components/settings-tabs'
import { SettingEditDialog } from './components/setting-edit-dialog'
import {
  captureSettingSnapshot,
  filterSettings,
  getSettingRestorePlan,
  getSettingSearchText,
  getSettings,
  type SettingView,
} from './data/settings'

const SETTINGS_RESOURCE = 'settings'
const ALL_FILTERS = 'ALL'

export function SystemSettingsPage() {
  const { t } = useTranslation('common')
  const perm = useEntityPermission(SETTINGS_RESOURCE)
  const [initialSnapshot] = useState(() => captureSettingSnapshot(getSettings()))
  const [rows, setRows] = useState(() => getSettings())
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL_FILTERS)
  const [valueType, setValueType] = useState(ALL_FILTERS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetAllConfirm, setResetAllConfirm] = useState(false)
  const [operationError, setOperationError] = useState(false)

  const all = useMemo(
    () =>
      rows.map((setting) => {
        const localizedTitle = t(setting.titleKey, { defaultValue: setting.key })
        return {
          ...setting,
          searchText: getSettingSearchText(setting, localizedTitle),
        }
      }),
    [rows, t],
  )
  const filtered = useMemo(
    () => filterSettings(all, { query, category, valueType }),
    [all, category, query, valueType],
  )
  const grouped = useMemo(() => {
    const groups = new Map<string, SettingView[]>()
    for (const row of filtered) {
      const label = t(`settings.categories.${row.category}`, { defaultValue: row.category })
      groups.set(label, [...(groups.get(label) ?? []), row])
    }
    return groups
  }, [filtered, t])
  const categories = useMemo(
    () => Array.from(new Set(all.map((row) => row.category))).sort(),
    [all],
  )
  const valueTypes = useMemo(
    () => Array.from(new Set(all.map((row) => row.valueType))).sort(),
    [all],
  )
  const restartCount = all.filter((row) => row.requiresRestart).length
  const restartPendingCount = all.filter(
    (row) => row.requiresRestart && initialSnapshot[row.id] !== row.value,
  ).length
  const restorePlan = useMemo(
    () => getSettingRestorePlan(initialSnapshot, all),
    [all, initialSnapshot],
  )
  const editingSetting = editingId ? all.find((row) => row.id === editingId) ?? null : null

  const clearFilters = useCallback(() => {
    setQuery('')
    setCategory(ALL_FILTERS)
    setValueType(ALL_FILTERS)
  }, [])

  const handleSave = useCallback(
    async (id: string, value: string) => {
      setIsSaving(true)
      setOperationError(false)
      const result = await runMutation(
        async () => {
          const setting = curated.settings.find((item) => item.id === id)
          if (!setting) throw new Error(t('settings.errors.notFound'))
          setting.setting_value = value
          setRows(getSettings())
        },
        t('settings.save.success', {
          key: getSettings().find((item) => item.id === id)?.key ?? id,
        }),
      )
      setIsSaving(false)
      if (!result.ok) setOperationError(true)
      return result.ok
    },
    [t],
  )

  const handleResetAll = useCallback(async () => {
    setIsResetting(true)
    setOperationError(false)
    const current = getSettings()
    const plan = getSettingRestorePlan(initialSnapshot, current)
    const result = await runMutation(
      async () => {
        for (const [id, value] of Object.entries(plan.values)) {
          const setting = curated.settings.find((item) => item.id === id)
          if (!setting) throw new Error(t('settings.errors.notFound'))
          setting.setting_value = value
        }
        setRows(getSettings())
      },
      t('settings.resetAll.successCount', { count: plan.affectedCount }),
    )
    setIsResetting(false)
    if (!result.ok) {
      setOperationError(true)
      return false
    }
    setResetAllConfirm(false)
    return true
  }, [initialSnapshot, t])

  return (
    <PageShell>
      <PageHeader
        title={t('settings.system.title')}
        description={t('settings.system.description')}
        actions={
          <Badge variant={perm.canWrite ? 'secondary' : 'outline'}>
            {perm.canWrite ? t('settings.access.editable') : t('settings.access.readOnly')}
          </Badge>
        }
      />
      <SettingsTabs />

      <section
        aria-label={t('settings.context.label')}
        className='flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card px-4 py-3'
      >
        <ContextMetric label={t('settings.context.total')} value={all.length} />
        <Separator orientation='vertical' className='hidden h-5 sm:block' />
        <ContextMetric
          label={t('settings.context.results')}
          value={filtered.length}
          ariaLive
        />
        <Separator orientation='vertical' className='hidden h-5 sm:block' />
        <ContextMetric label={t('settings.context.restart')} value={restartCount} />
        <Badge variant='outline' className='ms-auto'>
          {perm.canWrite ? t('settings.access.editable') : t('settings.access.readOnly')}
        </Badge>
      </section>

      <Alert>
        <SlidersHorizontal />
        <AlertTitle>{t('settings.source.title')}</AlertTitle>
        <AlertDescription>{t(perm.canWrite ? 'settings.source.editable' : 'settings.source.readOnly')}</AlertDescription>
      </Alert>

      {restartPendingCount > 0 && (
        <Alert>
          <RotateCcw />
          <AlertTitle>{t('settings.restart.title')}</AlertTitle>
          <AlertDescription>{t('settings.restart.description', { count: restartPendingCount })}</AlertDescription>
        </Alert>
      )}

      {operationError && (
        <Alert variant='destructive'>
          <Info />
          <AlertTitle>{t('settings.errors.title')}</AlertTitle>
          <AlertDescription>{t('settings.errors.operation')}</AlertDescription>
        </Alert>
      )}

      <div className='grid gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(180px,240px)_minmax(160px,220px)]'>
        <div className='relative'>
          <label htmlFor='settings-search' className='sr-only'>
            {t('settings.search.label')}
          </label>
          <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            id='settings-search'
            type='search'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('settings.search.placeholder')}
            className='ps-9 pe-9'
          />
          {query && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='absolute end-1 top-1/2 -translate-y-1/2'
              onClick={() => setQuery('')}
              aria-label={t('settings.search.clear')}
            >
              <X />
            </Button>
          )}
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label={t('settings.filters.category')} className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL_FILTERS}>{t('settings.filters.allCategories')}</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(`settings.categories.${item}`, { defaultValue: item })}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={valueType} onValueChange={setValueType}>
          <SelectTrigger aria-label={t('settings.filters.valueType')} className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL_FILTERS}>{t('settings.filters.allTypes')}</SelectItem>
              {valueTypes.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(`settings.types.${item.toLowerCase()}`)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <p aria-live='polite' className='text-sm text-muted-foreground'>
        {t('settings.search.results', { count: filtered.length, total: all.length })}
      </p>

      {all.length === 0 ? (
        <Alert>
          <Info />
          <AlertTitle>{t('settings.empty.title')}</AlertTitle>
          <AlertDescription>{t('settings.empty.description')}</AlertDescription>
        </Alert>
      ) : filtered.length === 0 ? (
        <Alert>
          <Info />
          <AlertTitle>{t('settings.filteredEmpty.title')}</AlertTitle>
          <AlertDescription className='flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <span>{t('settings.filteredEmpty.description')}</span>
            <Button type='button' variant='outline' size='sm' onClick={clearFilters}>
              {t('settings.filters.clear')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className='grid items-start gap-4 xl:grid-cols-2'>
          {Array.from(grouped.entries()).map(([label, rows]) => (
            <SectionCard
              key={label}
              title={label}
              description={t('settings.group.count', { count: rows.length })}
              bodyClassName='p-0'
            >
              <div className='divide-y'>
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

      {perm.canWrite && (
        <section aria-labelledby='settings-danger-zone' className='rounded-lg border border-destructive/40 bg-card p-4 sm:p-5'>
          <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div className='flex max-w-2xl flex-col gap-1'>
              <h2 id='settings-danger-zone' className='text-base font-semibold'>
                {t('settings.danger.title')}
              </h2>
              <p className='text-sm text-muted-foreground'>
                {t('settings.danger.description', { count: restorePlan.affectedCount })}
              </p>
            </div>
            <Button
              type='button'
              variant='destructive'
              onClick={() => setResetAllConfirm(true)}
              disabled={isResetting || restorePlan.affectedCount === 0}
              aria-busy={isResetting || undefined}
            >
              <RotateCcw data-icon='inline-start' />
              {isResetting ? t('settings.resetAll.pending') : t('settings.resetAll.button')}
            </Button>
          </div>
        </section>
      )}

      <SettingEditDialog
        key={editingSetting?.id}
        setting={editingSetting}
        open={Boolean(editingSetting)}
        onOpenChange={(open) => {
          if (!open) setEditingId(null)
        }}
        onSave={handleSave}
        isLoading={isSaving}
      />

      <ConfirmDialog
        open={resetAllConfirm}
        onOpenChange={(open) => {
          if (!isResetting) setResetAllConfirm(open)
        }}
        title={t('settings.resetAll.title')}
        desc={t('settings.resetAll.description', { count: restorePlan.affectedCount })}
        confirmText={t('settings.resetAll.confirm')}
        cancelBtnText={t('action.cancel')}
        destructive
        isLoading={isResetting}
        handleConfirm={() => void handleResetAll()}
      />
    </PageShell>
  )
}

function ContextMetric({
  label,
  value,
  ariaLive = false,
}: {
  label: string
  value: number
  ariaLive?: boolean
}) {
  return (
    <div className='flex items-baseline gap-1.5'>
      <span className='text-sm font-semibold tabular-nums' aria-live={ariaLive ? 'polite' : undefined}>
        {value}
      </span>
      <span className='text-xs text-muted-foreground'>{label}</span>
    </div>
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
  const { t } = useTranslation('common')
  const localizedTitle = t(setting.titleKey, { defaultValue: setting.key })
  const description = t(setting.descriptionKey, { defaultValue: setting.description })
  const category = t(`settings.categories.${setting.category}`, { defaultValue: setting.category })
  const type = t(`settings.types.${setting.valueType.toLowerCase()}`)
  const range = t('settings.info.range', {
    min: setting.minValue ?? t('settings.info.none'),
    max: setting.maxValue ?? t('settings.info.none'),
  })

  return (
    <article className='flex flex-col gap-3 p-4 sm:p-5'>
      <div className='flex min-w-0 flex-col gap-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <h3 className='text-sm font-semibold'>{localizedTitle}</h3>
          <Badge variant='outline'>{category}</Badge>
          <Badge variant='secondary'>{type}</Badge>
          {setting.isEncrypted && (
            <Badge variant='outline'>
              <Lock data-icon='inline-start' />
              {t('settings.badges.encrypted')}
            </Badge>
          )}
          {setting.requiresRestart && (
            <Badge variant='outline'>
              <RotateCcw data-icon='inline-start' />
              {t('settings.badges.restart')}
            </Badge>
          )}
        </div>
        <code className='break-all text-xs text-muted-foreground'>{setting.key}</code>
        <LongText className='max-w-3xl text-sm text-muted-foreground'>{description}</LongText>
      </div>

      <div className='flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center'>
        <div className='min-w-0'>
          <span className='sr-only'>{t('settings.row.currentValue')}</span>
          <p className='truncate font-mono text-sm tabular-nums'>
            {setting.isEncrypted ? '••••••••' : setting.value || t('settings.row.emptyValue')}
          </p>
        </div>
        <div className='flex items-center gap-1'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label={t('settings.info.button', { key: setting.key })}
              >
                <Info />
              </Button>
            </TooltipTrigger>
            <TooltipContent className='max-w-80'>
              {t('settings.info.snapshot')}
              {setting.isEncrypted && ` ${t('settings.info.encrypted')}`}
              {setting.requiresRestart && ` ${t('settings.info.restart')}`}
              {(setting.minValue !== null || setting.maxValue !== null) && ` ${range}`}
            </TooltipContent>
          </Tooltip>
          {canEdit && (
            <Button type='button' variant='outline' size='sm' onClick={onEdit}>
              <Pencil data-icon='inline-start' />
              {t('settings.row.edit')}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
