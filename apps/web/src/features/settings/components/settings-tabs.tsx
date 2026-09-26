import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Bell, Gauge, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEntityPermission } from '@/components/entity-crud'

export function SettingsTabs() {
  const { t } = useTranslation('common')
  const { pathname } = useLocation()
  const settingsPermission = useEntityPermission('settings')
  const notificationPermission = useEntityPermission('notification-groups')
  const tabs = [
    {
      label: t('settings.tabs.profile'),
      icon: UserCog,
      to: '/settings/profile',
      visible: true,
    },
    {
      label: t('settings.tabs.system'),
      icon: Gauge,
      to: '/settings/system',
      visible: settingsPermission.canRead || settingsPermission.canWrite,
    },
    {
      label: t('settings.tabs.notifications'),
      icon: Bell,
      to: '/settings/notification-groups',
      visible: notificationPermission.canRead || notificationPermission.canWrite,
    },
  ] as const

  return (
    <nav
      aria-label={t('settings.tabs.label')}
      className='flex flex-wrap gap-1 overflow-x-auto border-b'
    >
      {tabs
        .filter((tab) => tab.visible)
        .map((tab) => {
          const active = pathname === tab.to
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <tab.icon className='size-4' />
              {tab.label}
            </Link>
          )
        })}
    </nav>
  )
}
