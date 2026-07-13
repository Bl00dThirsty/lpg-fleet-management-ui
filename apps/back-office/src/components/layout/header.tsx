import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setOffset(window.scrollY || document.documentElement.scrollTop)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-40 h-16 w-full transition-all duration-200',
        fixed && 'header-fixed peer/header sticky top-0',
        fixed &&
          (offset > 12
            ? 'border-b border-border/70 bg-background/75 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/60'
            : 'border-b border-transparent bg-background/0'),
        className
      )}
      {...props}
    >
      <div
        className={cn('flex h-full items-center gap-3 px-4 sm:gap-4 sm:px-6')}
      >
        <SidebarTrigger
          variant='outline'
          className='rounded-xl border-border/60 bg-background/80 max-md:scale-125'
        />
        <Separator orientation='vertical' className='hidden h-6 sm:block' />
        {children}
      </div>
    </header>
  )
}
