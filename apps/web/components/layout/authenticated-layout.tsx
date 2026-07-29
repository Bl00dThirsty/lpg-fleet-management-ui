import { Outlet } from '@tanstack/react-router'
import { SidebarInset, SidebarProvider } from '@lpg/ui'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { getCookie } from '@/lib/cookies'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SkipToMain />
      <AppSidebar />
      <SidebarInset className='@container/content bg-muted/20'>
        <AppHeader />
        {children ?? <Outlet />}
      </SidebarInset>
    </SidebarProvider>
  )
}