import { buildAnalytics } from '@lpg/mock-data'

export interface MetricCard {
  id: string
  label: string
  value: string
  unit: string
  hint: string
}

export function getSystemMetrics(): MetricCard[] {
  const a = buildAnalytics()
  const traceability = a.traceability.traceabilityRate
  return [
    {
      id: 'tours',
      label: 'Tournées',
      value: String(a.tours.total),
      unit: 'total',
      hint: `${a.tours.inFlight} en cours`,
    },
    {
      id: 'scans',
      label: 'Scans',
      value: String(a.scans.total),
      unit: 'événements',
      hint: `${a.scans.conflicts} conflits`,
    },
    {
      id: 'devices',
      label: 'Appareils',
      value: String(a.devices.total),
      unit: 'dispositifs',
      hint: `${a.devices.attention.length} à surveiller`,
    },
    {
      id: 'traceability',
      label: 'Traçabilité',
      value: `${Math.round(traceability)}%`,
      unit: 'volume',
      hint: 'déclaré vs suivi',
    },
    {
      id: 'anomalies',
      label: 'Anomalies',
      value: String(a.anomalies.open),
      unit: 'ouvertes',
      hint: `${a.anomalies.total} au total`,
    },
    {
      id: 'gap',
      label: 'Écart volume',
      value: String(Math.round(a.reconciliations.totalGap)),
      unit: 'TM',
      hint: `${a.reconciliations.total} réconciliations`,
    },
  ]
}

export function getMetricGroups() {
  const a = buildAnalytics()
  return {
    operations: [
      { key: 'tournées', value: a.tours.total },
      { key: 'scans', value: a.scans.total },
      { key: 'déclarations suivies', value: a.traceability.trackedVolume },
    ],
    health: [
      { key: 'appareils', value: a.devices.total },
      { key: 'anomalies ouvertes', value: a.anomalies.open },
      { key: 'écart TM', value: Math.round(a.reconciliations.totalGap) },
    ],
  }
}