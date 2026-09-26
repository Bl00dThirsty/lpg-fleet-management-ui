/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import {
  describedByIds,
  fieldIds,
  findFirstInvalidControl,
  focusFirstInvalidControl,
  requestAnimationFrameScheduler,
  scheduleFocusFirstInvalidControl,
  type FrameScheduler,
} from './form-a11y'

function mount(html: string): HTMLElement {
  document.body.innerHTML = html
  return document.body
}

function fakeScheduler() {
  const state = { pending: null as (() => void) | null, cancels: 0 }
  const schedule: FrameScheduler = (callback) => {
    state.pending = callback
    return () => {
      state.cancels += 1
      state.pending = null
    }
  }
  return { state, schedule, run: () => state.pending?.() }
}

describe('fieldIds', () => {
  it('derives stable, prefixed ids for a field name', () => {
    expect(fieldIds('site_name')).toEqual({
      label: 'field-site_name-label',
      control: 'field-site_name',
      help: 'field-site_name-help',
      error: 'field-site_name-error',
    })
  })

  it('keeps ids distinct for two fields sharing a prefix', () => {
    expect(fieldIds('a').control).not.toBe(fieldIds('ab').control)
  })
})

describe('describedByIds', () => {
  it('returns undefined when neither help nor error is rendered', () => {
    expect(describedByIds(fieldIds('x'), { hasHelp: false, hasError: false })).toBeUndefined()
  })

  it('returns only the help id when only help is rendered', () => {
    expect(describedByIds(fieldIds('x'), { hasHelp: true, hasError: false })).toBe('field-x-help')
  })

  it('returns only the error id when only an error is rendered', () => {
    expect(describedByIds(fieldIds('x'), { hasHelp: false, hasError: true })).toBe('field-x-error')
  })

  it('joins help and error ids, help first, when both are rendered', () => {
    expect(describedByIds(fieldIds('x'), { hasHelp: true, hasError: true })).toBe(
      'field-x-help field-x-error',
    )
  })
})

describe('findFirstInvalidControl', () => {
  it('returns null when the root is missing', () => {
    expect(findFirstInvalidControl<HTMLElement>(null)).toBeNull()
  })

  it('returns null when no control is marked invalid', () => {
    const root = mount(`<input id="a" /><input id="b" aria-invalid="false" />`)
    expect(findFirstInvalidControl<HTMLElement>(root)).toBeNull()
  })

  it('returns the first invalid control in DOM order', () => {
    const root = mount(
      `<input id="a" /><input id="b" aria-invalid="true" /><input id="c" aria-invalid="true" />`,
    )
    expect(findFirstInvalidControl<HTMLElement>(root)?.id).toBe('b')
  })
})

describe('focusFirstInvalidControl', () => {
  it('focuses the first invalid control it finds', () => {
    const root = mount(
      `<input id="a" /><input id="b" aria-invalid="true" /><input id="c" aria-invalid="true" />`,
    )
    focusFirstInvalidControl(root)
    expect(document.activeElement?.id).toBe('b')
  })

  it('focuses a programmatically focusable group directly', () => {
    const root = mount(
      `<div id="group" role="group" aria-invalid="true" tabindex="-1"><input type="checkbox" id="cb1" /></div>`,
    )
    focusFirstInvalidControl(root)
    expect(document.activeElement?.id).toBe('group')
  })

  it('falls back to the first focusable descendant when the group cannot take focus', () => {
    const root = mount(
      `<div role="group" aria-invalid="true"><input type="checkbox" id="cb1" /><input type="checkbox" id="cb2" /></div>`,
    )
    focusFirstInvalidControl(root)
    expect(document.activeElement?.id).toBe('cb1')
  })

  it('returns null when the invalid control and its descendants cannot take focus', () => {
    const root = mount(`<span id="s" aria-invalid="true"><em>text</em></span>`)
    expect(focusFirstInvalidControl(root)).toBeNull()
    expect(document.activeElement?.id).not.toBe('s')
  })

  it('leaves focus untouched when nothing is invalid', () => {
    const root = mount(`<input id="a" />`)
    document.body.focus()
    focusFirstInvalidControl(root)
    expect(document.activeElement?.id).not.toBe('a')
  })
})

describe('scheduleFocusFirstInvalidControl', () => {
  it('does not move focus while the caller is still rendering', () => {
    const root = mount(`<input id="a" /><input id="b" aria-invalid="true" />`)
    const { schedule, run } = fakeScheduler()
    scheduleFocusFirstInvalidControl(root, schedule)
    expect(document.activeElement?.id).not.toBe('b')
    expect(run).toBeTypeOf('function')
  })

  it('focuses the invalid control once the scheduled callback runs', () => {
    const root = mount(`<input id="a" /><input id="b" aria-invalid="true" />`)
    const { schedule, run } = fakeScheduler()
    scheduleFocusFirstInvalidControl(root, schedule)
    run()
    expect(document.activeElement?.id).toBe('b')
  })

  it('re-reads the invalid state at callback time instead of capture time', () => {
    const root = mount(`<input id="a" /><input id="b" />`)
    const { schedule, run } = fakeScheduler()
    scheduleFocusFirstInvalidControl(root, schedule)
    root.querySelector('#b')!.setAttribute('aria-invalid', 'true')
    run()
    expect(document.activeElement?.id).toBe('b')
  })

  it('focuses the actionable checkbox of an invalid checklist group', () => {
    const root = mount(
      `<div role="group" aria-labelledby="l" aria-invalid="true"><input type="checkbox" id="cb1" /><input type="checkbox" id="cb2" /></div>`,
    )
    const { schedule, run } = fakeScheduler()
    scheduleFocusFirstInvalidControl(root, schedule)
    run()
    expect(document.activeElement?.id).toBe('cb1')
  })

  it('cancels the pending callback and the underlying frame', () => {
    const root = mount(`<input id="a" /><input id="b" aria-invalid="true" />`)
    const { state, schedule, run } = fakeScheduler()
    const cancel = scheduleFocusFirstInvalidControl(root, schedule)
    cancel()
    expect(state.cancels).toBe(1)
    run()
    expect(document.activeElement?.id).not.toBe('b')
  })

  it('is a no-op when the root is gone by the time the callback runs', () => {
    const root = mount(`<input id="a" aria-invalid="true" />`)
    const { schedule, run } = fakeScheduler()
    scheduleFocusFirstInvalidControl(root, schedule)
    document.body.innerHTML = ''
    expect(() => run()).not.toThrow()
    expect(document.activeElement?.id).not.toBe('a')
  })

  it('is a no-op when no root is available', () => {
    const { schedule, run } = fakeScheduler()
    expect(() => scheduleFocusFirstInvalidControl(null, schedule)).not.toThrow()
    expect(() => run()).not.toThrow()
  })
})

describe('requestAnimationFrameScheduler', () => {
  it('defers the callback past the current task', async () => {
    const order: string[] = []
    requestAnimationFrameScheduler(() => order.push('frame'))
    order.push('sync')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(order).toEqual(['sync', 'frame'])
  })

  it('cancels a pending callback', async () => {
    const callback = vi.fn()
    const cancel = requestAnimationFrameScheduler(callback)
    cancel()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(callback).not.toHaveBeenCalled()
  })
})
