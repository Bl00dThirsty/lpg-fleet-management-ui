import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'
import { ChevronRight } from 'lucide-react'
import { generateBreadcrumbs } from '@/lib/breadcrumbs'

export function Breadcrumbs({ pathname }: { pathname: string }) {
  const crumbs = generateBreadcrumbs(pathname)
  if (crumbs.length === 0) return null
  return (
    <nav aria-label="Fil d'ariane" className='hidden items-center gap-1 text-sm text-muted-foreground md:flex'>
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1
        return (
          <Fragment key={c.to}>
            {i > 0 && <ChevronRight className='size-3.5 shrink-0' />}
            {last ? (
              <span className='font-medium text-foreground'>{c.label}</span>
            ) : (
              <Link
                to={c.to}
                className='rounded px-1 transition-colors hover:text-foreground'
              >
                {c.label}
              </Link>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
