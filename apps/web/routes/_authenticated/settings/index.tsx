import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '@lpg/ui'
import { useRoleStore } from '@/store/role-store'
import { ROLE_LABELS } from '@/config/rbac/roles'
import {
  Palette,
  Shield,
  Settings,
  Truck,
  Map as RouteIcon,
  Smartphone,
  Bell,
  Wrench,
  Cpu,
  MapPin,
  User,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsIndexPage,
})

type SettingCard = {
  to: string
  icon: typeof Settings
  title: string
  description: string
}

function SettingCard({ item }: { item: SettingCard }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      className='block rounded-xl border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent/50'
    >
      <Card className='border-0 shadow-none'>
        <CardHeader className='flex flex-row items-center gap-4 space-y-0 pb-3'>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
            <Icon className='size-5 text-primary' />
          </div>
          <div>
            <CardTitle className='text-base'>{item.title}</CardTitle>
            <CardDescription className='text-sm'>{item.description}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}

const ROLE_SETTINGS: Record<string, SettingCard[]> = {
  SUPER_ADMIN: [
    { to: '/settings/profile', icon: User, title: 'Profil', description: 'Gérer vos informations personnelles.' },
    { to: '/settings', icon: Palette, title: 'Apparence', description: 'Thème, police et préférences d’affichage.' },
    { to: '/settings', icon: Shield, title: 'Gestion utilisateurs', description: 'Créer, modifier et désactiver des comptes.' },
    { to: '/settings', icon: Settings, title: 'Configuration système', description: 'Paramètres généraux de la plateforme.' },
  ],
  ADMIN: [
    { to: '/settings/profile', icon: User, title: 'Profil', description: 'Gérer vos informations personnelles.' },
    { to: '/settings', icon: Palette, title: 'Apparence', description: 'Thème, police et préférences d’affichage.' },
    { to: '/settings', icon: Shield, title: 'Gestion utilisateurs', description: 'Créer, modifier et désactiver des comptes.' },
    { to: '/settings', icon: Settings, title: 'Configuration système', description: 'Paramètres généraux de la plateforme.' },
  ],
  MARKETEUR: [
    { to: '/settings/profile', icon: User, title: 'Profil', description: 'Gérer vos informations personnelles.' },
    { to: '/settings', icon: Palette, title: 'Apparence', description: 'Thème, police et préférences d’affichage.' },
    { to: '/settings', icon: Truck, title: 'Paramètres flotte', description: 'Configuration des camions et transporteurs.' },
    { to: '/settings', icon: RouteIcon, title: 'Règles de tournée', description: 'Définir quotas, horaires et zones de livraison.' },
  ],
  LIVREUR: [
    { to: '/settings/profile', icon: User, title: 'Profil', description: 'Gérer vos informations personnelles.' },
    { to: '/settings', icon: Palette, title: 'Apparence', description: 'Thème, police et préférences d’affichage.' },
    { to: '/settings', icon: Smartphone, title: 'Préférences PDA', description: 'Paramètres de synchronisation et scan.' },
    { to: '/settings', icon: Bell, title: 'Alertes mission', description: 'Notifications de tournée et rappels.' },
  ],
  INTEGRATEUR: [
    { to: '/settings/profile', icon: User, title: 'Profil', description: 'Gérer vos informations personnelles.' },
    { to: '/settings', icon: Palette, title: 'Apparence', description: 'Thème, police et préférences d’affichage.' },
    { to: '/settings', icon: Wrench, title: 'Maintenance matériel', description: 'Suivi des PDA, GPS et RFID.' },
    { to: '/settings', icon: Cpu, title: 'PDA+GPS+RFID', description: 'Configuration des périphériques terrain.' },
  ],
  SUPERVISOR: [
    { to: '/settings/profile', icon: User, title: 'Profil', description: 'Gérer vos informations personnelles.' },
    { to: '/settings', icon: Palette, title: 'Apparence', description: 'Thème, police et préférences d’affichage.' },
    { to: '/settings', icon: Settings, title: 'Configuration système', description: 'Paramètres généraux de la plateforme.' },
  ],
  AGENT: [
    { to: '/settings/profile', icon: User, title: 'Profil', description: 'Gérer vos informations personnelles.' },
    { to: '/settings', icon: Palette, title: 'Apparence', description: 'Thème, police et préférences d’affichage.' },
    { to: '/settings', icon: MapPin, title: 'Zones de validation', description: 'Sites et dépôts assignés.' },
  ],
}

function SettingsIndexPage() {
  const activeRole = useRoleStore((s) => s.activeRole)
  const roleLabel = ROLE_LABELS[activeRole] ?? activeRole
  const items = ROLE_SETTINGS[activeRole] ?? ROLE_SETTINGS.SUPER_ADMIN

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <h1 className='mb-1 text-xl font-semibold tracking-tight'>Paramètres</h1>
      <p className='mb-6 text-sm text-muted-foreground'>
        Configuration pour le rôle {roleLabel}
      </p>
      <div className='grid gap-4'>
        {items.map((item) => (
          <SettingCard key={item.title} item={item} />
        ))}
      </div>
    </div>
  )
}