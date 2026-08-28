import { Link } from '@tanstack/react-router'
import { Gauge, SlidersHorizontal, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEntityPermission } from '@/components/entity-crud'

const tabs = [
  {
    id: 'settings',
    label: 'Règles métier',
    icon: SlidersHorizontal,
    to: '/settings',
    requires: 'settings.read',
  },
  {
    id: 'system',
    label: 'Configuration système',
    icon: Gauge,
    to: '/settings/system',
    requires: 'settings.read',
  },
  {
    id: 'notification-groups',
    label: 'Groupes de notification',
    icon: UserCog,
    to: '/settings/notification-groups',
    requires: 'notification-groups.write',
  },
] as const

export function SettingsTabs({ active }: { active: 'settings' | 'system' | 'notification-groups' }) {
  const perm = useEntityPermission('settings')
  const notif = useEntityPermission('notification-groups')

  const visible = tabs.filter((tab) => {
    if (tab.id === 'notification-groups') return notif.canWrite || notif.canRead
    return perm.canRead
  })

  return (
    <nav className='flex flex-wrap items-center gap-1 border-b'>
      {visible.map((tab) => (
        <Link
          key={tab.id}
          to={tab.to}
          className={cn(
            'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors',
            active === tab.id
              ? 'border-primary font-medium text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <tab.icon className='size-4' />
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}