import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/layout/page'
import { cn } from '@/lib/utils'

type ChartCardProps = {
  title: string
  description?: string
  /** Action slot (e.g. a date-range selector). Rendered right of the title. */
  actions?: ReactNode
  children: ReactNode
  /** Optional className for the outer card. */
  className?: string
  /** When true, no data has been provided; render <EmptyState /> instead of children. */
  empty?: boolean
  emptyLabel?: string
}

/**
 * Canonical wrapper for chart content. Mirrors the
 * `<Card>` / `<CardHeader>` / `<CardContent>` composition from shadcn.
 *
 * Charts are nested inside so the chart primitives stay focused on the
 * data visualisation, not the surrounding chrome.
 */
export function ChartCard({
  title,
  description,
  actions,
  children,
  className,
  empty,
  emptyLabel = 'Aucune donnée à afficher.',
}: ChartCardProps) {
  return (
    <Card className={cn('@container/chart', className)}>
      <CardHeader className='flex flex-row items-start justify-between gap-2 pb-2'>
        <div>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent>
        {empty ? <EmptyState title={emptyLabel} /> : children}
      </CardContent>
    </Card>
  )
}
