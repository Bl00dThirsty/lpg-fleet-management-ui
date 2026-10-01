/**
 * Shared form primitives: a pending-aware submit button, a mount-animated
 * section wrapper, and a small inline spinner. Used by config-driven entity
 * forms and bespoke wizards (e.g. the pickups create wizard).
 */

import { Loader2 } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@lpg/ui'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={className ?? 'size-4 animate-spin'} aria-hidden />
}

export function SubmitButton({
  pending,
  children,
  ...props
}: ComponentProps<typeof Button> & { pending?: boolean }) {
  return (
    <Button type='submit' disabled={pending || props.disabled} {...props}>
      {pending ? <Spinner className='size-4 animate-spin' /> : null}
      {children}
    </Button>
  )
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className='animate-in fade-in slide-in-from-bottom-1 duration-200 space-y-3'>
      <h3 className='text-sm font-semibold text-foreground'>{title}</h3>
      {children}
    </div>
  )
}
