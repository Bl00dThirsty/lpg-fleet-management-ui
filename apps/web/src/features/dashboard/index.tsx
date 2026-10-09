import { useEffect, useMemo, useState } from 'react'
import { ArrowDownToLine } from 'lucide-react'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { type Role } from '@/config/rbac/roles'
import { Main } from '@/components/layout/main'
import { useAuthStore } from '@/store/auth-store'
import { useRoleStore } from '@/store/role-store'
import { useToursStore } from '@/store/tours-store'
import { isOrgDashboardRole } from './data/kpi-cards'
import { summarizeTours } from './lib/tour-metrics'
import { canSeeMapMission, missionDay } from '@/features/map/lib/mission-filters'
import { useTourLiveRefresh } from '@/features/tours/lib/use-tour-live-refresh'
import { LpgKpiStrip } from './components/lpg-kpi-strip'
import { LpgDeliveryFlow } from './components/lpg-delivery-flow'
import { RegionalVolumeShare } from './components/regional-volume-share'
import { OrgFocusCard } from './components/org-focus-card'
import { DateRangePicker, type DateRangeValue } from '@/components/date-range-picker'
import { format } from 'date-fns'

export function DashboardPage({ role }: { role?: Role } = {}) {
  const user = useAuthStore((s) => s.user)
  const activeRole = useRoleStore((s) => s.activeRole)
  const effectiveRole = role ?? activeRole ?? (user?.system_role as Role) ?? 'SUPERADMIN'

  const [dateRange, setDateRange] = useState<DateRangeValue>(undefined)

  const tours = useToursStore((s) => s.tours)
  const hasLoaded = useToursStore((s) => s.hasLoaded)
  const fetchTours = useToursStore((s) => s.fetchTours)

  useEffect(() => {
    if (!hasLoaded) {
      void fetchTours()
    }
  }, [hasLoaded, fetchTours])

  useTourLiveRefresh(undefined, !!user)

  const effectiveUser = useMemo(() => {
    if (!user) return null
    return { ...user, system_role: effectiveRole }
  }, [user, effectiveRole])

  const filteredTours = useMemo(() => {
    const scoped = tours.filter((t) => canSeeMapMission(t, effectiveUser))
    const fromStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null
    const toStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null
    if (!fromStr && !toStr) return scoped

    return scoped.filter((t) => {
      const day = missionDay(t)
      if (!day) return true
      if (fromStr && day < fromStr) return false
      if (toStr && day > toStr) return false
      return true
    })
  }, [tours, effectiveUser, dateRange])

  const metrics = useMemo(() => summarizeTours(filteredTours), [filteredTours])

  const heading =
    effectiveRole === 'SUPERADMIN'
      ? 'Pilotage National — Traçabilité Hors Réseau'
      : effectiveRole === 'ADMIN'
        ? 'Tableau de Bord Administration'
        : effectiveRole === 'SUPERVISOR'
          ? 'Supervision des Flux & Traçabilité'
          : effectiveRole === 'MARKETEUR'
            ? 'Pilotage Marketeur — Distribution Hors Réseau'
            : effectiveRole === 'TRANSPORTEUR'
              ? 'Suivi Flotte & Acheminement Entreprises'
              : 'Tableau de Bord Traçabilité GPL'

  const subtitle =
    effectiveRole === 'SUPERADMIN'
      ? 'Suivi exécutif de la traçabilité du gaz hors réseau (Bouteilles 50 kg & Vrac), des tournées et du tracking de la flotte.'
      : effectiveRole === 'MARKETEUR'
        ? 'Suivi des livraisons vrac et bouteilles 50 kg destinées aux entreprises et clients industriels.'
        : effectiveRole === 'TRANSPORTEUR'
          ? 'Tracking en temps réel des camions citernes et plateaux 50 kg en tournée.'
          : 'Vue consolidée et simplifiée de la distribution de GPL hors réseau pour le top management.'

  const orgRole = isOrgDashboardRole(effectiveRole)
  const periodLabel =
    dateRange?.from && dateRange.to
      ? `${format(dateRange.from, 'd MMM', { locale: fr })} – ${format(dateRange.to, 'd MMM yyyy', { locale: fr })}`
      : 'Période globale (toutes dates)'

  return (
    <Main fluid className='space-y-6 bg-muted/20 pb-10'>
      {/* En-tête exécutif */}
      <section className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-1'>
          <h1 className='font-manrope text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
            {heading}
          </h1>
          <p className='max-w-3xl text-xs text-muted-foreground sm:text-sm'>
            {subtitle}
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <DateRangePicker
            value={dateRange}
            onValueChange={setDateRange}
            placeholder='Toutes les périodes'
            className='h-9 rounded-lg bg-background text-xs shadow-none'
          />
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 rounded-lg bg-background text-xs shadow-none'
          >
            <ArrowDownToLine className='mr-1.5 size-3.5' />
            Exporter
          </Button>
        </div>
      </section>

      {/* Bloc 1 : Bandeau KPI (cartes propres à chaque rôle) */}
      <section>
        <LpgKpiStrip
          role={effectiveRole}
          periodLabel={periodLabel}
          metrics={metrics}
        />
      </section>

      {/* Bloc 2 : Flux des Livraisons Hors Réseau (colonnes empilées) */}
      <section>
        <LpgDeliveryFlow tours={filteredTours} />
      </section>

      {/* Bloc 3 : régulateur = répartition régionale + cadence ; comptes org = panneau propre */}
      {orgRole ? (
        <section>
          <OrgFocusCard
            role={effectiveRole}
            activeTrucks={metrics.active}
            totalTrucks={metrics.total}
            tours={filteredTours}
          />
        </section>
      ) : (
        <section>
          <RegionalVolumeShare tours={filteredTours} />
        </section>
      )}
    </Main>
  )
}
