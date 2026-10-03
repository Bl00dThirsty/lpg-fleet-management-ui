import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import {
  type RiskScoreView,
  type RiskLevel,
  riskLevelLabels,
  riskLevelOrder,
  riskEntityLabels,
} from '../data/risk-scores'

const LEVEL_CLASS: Record<RiskLevel, string> = {
  FAIBLE: 'bg-slate-200 text-slate-800',
  MODERE: 'bg-amber-100 text-amber-900',
  ELEVE: 'bg-orange-500 text-white',
  CRITIQUE: 'bg-rose-600 text-white',
  CRITIQUEEXTREME: 'bg-rose-900 text-white',
}

export function getRiskScoreColumns(): ColumnDef<RiskScoreView>[] {
  return [
    {
      accessorKey: 'entity_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Entité' />,
      cell: ({ row }) => <span className='ps-3 font-medium'>{row.original.entity_name}</span>,
      enableHiding: false,
      meta: { label: 'Entité' },
    },
    {
      accessorKey: 'entity_type',
      accessorFn: (row) => riskEntityLabels[row.entity_type] ?? row.entity_type,
      header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
      cell: ({ row }) => riskEntityLabels[row.original.entity_type] ?? row.original.entity_type,
      meta: { label: 'Type' },
      enableGrouping: true,
    },
    {
      accessorKey: 'score',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Score' />,
      cell: ({ row }) => <span className='font-semibold tabular-nums'>{row.original.score}</span>,
      meta: { label: 'Score' },
      enableGrouping: true,
    },
    {
      accessorKey: 'level',
      accessorFn: (row) => riskLevelLabels[row.level],
      sortingFn: (a, b) => riskLevelOrder[a.original.level] - riskLevelOrder[b.original.level],
      header: ({ column }) => <DataTableColumnHeader column={column} title='Niveau' />,
      cell: ({ row }) => (
        <Badge className={LEVEL_CLASS[row.original.level]}>
          {riskLevelLabels[row.original.level]}
        </Badge>
      ),
      meta: { label: 'Niveau' },
      enableGrouping: true,
    },
    {
      accessorKey: 'detail',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Détails' />,
      cell: ({ row }) => (
        <span className='line-clamp-2 max-w-xs text-xs text-muted-foreground'>
          {row.original.detail || '—'}
        </span>
      ),
      meta: { label: 'Détails' },
      enableGrouping: true,
    },
    {
      accessorKey: 'updated_at',
      accessorFn: (row) => new Date(row.updated_at).getTime(),
      header: ({ column }) => <DataTableColumnHeader column={column} title='Mis à jour' />,
      cell: ({ row }) => new Date(row.original.updated_at).toLocaleDateString('fr-FR'),
      meta: { label: 'Mis à jour' },
      enableGrouping: true,
    },
  ]
}