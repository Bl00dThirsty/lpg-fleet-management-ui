import { useMemo } from 'react'
import { KeyRound, Lock } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { getPasswordSummary, getPasswordUsers, type PasswordUserView } from './data/passwords'

export function PasswordsPage() {
  const users = useMemo(() => getPasswordUsers(), [])
  const summary = useMemo(() => getPasswordSummary(), [])

  return (
    <PageShell>
      <PageHeader
        title='Reset mots de passe'
        description='Utilisateurs nécessitant une réinitialisation ou un déblocage.'
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <KpiTile label='Utilisateurs' value={String(summary.total)} />
        <KpiTile label='Changement requis' value={String(summary.mustChange)} />
        <KpiTile label='Comptes verrouillés' value={String(summary.locked)} />
      </div>

      <SectionCard title='Utilisateurs' description='État du compte et alertes de mot de passe (lecture seule).'>
        <div className='space-y-2'>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

function UserRow({ user }: { user: PasswordUserView }) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'>
      <div className='flex min-w-0 items-center gap-2'>
        <KeyRound className='size-4 shrink-0 text-primary' />
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{user.fullName}</p>
          <p className='truncate text-xs text-muted-foreground'>
            {user.email} / {user.role}
          </p>
        </div>
      </div>
      <div className='flex items-center gap-1.5'>
        {user.lockedUntil ? (
          <Badge variant='destructive'>
            <Lock className='mr-1 size-3' /> Verrouillé
          </Badge>
        ) : user.mustChange ? (
          <Badge variant='secondary'>Changement requis</Badge>
        ) : (
          <Badge variant='outline'>OK</Badge>
        )}
        {user.lastLogin && (
          <span className='text-xs text-muted-foreground'>Dernière connexion : {user.lastLogin.slice(0, 10)}</span>
        )}
      </div>
    </div>
  )
}