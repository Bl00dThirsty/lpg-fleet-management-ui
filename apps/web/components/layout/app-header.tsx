import { Moon, Search, Sun, LogOut } from 'lucide-react'
import { useTheme } from '@/context/theme-provider'
import { Avatar, AvatarFallback, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@lpg/ui'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth-store'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from './header'
import { Breadcrumbs } from './breadcrumbs'
import { useLocation } from '@tanstack/react-router'
import { NotificationCenter } from '@/features/notifications/notification-center'

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pathname } = useLocation()

  const initials = (
    (user?.firstName?.charAt(0) ?? '') + (user?.lastName?.charAt(0) ?? '')
  ).toUpperCase() || '?'

  const handleLogout = () => {
    logout()
    queryClient.clear()
    navigate({ to: '/login' })
  }

  return (
    <Header fixed>
      <div className='flex flex-1 items-center gap-3'>
        <div className='hidden flex-1 items-center gap-3 md:flex'>
          <Breadcrumbs pathname={pathname} />
        </div>

        <div className='ml-auto flex items-center gap-2'>
          <div className='relative hidden w-full max-w-md md:block'>
            <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
            <div className='pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1 rounded-md border bg-muted/70 px-1.5 py-1 text-[10px] font-medium text-muted-foreground'>
              <span>Ctrl</span>
              <span>K</span>
            </div>
          </div>

          <NotificationCenter />

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
                  <p className='font-medium'>
                    {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email}
                  </p>
                </div>
                <Avatar className='size-9 rounded-full border bg-background p-0.5'>
                  <AvatarFallback className='bg-primary/10 text-sm font-semibold text-primary'>
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem onClick={handleLogout} className='text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer'>
                <LogOut className='mr-2 h-4 w-4' />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Header>
  )
}
