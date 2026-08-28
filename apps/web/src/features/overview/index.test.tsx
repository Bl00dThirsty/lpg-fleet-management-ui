/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { createI18nForTest } from '@/lib/i18n'
import { OverviewPage } from './index'

afterEach(() => cleanup())

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  }
})

describe('Overview i18n', () => {
  it('renders French title', () => {
    const i18n = createI18nForTest('fr')
    render(
      <I18nextProvider i18n={i18n}>
        <OverviewPage role="SUPERADMIN" />
      </I18nextProvider>
    )
    expect(screen.getByRole('heading', { name: "Vue d'ensemble" })).toBeInTheDocument()
  })
  it('renders English title', async () => {
    const i18n = createI18nForTest('en')
    await i18n.changeLanguage('en')
    render(
      <I18nextProvider i18n={i18n}>
        <OverviewPage role="SUPERADMIN" />
      </I18nextProvider>
    )
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument()
  })
})
