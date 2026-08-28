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

type TranslateFn = (key: string, opts?: Record<string, unknown>) => string
const tx = (t: TranslateFn | undefined, key: string, fallback: string): string =>
  t ? t(key, { defaultValue: fallback } as never) : fallback

export function buildOverview(role: Role, dashboard?: DashboardView, t?: TranslateFn): OverviewCard[] {
  const cardsByRole: Record<string, (d?: DashboardView, t?: TranslateFn) => OverviewCard[]> = {
    SUPERADMIN: (d, tr) => adminCards(cached, d, tr),
    ADMIN: (d, tr) => adminCards(cached, d, tr),
    TRANSPORTEUR: (d, tr) => transportCards(cached, d, tr),
    MARKETEUR: (d, tr) => transportCards(cached, d, tr),
    SUPERVISOR: (d, tr) => supervisorCards(cached, d, tr),
    INTEGRATEUR: (d, tr) => supervisorCards(cached, d, tr),
    AGENT: (d, tr) => agentCards(cached, d, tr),
  }

  const build = cardsByRole[role]
  return build ? build(dashboard, t) : defaultCards(cached, dashboard, t)
}

function activeTrips(d?: DashboardView) {
  return d
    ? d.overview.activeTrips + d.overview.plannedTrips
    : cached.tours.inFlight
}

function openAlerts(d?: DashboardView) {
  return d ? d.overview.openAlerts : cached.anomalies.open
}

function adminCards(a: Analytics, d?: DashboardView, t?: TranslateFn): OverviewCard[] {
  const traceRate = Math.round(a.traceability.traceabilityRate * 100)
  return [
    {
      id: 'organizations',
      label: tx(t, 'overview:cards.organizations.label', 'Organisations'),
      value: `${a.organizations.active}/${a.organizations.total}`,
      detail: tx(t, 'overview:cards.organizations.detail', 'actives sur le réseau GPL'),
      href: '/organizations',
      tone: 'sky',
      icon: 'organizations',
    },
    {
      id: 'users',
      label: tx(t, 'overview:cards.users.label', 'Utilisateurs'),
      value: a.users.active,
      detail: tx(t, 'overview:cards.users.detail', `actifs sur ${a.users.total} comptes totaux`),
      href: '/users',
      tone: 'emerald',
      icon: 'users',
    },
    {
      id: 'sites',
      label: tx(t, 'overview:cards.sites.label', 'Sites'),
      value: `${a.sites.verified}/${a.sites.active}`,
      detail: tx(t, 'overview:cards.sites.detail', 'sites vérifiés et actifs'),
      href: '/sites',
      tone: 'amber',
      icon: 'sites',
      progress: a.sites.active ? Math.round((a.sites.verified / a.sites.active) * 100) : 0,
    },
    {
      id: 'tours',
      label: tx(t, 'overview:cards.tours.label', 'Tournées'),
      value: activeTrips(d),
      detail: tx(t, 'overview:cards.tours.detail', `${d?.overview.activeTrips ?? a.tours.inFlight} en vol · ${d?.overview.plannedTrips ?? a.tours.planned} planifiées`),
      href: '/tours',
      tone: 'slate',
      icon: 'tours',
    },
    {
      id: 'anomalies',
      label: tx(t, 'overview:cards.anomalies.label', 'Anomalies ouvertes'),
      value: openAlerts(d),
      detail: tx(t, 'overview:cards.anomalies.detail', `${d?.overview.criticalAlerts ?? 0} critiques à traiter en priorité`),
      href: '/anomalies',
      tone: 'rose',
      icon: 'anomalies',
    },
    {
      id: 'reconciliations',
      label: tx(t, 'overview:cards.reconciliations.label', 'Réconciliations'),
      value: a.reconciliations.total,
      detail: tx(t, 'overview:cards.reconciliations.detail', `écart cumulé ${formatTm(a.reconciliations.totalGap)}`),
      href: '/reconciliations',
      tone: 'emerald',
      icon: 'reconciliations',
    },
    {
      id: 'traceability',
      label: tx(t, 'overview:cards.traceability.label', 'Taux de traçabilité'),
      value: `${traceRate}%`,
      detail: tx(t, 'overview:cards.traceability.detail', `volume tracé vs ${formatTm(a.traceability.declaredVolume)} déclaré`),
      href: '/tours',
      tone: 'sky',
      icon: 'traceability',
      progress: traceRate,
    },
  ]
}

function transportCards(a: Analytics, d?: DashboardView, t?: TranslateFn): OverviewCard[] {
  const traceRate = Math.round(a.traceability.traceabilityRate * 100)
  const fill = d?.overview.reserveFillPercent ?? 0
  return [
    {
      id: 'tours-in-flight',
      label: tx(t, 'overview:cards.toursInFlight.label', 'Tournées en vol'),
      value: d?.overview.activeTrips ?? a.tours.inFlight,
      detail: tx(t, 'overview:cards.toursInFlight.detail', `sur ${a.tours.total} tournées totales`),
      href: '/tours',
      tone: 'sky',
      icon: 'tours',
    },
    {
      id: 'tours-awaiting',
      label: tx(t, 'overview:cards.toursAwaiting.label', 'À confirmer transporteur'),
      value: d?.overview.plannedTrips ?? a.tours.awaitingTransporter,
      detail: tx(t, 'overview:cards.toursAwaiting.detail', 'tournées en attente de validation'),
      href: '/tour-tracking',
      tone: 'amber',
      icon: 'tours',
    },
    {
      id: 'transported',
      label: tx(t, 'overview:cards.transported.label', 'Volume transporté'),
      value: formatTm(d?.overview.totalTransportedTM ?? 0),
      detail: tx(t, 'overview:cards.transported.detail', 'GPL chargé sur les tournées visibles'),
      href: '/tours',
      tone: 'emerald',
      icon: 'volumes',
    },
    {
      id: 'reserve',
      label: tx(t, 'overview:cards.reserve.label', 'Réserve utile'),
      value: formatTm(d?.overview.totalReserveTM ?? 0),
      detail: tx(t, 'overview:cards.reserve.detail', `${fill}% de remplissage sur le réseau`),
      href: '/sites',
      tone: 'sky',
      icon: 'reserve',
      progress: fill,
    },
    {
      id: 'devices',
      label: tx(t, 'overview:cards.devices.label', 'Véhicules & appareils'),
      value: a.devices.total,
      detail: tx(t, 'overview:cards.devices.detail', 'capteurs et PDA actifs sur la flotte'),
      href: '/devices',
      tone: 'slate',
      icon: 'devices',
    },
    {
      id: 'traceability',
      label: tx(t, 'overview:cards.traceability2.label', 'Taux de traçabilité'),
      value: `${traceRate}%`,
      detail: tx(t, 'overview:cards.traceability2.detail', `volume tracé vs ${formatTm(a.traceability.declaredVolume)} déclaré`),
      href: '/reconciliations',
      tone: 'emerald',
      icon: 'traceability',
      progress: traceRate,
    },
  ]
}

function supervisorCards(a: Analytics, d?: DashboardView, t?: TranslateFn): OverviewCard[] {
  const online = a.devices.byStatus['ONLINE'] ?? 0
  const total = a.devices.total
  return [
    {
      id: 'devices-total',
      label: tx(t, 'overview:cards.devicesTotal.label', 'Appareils'),
      value: total,
      detail: tx(t, 'overview:cards.devicesTotal.detail', 'appareils enregistrés sur le parc'),
      href: '/devices',
      tone: 'sky',
      icon: 'devices',
    },
    {
      id: 'devices-online',
      label: tx(t, 'overview:cards.devicesOnline.label', 'Appareils en ligne'),
      value: online,
      detail: tx(t, 'overview:cards.devicesOnline.detail', 'connectés et synchronisés'),
      href: '/devices',
      tone: 'emerald',
      icon: 'devices',
      progress: total ? Math.round((online / total) * 100) : 0,
    },
    {
      id: 'devices-offline',
      label: tx(t, 'overview:cards.devicesOffline.label', 'Appareils à attention'),
      value: a.devices.attention.length,
      detail: tx(t, 'overview:cards.devicesOffline.detail', 'batterie critique ou hors ligne'),
      href: '/device-health',
      tone: 'rose',
      icon: 'devices',
    },
    {
      id: 'tours',
      label: tx(t, 'overview:cards.toursActive.label', 'Tournées actives'),
      value: d?.overview.activeTrips ?? a.tours.inFlight,
      detail: tx(t, 'overview:cards.toursActive.detail', `sur ${a.tours.total} tournées totales`),
      href: '/tours',
      tone: 'amber',
      icon: 'tours',
    },
    {
      id: 'anomalies',
      label: tx(t, 'overview:cards.alertsOpen.label', 'Alertes ouvertes'),
      value: openAlerts(d),
      detail: tx(t, 'overview:cards.alertsOpen.detail', `${d?.overview.criticalAlerts ?? 0} critiques`),
      href: '/anomalies',
      tone: 'rose',
      icon: 'anomalies',
    },
    {
      id: 'checkpoints',
      label: tx(t, 'overview:cards.checkpoints.label', 'Points de contrôle'),
      value: a.checkpoints.total,
      detail: tx(t, 'overview:cards.checkpoints.detail', `${a.checkpoints.missed} manqués`),
      href: '/tours',
      tone: 'slate',
      icon: 'checkpoints',
    },
  ]
}

function agentCards(a: Analytics, d?: DashboardView, t?: TranslateFn): OverviewCard[] {
  const traceRate = Math.round(a.traceability.traceabilityRate * 100)
  const verifiedRate = a.sites.active
    ? Math.round((a.sites.verified / a.sites.active) * 100)
    : 0
  return [
    {
      id: 'sites-active',
      label: tx(t, 'overview:cards.sitesActive.label', 'Sites actifs'),
      value: a.sites.active,
      detail: tx(t, 'overview:cards.sitesActive.detail', `sur ${a.sites.total} sites du réseau`),
      href: '/sites',
      tone: 'sky',
      icon: 'sites',
    },
    {
      id: 'sites-verified',
      label: tx(t, 'overview:cards.sitesVerified.label', 'Sites vérifiés'),
      value: a.sites.verified,
      detail: tx(t, 'overview:cards.sitesVerified.detail', 'sites conformes et vérifiés'),
      href: '/sites',
      tone: 'emerald',
      icon: 'sites',
      progress: verifiedRate,
    },
    {
      id: 'reconciliations-gap',
      label: tx(t, 'overview:cards.reconciliationGap.label', 'Écart de réconciliation'),
      value: formatTm(a.reconciliations.totalGap),
      detail: tx(t, 'overview:cards.reconciliationGap.detail', `${a.reconciliations.total} réconciliations à traiter`),
      href: '/reconciliations',
      tone: 'rose',
      icon: 'reconciliations',
    },
    {
      id: 'declared-vs-tracked',
      label: tx(t, 'overview:cards.declaredVsTracked.label', 'Déclaré vs tracé'),
      value: `${traceRate}%`,
      detail: tx(t, 'overview:cards.declaredVsTracked.detail', `tracé · écart ${formatTm(a.traceability.declaredVolume - a.traceability.trackedVolume)}`),
      href: '/reconciliations',
      tone: 'amber',
      icon: 'traceability',
      progress: traceRate,
    },
    {
      id: 'tours',
      label: tx(t, 'overview:cards.toursOngoing.label', 'Tournées en cours'),
      value: d?.overview.activeTrips ?? a.tours.inFlight,
      detail: tx(t, 'overview:cards.toursOngoing.detail', `${d?.overview.plannedTrips ?? a.tours.planned} planifiées`),
      href: '/tours',
      tone: 'slate',
      icon: 'tours',
    },
    {
      id: 'anomalies',
      label: tx(t, 'overview:cards.anomalies2.label', 'Anomalies ouvertes'),
      value: openAlerts(d),
      detail: tx(t, 'overview:cards.anomalies2.detail', 'à traiter sur vos sites assignés'),
      href: '/anomalies',
      tone: 'rose',
      icon: 'anomalies',
    },
  ]
}

function defaultCards(a: Analytics, d?: DashboardView, t?: TranslateFn): OverviewCard[] {
  return [
    {
      id: 'organizations',
      label: tx(t, 'overview:cards.organizations.label', 'Organisations'),
      value: a.organizations.total,
      detail: tx(t, 'overview:cards.organizations.detail2', `${a.organizations.active} actives`),
      href: '/organizations',
      tone: 'sky',
      icon: 'organizations',
    },
    {
      id: 'tours-in-flight',
      label: tx(t, 'overview:cards.toursInFlight.label', 'Tournées en vol'),
      value: d?.overview.activeTrips ?? a.tours.inFlight,
      detail: tx(t, 'overview:cards.toursInFlight.detail2', `${a.tours.planned} planifiées`),
      href: '/tours',
      tone: 'amber',
      icon: 'tours',
    },
    {
      id: 'traceability',
      label: tx(t, 'overview:cards.traceability.label', 'Taux de traçabilité'),
      value: `${Math.round(a.traceability.traceabilityRate * 100)}%`,
      detail: tx(t, 'overview:cards.traceability.detail2', 'volume tracé vs déclaré'),
      href: '/reconciliations',
      tone: 'emerald',
      icon: 'traceability',
      progress: Math.round(a.traceability.traceabilityRate * 100),
    },
  ]
}

export function getOverviewCards(
  role: Role,
  dashboard?: DashboardView,
  t?: TranslateFn
): OverviewCard[] {
  return buildOverview(role, dashboard, t)
}
