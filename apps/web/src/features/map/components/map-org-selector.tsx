import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Building2, Truck, Users, X, Search } from 'lucide-react'
import { curated } from '@lpg/mock-data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { getOrgRegionOptions, type OrgRegionOption } from '@/features/map/data/national-map'
import type { UserScope } from '@/features/scope/scope'
import lpgSphereUrl from '@/assets/lpg-sphere.png'

type OrgType = 'MARKETEUR' | 'TRANSPORTEUR' | 'CLIENT' | 'DEPOT' | 'REGULATEUR'

const TYPE_LABEL: Record<OrgType, string> = {
  MARKETEUR: 'Marketeurs',
  TRANSPORTEUR: 'Transporteurs',
  CLIENT: 'Clients',
  DEPOT: 'Dépôts',
  REGULATEUR: 'Régulateur',
}

const TYPE_ICON: Record<OrgType, typeof Building2> = {
  MARKETEUR: Building2,
  TRANSPORTEUR: Truck,
  CLIENT: Users,
  DEPOT: Building2,
  REGULATEUR: Building2,
}

const TYPE_COLOR: Record<OrgType, string> = {
  MARKETEUR: 'bg-violet-500/10 text-violet-700 border-violet-500/20',
  TRANSPORTEUR: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  CLIENT: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  DEPOT: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  REGULATEUR: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
}

export type MapOrgSelectorProps = {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  scope?: UserScope
}

export function MapOrgSelector({ selectedIds, onChange, scope }: MapOrgSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<OrgType | 'ALL'>('ALL')

  const options = useMemo<OrgRegionOption[]>(() => getOrgRegionOptions(scope), [scope])

  const filtered = useMemo(() => {
    return options.filter((o) => {
      if (activeTab !== 'ALL' && o.type !== activeTab) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          o.orgName.toLowerCase().includes(q) ||
          o.acronym.toLowerCase().includes(q) ||
          o.region.toLowerCase().includes(q) ||
          o.orgId.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [options, activeTab, search])

  const selectedOptions = useMemo(
    () => options.filter((o) => selectedIds.includes(o.id)),
    [options, selectedIds]
  )

  const byRegion = useMemo(() => {
    const m = new Map<string, OrgRegionOption[]>()
    for (const o of filtered) {
      const arr = m.get(o.region) ?? []
      arr.push(o)
      m.set(o.region, arr)
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((v) => v !== id))
    else onChange([...selectedIds, id])
  }

  const selectAllFiltered = () => {
    const ids = filtered.map((f) => f.id)
    const next = Array.from(new Set([...selectedIds, ...ids]))
    onChange(next)
  }

  const clearAll = () => onChange([])

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between rounded-xl bg-background shadow-none h-10"
          >
            <span className="flex items-center gap-2 truncate">
              <Building2 data-icon="inline-start" className="shrink-0 text-muted-foreground" />
              {selectedIds.length === 0
                ? 'Sélectionner org × région (acronyme) — ex. SCTM · Centre'
                : `${selectedIds.length} sélection${selectedIds.length > 1 ? 's' : ''} · ${selectedOptions.map((o) => `${o.acronym}·${o.region}`).slice(0, 3).join(', ')}${selectedIds.length > 3 ? '…' : ''}`}
            </span>
            <ChevronsUpDown data-icon="inline-end" className="shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(96vw,720px)] p-0" align="start" sideOffset={8}>
          <div className="p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher acronyme, région, nom…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['ALL', 'MARKETEUR', 'TRANSPORTEUR', 'CLIENT', 'DEPOT'] as const).map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  variant={activeTab === tab ? 'default' : 'outline'}
                  size="sm"
                  className={cn('h-7 rounded-full px-3 text-xs whitespace-nowrap', activeTab === tab && 'shadow-sm')}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'ALL' ? 'Tous' : TYPE_LABEL[tab as OrgType]}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {filtered.length} résultat{filtered.length > 1 ? 's' : ''} · groupé par région
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAllFiltered}>
                Tout sélectionner
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
                Effacer
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[340px]">
            <div className="p-2">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucune entité trouvée</p>
              ) : (
                <div className="space-y-4">
                  {byRegion.map(([region, group]) => (
                    <div key={region} className="space-y-1.5">
                      <div className="flex items-center gap-2 px-2 py-1 bg-muted/40 rounded-md">
                        <span className="text-xs font-semibold tracking-wide uppercase">{region}</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">{group.length}</Badge>
                      </div>
                      {group.map((opt) => {
                        const checked = selectedIds.includes(opt.id)
                        const Icon = TYPE_ICON[opt.type as OrgType] ?? Building2
                        const isDepot = opt.type === 'DEPOT'
                        return (
                          // biome-ignore lint/a11y/useKeyWithClickEvents: row click toggles checkbox
                          <div
                            key={opt.id}
                            onClick={() => toggle(opt.id)}
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                              checked
                                ? 'bg-primary/5 border-primary/20'
                                : 'bg-background border-transparent hover:bg-muted/50 hover:border-border/60'
                            )}
                          >
                            <Checkbox checked={checked} onCheckedChange={() => toggle(opt.id)} aria-label={opt.orgName} />
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                              {isDepot ? (
                                <img src={lpgSphereUrl} alt="" className="size-6 object-contain" />
                              ) : (
                                <Icon className="size-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium leading-none flex items-center gap-2">
                                <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-bold tracking-wide bg-background">
                                  {opt.acronym}
                                </span>
                                <span className="truncate">{opt.orgName}</span>
                              </p>
                              <p className="truncate text-xs text-muted-foreground">{opt.region} · {opt.siteCount} site{opt.siteCount > 1 ? 's' : ''}</p>
                            </div>
                            <Badge variant="outline" className={cn('shrink-0 border text-[10px] px-1.5 py-0', TYPE_COLOR[opt.type as OrgType] ?? TYPE_COLOR.MARKETEUR)}>
                              {opt.type.slice(0, 3)}
                            </Badge>
                            {checked ? <Check className="size-4 shrink-0 text-primary" /> : null}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((opt) => {
            const isDepot = opt.type === 'DEPOT'
            return (
              <Badge
                key={opt.id}
                variant="secondary"
                className={cn('gap-1.5 rounded-full px-3 py-1 text-xs font-normal', TYPE_COLOR[opt.type as OrgType])}
              >
                {isDepot ? <img src={lpgSphereUrl} alt="" className="size-3.5 object-contain rounded-full" /> : null}
                <span className="font-bold">{opt.acronym}</span>
                <span className="opacity-80">· {opt.region}</span>
                <button
                  type="button"
                  aria-label={`Retirer ${opt.orgName}`}
                  className="ml-1 rounded-full p-0.5 hover:bg-black/10"
                  onClick={() => toggle(opt.id)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )
          })}
          <Button type="button" variant="ghost" size="sm" className="h-6 rounded-full text-xs" onClick={clearAll}>
            Effacer tout
          </Button>
        </div>
      ) : null}
    </div>
  )
}

// Backward compat: resolve org by id or name
export function getOrgDetails(id: string) {
  const raw = id.includes('::') ? id.split('::')[0]! : id
  const org = (curated.organizations as unknown as Array<{ id: string; name: string; type: string; operational_site_count?: number; client_site_count?: number; vehicle_count?: number }>)
    .find((o) => o.id === raw || o.name === raw)
  if (!org) return null
  return org
}

export function parseOrgRegionId(id: string): { orgId: string; region: string } {
  const [orgId, region] = id.split('::')
  return { orgId: orgId ?? id, region: region ?? '—' }
}
