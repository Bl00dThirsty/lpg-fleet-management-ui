import { audit_logs, buildAnalytics, curated } from '@lpg/mock-data'

export type ServiceStatus = 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL'

export interface SystemServiceHealth {
  id: string
  name: string
  kind: 'database' | 'storage' | 'api' | 'cache' | 'queue' | 'domain'
  status: ServiceStatus
  statusLabel: string
  detail: string
  /** Supplementary metrics shown on the expanded row (label → value). */
  metrics: Array<{ label: string; value: string }>
}

export interface SystemHealth {
  overall: ServiceStatus
  services: SystemServiceHealth[]
  operational: number
  degraded: number
  critical: number
  uptimePercent: number
  lastCheckAt: string
}

export const systemHealthLabels: Record<ServiceStatus, string> = {
  OPERATIONAL: 'Opérationnel',
  DEGRADED: 'Dégradé',
  CRITICAL: 'Critique',
}

function statusOf(ok: boolean, degraded = false): ServiceStatus {
  if (degraded) return 'DEGRADED'
  return ok ? 'OPERATIONAL' : 'DEGRADED'
}

/** Deterministic per time-bucket jitter so live values drift without randomness. */
function jitter(base: number, seed: number, spread = 0.08): number {
  const noise = Math.abs(Math.sin(seed * (base + 1))) * spread
  return Math.round(base * (1 + noise - spread / 2))
}

const fmt = (n: number) => n.toLocaleString('fr-FR')

export function getSystemHealth(now = Date.now()): SystemHealth {
  const a = buildAnalytics()
  const seed = Math.floor(now / 15000)

  const apiRequests =
    a.scans.total + a.tours.total * 3 + a.reconciliations.total * 2 + a.anomalies.total
  const apiLatency = 120 + jitter(28, seed + 1)
  const apiErrors = a.anomalies.open > 0 ? 0.3 + a.anomalies.open * 0.03 : 0.02

  const dbConnections = 24 + Math.min(32, a.users.total + Math.round(a.devices.total / 2))
  const dbLatency = 12 + jitter(6, seed + 2)
  const dbSizeGb = (a.tours.total * 0.4 + a.scans.total * 0.08) / 1024

  const minioObjects =
    a.scans.total + a.reconciliations.total + curated.declarations.length + a.tours.total
  const minioGb = minioObjects * 0.003

  const redisKeys = a.users.total + a.devices.total * 2 + a.sites.total * 3
  const redisMemMb = 120 + jitter(40, seed + 3)

  const queuePending =
    a.anomalies.open + a.tours.awaitingTransporter + Math.round(a.scans.conflicts / 2)
  const queuePerMin = 40 + jitter(24, seed + 4)
  const queueAvgSec = 1.2 + jitter(0.7, seed + 5)

  const services: SystemServiceHealth[] = [
    {
      id: 'api',
      name: 'API Gateway',
      kind: 'api',
      status: 'OPERATIONAL',
      statusLabel: systemHealthLabels.OPERATIONAL,
      detail: 'Points d’entrée REST et WebSocket',
      metrics: [
        { label: 'Requêtes/min', value: fmt(jitter(apiRequests, seed + 6)) },
        { label: 'Latence p95', value: `${apiLatency.toFixed(0)} ms` },
        { label: 'Erreurs 5xx', value: `${apiErrors.toFixed(2)}%` },
      ],
    },
    {
      id: 'database',
      name: 'PostgreSQL',
      kind: 'database',
      status: 'OPERATIONAL',
      statusLabel: systemHealthLabels.OPERATIONAL,
      detail: 'Base de données relationnelle principale',
      metrics: [
        { label: 'Connexions', value: `${dbConnections} / 100` },
        { label: 'Temps de réponse', value: `${dbLatency.toFixed(0)} ms` },
        { label: 'Taille', value: `${dbSizeGb.toFixed(1)} Go` },
      ],
    },
    {
      id: 'minio',
      name: 'MinIO (stockage objet)',
      kind: 'storage',
      status: 'OPERATIONAL',
      statusLabel: systemHealthLabels.OPERATIONAL,
      detail: 'Certificats, preuves et images S3-compatible',
      metrics: [
        { label: 'Buckets', value: '6' },
        { label: 'Objets', value: fmt(minioObjects) },
        { label: 'Stockage utilisé', value: `${minioGb.toFixed(1)} Go` },
      ],
    },
    {
      id: 'redis',
      name: 'Redis (cache)',
      kind: 'cache',
      status: 'OPERATIONAL',
      statusLabel: systemHealthLabels.OPERATIONAL,
      detail: 'Cache applicatif et sessions',
      metrics: [
        { label: 'Hit rate', value: `${(94 + jitter(3, seed + 7) / 10).toFixed(1)}%` },
        { label: 'Mémoire', value: `${redisMemMb} Mo / 1 Go` },
        { label: 'Clés', value: fmt(redisKeys) },
      ],
    },
    {
      id: 'queue',
      name: 'File de messages',
      kind: 'queue',
      status: queuePending > 30 ? 'DEGRADED' : 'OPERATIONAL',
      statusLabel: queuePending > 30 ? systemHealthLabels.DEGRADED : systemHealthLabels.OPERATIONAL,
      detail: 'Traitement asynchrone des rapports et risques',
      metrics: [
        { label: 'Messages en attente', value: fmt(queuePending) },
        { label: 'Traités/min', value: fmt(queuePerMin) },
        { label: 'Temps moyen', value: `${queueAvgSec.toFixed(1)} s` },
      ],
    },
    {
      id: 'devices',
      name: 'Flotte & dispositifs',
      kind: 'domain',
      status: statusOf(a.devices.attention.length === 0, a.devices.attention.length > 0),
      statusLabel:
        a.devices.attention.length > 0 ? systemHealthLabels.DEGRADED : systemHealthLabels.OPERATIONAL,
      detail: `${a.devices.total} appareils · ${a.devices.attention.length} à surveiller`,
      metrics: [
        { label: 'Total', value: String(a.devices.total) },
        { label: 'À surveiller', value: String(a.devices.attention.length) },
        { label: 'En ligne', value: String(a.devices.byStatus['ONLINE'] ?? 0) },
      ],
    },
    {
      id: 'tours',
      name: 'Moteur de tournées',
      kind: 'domain',
      status: 'OPERATIONAL',
      statusLabel: systemHealthLabels.OPERATIONAL,
      detail: `${a.tours.total} tournées · ${a.tours.inFlight} en cours`,
      metrics: [
        { label: 'En cours', value: String(a.tours.inFlight) },
        { label: 'Planifiées', value: String(a.tours.planned) },
        { label: 'En attente transporteur', value: String(a.tours.awaitingTransporter) },
      ],
    },
    {
      id: 'reconciliation',
      name: 'Réconciliation',
      kind: 'domain',
      status: statusOf(a.reconciliations.totalGap === 0, a.reconciliations.totalGap > 0),
      statusLabel:
        a.reconciliations.totalGap > 0 ? systemHealthLabels.DEGRADED : systemHealthLabels.OPERATIONAL,
      detail: `${a.reconciliations.total} réconciliations · écart ${fmt(a.reconciliations.totalGap)} TM`,
      metrics: [
        { label: 'Total', value: String(a.reconciliations.total) },
        { label: 'Écart', value: `${fmt(a.reconciliations.totalGap)} TM` },
        { label: 'Impact subvention', value: `${fmt(a.reconciliations.totalSubsidyImpact)} FCFA` },
      ],
    },
  ]

  const critical = services.filter((s) => s.status === 'CRITICAL').length
  const degraded = services.filter((s) => s.status === 'DEGRADED').length
  const operational = services.filter((s) => s.status === 'OPERATIONAL').length
  const overall: ServiceStatus = critical > 0 ? 'CRITICAL' : degraded > 0 ? 'DEGRADED' : 'OPERATIONAL'

  const failureCount = audit_logs.filter((l) => l.action === 'LOGINFAILURE').length
  const uptimePercent = Math.min(99.99, 99.5 + failureCount * 0.05 + (critical > 0 ? 0 : 0.48))

  return {
    overall,
    services,
    operational,
    degraded,
    critical,
    uptimePercent: Number(uptimePercent.toFixed(2)),
    lastCheckAt: new Date(now).toISOString(),
  }
}

export function getServiceHealthSummary(now?: number) {
  const health = getSystemHealth(now)
  return {
    total: health.services.length,
    operational: health.operational,
    degraded: health.degraded,
    critical: health.critical,
    overall: health.overall,
    overallLabel: systemHealthLabels[health.overall],
    uptimePercent: health.uptimePercent,
  }
}