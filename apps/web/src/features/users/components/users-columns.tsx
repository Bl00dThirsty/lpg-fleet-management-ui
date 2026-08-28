import { type ColumnDef } from '@tanstack/react-table'
import { Badge, DataTableColumnHeader } from '@lpg/ui'
import type { UserView } from '../data/users'
import { mfaStatusLabel, userStatusLabel } from '../data/users'
import { ROLE_LABELS } from '@/config/rbac/roles'
import { UserRowActions } from './user-row-actions'

export function getUsersColumns({
  onViewDetails,
  onEdit,
}: {
  onViewDetails: (user: UserView) => void
  onEdit: (user: UserView) => void
}): ColumnDef<UserView>[] {
  return [
    {
      accessorKey: 'fullName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Nom' />
      ),
      cell: ({ row }) => (
        <button
          type='button'
          onClick={() => onViewDetails(row.original)}
          className='font-medium text-primary underline-offset-4 hover:underline'
        >
          {row.original.fullName}
        </button>
      ),
      meta: { label: 'Nom' },
      enableHiding: false,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='E-mail' />
      ),
      cell: ({ row }) => row.original.email,
      meta: { label: 'E-mail' },
      enableGrouping: true,
    },
    {
      accessorKey: 'orgName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Organisation' />
      ),
      cell: ({ row }) => row.original.orgName,
      meta: { label: 'Organisation' },
      enableGrouping: true,
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Rôle' />
      ),
      cell: ({ row }) => (
        <Badge variant='outline'>{ROLE_LABELS[row.original.role]}</Badge>
      ),
      filterFn: (row, _id, value) => row.original.role === value,
      meta: { label: 'Rôle' },
      enableGrouping: true,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Statut' />
      ),
      cell: ({ row }) => (
        <Badge variant='outline'>{userStatusLabel(row.original.status)}</Badge>
      ),
      filterFn: (row, _id, value) => row.original.status === value,
      meta: { label: 'Statut' },
      enableGrouping: true,
    },
    {
      accessorKey: 'mfaStatus',
      header: 'MFA',
      cell: ({ row }) => mfaStatusLabel(row.original.mfaStatus),
      meta: { label: 'MFA' },
      enableGrouping: true,
    },
    {
      accessorKey: 'lastLogin',
      header: 'Dernière connexion',
      cell: ({ row }) => row.original.lastLogin,
      meta: { label: 'Dernière connexion' },
      enableGrouping: true,
    },
    {
      id: 'actions',
      header: '',
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <UserRowActions
            user={row.original}
            onEdit={onEdit}
            onViewDetails={onViewDetails}
          />
        </div>
      ),
      meta: { label: 'Actions' },
    },
  ]
}
