import { type ColumnDef } from '@tanstack/react-table'
import { Badge, DataTableColumnHeader } from '@lpg/ui'
import {
  type TourActivity,
  type TourneeStatus,
  type ExecutionMode,
  getTourCargo,
  getTourVolume,
  getTourStatusLabel,
  getExecutionModeLabel,
} from '../data/tour-activity'
import { formatTM, formatBtl } from '@/lib/i18n/formatters'
import type { LanguagePreference } from '@/store/preferences-store'

const STATUS_CLASS: Record<TourneeStatus, string> = {
  DRAFT: 'bg-slate-200 text-slate-800',
  PLANNED: 'bg-sky-100 text-sky-800',
  PENDINGTRANSPORTERACK: 'bg-amber-100 text-amber-900',
  ACKNOWLEDGED: 'bg-violet-100 text-violet-900',
  INPROGRESS: 'bg-blue-500 text-white',
  CHECKPOINTACTIVE: 'bg-orange-500 text-white',
  CLOSED: 'bg-emerald-600 text-white',
  CANCELLED: 'bg-rose-100 text-rose-900',
}

const MODE_CLASS: Record<ExecutionMode, string> = {
  INTERNAL: 'bg-slate-100 text-slate-700',
  EXTERNAL: 'bg-indigo-100 text-indigo-800',
}

const DASH = '\u2014'

type TranslateFn = (key: string, opts?: Record<string, unknown>) => string

export function getToursColumns({
  onOpenDetails,
  selectedTripId,
  t,
  lang,
}: {
  onOpenDetails: (row: TourActivity) => void
  selectedTripId?: string | null
  t?: TranslateFn
  lang?: LanguagePreference
}): ColumnDef<TourActivity>[] {
  const tr = (key: string, fallback: string) => (t ? t(key, { defaultValue: fallback } as never) : fallback)
  const effectiveLang: LanguagePreference = lang ?? 'fr-FR'
  return [
    {
      accessorKey: 'reference',
      header: ({ column }) => <DataTableColumnHeader column={column} title={tr('tours:columns.reference', 'Référence')} />,
      cell: ({ row }) => (
        <button
          type='button'
          onClick={() => onOpenDetails(row.original)}
          aria-current={row.original.id === selectedTripId ? 'true' : undefined}
          className={
            row.original.id === selectedTripId
              ? 'font-semibold text-primary underline-offset-4 hover:underline'
              : 'font-medium text-primary underline-offset-4 hover:underline'
          }
        >
          {row.original.reference}
        </button>
      ),
      enableHiding: false,
      enableGrouping: true,
      meta: { label: tr('tours:columns.reference', 'Référence') },
    },
    {
      accessorKey: 'marketeur_name',
      header: tr('tours:columns.marketeur', 'Marketeur'),
      cell: ({ row }) => row.original.marketeur_name,
      meta: { label: tr('tours:columns.marketeur', 'Marketeur') },
      enableGrouping: true,
    },
    {
      accessorKey: 'execution_mode',
      header: tr('tours:columns.mode', 'Mode'),
      cell: ({ row }) => (
        <Badge className={MODE_CLASS[row.original.execution_mode]}>
          {getExecutionModeLabel(row.original.execution_mode, t)}
        </Badge>
      ),
      meta: { label: tr('tours:columns.mode', 'Mode') },
      enableGrouping: true,
    },
    {
      accessorKey: 'tourneeType',
      header: tr('tours:columns.type', 'Type'),
      cell: ({ row }) => getTourCargo(row.original, t),
      meta: { label: tr('tours:columns.type', 'Type') },
      enableGrouping: true,
    },
    {
      accessorKey: 'transporter_name',
      header: tr('tours:columns.transporter', 'Transporteur'),
      cell: ({ row }) => row.original.transporter_name ?? DASH,
      meta: { label: tr('tours:columns.transporter', 'Transporteur') },
      enableGrouping: true,
    },
    {
      accessorKey: 'vehicle_plate',
      header: tr('tours:columns.vehicle', 'Véhicule'),
      cell: ({ row }) => row.original.vehicle_plate ?? DASH,
      meta: { label: tr('tours:columns.vehicle', 'Véhicule') },
      enableGrouping: true,
    },
    {
      accessorKey: 'requested_quantity',
      header: tr('tours:columns.quantity', 'Quantité'),
      cell: ({ row }) => getTourVolume(row.original, effectiveLang, t),
      meta: { label: tr('tours:columns.quantity', 'Quantité') },
      enableGrouping: true,
    },
    {
      accessorKey: 'delivered_quantity',
      header: tr('tours:columns.delivered', 'Livré'),
      cell: ({ row }) => {
        if (row.original.delivered_quantity == null) return DASH
        const qty = row.original.delivered_quantity
        if (row.original.tourneeType === 'VRAC') return formatTM(qty, effectiveLang)
        return formatBtl(qty, effectiveLang)
      },
      meta: { label: tr('tours:columns.delivered', 'Livré') },
      enableGrouping: true,
    },
    {
      accessorKey: 'tourneeStatus',
      header: tr('tours:columns.status', 'Statut'),
      cell: ({ row }) => (
        <Badge className={STATUS_CLASS[row.original.tourneeStatus]}>
          {getTourStatusLabel(row.original.tourneeStatus, t)}
        </Badge>
      ),
      enableHiding: false,
      meta: { label: tr('tours:columns.status', 'Statut') },
      enableGrouping: true,
    },
  ]
}
