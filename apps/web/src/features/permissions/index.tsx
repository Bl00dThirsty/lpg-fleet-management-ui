import { useMemo, useState } from 'react'
import { Check, Minus } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import {
  getPermissionMatrix,
  getMatrixRoles,
  getMatrixCategories,
  roleLabel,
  getPermissionCountByRole,
  type PermissionMatrixRow,
} from './data/permissions-matrix'

export function PermissionsPage() {
  const rows = useMemo(() => getPermissionMatrix(), [])
  const roles = useMemo(() => getMatrixRoles(), [])
  const categories = useMemo(() => getMatrixCategories(), [])
  const counts = useMemo(() => getPermissionCountByRole(), [])
  const [filterCategory, setFilterCategory] = useState<string>('ALL')

  const visible = filterCategory === 'ALL' ? rows : rows.filter((r) => r.category === filterCategory)

  return (
    <PageShell>
      <PageHeader
        title='Matrice de permissions'
        description='Code par catégorie et accès accordé à chaque rôle système.'
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <KpiTile label='Permissions' value={String(rows.length)} />
        {roles.slice(0, 3).map((role) => (
          <KpiTile key={role} label={roleLabel(role)} value={String(counts[role])} />
        ))}
      </div>

      <SectionCard
        title='Matrice'
        description='Les rôles livrent leurs droits par la matrice ROLE_GRANTS (source unique @lpg/permissions).'
        actions={
          <div className='flex flex-wrap gap-1'>
            <FilterChip active={filterCategory === 'ALL'} label='Tout' onClick={() => setFilterCategory('ALL')} />
            {categories.map((c) => (
              <FilterChip
                key={c.id}
                active={filterCategory === c.id}
                label={c.label}
                onClick={() => setFilterCategory(c.id)}
              />
            ))}
          </div>
        }
      >
        <div className='overflow-auto rounded-md border'>
          <table className='w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b bg-muted/50'>
                <th className='sticky left-0 bg-muted/50 px-3 py-2 text-left font-medium'>Permission</th>
                {roles.map((role) => (
                  <th key={role} className='px-2 py-2 text-center font-medium'>
                    {roleLabel(role)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <MatrixRow key={row.code} row={row} roles={roles} />
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </PageShell>
  )
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
      )}
    >
      {label}
    </button>
  )
}

function MatrixRow({ row, roles }: { row: PermissionMatrixRow; roles: readonly string[] }) {
  return (
    <tr className='border-b last:border-0 hover:bg-muted/30'>
      <td className='sticky left-0 bg-background px-3 py-1.5'>
        <div className='flex items-center gap-2'>
          <span className='font-medium'>{row.label}</span>
          <Badge variant='secondary' className='font-mono text-[10px]'>
            {row.code}
          </Badge>
        </div>
      </td>
      {roles.map((role) => {
        const granted = row.grants[role as keyof typeof row.grants]
        return (
          <td key={role} className='px-2 py-1.5 text-center'>
            <span
              className={cn(
                'inline-flex size-5 items-center justify-center rounded',
                granted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-muted text-muted-foreground/40',
              )}
            >
              {granted ? <Check className='size-3.5' /> : <Minus className='size-3.5' />}
            </span>
          </td>
        )
      })}
    </tr>
  )
}