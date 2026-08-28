/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSwitcher } from './language-switcher'
import { usePreferencesStore } from '@/store/preferences-store'

// Radix Select needs pointer capture + scrollIntoView polyfills in jsdom
if (typeof HTMLElement !== 'undefined') {
  if (!HTMLElement.prototype.hasPointerCapture) {
    (HTMLElement.prototype as unknown as Record<string, unknown>).hasPointerCapture = () => false
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    (HTMLElement.prototype as unknown as Record<string, unknown>).setPointerCapture = () => {}
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    (HTMLElement.prototype as unknown as Record<string, unknown>).releasePointerCapture = () => {}
  }
  if (!HTMLElement.prototype.scrollIntoView) {
    (HTMLElement.prototype as unknown as Record<string, unknown>).scrollIntoView = () => {}
  }
}
if (typeof globalThis !== 'undefined' && !('ResizeObserver' in globalThis)) {
  (globalThis as unknown as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ language: 'fr-FR' })
    document.documentElement.lang = 'fr'
  })

  it('switches fr→en and updates document lang', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.click(screen.getByText(/English/))
    // allow effect + async state to settle
    await new Promise((r) => setTimeout(r, 50))
    expect(document.documentElement.lang).toBe('en')
    expect(usePreferencesStore.getState().language).toBe('en-US')
  })
})
