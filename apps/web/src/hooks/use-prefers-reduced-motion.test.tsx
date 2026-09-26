import { act, cleanup, renderHook } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterAll, afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import { usePrefersReducedMotion } from './use-prefers-reduced-motion'

type TestDom = {
  window: Window & typeof globalThis & {
    matchMedia: typeof window.matchMedia
  }
}

type JSDOMModule = {
  JSDOM: new () => TestDom & { window: TestDom['window'] & { close: () => void } }
}

const { JSDOM } = await vi.importActual<JSDOMModule>('jsdom')
const testDom = new JSDOM()
const originalDescriptors = new Map<string, PropertyDescriptor | undefined>()

function setGlobal(name: string, value: unknown) {
  originalDescriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  })
}

setGlobal('window', testDom.window)
setGlobal('document', testDom.window.document)
setGlobal('navigator', testDom.window.navigator)
setGlobal('HTMLElement', testDom.window.HTMLElement)
setGlobal('Node', testDom.window.Node)

type MediaQueryListener = (event: MediaQueryListEvent) => void

type MockMediaQueryList = MediaQueryList & {
  addListener: Mock<(listener: MediaQueryListener) => void>
  removeListener: Mock<(listener: MediaQueryListener) => void>
  emitChange: (matches: boolean) => void
}

const originalMatchMedia = window.matchMedia

function installMatchMedia(initialMatches: boolean, api: 'modern' | 'legacy' = 'modern') {
  const listeners = new Set<MediaQueryListener>()
  let currentMatches = initialMatches
  const addListener = vi.fn((listener: MediaQueryListener) => {
    listeners.add(listener)
  })
  const removeListener = vi.fn((listener: MediaQueryListener) => {
    listeners.delete(listener)
  })
  const addEventListener = vi.fn((_type: string, listener: MediaQueryListener) => {
    listeners.add(listener)
  })
  const removeEventListener = vi.fn((_type: string, listener: MediaQueryListener) => {
    listeners.delete(listener)
  })
  const mediaQueryList = {
    get matches() {
      return currentMatches
    },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    ...(api === 'modern' ? { addEventListener, removeEventListener } : {}),
    addListener,
    removeListener,
    dispatchEvent: vi.fn(),
    emitChange: (matches: boolean) => {
      currentMatches = matches
      const event = { matches, media: mediaQueryList.media } as MediaQueryListEvent
      listeners.forEach((listener) => listener(event))
    },
  } as MockMediaQueryList

  const matchMedia = vi.fn(() => mediaQueryList)
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: matchMedia,
    writable: true,
  })

  return { matchMedia, mediaQueryList }
}

afterEach(() => {
  cleanup()
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: originalMatchMedia,
    writable: true,
  })
})

afterAll(() => {
  testDom.window.close()
  originalDescriptors.forEach((descriptor, name) => {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, name)
    }
  })
})

describe('usePrefersReducedMotion', () => {
  it('returns the initial reduced-motion preference', () => {
    const first = installMatchMedia(true)
    const { result: reduced } = renderHook(() => usePrefersReducedMotion())
    expect(reduced.current).toBe(true)
    expect(first.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')

    cleanup()
    const second = installMatchMedia(false)
    const { result: motion } = renderHook(() => usePrefersReducedMotion())
    expect(motion.current).toBe(false)
    expect(second.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('uses false as the server-safe default', () => {
    installMatchMedia(true)

    function ReducedMotionValue() {
      return <output>{String(usePrefersReducedMotion())}</output>
    }

    expect(renderToString(<ReducedMotionValue />)).toContain('<output>false</output>')
  })

  it('updates when the operating-system preference changes', () => {
    const { mediaQueryList } = installMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())

    act(() => mediaQueryList.emitChange(true))

    expect(result.current).toBe(true)
    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes its modern media-query subscription on unmount', () => {
    const { mediaQueryList } = installMatchMedia(false, 'modern')
    const { unmount } = renderHook(() => usePrefersReducedMotion())

    unmount()

    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    )
  })

  it('subscribes and unsubscribes with legacy media-query listeners', () => {
    const { mediaQueryList } = installMatchMedia(false, 'legacy')
    const { unmount } = renderHook(() => usePrefersReducedMotion())
    const listener = mediaQueryList.addListener.mock.calls[0]?.[0]

    unmount()

    expect(mediaQueryList.addListener).toHaveBeenCalledWith(expect.any(Function))
    expect(mediaQueryList.removeListener).toHaveBeenCalledWith(listener)
  })

  it('updates through legacy media-query listeners', () => {
    const { mediaQueryList } = installMatchMedia(false, 'legacy')
    const { result } = renderHook(() => usePrefersReducedMotion())

    act(() => mediaQueryList.emitChange(true))

    expect(result.current).toBe(true)
  })
})
