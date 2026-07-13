import { Bell, Moon, Search, Sun, LogOut } from 'lucide-react'
import { useTheme } from '@/context/theme-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Header } from './header'
import csphLogo from '@/assets/logo-csph-small.png'
import totalLogo from '@/assets/logo-total.png'
import { usePermissions } from '@/context/PermissionsProvider'
import { useNavigate } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const { session, logout } = usePermissions()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  const getLogo = () => {
    if (session?.orgName === 'TotalEnergies') return totalLogo
    return csphLogo // Default or CSPH
  }

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='flex gap-2 pl-2 pr-0 hover:bg-transparent'>
                <div className='hidden text-right text-sm md:block mr-1'>
                  <p className='font-medium'>{session?.subRole || session?.orgName}</p>
                  <p className='text-xs text-muted-foreground'>{session?.role}</p>
                </div>
                <Avatar className='size-9 rounded-full border bg-white p-0.5'>
                  <AvatarImage src={getLogo()} alt={session?.orgName || 'Logo'} className='object-contain' />
                  <AvatarFallback className='bg-primary/10 text-sm font-semibold text-primary'>
                    {session?.orgName?.substring(0, 2).toUpperCase() || 'CS'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </Header>
  )
}
