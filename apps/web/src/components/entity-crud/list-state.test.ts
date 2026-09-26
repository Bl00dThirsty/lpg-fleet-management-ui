import { describe, expect, it } from 'vitest'
import { resolveListState } from './list-state'

describe('resolveListState', () => {
  it('prioritizes loading over other inputs', () => {
    expect(resolveListState(true, true, 0, true)).toBe('loading')
  })

  it('prioritizes query errors over empty data', () => {
    expect(resolveListState(false, true, 0, false)).toBe('error')
  })

  it('distinguishes filtered empty from true empty', () => {
    expect(resolveListState(false, false, 0, true)).toBe('filtered-empty')
    expect(resolveListState(false, false, 0, false)).toBe('empty')
  })

  it('returns ready when data is available', () => {
    expect(resolveListState(false, false, 1, false)).toBe('ready')
  })
})
