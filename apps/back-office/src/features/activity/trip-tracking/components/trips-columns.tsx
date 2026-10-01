import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { Trip } from '../data/trip-data'
import { ArrowRight, Truck, User } from 'lucide-react'

interface TripsColumnsProps {
  onViewDetails: (trip: Trip) => void
}

export function getTripsColumns({
  onViewDetails,
}: TripsColumnsProps): ColumnDef<Trip>[] {
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
          aria-label='Select all'
          className='translate-y-[2px]'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
          className='translate-y-[2px]'
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: 'w-[40px]',
      },
    },
    {
      accessorKey: 'id',
      header: 'ID Tournée',
      cell: ({ row }) => (
        <div className='font-medium'>{row.getValue('id')}</div>
      ),
    },
    {
      accessorKey: 'cargoType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('cargoType') as string
        return (
          <Badge variant={type === 'vrac' ? 'default' : 'secondary'} className='rounded-full'>
            {type === 'vrac' ? 'Vrac' : 'Bouteilles 50kg'}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      id: 'route',
      header: 'Trajet',
      cell: ({ row }) => {
        const origin = row.original.origin.name
        const destination = row.original.destination.name
        return (
          <div className='flex items-center gap-2 text-sm'>
            <span className='truncate max-w-[120px]'>{origin}</span>
            <ArrowRight className='size-3 text-muted-foreground shrink-0' />
            <span className='truncate max-w-[120px]'>{destination}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        let colorClass = 'bg-slate-100 text-slate-700'
        
        switch (status) {
          case 'Planifié':
            colorClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            break
          case 'En transit':
            colorClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            break
          case 'En livraison':
            colorClass = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
            break
          case 'Livré':
            colorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            break
          case 'Retardé':
            colorClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            break
        }

        return (
          <Badge className={colorClass} variant='outline'>
            {status}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'progress',
      header: 'Progression',
      cell: ({ row }) => {
        const progress = row.getValue('progress') as number
        return (
          <div className='flex items-center gap-2'>
            <div className='h-2 w-[80px] overflow-hidden rounded-full bg-secondary'>
              <div 
                className='h-full bg-primary transition-all' 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className='text-xs text-muted-foreground w-8'>{progress}%</span>
          </div>
        )
      },
    },
    {
      id: 'assets',
      header: 'Ressources',
      cell: ({ row }) => {
        const truck = row.original.truckPlate
        const driver = row.original.driver
        return (
          <div className='flex flex-col gap-1 text-xs'>
            <div className='flex items-center gap-1.5 text-muted-foreground'>
              <Truck className='size-3' />
              <span className='font-medium text-foreground'>{truck}</span>
            </div>
            <div className='flex items-center gap-1.5 text-muted-foreground'>
              <User className='size-3' />
              <span>{driver}</span>
            </div>
          </div>
        )
      },
    },

    {
      accessorKey: 'createdAt',
      header: 'Création',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string
        if (!date) return null
        return (
          <div className='text-xs whitespace-nowrap text-muted-foreground'>
            {new Date(date).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'short', year: 'numeric'
            })}
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const rowValue = row.getValue(id) as string
        if (!rowValue) return false
        if (!Array.isArray(value) || value.length !== 2) return true
        
        const rowDate = new Date(rowValue).getTime()
        const fromDate = new Date(value[0]).getTime()
        const toDate = new Date(value[1]).getTime()
        
        return rowDate >= fromDate && rowDate <= toDate
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Mise à jour',
      cell: ({ row }) => {
        const date = row.getValue('updatedAt') as string
        if (!date) return null
        return (
          <div className='text-xs whitespace-nowrap text-muted-foreground'>
            {new Date(date).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'short', year: 'numeric'
            })}
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const rowValue = row.getValue(id) as string
        if (!rowValue) return false
        if (!Array.isArray(value) || value.length !== 2) return true
        
        const rowDate = new Date(rowValue).getTime()
        const fromDate = new Date(value[0]).getTime()
        const toDate = new Date(value[1]).getTime()
        
        return rowDate >= fromDate && rowDate <= toDate
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 font-medium'
            onClick={() => onViewDetails(row.original)}
          >
            Détails
          </Button>
        </div>
      ),
      meta: {
        className: 'w-[100px]',
      },
    },
  ]
}
