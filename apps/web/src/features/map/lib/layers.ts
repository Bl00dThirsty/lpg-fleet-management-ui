export type MapLayerKey =
  | 'sites'
  | 'clientSites'
  | 'zoneBoundaries'
  | 'countryBoundaries'
  | 'anomalies'
  | 'trucks'
  | 'checkpoints'
  | 'heatmap'

export type MapEntityFilter = 'all' | 'marketeur' | 'transporteur' | 'client'

export function getInitialLayers(): Record<MapLayerKey, boolean> {
  return {
    sites: true,
    clientSites: true,
    zoneBoundaries: true,
    countryBoundaries: false,
    anomalies: true,
    trucks: true,
    checkpoints: false,
    heatmap: false,
  }
}

export const LAYER_LABELS: Record<MapLayerKey, string> = {
  sites: 'Sites marchands',
  clientSites: 'Sites clients',
  zoneBoundaries: 'Limites Régions',
  countryBoundaries: 'Limite Pays',
  anomalies: 'Anomalies',
  trucks: 'Véhicules & tournées',
  checkpoints: 'Points de contrôle',
  heatmap: 'Carte de chaleur',
}