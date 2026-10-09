import { formatNumberFr, formatPercentFr, formatTm } from '@/features/map/utils/format'

export interface RegionalMonthlyStat {
  code: string
  name: string
  volumeTM: number
  deliveries: number
  color: string
  colorClass: string
}

/**
 * Les 10 régions du Cameroun avec volume mensuel livré (TM) et nombre de livraisons.
 * Source unique de vérité pour les panneaux régionaux du tableau de bord.
 */
export const REGIONAL_MONTHLY_STATS: RegionalMonthlyStat[] = [
  {
    code: 'LT',
    name: 'Littoral',
    volumeTM: 642.8,
    deliveries: 420,
    color: '#f59e0b',
    colorClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  {
    code: 'CE',
    name: 'Centre',
    volumeTM: 485.2,
    deliveries: 315,
    color: '#10b981',
    colorClass:
      'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  },
  {
    code: 'OU',
    name: 'Ouest',
    volumeTM: 218.4,
    deliveries: 160,
    color: '#0284c7',
    colorClass:
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  {
    code: 'SU',
    name: 'Sud',
    volumeTM: 185.0,
    deliveries: 130,
    color: '#6366f1',
    colorClass:
      'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  {
    code: 'EN',
    name: 'Extrême-Nord',
    volumeTM: 142.1,
    deliveries: 95,
    color: '#8b5cf6',
    colorClass:
      'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  },
  {
    code: 'SW',
    name: 'Sud-Ouest',
    volumeTM: 124.6,
    deliveries: 85,
    color: '#14b8a6',
    colorClass:
      'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
  },
  {
    code: 'NO',
    name: 'Nord',
    volumeTM: 112.3,
    deliveries: 80,
    color: '#ec4899',
    colorClass:
      'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30',
  },
  {
    code: 'AD',
    name: 'Adamaoua',
    volumeTM: 98.5,
    deliveries: 70,
    color: '#06b6d4',
    colorClass:
      'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  },
  {
    code: 'ES',
    name: 'Est',
    volumeTM: 74.0,
    deliveries: 55,
    color: '#f97316',
    colorClass:
      'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  },
  {
    code: 'NW',
    name: 'Nord-Ouest',
    volumeTM: 68.2,
    deliveries: 50,
    color: '#84cc16',
    colorClass:
      'bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30',
  },
]

/** Alias pour rétrocompatibilité */
export const regionalMonthlyVolumeStats = REGIONAL_MONTHLY_STATS

/** Volume actif en mouvement / rotation aujourd'hui (TM) */
export const ROTATING_ACTIVE_VOLUME_TM = 58.4

/** 30 jours de rotations et flux de livraison (fréquence sur 1 mois) */
export const DELIVERY_CADENCE_DATA = [
  { day: 1, volume: 42 },
  { day: 2, volume: 55 },
  { day: 3, volume: 68 },
  { day: 4, volume: 74 },
  { day: 5, volume: 62 },
  { day: 6, volume: 20 },
  { day: 7, volume: 15 },
  { day: 8, volume: 58 },
  { day: 9, volume: 65 },
  { day: 10, volume: 70 },
  { day: 11, volume: 82 },
  { day: 12, volume: 78 },
  { day: 13, volume: 25 },
  { day: 14, volume: 18 },
  { day: 15, volume: 64 },
  { day: 16, volume: 72 },
  { day: 17, volume: 85 },
  { day: 18, volume: 90 },
  { day: 19, volume: 68 },
  { day: 20, volume: 22 },
  { day: 21, volume: 16 },
  { day: 22, volume: 60 },
  { day: 23, volume: 75 },
  { day: 24, volume: 88 },
  { day: 25, volume: 92 },
  { day: 26, volume: 80 },
  { day: 27, volume: 24 },
  { day: 28, volume: 19 },
  { day: 29, volume: 76 },
  { day: 30, volume: 84 },
]

export interface RegionalShareChartItem {
  code: string
  name: string
  value: number
  formattedValue: string
  percentage: string
  color: string
}

export interface RegionCardItem extends RegionalMonthlyStat {
  formattedVolume: string
  share: string
}

export interface RegionalShareSummary {
  totalVolume: number
  formattedTotalVolume: string
  topSharePercent: string
  chartData: RegionalShareChartItem[]
  regionCards: RegionCardItem[]
}

import type { DeliveryTour } from '@lpg/types'

/** Calcule les statistiques régionales enrichies par les tournées réelles du système (planifiées et livrées) */
export function computeRegionalStatsFromTours(
  tours?: readonly DeliveryTour[],
  baseStats: RegionalMonthlyStat[] = REGIONAL_MONTHLY_STATS
): RegionalMonthlyStat[] {
  if (!tours || tours.length === 0) return baseStats

  const tourVolumeByRegion: Record<string, { volumeTM: number; deliveries: number }> = {}
  for (const stat of baseStats) {
    tourVolumeByRegion[stat.code] = { volumeTM: 0, deliveries: 0 }
  }

  for (const tour of tours) {
    if (tour.deleted_at || tour.mission_kind === 'PICKUP' || tour.status === 'CANCELLED') continue
    const targetStr = `${tour.destination_site_id ?? ''} ${tour.source_site_id ?? ''} ${tour.checkpoints?.map((c) => {
      const named = c as { site_id?: string; client_site_id?: string; site_name?: string; name?: string }
      return `${named.site_id ?? ''} ${named.client_site_id ?? ''} ${named.site_name ?? ''} ${named.name ?? ''}`
    }).join(' ') ?? ''}`.toLowerCase()

    let code = 'LT'
    if (targetStr.includes('yaounde') || targetStr.includes('centre') || targetStr.includes('bastos') || targetStr.includes('messa')) code = 'CE'
    else if (targetStr.includes('bafoussam') || targetStr.includes('ouest') || targetStr.includes('dschang') || targetStr.includes('bandjoun')) code = 'OU'
    else if (targetStr.includes('kribi') || targetStr.includes('ebolowa') || (targetStr.includes('sud') && !targetStr.includes('sud-ouest') && !targetStr.includes('sudouest'))) code = 'SU'
    else if (targetStr.includes('maroua') || targetStr.includes('extreme') || targetStr.includes('kousseri')) code = 'EN'
    else if (targetStr.includes('limbe') || targetStr.includes('buea') || targetStr.includes('sud-ouest') || targetStr.includes('sudouest')) code = 'SW'
    else if (targetStr.includes('garoua') || (targetStr.includes('nord') && !targetStr.includes('nord-ouest') && !targetStr.includes('nordouest'))) code = 'NO'
    else if (targetStr.includes('ngaoundere') || targetStr.includes('adamaoua')) code = 'AD'
    else if (targetStr.includes('bertoua') || targetStr.includes('est')) code = 'ES'
    else if (targetStr.includes('bamenda') || targetStr.includes('nord-ouest') || targetStr.includes('nordouest')) code = 'NW'
    else if (targetStr.includes('douala') || targetStr.includes('bonaberi') || targetStr.includes('wouri') || targetStr.includes('littoral')) code = 'LT'

    const quantity = ['PLANNED', 'ACKNOWLEDGED', 'PENDINGTRANSPORTERACK'].includes(tour.status)
      ? Math.max(0, tour.requested_quantity ?? 0)
      : Math.max(0, tour.delivered_quantity ?? tour.requested_quantity ?? 0)
    const tm = tour.type === 'VRAC' ? quantity : quantity / 20

    const targetRegion = tourVolumeByRegion[code]
    if (targetRegion) {
      targetRegion.volumeTM += tm
      targetRegion.deliveries += 1
    }
  }

  return baseStats.map((r) => {
    const extra = tourVolumeByRegion[r.code] ?? { volumeTM: 0, deliveries: 0 }
    return {
      ...r,
      volumeTM: Math.round((r.volumeTM + extra.volumeTM) * 10) / 10,
      deliveries: r.deliveries + extra.deliveries,
    }
  })
}

/** Calcule le volume total cumulé des régions */
export function computeTotalRegionalVolume(
  stats: RegionalMonthlyStat[] = REGIONAL_MONTHLY_STATS
): number {
  const sum = stats.reduce((acc, r) => acc + r.volumeTM, 0)
  return Math.round(sum * 10) / 10
}

/** Prépare les données pour le graphique donut (10 régions) et les cartes régionales */
export function buildRegionalShareSummary(
  stats: RegionalMonthlyStat[] = REGIONAL_MONTHLY_STATS
): RegionalShareSummary {
  const totalVolume = computeTotalRegionalVolume(stats)
  const top4 = stats.slice(0, 4)
  const topVolume = top4.reduce((acc, r) => acc + r.volumeTM, 0)

  const chartData: RegionalShareChartItem[] = stats.map((r) => ({
    code: r.code,
    name: r.name,
    value: r.volumeTM,
    formattedValue: formatTm(r.volumeTM),
    percentage: totalVolume > 0 ? formatPercentFr((r.volumeTM / totalVolume) * 100) : '0,0 %',
    color: r.color,
  }))

  const regionCards: RegionCardItem[] = stats.map((r) => ({
    ...r,
    formattedVolume: formatTm(r.volumeTM),
    share: totalVolume > 0 ? formatPercentFr((r.volumeTM / totalVolume) * 100) : '0,0 %',
  }))

  return {
    totalVolume,
    formattedTotalVolume: formatTm(totalVolume),
    topSharePercent: totalVolume > 0 ? formatPercentFr((topVolume / totalVolume) * 100) : '0,0 %',
    chartData,
    regionCards,
  }
}

export interface CadenceRegionItem extends RegionalMonthlyStat {
  share: string
  formattedVolume: string
}

/** Prépare les données pour la cadence de livraison et la liste modale */
export function buildCadenceRegions(
  stats: RegionalMonthlyStat[] = REGIONAL_MONTHLY_STATS
): {
  totalMonthVolumeTM: number
  formattedTotalMonthVolume: string
  rotatingActiveVolumeFormatted: string
  topRegions: CadenceRegionItem[]
  allRegions: CadenceRegionItem[]
} {
  const totalMonthVolumeTM = computeTotalRegionalVolume(stats)
  const allRegions: CadenceRegionItem[] = stats.map((r) => ({
    ...r,
    formattedVolume: formatTm(r.volumeTM),
    share: totalMonthVolumeTM > 0 ? formatPercentFr((r.volumeTM / totalMonthVolumeTM) * 100) : '0,0 %',
  }))

  return {
    totalMonthVolumeTM,
    formattedTotalMonthVolume: formatTm(totalMonthVolumeTM),
    rotatingActiveVolumeFormatted: formatNumberFr(ROTATING_ACTIVE_VOLUME_TM),
    topRegions: allRegions.slice(0, 4),
    allRegions,
  }
}
