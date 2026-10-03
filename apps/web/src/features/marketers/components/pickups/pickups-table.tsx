import { useState } from 'react'
import { DataTable } from '@lpg/ui'
import { pickupsColumns, type PickupWithSites } from './pickups-columns'

interface PickupsTableProps {
  data: PickupWithSites[]
  search?: string
  onViewDetails: (pickup: PickupWithSites) => void
}

export function PickupsTable({ data, onViewDetails }: PickupsTableProps) {
  const [columns] = useState(() => pickupsColumns(onViewDetails))

  return (
    <DataTable
      data={data}
      columns={columns}
      search={{ placeholder: 'Rechercher un enlèvement…', searchKey: 'q' }}
    />
  )
}