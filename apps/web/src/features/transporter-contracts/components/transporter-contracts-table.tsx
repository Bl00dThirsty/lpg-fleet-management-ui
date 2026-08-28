import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { Button, DataTablePagination, DataTableToolbar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@lpg/ui'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { hasPermission } from '@lpg/permissions'
import { cn } from '@/lib/utils'
import { getScope, isRegulateurView } from '@/features/scope/scope'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import { useAuthStore } from '@/store/auth-store'
import { useContractsStore } from '@/store/contracts-store'
import { useRoleStore } from '@/store/role-store'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { getTransporterContractColumns } from './transporter-contracts-columns'
import type { TransporterContractView } from '../data/transporter-contracts'

export function TransporterContractsTable({ rows, onEdit }: { rows: TransporterContractView[]; onEdit: (id: string) => void }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const role = useRoleStore((state) => state.activeRole)
  const user = useAuthStore((s) => s.user)
  const scope = useMemo(() => getScope(user), [user])
  const store = useContractsStore((s) => s)
  const columns = useMemo(() => getTransporterContractColumns((row) => {
    const owner = isRegulateurView(scope) || row.marketeur_org_id === scope.orgId
    const transporter = isRegulateurView(scope) || row.transporter_org_id === scope.orgId
    const canWrite = hasPermission(role, 'contracts.write') && owner
    const canValidate = hasPermission(role, 'contracts.validate') && transporter
    const canSuspend = hasPermission(role, 'contracts.suspend') && isRegulateurView(scope)
    const canDelete = hasPermission(role, 'contracts.delete') && owner
    if (!canWrite && !canValidate && !canSuspend && !canDelete) return null
    const run = (message: string, operation: () => void) => {
      try { operation(); toast.success(message) } catch (error) { toast.error(extractErrorMessage(error)) }
    }
    const attach = (file: File | undefined) => {
      if (!file) return
      if (file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024) { toast.error('Sélectionnez un PDF de 5 Mo maximum'); return }
      const reader = new FileReader()
      reader.onload = () => run('Preuve jointe', () => store.attachProof(row.id, String(reader.result)))
      reader.onerror = () => toast.error('Impossible de lire le fichier PDF')
      reader.readAsDataURL(file)
    }
    return <DropdownMenu><DropdownMenuTrigger asChild><Button variant='ghost' size='icon' aria-label={`Actions ${row.reference}`}><MoreHorizontal className='size-4' /></Button></DropdownMenuTrigger><DropdownMenuContent align='end'><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuSeparator />
      {canWrite && !row.has_proof ? <DropdownMenuItem onSelect={() => document.getElementById(`proof-${row.id}`)?.click()}>Joindre la preuve<input id={`proof-${row.id}`} type='file' accept='application/pdf' className='hidden' onChange={(event) => attach(event.target.files?.[0])} /></DropdownMenuItem> : null}
      {canValidate && row.has_proof && row.status === 'PENDINGTRANSPORTERACK' ? <DropdownMenuItem onSelect={() => run('Contrat accepté', () => store.accept(row.id))}>Accepter</DropdownMenuItem> : null}
      {canWrite ? <DropdownMenuItem onSelect={() => onEdit(row.id)}>Modifier</DropdownMenuItem> : null}
      {canSuspend ? <DropdownMenuItem onSelect={() => run(row.is_active ? 'Contrat suspendu' : 'Contrat réactivé', () => row.is_active ? store.suspend(row.id) : store.reactivate(row.id))}>{row.is_active ? 'Suspendre' : 'Réactiver'}</DropdownMenuItem> : null}
      {canWrite && !row.is_primary ? <DropdownMenuItem onSelect={() => run('Contrat principal défini', () => store.setPrimary(row.id))}>Définir principal</DropdownMenuItem> : null}
      {canDelete ? <DropdownMenuItem className='text-destructive' onSelect={() => run('Contrat supprimé', () => store.remove(row.id))}>Supprimer</DropdownMenuItem> : null}
    </DropdownMenuContent></DropdownMenu>
  }), [onEdit, role, scope, store])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Rechercher un contrat, transporteur...'
        searchKey='reference'
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className={cn(header.column.columnDef.meta?.className)}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  Aucun contrat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
