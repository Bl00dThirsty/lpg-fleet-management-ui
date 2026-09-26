import { useSyncExternalStore } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function getMediaQueryList() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(REDUCED_MOTION_QUERY)
    : null
}

function subscribe(onStoreChange: () => void) {
  const mediaQueryList = getMediaQueryList()
  if (!mediaQueryList) return () => undefined

  if (
    typeof mediaQueryList.addEventListener === 'function' &&
    typeof mediaQueryList.removeEventListener === 'function'
  ) {
    mediaQueryList.addEventListener('change', onStoreChange)
    return () => mediaQueryList.removeEventListener('change', onStoreChange)
  }

  if (
    typeof mediaQueryList.addListener === 'function' &&
    typeof mediaQueryList.removeListener === 'function'
  ) {
    mediaQueryList.addListener.call(mediaQueryList, onStoreChange)
    return () => mediaQueryList.removeListener.call(mediaQueryList, onStoreChange)
  }

  return () => undefined
}

function getSnapshot() {
  return getMediaQueryList()?.matches ?? false
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
