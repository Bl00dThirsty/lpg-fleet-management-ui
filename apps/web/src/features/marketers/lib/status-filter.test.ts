import { describe, expect, it } from 'vitest'
import {
  fromMarketerStatusFilterValue,
  toMarketerStatusFilterValue,
} from './status-filter'

describe('marketer status filter conversion', () => {
  it('converts route values to internal table values', () => {
    expect(toMarketerStatusFilterValue('active')).toBe('true')
    expect(toMarketerStatusFilterValue('inactive')).toBe('false')
  })

  it('converts internal table values to route values', () => {
    expect(fromMarketerStatusFilterValue('true')).toBe('active')
    expect(fromMarketerStatusFilterValue('false')).toBe('inactive')
  })

  it('ignores unsupported values', () => {
    expect(toMarketerStatusFilterValue('unknown')).toBeUndefined()
    expect(fromMarketerStatusFilterValue('unknown')).toBeUndefined()
  })
})
