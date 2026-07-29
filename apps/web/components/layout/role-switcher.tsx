import {
  Shield,
  Users,
  Activity,
  RadioTower,
  ClipboardList,
  Building2,
  Truck,
  ChevronsUpDown,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@lpg/ui'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@lpg/ui'
import { useRoleStore } from '@/store/role-store'
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from '@/config/rbac/roles'
import { roleSlug } from '@/config/rbac/sidebar-by-role'

const ROLE_ICON: Record<Role, LucideIcon> = {
  SUPER_ADMIN: Shield,
  ADMIN: Users,
  SUPERVISOR: Activity,
  INTEGRATEUR: RadioTower,
  AGENT: ClipboardList,
  MARKETEUR: Building2,
  LIVREUR: Truck,
}

const ROLE_AVATAR_CLASS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  SUPERVISOR: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  INTEGRATEUR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  AGENT: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  MARKETEUR: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  LIVREUR: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
}

export function RoleSwitcher() {
  const { isMobile } = useSidebar()
  const activeRole = useRoleStore((s) => s.activeRole)
  const setActiveRole = useRoleStore((s) => s.setActiveRole)
  const navigate = useNavigate()
  const Icon = ROLE_ICON[activeRole]

  const handleSwitch = (role: Role) => {
    setActiveRole(role)
    navigate({ to: `/${roleSlug(role)}` as never })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className={`flex aspect-square size-8 items-center justify-center rounded-lg ${ROLE_AVATAR_CLASS[activeRole]}`}>
                <Icon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">LPG Fleet</span>
                <span className="truncate text-xs">{ROLE_LABELS[activeRole]}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="start"
            sideOffset={4}
          >
            {(ROLES as unknown as Role[]).map((role) => {
              const isActive = role === activeRole
              const RoleIcon = ROLE_ICON[role]

              return (
                <DropdownMenuItem
                  key={role}
                  onClick={() => handleSwitch(role)}
                  className="flex items-start gap-3 py-2"
                >
                  <div
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${ROLE_AVATAR_CLASS[role]}`}
                  >
                    <RoleIcon className="size-4" />
                  </div>
                  <div className="flex-1 text-left text-sm leading-tight">
                    <span className="flex items-center gap-1.5 font-medium">
                      {ROLE_LABELS[role]}
                      {isActive && <Check className="size-3.5 text-primary" />}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {ROLE_DESCRIPTIONS[role]}
                    </span>
                  </div>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}