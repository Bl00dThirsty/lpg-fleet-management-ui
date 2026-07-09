export type TransporteurStatus = 'active' | 'inactive'

export type Transporteur = {
  id: string
  name: string
  status: TransporteurStatus
  region: string
  contactEmail: string
  contactPhone: string
  fleetSize: number
}

export const transporteurStatusOptions = [
  { label: 'Actif', value: 'active' },
  { label: 'Inactif', value: 'inactive' },
]

export const transporteurs: Transporteur[] = [
  { id: 'TRP-001', name: 'TRANSLOG CAMEROUN', status: 'active', region: 'Littoral', contactEmail: 'contact@translog.cm', contactPhone: '+237 6 91 00 00 01', fleetSize: 8 },
  { id: 'TRP-002', name: 'SAHEL TRANSPORT', status: 'active', region: 'Nord', contactEmail: 'contact@saheltransport.cm', contactPhone: '+237 6 92 00 00 02', fleetSize: 5 },
  { id: 'TRP-003', name: 'EXPRESS PETRO LOGISTICS', status: 'active', region: 'Centre', contactEmail: 'contact@expresspl.cm', contactPhone: '+237 6 93 00 00 03', fleetSize: 12 },
  { id: 'TRP-004', name: 'GULF TRANS', status: 'inactive', region: 'Ouest', contactEmail: 'contact@gulftrans.cm', contactPhone: '+237 6 94 00 00 04', fleetSize: 3 },
]

export function getTransporteurById(id: string): Transporteur | undefined {
  return transporteurs.find((t) => t.id === id)
}
