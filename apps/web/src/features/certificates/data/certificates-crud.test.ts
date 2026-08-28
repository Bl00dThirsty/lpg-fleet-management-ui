import { describe, expect, it, vi } from 'vitest'
import { certificateDeletePatch, certificateFromForm } from './certificates-crud'

vi.mock('@/lib/save-link', () => ({
  saveLink: vi.fn(async (url: string) => `saved:${url}`),
}))

describe('certificates-crud config', () => {
  it('routes the URL through saveLink and maps fields onto the vehicle payload', async () => {
    const out = await certificateFromForm({
      vehicle_id: 'veh-1',
      certificate_number: 'JAUGE-2026-001',
      issued_at: '2026-01-10',
      expiry_at: '2027-01-10',
      url: 'https://minio/lpg/certs/jauge-001.pdf',
    })
    expect(out.certificate_number).toBe('JAUGE-2026-001')
    expect(out.certificate_issued_at).toBe('2026-01-10')
    expect(out.certificate_expiry_at).toBe('2027-01-10')
    expect(out.certificate_url).toBe('saved:https://minio/lpg/certs/jauge-001.pdf')
  })

  it('clears certificate fields on the vehicle (delete = unset, not vehicle delete)', () => {
    const patch = certificateDeletePatch()
    expect(patch.certificate_number).toBe('')
    expect(patch.certificate_url).toBe('')
    expect(patch.certificate_expiry_at).toBe('')
    expect(patch.certificate_issued_at).toBe('')
  })
})