import { describe, it, expect, beforeEach } from 'vitest'
import { useGlobalSearchStore } from './global-search-store'

describe('useGlobalSearchStore', () => {
  beforeEach(() => {
    useGlobalSearchStore.setState({ open: false })
  })

  it('initialises open to false', () => {
    expect(useGlobalSearchStore.getState().open).toBe(false)
  })

  it('open sets open to true', () => {
    useGlobalSearchStore.getState().setOpen(true)
    expect(useGlobalSearchStore.getState().open).toBe(true)
  })

  it('close sets open to false', () => {
    useGlobalSearchStore.getState().setOpen(true)
    useGlobalSearchStore.getState().close()
    expect(useGlobalSearchStore.getState().open).toBe(false)
  })

  it('toggle inverts open', () => {
    useGlobalSearchStore.getState().toggle()
    expect(useGlobalSearchStore.getState().open).toBe(true)
    useGlobalSearchStore.getState().toggle()
    expect(useGlobalSearchStore.getState().open).toBe(false)
  })
})
