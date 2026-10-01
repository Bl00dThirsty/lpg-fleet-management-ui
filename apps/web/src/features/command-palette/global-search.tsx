import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@lpg/ui'
import { useGlobalSearchStore } from './global-search-store'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useRoleStore } from '@/store/role-store'
import { getSidebarData } from '@/config/rbac/sidebar-by-role'
import type { Role } from '@lpg/permissions'
import { trucks } from '@/features/trucks/data/trucks'
import { sites } from '@/features/sites/data/sites'
import { transporters } from '@/features/transporters/transporters'
import { getMarketers } from '@/features/marketers/data/marketers'
import { getRouteTripsView } from '@/features/tours/data/tour-activity'
import { TruckIcon, MapPin, Handshake, Building2, FileText, Home, Clock } from 'lucide-react'

type SearchItem = {
  category: string
  title: string
  subtitle: string
  value: string
  url: string
  icon: React.ElementType
}

type RecentEntry = {
  term: string
  category: string
  title: string
  url: string
  icon: React.ElementType
}

const RECENT_KEY = 'global-search-recent'
const MAX_RECENT = 8

function readRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RecentEntry[]
  } catch {
    return []
  }
}

function writeRecent(entries: RecentEntry[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(entries.slice(0, MAX_RECENT)))
  } catch {
    // ignore
  }
}

function addRecent(entry: RecentEntry) {
  const existing = readRecent().filter((r) => r.url !== entry.url)
  const next = [entry, ...existing].slice(0, MAX_RECENT)
  writeRecent(next)
}

function getSitesUrlForRole(role: Role): string | null {
  try {
    const data = getSidebarData(role)
    for (const group of data.navGroups) {
      for (const item of group.items) {
        if (
          'url' in item &&
          typeof (item as { url: string }).url === 'string' &&
          ((item as { url: string }).url.includes('/sites') ||
            (item as { url: string }).url.includes('/site-verification'))
        ) {
          return (item as { url: string }).url
        }
      }
    }
  } catch {
    // ignore
  }
  return null
}

function buildLiveIndex(role: Role): SearchItem[] {
  const items: SearchItem[] = []

  try {
    const data = getSidebarData(role)
    for (const group of data.navGroups) {
      for (const item of group.items) {
         if ('url' in item && typeof (item as { url: string }).url === 'string') {
          const leaf = item as { title: string; url: string; icon?: React.ElementType }
          items.push({
            category: group.title,
            title: leaf.title,
            subtitle: '',
            value: `${leaf.title} ${group.title}`,
            url: leaf.url,
            icon: leaf.icon ?? Home,
          })
        } else if ('items' in item) {
          for (const child of (item as { items: Array<{ title: string; url: string; icon?: React.ElementType }> }).items) {
            if ('url' in child && typeof child.url === 'string') {
              items.push({
                category: group.title,
                title: child.title,
                subtitle: '',
                value: `${child.title} ${group.title}`,
                url: child.url,
                icon: child.icon ?? Home,
              })
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }

  for (const t of trucks) {
    items.push({
      category: 'Camions',
      title: t.license_plate,
      subtitle: `${t.tenant_name} - ${t.assigned_driver}`,
      value: `${t.license_plate} ${t.tenant_name} ${t.assigned_driver} ${t.id}`,
      url: `/trucks/${t.id}`,
      icon: TruckIcon,
    })
  }

  for (const trip of getRouteTripsView()) {
    items.push({
      category: 'Tournées',
      title: trip.reference,
      subtitle: `${trip.customerName} — ${trip.truck}`,
      value: `${trip.reference} ${trip.customerName} ${trip.id}`,
      url: `/tour-tracking/${trip.id}`,
      icon: FileText,
    })
  }

  for (const t of transporters) {
    items.push({
      category: 'Transporteurs',
      title: t.name,
      subtitle: `${t.vehicle_count ?? 0} véhicules`,
      value: `${t.name} ${t.id}`,
      url: `/transporters/${t.id}`,
      icon: Handshake,
    })
  }

  for (const m of getMarketers()) {
    items.push({
      category: 'Marketeurs',
      title: m.name,
      subtitle: `${m.vehicle_count ?? 0} véhicules`,
      value: `${m.name} ${m.id}`,
      url: `/marketers/${m.id}`,
      icon: Building2,
    })
  }

  const sitesUrl = getSitesUrlForRole(role)
  if (sitesUrl) {
    for (const s of sites) {
      items.push({
        category: 'Sites',
        title: s.name,
        subtitle: `${s.city} - ${s.region}`,
        value: `${s.name} ${s.city} ${s.region} ${s.id}`,
        url: `${sitesUrl}?q=${encodeURIComponent(s.name)}`,
        icon: MapPin,
      })
    }
  }

  return items
}

export function GlobalSearch() {
  const open = useGlobalSearchStore((s) => s.open)
  const close = useGlobalSearchStore((s) => s.close)
  const toggle = useGlobalSearchStore((s) => s.toggle)
  const { activeRole } = useRoleStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const items = useMemo(() => buildLiveIndex(activeRole), [activeRole])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.value.toLowerCase().includes(q)).slice(0, 50)
  }, [items, query])

  // Re-read recent entries whenever the dialog open state toggles
  const recent = useMemo(() => readRecent(), [open, query])

  const grouped = useMemo(() => {
    const map = new Map<string, SearchItem[]>()
    const source = filtered
    for (const item of source) {
      const group = map.get(item.category) ?? []
      group.push(item)
      map.set(item.category, group)
    }
    return Array.from(map.entries())
  }, [filtered])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [toggle])

  const selectItem = (item: SearchItem) => {
    addRecent({
      term: query.trim(),
      category: item.category,
      title: item.title,
      url: item.url,
      icon: item.icon,
    })
    navigate({ to: item.url })
    close()
  }

  return (
    <CommandDialog open={open} onOpenChange={(o) => { if (!o) close() }}>
      <CommandInput
        placeholder="Rechercher une page, un camion, un site, une tournée..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className='max-h-96'>
        <CommandEmpty>Aucun resultat.</CommandEmpty>

        {query.trim().length === 0 && recent.length > 0 && (
          <CommandGroup heading="Recents">
            {recent.map((entry, idx) => (
              <CommandItem
                key={`${entry.url}-${idx}`}
                value={`${entry.title} ${entry.category} recent`}
                onSelect={() => {
                  setQuery(entry.term)
                  navigate({ to: entry.url })
                  close()
                }}
              >
                <Clock className="size-4 shrink-0 opacity-50 mr-2" />
                {entry.title}
                <span className="ml-auto text-xs text-muted-foreground">{entry.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {grouped.map(([category, groupItems]) => (
          <CommandGroup key={category} heading={category}>
            {groupItems.map((item) => (
              <CommandItem
                key={item.url}
                value={item.value}
                onSelect={() => selectItem(item)}
              >
                <item.icon className="size-4 shrink-0 opacity-50 mr-2" />
                {item.title}
                {item.subtitle && (
                  <span className="ml-auto text-xs text-muted-foreground">{item.subtitle}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
