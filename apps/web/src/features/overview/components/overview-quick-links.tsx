import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { Role } from '@/config/rbac/roles'
import { getSidebarData } from '@/config/rbac/sidebar-by-role'
import type { NavItem } from '@/components/layout/types'

type QuickLink = {
  title: string
  url: string
  icon?: NavItem['icon']
}

/**
 * "Accès rapides" — the sidebar navigation projected as a professional
 * grouped link grid. Grouping mirrors the sidebar structure so users find
 * their modules the same way they navigate.
 */
export function OverviewQuickLinks({ role }: { role: Role }) {
  const groups = useMemo(() => {
    const sidebar = getSidebarData(role)
    return sidebar.navGroups
      .map((group) => ({
        title: group.title,
        links: group.items.flatMap((item): QuickLink[] =>
          'items' in item && item.items
            ? (item.items ?? []).map((sub) => ({
                title: sub.title,
                url: sub.url as string,
                icon: sub.icon,
              }))
            : [{ title: item.title, url: item.url as string, icon: item.icon }]
        ),
      }))
      .filter((group) => group.links.length > 0)
  }, [role])

  return (
    <section className='space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <div className='space-y-1'>
          <h2 className='text-lg font-semibold tracking-tight'>
            Accès rapides
          </h2>
          <p className='text-sm text-muted-foreground'>
            Vos modules les plus utiles, groupés par domaine.
          </p>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {groups.map((group) => (
          <div
            key={group.title}
            className='rounded-2xl border border-border/60 bg-background shadow-none'
          >
            <div className='border-b border-border/60 px-4 py-3'>
              <p className='text-sm font-medium'>{group.title}</p>
            </div>
            <div className='divide-y divide-border/40'>
              {group.links.map((link) => (
                <Link
                  key={String(link.url)}
                  to={link.url as never}
                  className='group flex items-center justify-between gap-2 px-4 py-2.5 transition-colors hover:bg-muted/40'
                >
                  <span className='flex min-w-0 items-center gap-2 text-sm'>
                    {link.icon ? (
                      <link.icon className='size-4 shrink-0 text-primary' />
                    ) : null}
                    <span className='truncate'>{link.title}</span>
                  </span>
                  <ArrowRight className='size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5' />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
