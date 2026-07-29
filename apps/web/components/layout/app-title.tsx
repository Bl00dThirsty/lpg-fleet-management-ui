import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { cn, Button, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@lpg/ui'

export function AppTitle() {
  const { setOpenMobile, toggleSidebar } = useSidebar()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='gap-0 py-0 hover:bg-transparent active:bg-transparent'
          asChild
        >
          <div>
            <Link
              to='/dashboard'
              onClick={() => setOpenMobile(false)}
              className='grid flex-1 text-start text-sm leading-tight'
            >
              <span className='truncate font-bold'>LPG Fleet</span>
              <span className='truncate text-xs'>Tracking & delivery ops</span>
            </Link>
            <Button
              data-sidebar='trigger'
              data-slot='sidebar-trigger'
              variant='ghost'
              size='icon'
              className={cn('aspect-square size-8 max-md:scale-125')}
              onClick={() => {
                toggleSidebar()
              }}
            >
              <X className='md:hidden' />
              <Menu className='max-md:hidden' />
              <span className='sr-only'>Toggle Sidebar</span>
            </Button>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
