import { deviceStats } from '@lpg/mock-data'
import { getAnomalies, severityLabels } from '@/features/anomalies/data/anomalies'

export interface InfraAlert {
  id: string
  title: string
  source: 'DEVICE' | 'ANOMALY' | 'SYSTEM'
  severity: string
  severityLabel: string
  detail: string
}

export function getInfraAlerts(): InfraAlert[] {
  const deviceAlerts: InfraAlert[] = deviceStats().attention.map((device) => ({
    id: `device-${device.id}`,
    title: `${device.serial} — ${device.issue}`,
    source: 'DEVICE',
    severity: 'CRITIQUE',
    severityLabel: 'Critique',
    detail: `Batterie : ${device.battery ?? '—'}% · Dernier sync : ${device.lastSync ?? '—'}`,
  }))

  const anomalyAlerts: InfraAlert[] = getAnomalies('ALL')
    .filter((a) => a.status !== 'RESOLU')
    .slice(0, 6)
    .map((a) => ({
      id: `anomaly-${a.id}`,
      title: a.type_label ?? a.type,
      source: 'ANOMALY',
      severity: a.severity,
      severityLabel: severityLabels[a.severity] ?? a.severity,
      detail: a.assigned_agent ?? 'Non affectée',
    }))

  return [...deviceAlerts, ...anomalyAlerts]
}

export function getInfraAlertSummary() {
  const alerts = getInfraAlerts()
  return {
    total: alerts.length,
    devices: alerts.filter((a) => a.source === 'DEVICE').length,
    anomalies: alerts.filter((a) => a.source === 'ANOMALY').length,
  }
}