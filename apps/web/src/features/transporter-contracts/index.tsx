import { useMemo, useState } from 'react'
import { CheckCircle2, FileSignature, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@lpg/ui'
import { hasPermission } from '@lpg/permissions'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { useRoleStore } from '@/store/role-store'
import { useAuthStore } from '@/store/auth-store'
import { useContractsStore } from '@/store/contracts-store'
import { getScope } from '@/features/scope/scope'
import { TransporterContractsTable } from './components/transporter-contracts-table'
import { ContractFormDialog } from './components/contract-form-dialog'
import { getTransporterContracts, getTransporterContractSummary } from './data/transporter-contracts'

export function TransporterContractsPage() {
  const activeRole = useRoleStore((s) => s.activeRole)
  const user = useAuthStore((s) => s.user)
  const contracts = useContractsStore((s) => s.contracts)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const scope = useMemo(() => getScope(user), [user])
  const rows = useMemo(() => getTransporterContracts(contracts, scope), [contracts, scope])
  const summary = useMemo(() => getTransporterContractSummary(rows), [rows])

  return (
    <PageShell>
      <PageHeader
        title='Contrats transporteurs'
        description='Conventions marketeur-transporteur : preuve PDF, acceptation et dates de validité.'
        actions={hasPermission(activeRole, 'contracts.create') ? <Button onClick={() => setCreateOpen(true)}><Plus className='mr-1 size-4' /> Nouveau contrat</Button> : undefined}
      />
       <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <KpiTile label='Total' value={String(summary.total)} icon={<FileSignature className='size-4 text-primary' />} />
        <KpiTile label='Actifs' value={String(summary.active)} icon={<CheckCircle2 className='size-4 text-emerald-500' />} />
        <KpiTile label='Principaux' value={String(summary.primary)} icon={<ShieldCheck className='size-4 text-indigo-500' />} />
        <KpiTile label='En attente' value={String(summary.pending)} icon={<ShieldCheck className='size-4 text-amber-500' />} />
      </div>
      <SectionCard>
        <TransporterContractsTable rows={rows} onEdit={setEditingId} />
      </SectionCard>
      <ContractFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ContractFormDialog
        open={editingId !== null}
        onOpenChange={(open) => { if (!open) setEditingId(null) }}
        contract={editingId ? contracts.find((contract) => contract.id === editingId) ?? null : null}
      />
    </PageShell>
  )
}
