import { curated } from '@lpg/mock-data'
import type {
  Vehicle as CuratedVehicle,
  VehicleType,
} from '@lpg/types'
import { makeStatusDisplay } from '@/lib/ui/status-display'

export type CertificateStatus =
  | 'VALID'
  | 'EXPIRED'
  | 'EXPIRING'
  | 'MISSING'

export interface CertificateView {
  id: string
  vehicleId: string
  licensePlate: string
  certificateNumber: string
  issuedAt: string
  expiryAt: string
  status: CertificateStatus
  orgId: string
  orgName: string
  vehicleType: VehicleType
  url: string
}

const EXPIRING_WINDOW_DAYS = 30

const CERT_STATUS_LABELS: Record<CertificateStatus, string> = {
  VALID: 'Valide',
  EXPIRED: 'Expiré',
  EXPIRING: 'Expirant',
  MISSING: 'Manquant',
}

const CERT_STATUS_CLASSES: Record<CertificateStatus, string> = {
  VALID: 'bg-emerald-100 text-emerald-800',
  EXPIRED: 'bg-rose-100 text-rose-800',
  EXPIRING: 'bg-amber-100 text-amber-800',
  MISSING: 'bg-slate-200 text-slate-800',
}

/** Single source of truth for the certificate status UI (AGENTS.md §3). */
export const certStatusDisplay = makeStatusDisplay<CertificateStatus>({
  labels: CERT_STATUS_LABELS,
  classes: CERT_STATUS_CLASSES,
})

export function certStatusLabel(status: CertificateStatus): string {
  return certStatusDisplay.label(status)
}

function statusForExpiry(expiry: string): CertificateStatus {
  const expiryAt = new Date(expiry).getTime()
  if (Number.isNaN(expiryAt)) return 'MISSING'
  const now = Date.now()
  if (expiryAt < now) return 'EXPIRED'
  const windowMs = EXPIRING_WINDOW_DAYS * 24 * 60 * 60 * 1000
  if (expiryAt - now <= windowMs) return 'EXPIRING'
  return 'VALID'
}

export function getCertificates(
  vehicles: CuratedVehicle[] = curated.vehicles as CuratedVehicle[],
): CertificateView[] {
  const orgById = new Map(curated.organizations.map((org) => [org.id, org.name]))

  const certificates: CertificateView[] = []
  for (const vehicle of vehicles) {
    const number = vehicle.certificate_number?.trim()
    const url = vehicle.certificate_url?.trim()
    if (!number && !url) continue

    const expiry = vehicle.certificate_expiry_at?.trim()

    certificates.push({
      id: `cert-${vehicle.id}`,
      vehicleId: vehicle.id,
      licensePlate: vehicle.license_plate,
      certificateNumber: number ?? url ?? '—',
      issuedAt: vehicle.certificate_issued_at ?? '—',
      expiryAt: expiry ?? '—',
      status: expiry ? statusForExpiry(expiry) : 'MISSING',
      orgId: vehicle.org_id,
      orgName: orgById.get(vehicle.org_id) ?? '—',
      vehicleType: vehicle.type,
      url: url ?? '',
    })
  }

  return certificates
}