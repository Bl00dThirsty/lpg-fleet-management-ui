import type { ComponentType, ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

export type EntityPageProps = {
  /** Lucide icon shown next to the heading. */
  icon?: ComponentType<{ className?: string }>
  title: string
  /** Optional count badge rendered on the right side of the header. */
  count?: number
  /** Optional action slot next to the count badge (e.g. an export button). */
  actions?: ReactNode
  children: ReactNode
}

/**
 * Canonical page wrapper used by every list page in the app.
 *
 * Mirrors the verbatim `<main>` gradient + heading + body section block
 * that every list page duplicates verbatim. Pages that need a description
 * line above the heading should use the `PageShell` + `PageHeader` flow
 * instead — those layouts are heterogeneous (KPI tiles, descriptions, etc).
 */
export function EntityPage({
  icon: Icon,
  title,
  count,
  actions,
  children,
}: EntityPageProps) {
  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <header className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          {Icon ? <Icon className='h-6 w-6 text-primary' /> : null}
          <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
          {typeof count === 'number' && (
            <Badge variant='outline' className='ml-auto'>
              {count}
            </Badge>
          )}
          {actions}
        </div>
      </header>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        {children}
      </section>
    </main>
  )
}
