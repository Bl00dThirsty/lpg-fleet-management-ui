/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ariaSortValue, headerSortAttribute } from './sort-attribute'

describe('ariaSortValue', () => {
  it('maps ascending sort to the ascending ARIA value', () => {
    expect(ariaSortValue('asc')).toBe('ascending')
  })

  it('maps descending sort to the descending ARIA value', () => {
    expect(ariaSortValue('desc')).toBe('descending')
  })

  it('maps an unsorted column to none rather than leaving it out', () => {
    expect(ariaSortValue(false)).toBe('none')
  })
})

describe('headerSortAttribute', () => {
  it('exposes ascending when the column is sorted ascending', () => {
    expect(headerSortAttribute({ canSort: true, sortState: 'asc' })).toBe('ascending')
  })

  it('exposes none for a sortable but unsorted column', () => {
    expect(headerSortAttribute({ canSort: true, sortState: false })).toBe('none')
  })

  it('omits the attribute for a column that cannot be sorted', () => {
    expect(headerSortAttribute({ canSort: false, sortState: false })).toBeUndefined()
  })

  it('omits the attribute for a non-sortable column even when a sort state is reported', () => {
    expect(headerSortAttribute({ canSort: false, sortState: 'desc' })).toBeUndefined()
  })
})
