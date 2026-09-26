import { cn } from '@lpg/ui'

type PageHeaderProps = {
  title: string
  description?: string
  icon?: React.ElementType
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col items-start justify-between gap-3 sm:flex-row', className)}>
      <div className='flex items-center gap-2'>
        {Icon && <Icon className='h-6 w-6 text-primary' />}
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
          {description && (
            <p className='mt-0.5 text-sm text-muted-foreground'>{description}</p>
          )}
        </div>
      </div>
      {actions && <div className='flex w-full flex-wrap items-center gap-2 sm:w-auto'>{actions}</div>}
    </div>
  )
}
