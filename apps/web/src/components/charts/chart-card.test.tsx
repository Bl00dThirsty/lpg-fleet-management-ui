import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { createI18nForTest } from '@/lib/i18n'
import { ChartCard, type ChartCardStatus } from '.'

afterEach(() => cleanup())

function renderChartCard(ui: React.ReactNode, language: 'fr' | 'en' = 'en') {
  return render(<I18nextProvider i18n={createI18nForTest(language)}>{ui}</I18nextProvider>)
}

describe('ChartCard', () => {
  it('gives loading precedence over the legacy empty prop', () => {
    const loadingStatus: ChartCardStatus = 'loading'
    const { container } = renderChartCard(
      <ChartCard title='Volume' status={loadingStatus} empty>
        <div>Chart content</div>
      </ChartCard>,
    )

    expect(container.querySelector('[data-slot="card-content"]')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading chart')
    expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass(
      'motion-reduce:animate-none',
    )
    expect(screen.queryByText('Chart content')).not.toBeInTheDocument()
  })

  it('gives error precedence over the legacy empty prop and localizes its status', () => {
    renderChartCard(
      <ChartCard title='Volume' status='error' empty>
        <div>Chart content</div>
      </ChartCard>,
      'fr',
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger le graphique')
    expect(screen.queryByText('Aucune donnée à afficher.')).not.toBeInTheDocument()
    expect(screen.queryByText('Chart content')).not.toBeInTheDocument()
  })

  it('maps the legacy empty prop to the localized empty state', () => {
    renderChartCard(
      <ChartCard title='Volume' empty>
        <div>Chart content</div>
      </ChartCard>,
    )

    expect(screen.getByText('No chart data available.')).toBeInTheDocument()
    expect(screen.queryByText('Chart content')).not.toBeInTheDocument()
  })

  it('announces loading, empty, error, and ready transitions politely', () => {
    const i18n = createI18nForTest('en')
    const chart = (status: ChartCardStatus) => (
      <I18nextProvider i18n={i18n}>
        <ChartCard title='Volume' status={status}>
          <div>Chart content</div>
        </ChartCard>
      </I18nextProvider>
    )
    const { rerender } = render(chart('loading'))
    const liveStatus = screen.getByRole('status')

    expect(liveStatus).toHaveAttribute('aria-live', 'polite')
    expect(liveStatus).toHaveAttribute('aria-atomic', 'true')
    expect(liveStatus).toHaveTextContent('Loading chart')

    rerender(chart('empty'))
    expect(liveStatus).toHaveTextContent('Chart is empty.')

    rerender(chart('error'))
    expect(liveStatus).toHaveTextContent('Chart failed to load.')

    rerender(chart('ready'))
    expect(liveStatus).toHaveTextContent('Chart loaded.')
  })

  it('invokes the retry callback from the localized error action', () => {
    const onRetry = vi.fn()
    renderChartCard(
      <ChartCard title='Volume' status='error' onRetry={onRetry}>
        <div>Chart content</div>
      </ChartCard>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders ready content without an empty state or busy state', () => {
    const { container } = renderChartCard(
      <ChartCard title='Volume' status='ready' empty>
        <div>Chart content</div>
      </ChartCard>,
    )
    const chartContent = screen.getByText('Chart content')
    const liveStatus = screen.getByRole('status')

    expect(chartContent).toBeInTheDocument()
    expect(liveStatus).toHaveTextContent('Chart loaded.')
    expect(liveStatus).not.toContainElement(chartContent)
    expect(container.querySelector('[data-slot="card-content"]')).not.toHaveAttribute(
      'aria-busy',
    )
    expect(screen.queryByText('No chart data available.')).not.toBeInTheDocument()
  })
})
