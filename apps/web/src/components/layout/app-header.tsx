import { Building2, Moon, Search, Sun, LogOut, Keyboard, User } from 'lucide-react'
import { useGlobalSearchStore } from '@/features/command-palette/global-search-store'
import { useTheme } from '@/context/theme-provider'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@lpg/ui'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth-store'
import { useRoleStore } from '@/store/role-store'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from './header'
import { Breadcrumbs } from './breadcrumbs'
import { useLocation } from '@tanstack/react-router'
import { NotificationCenter } from '@/features/notifications/notification-center'
import { GlobalSearch } from '@/features/command-palette/global-search'
import { ROLE_LABELS } from '@/config/rbac/roles'

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const activeRole = useRoleStore((s) => s.activeRole)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pathname } = useLocation()

  const initials = (
    (user?.first_name?.charAt(0) ?? '') + (user?.last_name?.charAt(0) ?? '')
  ).toUpperCase() || '?'

  const roleLabel = ROLE_LABELS[activeRole] ?? activeRole
  const orgName = user?.org_name
  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || ''

  const handleLogout = () => {
    logout()
    queryClient.clear()
    navigate({ to: '/login' })
  }

  return (
    <Header fixed>
      <GlobalSearch />
      <div className='flex flex-1 items-center gap-3'>
        <div className='hidden flex-1 items-center gap-3 md:flex'>
          <Breadcrumbs pathname={pathname} />
        </div>

        <div className='ml-auto flex items-center gap-3'>
          <Button
            type='button'
            variant='outline'
            className='relative hidden w-72 md:w-80 md:flex items-center justify-between rounded-full border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted/30'
            onClick={() => useGlobalSearchStore.getState().setOpen(true)}
            aria-label='Rechercher dans le système'
            data-icon='inline-start'
          >
            <Search className='size-4 shrink-0' />
            <span className='truncate'>Rechercher…</span>
            <kbd className='-mr-1 flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-1 text-[10px] font-medium text-muted-foreground'>
              <Keyboard className='size-3' />
              K
            </kbd>
          </Button>

          <NotificationCenter />

          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='rounded-full text-muted-foreground'
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
            aria-label='Changer le thème'
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
                  <p className='font-medium'>{fullName}</p>
                  {orgName && (
                    <p className='text-[11px] text-muted-foreground flex items-center justify-end gap-1 truncate'>
                      <Building2 className='size-3 shrink-0' />
                      <span className='truncate max-w-[180px]'>{orgName}</span>
                    </p>
                  )}
                </div>
                <Avatar className='size-9 rounded-full border bg-background p-0.5'>
                  <AvatarFallback className='bg-primary/10 text-sm font-semibold text-primary'>
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-64'>
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-3 px-2 py-2'>
                  <Avatar className='h-10 w-10 rounded-lg'>
                    <AvatarFallback className='rounded-lg bg-primary/10 text-primary'>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex flex-1 flex-col text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>{fullName}</span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {user?.email}
                    </span>
                    {orgName && (
                      <span className='truncate text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5'>
                        <Building2 className='size-3 shrink-0' />
                        <span className='truncate'>{orgName}</span>
                      </span>
                    )}
                    <Badge variant='secondary' className='mt-1 self-start text-[10px]'>
                      {roleLabel}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate({ to: '/settings/profile' })}
                className='cursor-pointer'
              >
                <User className='mr-2 h-4 w-4' />
                <span>Mon profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className='text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer'
              >
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