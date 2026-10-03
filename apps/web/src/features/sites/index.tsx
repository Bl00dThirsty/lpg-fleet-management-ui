import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@lpg/api-client'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import type { SiteRole, SiteRow, TransitionRequest } from './lib/site-status-machine'
import { canTransition } from './lib/site-status-machine'
import { SitesTable } from './components/sites-table'
import { SiteStatusBadge } from './components/site-status-badge'
import { defaultThresholds, getSiteRows, getClientSiteRows, getVerificationInbox } from './data/site-lifecycle'
import { clientSiteFields, clientSiteFromForm, siteFields, siteFromForm } from './data/sites-crud'
import { EntityFormSheet, useEntityPermission } from '@/components/entity-crud'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { assertPermission } from '@/lib/security/guards'

export function SitesScreen({ kind, role }: { kind: 'site' | 'client_site'; role: SiteRole }) {
  const perm = useEntityPermission('sites')
  const navigate = useNavigate()
  const [rows, setRows] = useState<SiteRow[]>(() =>
    kind === 'site' ? getSiteRows() : getClientSiteRows(),
  )
  const [creating, setCreating] = useState(false)

  const openOnMap = useCallback(
    (row: SiteRow) => {
      navigate({ to: '/map', search: { site: row.id } })
    },
    [navigate],
  )

  const handleAction = (row: SiteRow, request: TransitionRequest) => {
    const required = request.kind === 'verify' ? 'sites.verify' : 'sites.write'
    try {
      assertPermission(role, required)
    } catch {
      toast.error('Accès refusé pour cette action.')
      return
    }
    // Derive the next status from the state machine (single source of truth)
    // rather than a hardcoded map. The menu already hides invalid transitions,
    // so `canTransition` should always be ok here.
    const result = canTransition(row, role, request)
    if (!result.ok || !result.nextStatus) {
      toast.error('Transition non autorisée.')
      return
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: result.nextStatus! } : r)))
    const labels: Record<string, string> = { verify: 'vérifié', suspend: 'suspendu', reject: 'rejeté', reassign: 'réassigné' }
    toast[request.kind === 'reject' ? 'error' : request.kind === 'suspend' ? 'warning' : 'success'](`${row.name} marqué comme ${labels[request.kind]}`)
  }

  const handleDelete = useCallback(
    async (row: SiteRow) => {
      try {
        if (kind === 'site') await api.sites.remove(row.id)
        else await api.clientSites.remove(row.id)
        toast.success(`Site ${row.name} supprimé.`)
        setRows(kind === 'site' ? getSiteRows() : getClientSiteRows())
      } catch {
        toast.error('Échec de la suppression.')
      }
    },
    [kind],
  )

  const handleCreate = useCallback(
    async (values: Record<string, unknown>) => {
      try {
        if (kind === 'site') await api.sites.create(siteFromForm(values) as never)
        else await api.clientSites.create(clientSiteFromForm(values) as never)
        toast.success(kind === 'site' ? 'Site créé.' : 'Site client créé.')
        setCreating(false)
        setRows(kind === 'site' ? getSiteRows() : getClientSiteRows())
      } catch {
        toast.error('Échec de la création.')
      }
    },
    [kind],
  )

  const regionCount = new Set(rows.map((r) => r.region)).size
  const title = kind === 'site' ? 'Sites opérationnels' : 'Sites clients'
  return (
    <PageShell>
      <PageHeader
        title={title}
        description={`${rows.length} site(s) répartis sur ${regionCount} région(s). Statuts: UNASSIGNED → ASSIGNED → ACTIVE → VERIFIED. SUSPENDED/REJECTED accessibles par AGENT/ADMIN/SUPERADMIN.`}
        actions={
          perm.canCreate ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className='mr-1 h-4 w-4' />
              {kind === 'site' ? 'Nouveau site' : 'Nouveau site client'}
            </Button>
          ) : undefined
        }
      />
      <SectionCard>
        <SitesTable rows={rows} role={role} onAction={handleAction} onDelete={handleDelete} onOpenMap={openOnMap} />
      </SectionCard>

      <EntityFormSheet
        open={creating}
        onOpenChange={setCreating}
        title={kind === 'site' ? 'Nouveau site' : 'Nouveau site client'}
        description='Renseignez le site. Sa position GPS est optionnelle : renseignez-la si vous la connaissez. Son statut initial est UNASSIGNED.'
        fields={kind === 'site' ? siteFields : clientSiteFields}
        onSubmit={handleCreate}
        onCancel={() => setCreating(false)}
        submitLabel='Créer'
      />
    </PageShell>
  )
}

export function SiteVerificationsScreen({ role }: { role: SiteRole }) {
  const navigate = useNavigate()
  const [openRow, setOpenRow] = useState<SiteRow | null>(null)
  const [inbox, setInbox] = useState<SiteRow[]>(() => getVerificationInbox())
  const handleAction = (row: SiteRow, request: TransitionRequest) => {
    if (request.kind === 'verify') { setInbox((prev) => prev.filter((r) => r.id !== row.id)); toast.success(`${row.name} vérifié`) }
    else if (request.kind === 'suspend' || request.kind === 'reject') { setInbox((prev) => prev.filter((r) => r.id !== row.id)); toast.info(`${row.name} retiré de la file`) }
    setOpenRow(null)
  }
  const openOnMap = (row: SiteRow) => {
    navigate({ to: '/map', search: { site: row.id } })
  }
  return (
    <PageShell>
      <PageHeader title='File de vérification' description={`${inbox.length} site(s) en attente de validation par AGENT/ADMIN/SUPERADMIN.`} />
      <SectionCard><SitesTable rows={inbox} role={role} onAction={handleAction} onOpenMap={openOnMap} /></SectionCard>
      {openRow && (
        <Dialog open onOpenChange={(open) => { if (!open) setOpenRow(null) }}>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>{openRow.name} <span className='font-mono text-xs text-muted-foreground'>({openRow.id})</span></DialogTitle>
              <DialogDescription>
                Fiche synthétique du site dans la file de vérification.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-1 text-sm'>
              <p>Statut: <SiteStatusBadge row={openRow} thresholds={defaultThresholds} /></p>
              <p>Livraisons: {openRow.delivery_count}</p>
              <p>Confiance geo: {openRow.geo_confidence_score}/100</p>
              <p>Région: {openRow.region}</p>
            </div>
            <Button variant='ghost' className='mt-4' onClick={() => setOpenRow(null)}>Fermer</Button>
          </DialogContent>
        </Dialog>
      )}
    </PageShell>
  )
}
