import { getRouteApi } from '@tanstack/react-router'
import { FileCheck, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@lpg/api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEntityPermission } from '@/lib/permissions/use-entity-permission'
import { vehiclesHooks } from '@/lib/api/use-resources'
import { CertificatesTable } from './components/certificates-table'
import { CertificateDetailsSheet } from './components/certificate-details-sheet'
import { CertificateEditSheet } from './components/certificate-edit-sheet'
import { getCertificates } from './data/certificates'
import { certificateDeletePatch } from './data/certificates-crud'
import type { CertificateView } from './data/certificates'

const route = getRouteApi('/_authenticated/certificates/')

export function CertificatesPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const perm = useEntityPermission('certificates')
  const qc = useQueryClient()
  const [detailsCert, setDetailsCert] = useState<CertificateView | null>(null)
  const [editCert, setEditCert] = useState<CertificateView | null | 'new'>(null)
  const vehiclesQuery = vehiclesHooks.useList({ limit: 100 })
  const certificates = useMemo(
    () => getCertificates(vehiclesQuery.data ?? []),
    [vehiclesQuery.data],
  )
  const deleteMut = useMutation({
    mutationFn: (certificate: CertificateView) =>
      api.vehicles.patch(certificate.vehicleId, certificateDeletePatch()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  const handleViewDetails = useCallback((certificate: CertificateView) => {
    setDetailsCert(certificate)
  }, [])

  const handleOpenEdit = useCallback((certificate: CertificateView) => {
    setEditCert(certificate)
  }, [])

  const handleDelete = useCallback(
    async (certificate: CertificateView) => {
      try {
        await deleteMut.mutateAsync(certificate)
        toast.success('Certificat supprimé.')
      } catch {
        toast.error('Échec de la suppression.')
      }
    },
    [deleteMut],
  )

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <FileCheck className='h-6 w-6 text-primary' />
          <h1 className='text-2xl font-bold tracking-tight'>Certificats</h1>
          <Badge variant='outline' className='ml-auto'>
            {certificates.length}
          </Badge>
          {perm.canCreate && (
            <Button onClick={() => setEditCert('new')}>
              <Plus className='mr-1 h-4 w-4' /> Nouveau certificat
            </Button>
          )}
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <CertificatesTable
          data={certificates}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      </section>

      <CertificateDetailsSheet
        certificate={detailsCert}
        open={detailsCert !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsCert(null)
        }}
      />

      <CertificateEditSheet
        certificate={editCert === 'new' ? null : editCert}
        open={editCert !== null}
        onOpenChange={(open) => {
          if (!open) setEditCert(null)
        }}
        onSaved={() => qc.invalidateQueries({ queryKey: ['vehicles'] })}
      />
    </main>
  )
}
