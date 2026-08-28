import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  MapPin,
  Route,
  Truck,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { siteStatusLabels, siteTypeLabels } from '@/features/sites/data/sites'
import { statusLabels } from '@/features/trucks/data/trucks'
import type { MapEntitySelection } from './national-map'

export type NationalMapDetailsProps = {
  entity: MapEntitySelection
  onClose: () => void
}

const kindLabels: Record<MapEntitySelection['kind'], string> = {
  site: 'Site marchand',
  'client-site': 'Site client',
  truck: 'Véhicule',
  anomaly: 'Anomalie',
  region: 'Région',
  checkpoint: 'Point de contrôle',
}

const hrefFor: Record<
  Exclude<MapEntitySelection['kind'], 'region' | 'checkpoint'>,
  string
> = {
  site: '/sites',
  'client-site': '/client-sites',
  truck: '/trucks',
  anomaly: '/anomalies',
}

export function NationalMapDetails({
  entity,
  onClose,
}: NationalMapDetailsProps) {
  const Icon =
    entity.kind === 'truck'
      ? Truck
      : entity.kind === 'anomaly'
        ? AlertTriangle
        : entity.kind === 'checkpoint'
          ? Route
          : entity.kind === 'site' || entity.kind === 'client-site'
            ? MapPin
            : entity.kind === 'region'
              ? Route
              : Building2

  return (
    <div className="absolute top-4 right-4 z-10 w-72 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-muted/50 text-primary">
            <Icon className="size-4" />
          </div>
          <div>
            <Badge variant='outline' className='border-transparent bg-muted/40 px-2 py-0 text-[10px] text-muted-foreground'>
              {kindLabels[entity.kind]}
            </Badge>
          </div>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='h-7 w-7 text-muted-foreground'
          onClick={onClose}
          aria-label='Fermer le détail'
        >
          <X className='size-4' />
        </Button>
      </div>

      <p className='mt-3 text-sm leading-snug font-medium'>{entity.title}</p>

      <div className='mt-3 space-y-2 text-xs text-muted-foreground'>
        <EntityMeta entity={entity} />
      </div>

      {entity.kind === 'site' ||
      entity.kind === 'client-site' ||
      entity.kind === 'truck' ||
      entity.kind === 'anomaly' ? (
        <Link
          to={hrefFor[entity.kind] as never}
          className='mt-4 flex h-9 w-full items-center justify-between rounded-xl bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15'
        >
          Ouvrir la fiche
          <ArrowUpRight className='size-4' />
        </Link>
      ) : null}
    </div>
  )
}

function EntityMeta({ entity }: { entity: MapEntitySelection }) {
  switch (entity.kind) {
    case 'site':
      return (
        <>
          <StatusLine label='Type' value={siteTypeLabels[entity.type]} />
          <StatusLine label='Statut' value={siteStatusLabels[entity.status]} />
        </>
      )
    case 'truck':
      return (
        <StatusLine label='Statut' value={statusLabels[entity.status]} />
      )
    case 'anomaly':
      return entity.severity ? (
        <StatusLine label='Sévérité' value={entity.severity} />
      ) : null
    case 'checkpoint':
      return (
        <>
          <StatusLine label='Tournée' value={entity.tourId} />
          <StatusLine label='Séquence' value={String(entity.sequence)} />
        </>
      )
    default:
      return null
  }
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='font-medium text-foreground'>{value}</span>
    </div>
  )
}