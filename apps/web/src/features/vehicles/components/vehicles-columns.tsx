import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader, StatusIndicator, STATUS_TONE_MAP } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import {
  vehicleRiskClasses,
  vehicleRiskLabels,
  vehicleStatusClasses,
  vehicleStatusLabels,
  vehicleTypeLabels,
  certificateStatusLabels,
  certificateStatusClasses,
  type VehicleView,
} from '../data/vehicles'
import { activeTourForVehicle } from '@/features/tours/data/active-tour'
import { CrudRowActions } from '@/components/entity-crud'

type VehiclesColumnsProps = {
  onViewDetails: (vehicle: VehicleView) => void
  onOpenActiveTour: (vehicleId: string) => void
  onEdit?: (vehicle: VehicleView) => void
  onDelete?: (vehicle: VehicleView) => void
}

export function getVehiclesColumns({
  onViewDetails,
  onOpenActiveTour,
  onEdit,
  onDelete,
}: VehiclesColumnsProps): ColumnDef<VehicleView>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Tout selectionner'
          className='translate-y-0.5'
        />
      ),
      meta: {
        className: cn('inset-s-0 z-10 rounded-tl-[inherit] max-md:sticky'),
      },
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Selectionner la ligne'
          className='translate-y-0.5'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'license_plate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Plaque' />
      ),
      cell: ({ row }) => (
        <button
          type='button'
          onClick={() => onViewDetails(row.original)}
          className='ps-3 text-left font-medium text-primary underline-offset-4 hover:underline'
        >
          {row.original.license_plate}
        </button>
      ),
      filterFn: (row, _id, value) => {
        const query = String(value ?? '')
          .trim()
          .toLowerCase()
        if (!query) return true

        return [
          row.original.license_plate,
          row.original.tenant_name,
          row.original.assigned_driver,
          row.original.region,
          row.original.type,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      },
      meta: {
        label: 'Plaque',
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Type' />
      ),
      cell: ({ row }) => (
        <div className='text-xs'>{vehicleTypeLabels[row.original.type]}</div>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Type', className: 'w-32' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'tenant_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Entreprise' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.tenant_name}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Entreprise' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'region',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Region' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.region}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Region' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'assigned_driver',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Chauffeur' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-40 font-medium'>
          {row.original.assigned_driver}
        </LongText>
      ),
      meta: { label: 'Chauffeur', className: 'min-w-42' },
      enableGrouping: true,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Statut' />
      ),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <StatusIndicator tone={STATUS_TONE_MAP[status] ?? 'muted'} ariaLabel={`Statut: ${vehicleStatusLabels[status]}`}>
            <Badge className={cn('font-medium', vehicleStatusClasses[status])}>
              {vehicleStatusLabels[status]}
            </Badge>
          </StatusIndicator>
        )
      },
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Statut' },
      enableSorting: false,
      enableHiding: false,
      enableGrouping: true,
    },
    {
      id: 'lpgLevel',
      accessorFn: (vehicle) => quantityPercent(vehicle),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='LPG' />
      ),
      cell: ({ row }) => {
        const vehicle = row.original
        const isVrac = vehicle.type === 'VRAC'
        const max = isVrac
          ? vehicle.max_volume ?? null
          : vehicle.max_bottle_count ?? null
        const loaded = vehicle.loaded_quantity ?? 0
        const percent = max && max > 0 ? Math.round((loaded / max) * 100) : 0
        const unit = isVrac ? ' TM' : ' bouteilles'
        return (
          <div className='w-32 space-y-1'>
            <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-emerald-500 transition-all duration-700'
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className='text-xs text-muted-foreground'>
              {percent}% • {Math.round(loaded)}/{max ?? '—'}
              {unit}
            </p>
          </div>
        )
      },
      meta: { label: 'LPG', className: 'w-36' },
    },
    {
      accessorKey: 'risk_level',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Risque' />
      ),
      cell: ({ row }) => {
        const risk = row.original.risk_level
        return (
          <Badge variant='outline' className={cn(vehicleRiskClasses[risk])}>
            {vehicleRiskLabels[risk]}
          </Badge>
        )
      },
      meta: { label: 'Risque' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      id: 'certificate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Certificat de jaugement' />
      ),
      cell: ({ row }) => (
        <div className='flex flex-col gap-1'>
          <Badge
            className={cn(certificateStatusClasses[row.original.certificate_status])}
          >
            {certificateStatusLabels[row.original.certificate_status]}
          </Badge>
          {row.original.type === 'VRAC' && row.original.certificate_number && (
            <span className='text-[10px] text-muted-foreground'>
              {row.original.certificate_number}
            </span>
          )}
        </div>
      ),
      meta: { label: 'Certificat de jaugement', className: 'w-44' },
      enableSorting: false,
    },
    {
      id: 'active-tour',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='En tournée' />
      ),
      cell: ({ row }) => {
        const trip = activeTourForVehicle(row.original.id)
        if (!trip) return <span className='text-muted-foreground text-xs'>—</span>
        return (
          <button
            type='button'
            onClick={() => onOpenActiveTour(row.original.id)}
            className='text-primary underline-offset-4 hover:underline'
          >
            {trip.reference}
          </button>
        )
      },
      meta: { label: 'En tournée', className: 'w-36' },
      enableSorting: false,
    },
    {
      id: 'actions',
      header: '',
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <CrudRowActions
            resource='trucks'
            itemLabel='ce véhicule'
            onEdit={onEdit ? () => onEdit?.(row.original) : undefined}
            onDelete={onDelete ? () => onDelete?.(row.original) : undefined}
          />
        </div>
      ),
      meta: { label: 'Actions' },
    },
  ]
}

function quantityPercent(vehicle: VehicleView): number {
  const max =
    vehicle.type === 'VRAC'
      ? vehicle.max_volume ?? null
      : vehicle.max_bottle_count ?? null
  const loaded = vehicle.loaded_quantity ?? 0
  return max && max > 0 ? Math.round((loaded / max) * 100) : 0
}