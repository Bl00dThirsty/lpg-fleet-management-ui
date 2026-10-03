import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

function Progress({ className, value = 0, max = 100, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn(
        'relative flex h-2 w-full overflow-hidden rounded-full bg-muted',
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="size-full flex-1 bg-primary transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export { Progress }
