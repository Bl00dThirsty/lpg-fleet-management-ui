/**
 * Analytics selectors — pure functions deriving KPIs from the curated CSPH GPL
 * fixtures. Consumed by the per-role dashboards; kept side-effect free so they
 * are trivially testable.
 */

import { curated } from './curated.ts'
import type { RiskScore } from './curated.ts'
import { getSettingNumber } from './settings.ts'

type Indexable = object

export function countBy<T extends Indexable>(
  items: readonly T[],
  key: string
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const value = String((item as Record<string, unknown>)[key] ?? 'inconnu')
    counts[value] = (counts[value] ?? 0) + 1
  }
  return counts
}

export function sumBy<T extends Indexable>(
  items: readonly T[],
  key: string
): number {
  return items.reduce(
    (acc, item) => acc + (Number((item as Record<string, unknown>)[key]) || 0),
    0
  )
}

export interface OrgSummary {
  total: number
  active: number
  byType: Record<string, number>
}

export function organizationStats(): OrgSummary {
  return {
    total: curated.organizations.length,
    active: curated.organizations.filter((o) => o.is_active).length,
    byType: countBy(curated.organizations, 'type'),
  }
}

export function orgNameById(id: string): string {
  return curated.organizations.find((o) => o.id === id)?.name ?? id
}

export interface DeclaredVsTracked {
  marketeurId: string
  marketeurName: string
  declaredVolume: number
  trackedVolume: number
  gap: number
  gapPct: number
  subsidyImpact: number
}

export interface Traceability {
  declaredVolume: number
  trackedVolume: number
  traceabilityRate: number
  byMarketeur: DeclaredVsTracked[]
}

export function declaredVsTracked(): Traceability {
  const trackedByDeclaration = new Map(
    curated.reconciliations.map((r) => [r.declaration_id, r])
  )

  const marketeurs = new Map<string, DeclaredVsTracked>()
  for (const declaration of curated.declarations) {
    const tracked = trackedByDeclaration.get(declaration.id)
    const current = marketeurs.get(declaration.marketeur_org_id) ?? {
      marketeurId: declaration.marketeur_org_id,
      marketeurName: orgNameById(declaration.marketeur_org_id),
      declaredVolume: 0,
      trackedVolume: 0,
      gap: 0,
      gapPct: 0,
      subsidyImpact: 0,
    }
    current.declaredVolume += declaration.declared_volume
    current.trackedVolume += tracked?.tracked_volume ?? 0
    current.gap = current.declaredVolume - current.trackedVolume
    current.gapPct =
      current.declaredVolume > 0
        ? (current.gap / current.declaredVolume) * 100
        : 0
    current.subsidyImpact += tracked?.subsidy_impact ?? 0
    marketeurs.set(declaration.marketeur_org_id, current)
  }

  const byMarketeur = Array.from(marketeurs.values()).sort(
    (a, b) => b.declaredVolume - a.declaredVolume
  )
  const declaredVolume = sumBy(curated.declarations, 'declared_volume')
  const trackedVolume = sumBy(curated.reconciliations, 'tracked_volume')

  return {
    declaredVolume,
    trackedVolume,
    traceabilityRate: declaredVolume > 0 ? trackedVolume / declaredVolume : 0,
    byMarketeur,
  }
}

export interface AnomalyStats {
  total: number
  open: number
  resolved: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  bySeverity: Record<string, number>
  byType: Record<string, number>
}

export function anomalyStats(): AnomalyStats {
  const open = curated.anomalies.filter((a) => a.status !== 'RESOLU')
  const resolved = curated.anomalies.filter((a) => a.status === 'RESOLU')
  return {
    total: curated.anomalies.length,
    open: open.length,
    resolved: resolved.length,
    byStatus: countBy(curated.anomalies, 'status'),
    byCategory: countBy(curated.anomalies, 'category'),
    bySeverity: countBy(curated.anomalies, 'severity'),
    byType: countBy(curated.anomalies, 'type'),
  }
}

export function anomaliesByRegion(): Record<string, number> {
  const regionBySite = new Map(curated.sites.map((s) => [s.id, s.region]))
  const counts: Record<string, number> = {}
  for (const anomaly of curated.anomalies) {
    const region = anomaly.site_id
      ? (regionBySite.get(anomaly.site_id) ?? 'inconnu')
      : 'sans site'
    counts[region] = (counts[region] ?? 0) + 1
  }
  return counts
}

export interface TourStats {
  total: number
  byStatus: Record<string, number>
  byMode: Record<string, number>
  byType: Record<string, number>
  inFlight: number
  planned: number
  awaitingTransporter: number
  totalRequested: number
  totalLoaded: number
  totalDelivered: number
}

const IN_FLIGHT_STATUSES = ['INPROGRESS', 'CHECKPOINTACTIVE', 'ACKNOWLEDGED']

export function tourStats(): TourStats {
  return {
    total: curated.delivery_tours.length,
    byStatus: countBy(curated.delivery_tours, 'status'),
    byMode: countBy(curated.delivery_tours, 'execution_mode'),
    byType: countBy(curated.delivery_tours, 'type'),
    inFlight: curated.delivery_tours.filter((t) =>
      IN_FLIGHT_STATUSES.includes(t.status)
    ).length,
    planned: curated.delivery_tours.filter((t) => t.status === 'PLANNED').length,
    awaitingTransporter: curated.delivery_tours.filter((t) =>
      t.status === 'PENDINGTRANSPORTERACK'
    ).length,
    totalRequested: sumBy(curated.delivery_tours, 'requested_quantity'),
    totalLoaded: sumBy(curated.delivery_tours, 'loaded_quantity'),
    totalDelivered: sumBy(curated.delivery_tours, 'delivered_quantity'),
  }
}

export interface DeviceAttention {
  id: string
  serial: string
  type: string
  issue: string
  battery: number | null
  lastSync: string | null
}

export interface DeviceStats {
  total: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  attention: DeviceAttention[]
}

export function deviceStats(): DeviceStats {
  const attention: DeviceAttention[] = []
  const criticalThreshold = getSettingNumber('device.battery_critical_threshold') ?? 15
  for (const device of curated.devices) {
    if (device.battery_critical || (device.battery_level !== null && device.battery_level <= criticalThreshold)) {
      attention.push({
        id: device.id,
        serial: device.serial_number,
        type: device.device_type,
        issue: 'Batterie critique',
        battery: device.battery_level,
        lastSync: device.last_sync ?? null,
      })
    } else if (device.status === 'OFFLINE') {
      attention.push({
        id: device.id,
        serial: device.serial_number,
        type: device.device_type,
        issue: device.status,
        battery: device.battery_level,
        lastSync: device.last_sync ?? null,
      })
    }
  }
  return {
    total: curated.devices.length,
    byType: countBy(curated.devices, 'device_type'),
    byStatus: countBy(curated.devices, 'status'),
    attention,
  }
}

export interface RiskEntitySummary {
  entityType: string
  count: number
  avgScore: number
  maxScore: number
  levels: Record<string, number>
}

export function riskScoreStats(): RiskEntitySummary[] {
  const byType = new Map<string, RiskScore[]>()
  for (const score of curated.risk_scores) {
    const list = byType.get(score.entity_type) ?? []
    list.push(score)
    byType.set(score.entity_type, list)
  }
  return Array.from(byType.entries())
    .map(([entityType, scores]) => ({
      entityType,
      count: scores.length,
      avgScore: Math.round((scores.reduce((a, s) => a + s.score, 0) / scores.length) * 10) / 10,
      maxScore: Math.max(...scores.map((s) => s.score)),
      levels: countBy(scores, 'level'),
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
}

export interface ScanStats {
  total: number
  byDirection: Record<string, number>
  withPhoto: number
  conflicts: number
}

export function scanStats(): ScanStats {
  return {
    total: curated.scan_events.length,
    byDirection: countBy(curated.scan_events, 'direction'),
    withPhoto: curated.scan_events.filter((s) => s.photo_url).length,
    conflicts: curated.scan_events.filter((s) => s.conflict_status).length,
  }
}

export interface Subsidy {
  atRisk: number
  redressementsEmitted: number
  redressementsOpen: number
  reconciliationImpact: number
}

export function subsidyStats(): Subsidy {
  const reconciliationImpact = curated.reconciliations
    .filter((r) => r.status !== 'VERIFIED')
    .reduce((acc, r) => acc + r.subsidy_impact, 0)
  const redressementsEmitted = sumBy(curated.redressements, 'amount')
  const redressementsOpen = curated.redressements
    .filter((r) => r.status !== 'PAID')
    .reduce((acc, r) => acc + r.amount, 0)
  return {
    atRisk: reconciliationImpact + redressementsOpen,
    redressementsEmitted,
    redressementsOpen,
    reconciliationImpact,
  }
}

export interface ReconciliationStats {
  total: number
  totalGap: number
  totalSubsidyImpact: number
  byStatus: Record<string, number>
}

export function reconciliationStats(): ReconciliationStats {
  return {
    total: curated.reconciliations.length,
    totalGap: sumBy(curated.reconciliations, 'volume_gap'),
    totalSubsidyImpact: sumBy(curated.reconciliations, 'subsidy_impact'),
    byStatus: countBy(curated.reconciliations, 'status'),
  }
}

export interface UserStats {
  total: number
  active: number
  byRole: Record<string, number>
}

export function userStats(): UserStats {
  return {
    total: curated.users.length,
    active: curated.users.filter((u) => u.is_active).length,
    byRole: countBy(curated.users, 'system_role'),
  }
}

export interface SiteStats {
  total: number
  verified: number
  active: number
  byRegion: Record<string, number>
  byStatus: Record<string, number>
}

export function siteStats(): SiteStats {
  return {
    total: curated.sites.length,
    verified: curated.sites.filter((s) => s.is_verified).length,
    active: curated.sites.filter((s) => s.is_active).length,
    byRegion: countBy(curated.sites, 'region'),
    byStatus: countBy(curated.sites, 'status'),
  }
}

export interface NotificationStats {
  total: number
  unread: number
  byChannel: Record<string, number>
}

export function notificationStats(): NotificationStats {
  return {
    total: curated.notifications.length,
    unread: curated.notifications.filter((n) => !n.is_read).length,
    byChannel: countBy(curated.notifications, 'channel'),
  }
}

export interface CheckpointStats {
  total: number
  byStatus: Record<string, number>
  missed: number
}

export function checkpointStats(): CheckpointStats {
  return {
    total: curated.checkpoints.length,
    byStatus: countBy(curated.checkpoints, 'status'),
    missed: curated.checkpoints.filter((c) => c.status === 'SKIPPED').length,
  }
}

export interface Analytics {
  organizations: OrgSummary
  users: UserStats
  sites: SiteStats
  devices: DeviceStats
  tours: TourStats
  scans: ScanStats
  traceability: Traceability
  anomalies: AnomalyStats
  anomaliesByRegion: Record<string, number>
  reconciliations: ReconciliationStats
  subsidy: Subsidy
  riskScores: RiskEntitySummary[]
  checkpoints: CheckpointStats
  notifications: NotificationStats
}

export function buildAnalytics(): Analytics {
  return {
    organizations: organizationStats(),
    users: userStats(),
    sites: siteStats(),
    devices: deviceStats(),
    tours: tourStats(),
    scans: scanStats(),
    traceability: declaredVsTracked(),
    anomalies: anomalyStats(),
    anomaliesByRegion: anomaliesByRegion(),
    reconciliations: reconciliationStats(),
    subsidy: subsidyStats(),
    riskScores: riskScoreStats(),
    checkpoints: checkpointStats(),
    notifications: notificationStats(),
  }
}
