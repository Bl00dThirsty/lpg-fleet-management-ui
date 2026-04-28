import { Bell, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from '@/context/theme-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Header } from './header'

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Header fixed>
      <div className='flex flex-1 items-center justify-between gap-3'>
        <div className='hidden flex-1 items-center gap-3 md:flex'>
          <div className='relative w-full max-w-md'>
            <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              aria-label='Rechercher'
              placeholder='Rechercher un camion, une tournee, un depot...'
              className='h-10 rounded-xl border-border/60 bg-background/80 pr-16 pl-9 shadow-none'
            />
            <div className='pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1 rounded-md border bg-muted/70 px-1.5 py-1 text-[10px] font-medium text-muted-foreground'>
              <span>Ctrl</span>
              <span>K</span>
            </div>
          </div>
        </div>

        <div className='flex flex-1 items-center justify-end gap-2'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='relative rounded-full text-muted-foreground'
            aria-label='Notifications'
          >
            <Bell className='size-4' />
            <span className='absolute top-2 right-2 size-1.5 rounded-full bg-rose-500' />
          </Button>

          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='rounded-full text-muted-foreground'
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
            aria-label='Changer le theme'
          >
            {resolvedTheme === 'dark' ? (
              <Sun className='size-4' />
            ) : (
              <Moon className='size-4' />
            )}
          </Button>

          <div className='hidden text-right text-sm md:block'>
            <p className='font-medium'>Operations GPL</p>
            <p className='text-xs text-muted-foreground'>Centre de pilotage</p>
          </div>

          <Avatar className='size-9 rounded-full border'>
            <AvatarFallback className='bg-primary/10 text-sm font-semibold text-primary'>
              JD
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </Header>
  )
}
