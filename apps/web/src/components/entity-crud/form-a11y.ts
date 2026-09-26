export type FieldIdSet = {
  label: string
  control: string
  help: string
  error: string
}

const INVALID_SELECTOR = '[aria-invalid="true"]'
const FOCUSABLE_SELECTOR =
  'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]'

export function fieldIds(name: string): FieldIdSet {
  return {
    label: `field-${name}-label`,
    control: `field-${name}`,
    help: `field-${name}-help`,
    error: `field-${name}-error`,
  }
}

export function describedByIds(
  ids: FieldIdSet,
  present: { hasHelp: boolean; hasError: boolean },
): string | undefined {
  const parts: string[] = []
  if (present.hasHelp) parts.push(ids.help)
  if (present.hasError) parts.push(ids.error)
  return parts.length > 0 ? parts.join(' ') : undefined
}

export function isFocusableElement(el: Element): boolean {
  return el.matches(FOCUSABLE_SELECTOR)
}
export function findFirstInvalidControl<T extends Element>(
  root: ParentNode | null | undefined,
): T | null {
  return (root?.querySelector(INVALID_SELECTOR) as T | null) ?? null
}

export function focusFirstInvalidControl(root: ParentNode | null | undefined): HTMLElement | null {
  const invalid = findFirstInvalidControl<HTMLElement>(root)
  if (!invalid) return null
  const target = isFocusableElement(invalid)
    ? invalid
    : invalid.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
  if (!target) return null
  target.focus()
  return target
}

export type FrameScheduler = (callback: () => void) => () => void

export const requestAnimationFrameScheduler: FrameScheduler = (callback) => {
  if (typeof requestAnimationFrame === 'function') {
    const handle = requestAnimationFrame(() => callback())
    return () => cancelAnimationFrame(handle)
  }
  const handle = setTimeout(callback, 0)
  return () => clearTimeout(handle)
}

export function scheduleFocusFirstInvalidControl(
  root: ParentNode | null | undefined,
  schedule: FrameScheduler = requestAnimationFrameScheduler,
): () => void {
  let cancelled = false
  const cancelFrame = schedule(() => {
    if (cancelled) return
    focusFirstInvalidControl(root)
  })
  return () => {
    cancelled = true
    cancelFrame()
  }
}
