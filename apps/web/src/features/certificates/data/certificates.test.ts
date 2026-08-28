import { describe, expect, it } from 'vitest'
import { getCertificates, certStatusLabel } from './certificates'

describe('certificates view-model', () => {
  it('derives one certificate per vehicle that carries one', () => {
    const certificates = getCertificates()
    expect(certificates.length).toBe(33)
  })

  it('exposes the expected fields', () => {
    const [cert] = getCertificates()
    expect(cert).toMatchObject({
      id: expect.any(String),
      vehicleId: expect.any(String),
      licensePlate: expect.any(String),
      certificateNumber: expect.any(String),
      issuedAt: expect.any(String),
      expiryAt: expect.any(String),
      status: expect.any(String),
      orgName: expect.any(String),
      vehicleType: expect.any(String),
    })
  })

  it('labels statuses in French', () => {
    expect(certStatusLabel('VALID')).toBe('Valide')
    expect(certStatusLabel('EXPIRED')).toBe('Expiré')
    expect(certStatusLabel('MISSING')).toBe('Manquant')
  })
})