import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@lpg/ui'
import { AppTitle } from './app-title'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { useAuthStore } from '@/store/auth-store'
import { useRoleStore } from '@/store/role-store'
import { getSidebarData } from '@/config/rbac/sidebar-by-role'

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const activeRole = useRoleStore((s) => s.activeRole)
  const user = useAuthStore((s) => s.user)
  const sidebarData = getSidebarData(
    activeRole,
    user?.system_role === activeRole ? user.custom_roles : undefined
  )

  return (
    <Sidebar collapsible='icon' variant='inset' {...props}>
      <SidebarHeader>
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((group) => (
          <NavGroup key={group.title} title={group.title} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
