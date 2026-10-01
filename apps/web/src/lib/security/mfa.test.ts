import { describe, expect, it, vi } from 'vitest'

vi.mock('@lpg/mock-data', () => ({
  getSetting: vi.fn(),
}))

import { getSetting } from '@lpg/mock-data'
import { isMfaRequired } from './mfa'

const mockedGetSetting = vi.mocked(getSetting)

describe('isMfaRequired', () => {
  it('parses the JSON-array setting form', () => {
    mockedGetSetting.mockReturnValue('["ADMIN","SUPERADMIN","SUPERVISOR"]')
    expect(isMfaRequired('ADMIN')).toBe(true)
    expect(isMfaRequired('SUPERADMIN')).toBe(true)
    expect(isMfaRequired('SUPERVISOR')).toBe(true)
    expect(isMfaRequired('MARKETEUR')).toBe(false)
    expect(isMfaRequired('TRANSPORTEUR')).toBe(false)
  })

  it('parses the comma-separated setting form', () => {
    mockedGetSetting.mockReturnValue('ADMIN, SUPERVISOR, SUPERADMIN')
    expect(isMfaRequired('ADMIN')).toBe(true)
    expect(isMfaRequired('SUPERVISOR')).toBe(true)
    expect(isMfaRequired('LIVREUR')).toBe(false)
  })

  it('returns false when the setting is absent', () => {
    mockedGetSetting.mockReturnValue(null)
    expect(isMfaRequired('ADMIN')).toBe(false)
  })

  it('returns false when the setting is empty', () => {
    mockedGetSetting.mockReturnValue('')
    expect(isMfaRequired('ADMIN')).toBe(false)
  })
})
