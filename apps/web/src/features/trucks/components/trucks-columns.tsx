import type { TFunction } from 'i18next'
import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import {
  getTruckTelemetry,
  riskClasses,
  statusClasses,
  type Truck,
} from '../data/trucks'
import { quantityInfo } from '../lib/quantity'
import { DataTableRowActions } from './data-table-row-actions'
import { CrudRowActions } from '@/components/entity-crud'

type TrucksColumnsProps = {
  onViewDetails: (truck: Truck) => void
  onEdit?: (truck: Truck) => void
  onDelete?: (truck: Truck) => void
  deletingId?: string
  t: TFunction
}

export function getTrucksColumns({
  onViewDetails,
  onEdit,
  onDelete,
  deletingId,
  t,
}: TrucksColumnsProps): ColumnDef<Truck>[] {
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
          aria-label={t('trucks.selectAll')}
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
          aria-label={t('trucks.selectRow')}
          className='translate-y-0.5'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('trucks.columns.id')} />
      ),
      cell: ({ row }) => (
        <button
          type='button'
          onClick={() => onViewDetails(row.original)}
          className='ps-3 text-left font-medium text-primary underline-offset-4 hover:underline'
        >
          {row.original.id}
        </button>
      ),
      filterFn: (row, _id, value) => {
        const query = String(value ?? '')
          .trim()
          .toLowerCase()
        if (!query) return true

        return [
          row.original.id,
          row.original.license_plate,
          row.original.tenant_name,
          row.original.assigned_driver,
          row.original.region,
          row.original.current_location,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      },
      meta: {
        label: t('trucks.columns.id'),
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'license_plate',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trucks.columns.plate')}
        />
      ),
      cell: ({ row }) => (
        <div className='font-mono text-xs'>{row.original.license_plate}</div>
      ),
      meta: { label: t('trucks.columns.plate'), className: 'w-32' },
      enableGrouping: true,
    },
    {
      accessorKey: 'tenant_name',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trucks.columns.company')}
        />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.tenant_name}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: t('trucks.columns.company') },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'region',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trucks.columns.region')}
        />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.region}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: t('trucks.columns.region') },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'assigned_driver',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trucks.columns.driver')}
        />
      ),
      cell: ({ row }) => (
        <div className='space-y-0.5'>
          <LongText className='max-w-40 font-medium'>
            {row.original.assigned_driver}
          </LongText>
        </div>
      ),
      meta: { label: t('trucks.columns.driver'), className: 'min-w-42' },
      enableGrouping: true,
    },
    {
      accessorKey: 'tournee_status',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trucks.columns.status')}
        />
      ),
      cell: ({ row }) => {
        const status = row.original.tournee_status
        return (
          <Badge className={cn('font-medium', statusClasses[status])}>
            {t(`trucks.statuses.${status}`)}
          </Badge>
        )
      },
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: t('trucks.columns.status') },
      enableSorting: false,
      enableHiding: false,
      enableGrouping: true,
    },
    {
      id: 'lpgLevel',
      accessorFn: (truck) => quantityInfo(truck).percent,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trucks.columns.lpg')}
        />
      ),
      cell: ({ row }) => {
        const info = quantityInfo(row.original)
        const telemetry = getTruckTelemetry(row.original.id)
        return (
          <div className='w-32 space-y-1'>
            <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-emerald-500 transition-all duration-700'
                style={{ width: `${info.percent}%` }}
              />
            </div>
            <p className='text-xs text-muted-foreground'>
              {info.percent}% • {info.amount}
            </p>
            {telemetry.expected_arrival ? (
              <p className='text-[10px] text-muted-foreground'>
                ETA{' '}
                {new Date(telemetry.expected_arrival).toLocaleTimeString(
                  'fr-FR',
                  { hour: '2-digit', minute: '2-digit' }
                )}
              </p>
            ) : null}
          </div>
        )
      },
      meta: { label: t('trucks.columns.lpg'), className: 'w-36' },
    },
    {
      accessorKey: 'risk_level',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trucks.columns.risk')}
        />
      ),
      cell: ({ row }) => {
        const risk = row.original.risk_level
        return (
          <Badge variant='outline' className={cn(riskClasses[risk])}>
            {t(`trucks.riskLevels.${risk}`)}
          </Badge>
        )
      },
      meta: { label: t('trucks.columns.risk') },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions
          truck={row.original}
          onViewDetails={onViewDetails}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'crud-actions',
      header: () => <span className='sr-only'>{t('entityCrud.actions')}</span>,

      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <CrudRowActions
            resource='trucks'
            itemLabel={t('trucks.itemLabel')}
            onEdit={onEdit ? () => onEdit?.(row.original) : undefined}
            onDelete={onDelete ? () => onDelete?.(row.original) : undefined}
            pending={deletingId === row.original.id}

            feedbackHandled
          />
        </div>
      ),
      meta: { label: t('entityCrud.actions') },
    },
  ]
}
