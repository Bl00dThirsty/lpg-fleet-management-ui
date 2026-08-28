import { useMemo } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { getContractSummary, getContractsByTransporter, type ContractByTransporter } from './data/contracts'

export function ContractsPage() {
  const rows = useMemo(() => getContractsByTransporter(), [])
  const summary = useMemo(() => getContractSummary(), [])

  return (
    <PageShell>
      <PageHeader
        title='Contrats marketeurs'
        description='Vue transporteur : contrats signés avec les marketeurs.'
      />

      <div className='grid gap-4 sm:grid-cols-4'>
        <KpiTile label='Transporteurs' value={String(summary.transporters)} />
        <KpiTile label='Contrats' value={String(summary.totalContracts)} />
        <KpiTile label='Actifs' value={String(summary.active)} />
        <KpiTile label='Contrats principaux' value={String(summary.primary)} />
      </div>

      <SectionCard title='Contrats par transporteur' description='Chaque transporteur et ses relations contractuelles avec les marketeurs.'>
        <div className='space-y-2'>
          {rows.map((row) => (
            <ContractRow key={row.transporterId} row={row} />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

function ContractRow({ row }: { row: ContractByTransporter }) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'>
      <div className='flex min-w-0 items-center gap-2'>
        <ShieldCheck className='size-4 shrink-0 text-primary' />
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{row.transporterName}</p>
          <p className='truncate text-xs text-muted-foreground'>{row.marketeurs.join(', ')}</p>
        </div>
      </div>
      <div className='flex items-center gap-1.5'>
        {row.primaryCount > 0 && <Badge>Principal</Badge>}
        <Badge variant={row.activeCount > 0 ? 'default' : 'secondary'}>
          {row.activeCount} actif(s)
        </Badge>
        <span className='text-xs text-muted-foreground'>{row.contractCount} contrats</span>
      </div>
    </div>
  )
}