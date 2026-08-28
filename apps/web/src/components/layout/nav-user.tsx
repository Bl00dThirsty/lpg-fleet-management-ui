import { Building2, ChevronsUpDown, LogOut, User } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  Avatar,
  AvatarFallback,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@lpg/ui'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@lpg/ui'
import { useAuthStore } from '@/store/auth-store'
import { useRoleStore } from '@/store/role-store'
import { ROLE_LABELS } from '@/config/rbac/roles'

export function NavUser() {
  const { isMobile } = useSidebar()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const activeRole = useRoleStore((s) => s.activeRole)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  if (!user) return null

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
  const initials = ((user.first_name?.charAt(0) ?? '') + (user.last_name?.charAt(0) ?? '')).toUpperCase() || '?'
  const roleLabel = ROLE_LABELS[activeRole] ?? activeRole
  const orgName = user.org_name

  const handleLogout = () => {
    logout()
    queryClient.clear()
    navigate({ to: '/login' })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <Avatar className='h-8 w-8 rounded-lg'>
                <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>{fullName}</span>
                <span className='truncate text-xs text-muted-foreground flex items-center gap-1'>
                  {orgName ? (
                    <>
                      <Building2 className='size-3 shrink-0' />
                      <span className='truncate'>{orgName}</span>
                    </>
                  ) : (
                    <span className='truncate'>{user.email}</span>
                  )}
                </span>
              </div>
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='h-9 w-9 rounded-lg'>
                  <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>{fullName}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {user.email}
                  </span>
                  {orgName && (
                    <span className='truncate text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5'>
                      <Building2 className='size-3 shrink-0' />
                      {orgName}
                    </span>
                  )}
                  <Badge variant='secondary' className='mt-1 self-start text-[10px]'>
                    {roleLabel}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate({ to: '/settings/profile' })}>
                <User />
                Profil
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
