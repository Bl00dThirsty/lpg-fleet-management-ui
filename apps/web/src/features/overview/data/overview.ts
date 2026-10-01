/**
 * Role-aware "Vue d'ensemble" KPI builder.
 *
 * Single source of data for the overview landing dashboard. Pure function
 * (side-effect free) so it can be shared by the page and tested directly.
 *
 * Scoping: when a `DashboardView` is supplied it is used as the authoritative
 * source for operational KPIs (tournées, volumes, réserve, alertes) so the
 * landing page respects the authenticated user's scope — network-wide counts
 * (organisations, utilisateurs, sites, appareils) come from the global
 * analytics snapshot, which is the correct reading for those counters.
 */

import { buildAnalytics, type Analytics } from '@lpg/mock-data'
import type { Role } from '@lpg/permissions'
import type { DashboardView } from '@/features/dashboard/data/dashboard'
import { formatTm } from '@/features/map/utils/format'

export type OverviewCardTone = 'sky' | 'emerald' | 'amber' | 'rose' | 'slate'

export type OverviewCardIcon =
  | 'organizations'
  | 'users'
  | 'sites'
  | 'tours'
  | 'anomalies'
  | 'reconciliations'
  | 'devices'
  | 'traceability'
  | 'checkpoints'
  | 'volumes'
  | 'reserve'

export type OverviewCard = {
  id: string
  label: string
  value: number | string
  detail: string
  href: string
  tone: OverviewCardTone
  icon: OverviewCardIcon
  /** Optional 0–100 value to render as a mini progress bar. */
  progress?: number
}

const cached = buildAnalytics()

export function buildOverview(role: Role, dashboard?: DashboardView): OverviewCard[] {
  const cardsByRole: Record<string, (d?: DashboardView) => OverviewCard[]> = {
    SUPERADMIN: (d) => adminCards(cached, d),
    ADMIN: (d) => adminCards(cached, d),
    TRANSPORTEUR: (d) => transportCards(cached, d),
    MARKETEUR: (d) => transportCards(cached, d),
    SUPERVISOR: (d) => supervisorCards(cached, d),
    INTEGRATEUR: (d) => supervisorCards(cached, d),
    AGENT: (d) => agentCards(cached, d),
  }

  const build = cardsByRole[role]
  return build ? build(dashboard) : defaultCards(cached, dashboard)
}

function activeTrips(d?: DashboardView) {
  return d
    ? d.overview.activeTrips + d.overview.plannedTrips
    : cached.tours.inFlight
}

function openAlerts(d?: DashboardView) {
  return d ? d.overview.openAlerts : cached.anomalies.open
}

function adminCards(a: Analytics, d?: DashboardView): OverviewCard[] {
  const traceRate = Math.round(a.traceability.traceabilityRate * 100)
  return [
    {
      id: 'organizations',
      label: 'Organisations',
      value: `${a.organizations.active}/${a.organizations.total}`,
      detail: 'actives sur le réseau GPL',
      href: '/organizations',
      tone: 'sky',
      icon: 'organizations',
    },
    {
      id: 'users',
      label: 'Utilisateurs',
      value: a.users.active,
      detail: `actifs sur ${a.users.total} comptes totaux`,
      href: '/users',
      tone: 'emerald',
      icon: 'users',
    },
    {
      id: 'sites',
      label: 'Sites',
      value: `${a.sites.verified}/${a.sites.active}`,
      detail: 'sites vérifiés et actifs',
      href: '/sites',
      tone: 'amber',
      icon: 'sites',
      progress: a.sites.active ? Math.round((a.sites.verified / a.sites.active) * 100) : 0,
    },
    {
      id: 'tours',
      label: 'Tournées',
      value: activeTrips(d),
      detail: `${d?.overview.activeTrips ?? a.tours.inFlight} en vol · ${
        d?.overview.plannedTrips ?? a.tours.planned
      } planifiées`,
      href: '/tours',
      tone: 'slate',
      icon: 'tours',
    },
    {
      id: 'anomalies',
      label: 'Anomalies ouvertes',
      value: openAlerts(d),
      detail: `${d?.overview.criticalAlerts ?? 0} critiques à traiter en priorité`,
      href: '/anomalies',
      tone: 'rose',
      icon: 'anomalies',
    },
    {
      id: 'reconciliations',
      label: 'Réconciliations',
      value: a.reconciliations.total,
      detail: `écart cumulé ${formatTm(a.reconciliations.totalGap)}`,
      href: '/reconciliations',
      tone: 'emerald',
      icon: 'reconciliations',
    },
    {
      id: 'traceability',
      label: 'Taux de traçabilité',
      value: `${traceRate}%`,
      detail: `volume tracé vs ${formatTm(a.traceability.declaredVolume)} déclaré`,
      href: '/tours',
      tone: 'sky',
      icon: 'traceability',
      progress: traceRate,
    },
  ]
}

function transportCards(a: Analytics, d?: DashboardView): OverviewCard[] {
  const traceRate = Math.round(a.traceability.traceabilityRate * 100)
  const fill = d?.overview.reserveFillPercent ?? 0
  return [
    {
      id: 'tours-in-flight',
      label: 'Tournées en vol',
      value: d?.overview.activeTrips ?? a.tours.inFlight,
      detail: `sur ${a.tours.total} tournées totales`,
      href: '/tours',
      tone: 'sky',
      icon: 'tours',
    },
    {
      id: 'tours-awaiting',
      label: 'À confirmer transporteur',
      value: d?.overview.plannedTrips ?? a.tours.awaitingTransporter,
      detail: 'tournées en attente de validation',
      href: '/tour-tracking',
      tone: 'amber',
      icon: 'tours',
    },
    {
      id: 'transported',
      label: 'Volume transporté',
      value: formatTm(d?.overview.totalTransportedTM ?? 0),
      detail: 'GPL chargé sur les tournées visibles',
      href: '/tours',
      tone: 'emerald',
      icon: 'volumes',
    },
    {
      id: 'reserve',
      label: 'Réserve utile',
      value: formatTm(d?.overview.totalReserveTM ?? 0),
      detail: `${fill}% de remplissage sur le réseau`,
      href: '/sites',
      tone: 'sky',
      icon: 'reserve',
      progress: fill,
    },
    {
      id: 'devices',
      label: 'Véhicules & appareils',
      value: a.devices.total,
      detail: 'capteurs et PDA actifs sur la flotte',
      href: '/devices',
      tone: 'slate',
      icon: 'devices',
    },
    {
      id: 'traceability',
      label: 'Taux de traçabilité',
      value: `${traceRate}%`,
      detail: `volume tracé vs ${formatTm(a.traceability.declaredVolume)} déclaré`,
      href: '/reconciliations',
      tone: 'emerald',
      icon: 'traceability',
      progress: traceRate,
    },
  ]
}

function supervisorCards(a: Analytics, d?: DashboardView): OverviewCard[] {
  const online = a.devices.byStatus['ONLINE'] ?? 0
  const total = a.devices.total
  return [
    {
      id: 'devices-total',
      label: 'Appareils',
      value: total,
      detail: 'appareils enregistrés sur le parc',
      href: '/devices',
      tone: 'sky',
      icon: 'devices',
    },
    {
      id: 'devices-online',
      label: 'Appareils en ligne',
      value: online,
      detail: 'connectés et synchronisés',
      href: '/devices',
      tone: 'emerald',
      icon: 'devices',
      progress: total ? Math.round((online / total) * 100) : 0,
    },
    {
      id: 'devices-offline',
      label: 'Appareils à attention',
      value: a.devices.attention.length,
      detail: 'batterie critique ou hors ligne',
      href: '/device-health',
      tone: 'rose',
      icon: 'devices',
    },
    {
      id: 'tours',
      label: 'Tournées actives',
      value: d?.overview.activeTrips ?? a.tours.inFlight,
      detail: `sur ${a.tours.total} tournées totales`,
      href: '/tours',
      tone: 'amber',
      icon: 'tours',
    },
    {
      id: 'anomalies',
      label: 'Alertes ouvertes',
      value: openAlerts(d),
      detail: `${d?.overview.criticalAlerts ?? 0} critiques`,
      href: '/anomalies',
      tone: 'rose',
      icon: 'anomalies',
    },
    {
      id: 'checkpoints',
      label: 'Points de contrôle',
      value: a.checkpoints.total,
      detail: `${a.checkpoints.missed} manqués`,
      href: '/tours',
      tone: 'slate',
      icon: 'checkpoints',
    },
  ]
}

function agentCards(a: Analytics, d?: DashboardView): OverviewCard[] {
  const traceRate = Math.round(a.traceability.traceabilityRate * 100)
  const verifiedRate = a.sites.active
    ? Math.round((a.sites.verified / a.sites.active) * 100)
    : 0
  return [
    {
      id: 'sites-active',
      label: 'Sites actifs',
      value: a.sites.active,
      detail: `sur ${a.sites.total} sites du réseau`,
      href: '/sites',
      tone: 'sky',
      icon: 'sites',
    },
    {
      id: 'sites-verified',
      label: 'Sites vérifiés',
      value: a.sites.verified,
      detail: 'sites conformes et vérifiés',
      href: '/sites',
      tone: 'emerald',
      icon: 'sites',
      progress: verifiedRate,
    },
    {
      id: 'reconciliations-gap',
      label: 'Écart de réconciliation',
      value: formatTm(a.reconciliations.totalGap),
      detail: `${a.reconciliations.total} réconciliations à traiter`,
      href: '/reconciliations',
      tone: 'rose',
      icon: 'reconciliations',
    },
    {
      id: 'declared-vs-tracked',
      label: 'Déclaré vs tracé',
      value: `${traceRate}%`,
      detail: `tracé · écart ${formatTm(
        a.traceability.declaredVolume - a.traceability.trackedVolume
      )}`,
      href: '/reconciliations',
      tone: 'amber',
      icon: 'traceability',
      progress: traceRate,
    },
    {
      id: 'tours',
      label: 'Tournées en cours',
      value: d?.overview.activeTrips ?? a.tours.inFlight,
      detail: `${d?.overview.plannedTrips ?? a.tours.planned} planifiées`,
      href: '/tours',
      tone: 'slate',
      icon: 'tours',
    },
    {
      id: 'anomalies',
      label: 'Anomalies ouvertes',
      value: openAlerts(d),
      detail: 'à traiter sur vos sites assignés',
      href: '/anomalies',
      tone: 'rose',
      icon: 'anomalies',
    },
  ]
}

function defaultCards(a: Analytics, d?: DashboardView): OverviewCard[] {
  return [
    {
      id: 'organizations',
      label: 'Organisations',
      value: a.organizations.total,
      detail: `${a.organizations.active} actives`,
      href: '/organizations',
      tone: 'sky',
      icon: 'organizations',
    },
    {
      id: 'tours-in-flight',
      label: 'Tournées en vol',
      value: d?.overview.activeTrips ?? a.tours.inFlight,
      detail: `${a.tours.planned} planifiées`,
      href: '/tours',
      tone: 'amber',
      icon: 'tours',
    },
    {
      id: 'traceability',
      label: 'Taux de traçabilité',
      value: `${Math.round(a.traceability.traceabilityRate * 100)}%`,
      detail: 'volume tracé vs déclaré',
      href: '/reconciliations',
      tone: 'emerald',
      icon: 'traceability',
      progress: Math.round(a.traceability.traceabilityRate * 100),
    },
  ]
}

export function getOverviewCards(
  role: Role,
  dashboard?: DashboardView
): OverviewCard[] {
  return buildOverview(role, dashboard)
}
