import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import {
  Info,
  Laptop,
  Globe,
  Clock,
} from 'lucide-react'

const generalNavItems = [
  {
    title: 'À propos',
    href: '/settings/general/about',
    icon: Info,
  },
  {
    title: 'Logiciel',
    href: '/settings/general/software',
    icon: Laptop,
  },
  {
    title: 'Langue et région',
    href: '/settings/general/language',
    icon: Globe,
  },
  {
    title: 'Date et heure',
    href: '/settings/general/date',
    icon: Clock,
  },
]

export function GeneralLayout() {
  const location = useLocation()

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between space-y-2 mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Général</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            {generalNavItems.map((item) => {
              const isActive = location.pathname === item.href || (item.href === '/settings/general/about' && location.pathname === '/settings/general')
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
                    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 bg-card shadow-sm rounded-2xl ring-1 ring-black/5 dark:ring-white/5 p-6 min-h-[400px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
