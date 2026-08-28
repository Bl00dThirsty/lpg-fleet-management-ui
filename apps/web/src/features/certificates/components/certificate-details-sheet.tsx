import { FileCheck2 } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lpg/ui'
import { EntityDetailTabs } from '@/components/entity-table'
import type { CertificateView } from '../data/certificates'
import { certStatusLabel } from '../data/certificates'

type CertificateDetailsSheetProps = {
  certificate: CertificateView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CertificateDetailsSheet({
  certificate,
  open,
  onOpenChange,
}: CertificateDetailsSheetProps) {
  if (!certificate) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader className='pb-4'>
          <div className='flex items-start justify-between gap-3 pe-8'>
            <div>
              <SheetTitle className='text-xl'>
                {certificate.licensePlate}
              </SheetTitle>
              <SheetDescription>
                Certificat · {certificate.vehicleType}
              </SheetDescription>
            </div>
            <Badge variant='outline' className='font-medium'>
              {certStatusLabel(certificate.status)}
            </Badge>
          </div>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          <div className='grid grid-cols-2 gap-3'>
            <MetricCard
              label='Statut'
              value={certStatusLabel(certificate.status)}
              detail='Certificate status'
            />
            <MetricCard
              label='Type'
              value={certificate.vehicleType}
              detail='Vehicle type'
            />
            <MetricCard
              label='Émis le'
              value={certificate.issuedAt.slice(0, 10)}
              detail='Issued date'
            />
            <MetricCard
              label='Expire le'
              value={certificate.expiryAt.slice(0, 10)}
              detail='Expiry date'
            />
          </div>

          <EntityDetailTabs
            defaultValue='info'
            tabs={[
              {
                value: 'info',
                label: 'Informations',
                icon: FileCheck2,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <FileCheck2 className='size-4 text-primary' />
                        Informations générales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine label='Véhicule' value={certificate.vehicleId} />
                      <DetailLine label='Plaque' value={certificate.licensePlate} />
                      <DetailLine label='Certificat n°' value={certificate.certificateNumber} />
                      <DetailLine label='Type' value={certificate.vehicleType} />
                      <DetailLine label='Émis le' value={certificate.issuedAt} />
                      <DetailLine label='Expire le' value={certificate.expiryAt} />
                    </CardContent>
                  </Card>
                ),
              },
              {
                value: 'details',
                label: 'Détails',
                icon: FileCheck2,
                content: (
                  <div className='space-y-3'>
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center gap-2 text-sm'>
                          <FileCheck2 className='size-4 text-primary' />
                          Détails
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <DetailLine label='Titulaire / Org' value={certificate.orgName} />
                        <DetailLine label='Statut' value={certStatusLabel(certificate.status)} />
                        <DetailLine label='Référence' value={certificate.id} />
                      </CardContent>
                    </Card>

                    <p className='text-xs text-muted-foreground'>
                      Le prévisualisation du document n'est pas disponible dans
                      cette vue. Statut actuel :{' '}
                      {certStatusLabel(certificate.status)}.
                    </p>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className='surface-sunken p-3'>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p className='mt-1 text-lg leading-none font-semibold'>{value}</p>
      <p className='mt-1 text-xs text-muted-foreground'>{detail}</p>
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-3 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='max-w-72 text-right font-medium'>{value}</span>
    </div>
  )
}