import {
  buildAttentionRows,
  buildStatusSlices,
  buildTypeSlices,
  computeIntegrateurKpis,
  type IntegrateurKpis,
  type StatusSlice,
  type TypeSlice,
} from '../lib/integrateur-dashboard'

export interface IntegrateurDashboardData {
  kpis: IntegrateurKpis
  statusSlices: StatusSlice[]
  typeSlices: TypeSlice[]
  attention: ReturnType<typeof buildAttentionRows>
}

/**
 * View builder for the Intégrateur dashboard. Stateless: feed it the
 * payload of GET /api/v1/devices/stats (`deviceStats()` shape) and get the
 * view models consumed by the page components.
 *
 * NOTE: GET /api/v1/devices/stats is a frontend-only contract, not yet
 * implemented in lpg-backend (see api-client `deviceStats`). Only the
 * Intégrateur dashboard consumes it.
 */
export function toIntegrateurDashboardData(stats: {
  total: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  attention: Array<{ id: string; serial: string; type: string; issue: string; battery: number | null; lastSync: string | null }>
}): IntegrateurDashboardData {
  return {
    kpis: computeIntegrateurKpis(stats),
    statusSlices: buildStatusSlices(stats),
    typeSlices: buildTypeSlices(stats),
    attention: buildAttentionRows(stats),
  }
}
