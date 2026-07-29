import { cn } from '@lpg/ui'
import { type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

type PageShellProps = React.HTMLAttributes<HTMLElement> & {
  fluid?: boolean
  children?: ReactNode
}

export function PageShell({ fluid, className, children, ...props }: PageShellProps) {
  return (
    <main
      id='main-content'
      className={cn('flex-1 space-y-6 p-4 sm:p-6 lg:p-8', !fluid && 'mx-auto w-full max-w-7xl', className)}
      {...props}
    >
      {children}
    </main>
  )
}

type KpiTileProps = {
  label: string
  value: string
  delta?: string
  trend?: 'up' | 'down'
  icon?: ReactNode
}

export function KpiTile({ label, value, delta, trend, icon }: KpiTileProps) {
  return (
    <div className='surface-card group relative overflow-hidden p-5 transition-shadow hover:shadow-md'>
      <div className='absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg bg-muted/60'>
        {icon}
      </div>
      <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>{label}</p>
      <p className='mt-2 text-3xl font-bold tracking-tight'>{value}</p>
      {delta && (
        <div className='mt-2 flex items-center gap-1.5'>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
              trend === 'up' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
            )}
          >
            {trend === 'up' ? <ArrowUpRight className='size-3' /> : <ArrowDownRight className='size-3' />}
            {delta}
          </span>
        </div>
      )}
    </div>
  )
}

type SectionCardProps = {
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export function SectionCard({ title, description, actions, className, bodyClassName, children }: SectionCardProps) {
  return (
    <section className={cn('surface-card', className)}>
      {(title || actions) && (
        <header className='flex items-start justify-between gap-3 border-b border-border/50 p-5'>
          <div>
            {title && <h2 className='text-sm font-semibold tracking-tight'>{title}</h2>}
            {description && <p className='mt-1 text-xs text-muted-foreground'>{description}</p>}
          </div>
          {actions && <div className='flex items-center gap-2'>{actions}</div>}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className='surface-card flex flex-col items-center justify-center gap-3 p-12 text-center'>
      <p className='text-base font-semibold'>{title}</p>
      {description && <p className='max-w-sm text-sm text-muted-foreground'>{description}</p>}
      {action && <div className='mt-1'>{action}</div>}
    </div>
  )
}
