import { Toaster as Sonner, ToasterProps } from 'sonner'

export function Toaster({ theme, ...props }: ToasterProps) {
  return (
    <Sonner
      theme={theme ?? 'system'}
      richColors={false}
      className='toaster group'
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
