import { curated } from '@lpg/mock-data'
import type { Vehicle } from '@lpg/types'
import { saveLink } from '@/lib/save-link'

const VEHICLE_OPTIONS = (curated.vehicles as Vehicle[]).map((v) => ({
  label: `${v.license_plate} — ${v.id}`,
  value: v.id,
}))

export { VEHICLE_OPTIONS }

export function certificateDeletePatch(): Partial<Vehicle> {
  return {
    certificate_number: '',
    certificate_issued_at: '',
    certificate_expiry_at: '',
    certificate_url: '',
  }
}

export function certificateFromForm(v: {
  vehicle_id: string
  certificate_number: string
  issued_at: string
  expiry_at: string
  url: string
}): Promise<Partial<Vehicle>> {
  return (async () => ({
    certificate_number: v.certificate_number.trim() || undefined,
    certificate_issued_at: v.issued_at || undefined,
    certificate_expiry_at: v.expiry_at || undefined,
    certificate_url: v.url ? await saveLink(v.url.trim(), 'certificate') : undefined,
  }))()
}