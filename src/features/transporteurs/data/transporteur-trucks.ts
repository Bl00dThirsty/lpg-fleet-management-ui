export type TransporteurTruckStatus = 'available' | 'in_transit' | 'maintenance'

export type TransporteurTruck = {
  id: string
  transporteurId: string
  plateNumber: string
  makeModel: string
  year: number
  tankCapacityTM: number
  status: TransporteurTruckStatus
  assignedDriver: string
}

export const truckStatusLabels: Record<TransporteurTruckStatus, string> = {
  available: 'Disponible',
  in_transit: 'En livraison',
  maintenance: 'Maintenance',
}

export const transporteurTrucks: TransporteurTruck[] = [
  // ── TRANSLOG CAMEROUN (TRP-001) ──────────────────────────
  { id: 'TC-001', transporteurId: 'TRP-001', plateNumber: 'LT 3344 AB', makeModel: 'HOWO Sinotruk 6x4', year: 2023, tankCapacityTM: 22, status: 'in_transit', assignedDriver: 'Nguemo Paul' },
  { id: 'TC-002', transporteurId: 'TRP-001', plateNumber: 'LT 5566 CD', makeModel: 'Mercedes Actros 1845', year: 2021, tankCapacityTM: 18, status: 'available', assignedDriver: 'Fotso Michel' },
  { id: 'TC-003', transporteurId: 'TRP-001', plateNumber: 'LT 7788 EF', makeModel: 'Iveco Trakker 410', year: 2020, tankCapacityTM: 16, status: 'maintenance', assignedDriver: 'Talla Jean' },

  // ── SAHEL TRANSPORT (TRP-002) ────────────────────────────
  { id: 'TC-004', transporteurId: 'TRP-002', plateNumber: 'NO 1122 GH', makeModel: 'Renault T 480', year: 2022, tankCapacityTM: 20, status: 'in_transit', assignedDriver: 'Adamou Issa' },
  { id: 'TC-005', transporteurId: 'TRP-002', plateNumber: 'NO 3344 IJ', makeModel: 'DAF XF 480', year: 2021, tankCapacityTM: 24, status: 'available', assignedDriver: 'Hamidou Sali' },

  // ── EXPRESS PETRO LOGISTICS (TRP-003) ────────────────────
  { id: 'TC-006', transporteurId: 'TRP-003', plateNumber: 'CE 9900 KL', makeModel: 'Scania R450', year: 2023, tankCapacityTM: 25, status: 'in_transit', assignedDriver: 'Mbarga Luc' },
  { id: 'TC-007', transporteurId: 'TRP-003', plateNumber: 'CE 1100 MN', makeModel: 'Volvo FH 500', year: 2022, tankCapacityTM: 22, status: 'available', assignedDriver: 'Onana Pierre' },
  { id: 'TC-008', transporteurId: 'TRP-003', plateNumber: 'CE 2200 OP', makeModel: 'MAN TGS 26.440', year: 2020, tankCapacityTM: 18, status: 'in_transit', assignedDriver: 'Essomba Denis' },

  // ── GULF TRANS (TRP-004) ─────────────────────────────────
  { id: 'TC-009', transporteurId: 'TRP-004', plateNumber: 'OU 4455 QR', makeModel: 'HOWO Sinotruk 8x4', year: 2019, tankCapacityTM: 30, status: 'maintenance', assignedDriver: 'Kengne Victor' },
]

export function getTransporteurTrucks(transporteurId: string): TransporteurTruck[] {
  return transporteurTrucks.filter((t) => t.transporteurId === transporteurId)
}
