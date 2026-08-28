import { useMemo, useRef, useState } from 'react'
import type MapView from '@arcgis/core/views/MapView.js'
import {
  Layers,
  Locate,
  Map as MapIcon,
  Minus,
  Plus,
  RefreshCw,
  Satellite,
  Search,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CAMEROON_CENTER } from '@/features/map/lib/cameroon-boundaries'
import type { BasemapMode } from './national-map'

export type MapSearchItem = {
  id: string
  label: string
  sublabel: string
  lat: number
  lng: number
}

export type NationalMapToolbarProps = {
  view: MapView | null
  searchItems: MapSearchItem[]
  basemap: BasemapMode
  onBasemapChange: (mode: BasemapMode) => void
  onRefresh: () => void
  onSearchPick: (item: MapSearchItem) => void
  layersOpen: boolean
  onLayersToggle: (open: boolean) => void
}

export function NationalMapToolbar({
  view,
  searchItems,
  basemap,
  onBasemapChange,
  onRefresh,
  onSearchPick,
  layersOpen,
  onLayersToggle,
}: NationalMapToolbarProps) {
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return searchItems
      .filter((item) => `${item.label} ${item.sublabel}`.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, searchItems])

  const handlePick = (item: MapSearchItem) => {
    setQuery('')
    inputRef.current?.blur()
    onSearchPick(item)
  }

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      <div className="relative w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Rechercher un site, client, zone…"
          className="h-10 rounded-xl border-border/60 bg-background/90 pl-9 pr-8 shadow-sm backdrop-blur"
          aria-label="Rechercher sur la carte"
        />
        {query ? (
          <button
            type='button'
            className='absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
            onClick={() => setQuery('')}
            aria-label='Effacer la recherche'
          >
            <X className='size-4' />
          </button>
        ) : null}

        {searchFocused && query ? (
          <div className="absolute inset-x-0 top-12 overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-lg backdrop-blur">
            {results.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                Aucun résultat.
              </p>
            ) : (
              <ul className="max-h-72 overflow-y-auto">
                {results.map((item) => (
                  <li key={item.id}>
                    <button
                      type='button'
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handlePick(item)}
                      className='flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50'
                    >
                      <span className='min-w-0'>
                        <span className='block truncate text-sm font-medium'>
                          {item.label}
                        </span>
                        <span className='block truncate text-xs text-muted-foreground'>
                          {item.sublabel}
                        </span>
                      </span>
                      <MapIcon className='size-4 shrink-0 text-muted-foreground' />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex w-fit items-center gap-1 rounded-xl border border-border/60 bg-background/90 p-1 shadow-sm backdrop-blur">
        <ToolbarButton
          label='Zoom avant'
          onClick={() => void view?.zoomIn()}
        >
          <Plus className='size-4' />
        </ToolbarButton>
        <ToolbarButton
          label='Zoom arrière'
          onClick={() => void view?.zoomOut()}
        >
          <Minus className='size-4' />
        </ToolbarButton>
        <ToolbarButton
          label='Revenir à la vue nationale'
          onClick={() => {
            void view
              ?.goTo({ center: [...CAMEROON_CENTER] as unknown as [number, number], zoom: 7 })
              .catch(() => undefined)
          }}
        >
          <Locate className='size-4' />
        </ToolbarButton>
        <ToolbarButton
          label={basemap === 'vector' ? 'Passer en vue satellite' : 'Passer en vue vectorielle'}
          active={basemap === 'satellite'}
          onClick={() =>
            onBasemapChange(basemap === 'vector' ? 'satellite' : 'vector')
          }
        >
          <Satellite className='size-4' />
        </ToolbarButton>
        <ToolbarButton label='Actualiser les données' onClick={onRefresh}>
          <RefreshCw className='size-4' />
        </ToolbarButton>
        <ToolbarButton
          label='Couches de la carte'
          active={layersOpen}
          onClick={() => onLayersToggle(!layersOpen)}
        >
          <Layers className='size-4' />
        </ToolbarButton>
      </div>
    </div>
  )
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      className={cn(
        'h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground',
        active && 'bg-muted text-foreground',
      )}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  )
}