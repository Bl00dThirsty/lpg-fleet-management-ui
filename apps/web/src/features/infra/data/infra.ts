export interface InfraDashboard {
  id: string
  title: string
  description: string
}

export const INFRA_DASHBOARDS: readonly InfraDashboard[] = [
  { id: 'overview', title: 'Vue d’ensemble', description: 'Volumes, traces et indicateurs clés agrégés.' },
  { id: 'fleet', title: 'Flotte & dispositifs', description: 'Télémétrie appareils, batterie et connectivité.' },
  { id: 'tours', title: 'Tournées temps réel', description: 'Suivi des missions et points de contrôle.' },
  { id: 'risk', title: 'Risques & anomalies', description: 'Chaleur de risques et file d’anomalies.' },
]

export function getInfraDashboards(): InfraDashboard[] {
  return [...INFRA_DASHBOARDS]
}