export type TransporterRouteStatus = 'terminé' | 'en cours' | 'planifié'

export type TransporterRoute = {
  id: string
  transporterId: string
  truckPlate: string
  origin: string
  destination: string
  date: string
  volume: string
  status: TransporterRouteStatus
  marketer: string
}

export const transporterRoutes: TransporterRoute[] = [
  // ── TRANSLOG CAMEROUN (TRP-001) ──────────────────────────
  { id: 'TR-001', transporterId: 'TRP-001', truckPlate: 'LT 3344 AB', origin: 'SCDP Douala', destination: 'Total Bonanjo', date: '2026-07-08', volume: '18 TM', status: 'en cours', marketer: 'TOTALENERGIES' },
  { id: 'TR-002', transporterId: 'TRP-001', truckPlate: 'LT 5566 CD', origin: 'Dépôt Bonaberi', destination: 'Tradex Akwa', date: '2026-07-07', volume: '15 TM', status: 'terminé', marketer: 'TRADEX' },
  { id: 'TR-003', transporterId: 'TRP-001', truckPlate: 'LT 3344 AB', origin: 'SCDP Douala', destination: 'Camgaz Bassa', date: '2026-07-06', volume: '20 TM', status: 'terminé', marketer: 'CAMGAZ' },

  // ── SAHEL TRANSPORT (TRP-002) ────────────────────────────
  { id: 'TR-004', transporterId: 'TRP-002', truckPlate: 'NO 1122 GH', origin: 'Dépôt Garoua', destination: 'Ola Energy Maroua', date: '2026-07-08', volume: '20 TM', status: 'en cours', marketer: 'OLA ENERGY' },
  { id: 'TR-005', transporterId: 'TRP-002', truckPlate: 'NO 3344 IJ', origin: 'Dépôt Garoua', destination: 'Tradex Ngaoundéré', date: '2026-07-05', volume: '22 TM', status: 'terminé', marketer: 'TRADEX' },

  // ── EXPRESS PETRO LOGISTICS (TRP-003) ────────────────────
  { id: 'TR-006', transporterId: 'TRP-003', truckPlate: 'CE 9900 KL', origin: 'SCDP Yaoundé', destination: 'Total Nsam', date: '2026-07-08', volume: '25 TM', status: 'en cours', marketer: 'TOTALENERGIES' },
  { id: 'TR-007', transporterId: 'TRP-003', truckPlate: 'CE 2200 OP', origin: 'SCDP Yaoundé', destination: 'Camgaz Mvan', date: '2026-07-08', volume: '18 TM', status: 'en cours', marketer: 'CAMGAZ' },
  { id: 'TR-008', transporterId: 'TRP-003', truckPlate: 'CE 1100 MN', origin: 'Dépôt Nsam', destination: 'Total Mokolo', date: '2026-07-04', volume: '22 TM', status: 'terminé', marketer: 'TOTALENERGIES' },

  // ── GULF TRANS (TRP-004) ─────────────────────────────────
  { id: 'TR-009', transporterId: 'TRP-004', truckPlate: 'OU 4455 QR', origin: 'Dépôt Bafoussam', destination: 'Ola Energy Bafoussam', date: '2026-06-28', volume: '28 TM', status: 'terminé', marketer: 'OLA ENERGY' },
]

export function getTransporterRoutes(transporterId: string): TransporterRoute[] {
  return transporterRoutes.filter((r) => r.transporterId === transporterId)
}
