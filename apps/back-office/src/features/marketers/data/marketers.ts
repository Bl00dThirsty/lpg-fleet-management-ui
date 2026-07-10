export type MarketerStatus = 'active' | 'inactive'

export type Marketer = {
  id: string
  name: string
  status: MarketerStatus
  region: string
  contactEmail: string
  contactPhone: string
}

export const marketerStatusOptions = [
  { label: 'Actif', value: 'active' },
  { label: 'Inactif', value: 'inactive' },
]

export const marketers: Marketer[] = [
  { id: 'MKT-001', name: 'TOTALENERGIES', status: 'active', region: 'National', contactEmail: 'contact@totalenergies.cm', contactPhone: '+237 600000001' },
  { id: 'MKT-002', name: 'CAMGAZ', status: 'active', region: 'National', contactEmail: 'contact@camgaz.cm', contactPhone: '+237 600000002' },
  { id: 'MKT-003', name: 'OLA ENERGY', status: 'active', region: 'National', contactEmail: 'contact@olaenergy.cm', contactPhone: '+237 600000003' },
  { id: 'MKT-004', name: 'CORLAY', status: 'active', region: 'National', contactEmail: 'contact@corlay.cm', contactPhone: '+237 600000004' },
  { id: 'MKT-005', name: 'NEPTUNE', status: 'active', region: 'National', contactEmail: 'contact@neptune.cm', contactPhone: '+237 600000005' },
  { id: 'MKT-006', name: 'TRADEX', status: 'active', region: 'National', contactEmail: 'contact@tradex.cm', contactPhone: '+237 600000006' },
  { id: 'MKT-007', name: 'SCTM', status: 'active', region: 'National', contactEmail: 'contact@sctm.cm', contactPhone: '+237 600000007' },
  { id: 'MKT-008', name: 'AZA AFRIGAZ', status: 'active', region: 'National', contactEmail: 'contact@azaafrigaz.cm', contactPhone: '+237 600000008' },
  { id: 'MKT-009', name: 'SEDECAM', status: 'active', region: 'National', contactEmail: 'contact@sedecam.cm', contactPhone: '+237 600000009' },
  { id: 'MKT-010', name: 'STARGAS', status: 'active', region: 'National', contactEmail: 'contact@stargas.cm', contactPhone: '+237 600000010' },
  { id: 'MKT-011', name: 'INFOTECH', status: 'active', region: 'National', contactEmail: 'contact@infotech.cm', contactPhone: '+237 600000011' },
  { id: 'MKT-012', name: 'GREEN OIL', status: 'active', region: 'National', contactEmail: 'contact@greenoil.cm', contactPhone: '+237 600000012' },
  { id: 'MKT-013', name: 'BOCOM', status: 'active', region: 'National', contactEmail: 'contact@bocom.cm', contactPhone: '+237 600000013' },
  { id: 'MKT-014', name: 'AKENO', status: 'active', region: 'National', contactEmail: 'contact@akeno.cm', contactPhone: '+237 600000014' },
  { id: 'MKT-015', name: 'TANK OIL', status: 'active', region: 'National', contactEmail: 'contact@tankoil.cm', contactPhone: '+237 600000015' },
  { id: 'MKT-016', name: 'PETROLEX', status: 'active', region: 'National', contactEmail: 'contact@petrolex.cm', contactPhone: '+237 600000016' },
  { id: 'MKT-017', name: 'BLESSING', status: 'active', region: 'National', contactEmail: 'contact@blessing.cm', contactPhone: '+237 600000017' },
  { id: 'MKT-018', name: 'CAMOCO', status: 'active', region: 'National', contactEmail: 'contact@camoco.cm', contactPhone: '+237 600000018' },
  { id: 'MKT-019', name: 'GAMA ENERGY', status: 'active', region: 'National', contactEmail: 'contact@gamaenergy.cm', contactPhone: '+237 600000019' },
  { id: 'MKT-020', name: 'BG PETROLEUM', status: 'active', region: 'National', contactEmail: 'contact@bgpetroleum.cm', contactPhone: '+237 600000020' },
  { id: 'MKT-021', name: 'VISION ENERGY', status: 'active', region: 'National', contactEmail: 'contact@visionenergy.cm', contactPhone: '+237 600000021' },
  { id: 'MKT-022', name: 'REAL OIL', status: 'active', region: 'National', contactEmail: 'contact@realoil.cm', contactPhone: '+237 600000022' },
  { id: 'MKT-023', name: 'GLOBAL PT.', status: 'active', region: 'National', contactEmail: 'contact@globalpt.cm', contactPhone: '+237 600000023' },
  { id: 'MKT-024', name: 'TABE PET.', status: 'active', region: 'National', contactEmail: 'contact@tabepet.cm', contactPhone: '+237 600000024' },
  { id: 'MKT-025', name: 'GDC', status: 'active', region: 'National', contactEmail: 'contact@gdc.cm', contactPhone: '+237 600000025' },
]

export function getMarketerById(id: string): Marketer | undefined {
  return marketers.find((m) => m.id === id)
}
