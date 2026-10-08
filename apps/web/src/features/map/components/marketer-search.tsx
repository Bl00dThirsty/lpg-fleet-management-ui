import { useState } from 'react'
import { Search, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import {
  mapCoordinates,
  useMarketerDirectory,
  type MarketerMapEntry,
} from '../data/marketer-directory'
export function MarketerSearch({
  onSelect,
  onFocus,
}: {
  onSelect: (entry: MarketerMapEntry | null) => void
  onFocus: (coordinates: [number, number]) => void
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<MarketerMapEntry | null>(null)
  const directory = useMarketerDirectory()
  return (
    <div className='w-full max-w-sm space-y-2'>
      <Button
        variant='outline'
        className='h-11 w-full justify-start gap-3 bg-background shadow-md'
        onClick={() => setOpen(true)}
      >
        <Search className='size-4' />
        <span className='truncate'>
          {selected?.organization.name ?? 'Rechercher un marketeur…'}
        </span>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title='Rechercher un marketeur'
        description='Sélectionnez un marketeur pour afficher ses sites et centrer la carte.'
      >
        <CommandInput placeholder='Nom, code ou région…' />
        <CommandList>
          {directory.isPending ? (
            <p role='status' className='p-4 text-sm'>
              Chargement des marketeurs…
            </p>
          ) : directory.isError ? (
            <div role='alert' className='p-4 text-sm'>
              Recherche indisponible.
              <Button variant='link' onClick={() => directory.refetch()}>
                Réessayer
              </Button>
            </div>
          ) : (
            <>
              <CommandEmpty>Aucun marketeur trouvé.</CommandEmpty>
              <CommandGroup heading='Marketeurs'>
                {directory.data?.map((entry) => (
                  <CommandItem
                    key={entry.organization.id}
                    value={entry.organization.id}
                    keywords={[
                      entry.organization.name,
                      entry.organization.registration_number ?? '',
                      ...entry.locations.map((site) => site.region),
                    ]}
                    onSelect={() => {
                      setSelected(entry)
                      setOpen(false)
                      onSelect(entry)
                    }}
                  >
                    <MapPin className='size-4' />
                    <div>
                      <p>{entry.organization.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {entry.locations.length} site(s) ·{' '}
                        {entry.deliveries.length} point(s) de livraison
                        {!entry.coordinates && ' · Position indisponible'}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
      {selected && (
        <section
          aria-label='Détails du marketeur'
          className='max-h-[45dvh] overflow-auto rounded-lg border bg-background p-4 shadow-md'
        >
          <div className='flex items-center justify-between gap-2'>
            <h2 className='font-semibold'>{selected.organization.name}</h2>
            <Button
              size='icon'
              variant='ghost'
              aria-label='Fermer les détails du marketeur'
              onClick={() => {
                setSelected(null)
                onSelect(null)
              }}
            >
              <X className='size-4' />
            </Button>
          </div>
          {!selected.coordinates && (
            <p className='text-sm text-muted-foreground'>
              Aucune position GPS disponible pour ses sites.
            </p>
          )}
          <p className='mt-3 text-xs font-semibold text-muted-foreground'>
            Sites et points de livraison
          </p>
          <ul className='mt-2 space-y-1'>
            {[...selected.locations, ...selected.deliveries].map((site) => {
              const coordinates = mapCoordinates(site.geo_point)
              return (
                <li key={site.id}>
                  <Button
                    variant='ghost'
                    className='h-auto w-full justify-start whitespace-normal text-left'
                    disabled={!coordinates}
                    onClick={() => {
                      if (coordinates) onFocus(coordinates)
                    }}
                  >
                    <MapPin className='mr-2 size-3 shrink-0' />
                    <span>
                      {site.name}
                      <span className='block text-xs text-muted-foreground'>
                        {site.region}
                        {!coordinates && ' · GPS indisponible'}
                      </span>
                    </span>
                  </Button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
