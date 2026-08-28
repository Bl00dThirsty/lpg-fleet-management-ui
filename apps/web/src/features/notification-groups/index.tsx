import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import {
  getActiveNotificationGroupCount,
  getNotificationGroups,
  getTotalGroupMembers,
  type NotificationGroupView,
} from './data/notification-groups'
import { SettingsTabs } from '@/features/settings/components/settings-tabs'

export function NotificationGroupsPage() {
  const groups = useMemo(() => getNotificationGroups(), [])
  const active = useMemo(() => getActiveNotificationGroupCount(), [])
  const totalMembers = useMemo(() => getTotalGroupMembers(), [])
  const [expandedId, setExpandedId] = useState<string | null>(groups[0]?.id ?? null)

  return (
    <PageShell>
      <SettingsTabs active='notification-groups' />
      <PageHeader
        title='Groupes de notification'
        description='Groupes cibles pour l’envoi des alertes et notifications.'
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <KpiTile label='Groupes' value={String(groups.length)} />
        <KpiTile label='Groupes actifs' value={String(active)} />
        <KpiTile label='Membres affectés' value={String(totalMembers)} />
      </div>

      <SectionCard title='Groupes' description='Chaque groupe regroupe des utilisateurs par spécialité.'>
        <div className='space-y-2'>
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              expanded={expandedId === group.id}
              onToggle={() => setExpandedId(expandedId === group.id ? null : group.id)}
            />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

function GroupCard({
  group,
  expanded,
  onToggle,
}: {
  group: NotificationGroupView
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className='rounded-lg border p-3'>
      <button type='button' onClick={onToggle} className='flex w-full items-center justify-between gap-2 text-left'>
        <div className='flex items-center gap-2'>
          <Users className='size-4 text-primary' />
          <span className='font-medium'>{group.name}</span>
          <Badge variant='secondary' className='hidden sm:inline-flex'>
            {group.typeLabel}
          </Badge>
          <Badge
            variant={group.isActive ? 'default' : 'secondary'}
            className={cn(!group.isActive && 'text-muted-foreground')}
          >
            {group.isActive ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
        <span className='text-xs text-muted-foreground'>{group.memberCount} membres</span>
      </button>

      {expanded && (
        <div className='mt-3 border-t pt-3'>
          {group.memberCount === 0 ? (
            <p className='text-sm text-muted-foreground'>Aucun membre affecté.</p>
          ) : (
            <ul className='grid gap-1 sm:grid-cols-2'>
              {group.members.map((m) => (
                <li key={m.userId} className='text-sm'>
                  {m.fullName}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}