import { ShieldCheck, Truck } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lpg/ui'
import { EntityDetailTabs } from '@/components/entity-table'
import type { LivreurView } from '../data/livreurs'
import {
  livreurStatusLabel,
  mfaStatusLabel,
} from '../data/livreurs'

type LivreurDetailsSheetProps = {
  livreur: LivreurView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LivreurDetailsSheet({
  livreur,
  open,
  onOpenChange,
}: LivreurDetailsSheetProps) {
  if (!livreur) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader className='pb-4'>
          <div className='flex items-start justify-between gap-3 pe-8'>
            <div>
              <SheetTitle className='text-xl'>{livreur.fullName}</SheetTitle>
              <SheetDescription>
                Livreur · {livreur.orgName}
              </SheetDescription>
            </div>
            <Badge variant='outline' className='font-medium'>
              {livreurStatusLabel(livreur.status)}
            </Badge>
          </div>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          <div className='grid grid-cols-2 gap-3'>
            <MetricCard
              label='Organisation'
              value={livreur.orgName}
              detail='Délivery org'
            />
            <MetricCard
              label='Statut'
              value={livreurStatusLabel(livreur.status)}
              detail='Account status'
            />
            <MetricCard
              label='MFA'
              value={mfaStatusLabel(livreur.mfaStatus)}
              detail='Multi-factor auth'
            />
            <MetricCard
              label='Dernière connexion'
              value={livreur.lastLogin}
              detail='Last login'
            />
          </div>

          <EntityDetailTabs
            defaultValue='info'
            tabs={[
              {
                value: 'info',
                label: 'Informations',
                icon: Truck,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <Truck className='size-4 text-primary' />
                        Informations générales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine label='ID' value={livreur.id} />
                      <DetailLine label='Nom' value={livreur.fullName} />
                      <DetailLine label='E-mail' value={livreur.email} />
                      <DetailLine label='Organisation' value={livreur.orgName} />
                    </CardContent>
                  </Card>
                ),
              },
              {
                value: 'details',
                label: 'Détails',
                icon: ShieldCheck,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <ShieldCheck className='size-4 text-primary' />
                        Détails
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine
                        label='Statut'
                        value={livreurStatusLabel(livreur.status)}
                      />
                      <DetailLine
                        label='MFA'
                        value={mfaStatusLabel(livreur.mfaStatus)}
                      />
                      <DetailLine
                        label='Dernière connexion'
                        value={livreur.lastLogin}
                      />
                      <DetailLine label='Créé le' value={livreur.created_at} />
                    </CardContent>
                  </Card>
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