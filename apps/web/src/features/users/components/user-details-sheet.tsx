import { ShieldCheck, UserRound, Users } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lpg/ui'
import { EntityDetailTabs } from '@/components/entity-table'
import type { UserView } from '../data/users'
import { mfaStatusLabel, userStatusLabel } from '../data/users'

type UserDetailsSheetProps = {
  user: UserView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailsSheet({
  user,
  open,
  onOpenChange,
}: UserDetailsSheetProps) {
  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader className='pb-4'>
          <div className='flex items-start justify-between gap-3 pe-8'>
            <div>
              <SheetTitle className='text-xl'>{user.fullName}</SheetTitle>
              <SheetDescription>
                {user.roleLabel} · {user.orgName}
              </SheetDescription>
            </div>
            <Badge variant='outline' className='font-medium'>
              {userStatusLabel(user.status)}
            </Badge>
          </div>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          <div className='grid grid-cols-2 gap-3'>
            <MetricCard
              label='Rôle'
              value={user.roleLabel}
              detail='System role'
            />
            <MetricCard
              label='Statut'
              value={userStatusLabel(user.status)}
              detail='Account status'
            />
            <MetricCard
              label='MFA'
              value={mfaStatusLabel(user.mfaStatus)}
              detail='Multi-factor auth'
            />
            <MetricCard
              label='Dernière connexion'
              value={user.lastLogin}
              detail='Last login'
            />
          </div>

          <EntityDetailTabs
            defaultValue='info'
            tabs={[
              {
                value: 'info',
                label: 'Informations',
                icon: Users,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <Users className='size-4 text-primary' />
                        Informations générales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine label='ID' value={user.id} />
                      <DetailLine label='Nom' value={user.fullName} />
                      <DetailLine label='E-mail' value={user.email} />
                      <DetailLine label='Organisation' value={user.orgName} />
                      <DetailLine label='Rôle' value={user.roleLabel} />
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
                        value={userStatusLabel(user.status)}
                      />
                      <DetailLine
                        label='MFA'
                        value={mfaStatusLabel(user.mfaStatus)}
                      />
                      <DetailLine label='Dernière connexion' value={user.lastLogin} />
                      <DetailLine label='Créé le' value={user.created_at} />
                      <DetailLine label='Mis à jour' value={user.updated_at} />
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
    <div className='surface-sunken flex items-start gap-2 p-3'>
      <UserRound className='mt-1 size-4 text-primary' />
      <div>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <p className='mt-1 text-lg leading-none font-semibold'>{value}</p>
        <p className='mt-1 text-xs text-muted-foreground'>{detail}</p>
      </div>
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
