import '@testing-library/jest-dom/vitest'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
} from 'recharts'
import { CompositionBar } from './composition-bar'
import { Sparkline } from './sparkline'
import { StatusDistribution } from './status-distribution'
import { TrendLine } from './trend-line'

vi.mock('recharts', () => ({
  Area: vi.fn(({ children }: { children?: React.ReactNode }) => children),
  AreaChart: vi.fn(({ children }: { children?: React.ReactNode }) => children),
  Bar: vi.fn(({ children }: { children?: React.ReactNode }) => children),
  BarChart: vi.fn(({ children }: { children?: React.ReactNode }) => children),
  CartesianGrid: vi.fn(({ children }: { children?: React.ReactNode }) => children),
  Cell: vi.fn(({ children }: { children?: React.ReactNode }) => children),
  Pie: vi.fn(({ children }: { children?: React.ReactNode }) => children),
  PieChart: vi.fn(({ children }: { children?: React.ReactNode }) => children),
  XAxis: vi.fn(({ children }: { children?: React.ReactNode }) => children),
  YAxis: vi.fn(({ children }: { children?: React.ReactNode }) => children),
}))

vi.mock('@lpg/ui', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => children,
  ChartLegend: vi.fn(() => null),
  ChartLegendContent: vi.fn(() => null),
  ChartTooltip: vi.fn(() => null),
  ChartTooltipContent: vi.fn(() => null),
}))

vi.mock('@/store/preferences-store', () => ({
  usePreferencesStore: () => 'en',
}))

const originalMatchMedia = window.matchMedia

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
}

const config = { value: { label: 'Value', color: 'var(--color-chart-1)' } }

beforeEach(() => {
  vi.clearAllMocks()
  setReducedMotion(false)
})

afterEach(() => {
  cleanup()
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  })
})

describe('shared chart primitives', () => {
  it('enables Recharts accessibility and animation when motion is allowed', () => {
    render(
      <>
        <TrendLine points={[{ label: 'Jan', value: 1 }]} config={config} />
        <StatusDistribution
          data={[{ key: 'active', label: 'Active', value: 1 }]}
          config={config}
        />
        <CompositionBar data={[{ label: 'Site', value: 1 }]} config={config} />
        <Sparkline values={[1, 2]} config={config} />
      </>,
    )

    expect(AreaChart).toHaveBeenCalledWith(
      expect.objectContaining({ accessibilityLayer: true }),
      undefined,
    )
    expect(PieChart).toHaveBeenCalledWith(
      expect.objectContaining({ accessibilityLayer: true }),
      undefined,
    )
    expect(BarChart).toHaveBeenCalledWith(
      expect.objectContaining({ accessibilityLayer: true }),
      undefined,
    )
    expect(vi.mocked(Area).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ isAnimationActive: true }),
    )
    expect(vi.mocked(Pie).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ isAnimationActive: true }),
    )
    expect(vi.mocked(Bar).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ isAnimationActive: true }),
    )
    expect(vi.mocked(Area).mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({ isAnimationActive: true }),
    )
  })

  it('disables chart animation when reduced motion is preferred', () => {
    setReducedMotion(true)

    render(
      <>
        <TrendLine points={[{ label: 'Jan', value: 1 }]} config={config} />
        <StatusDistribution
          data={[{ key: 'active', label: 'Active', value: 1 }]}
          config={config}
        />
        <CompositionBar data={[{ label: 'Site', value: 1 }]} config={config} />
        <Sparkline values={[1, 2]} config={config} />
      </>,
    )

    expect(vi.mocked(Area).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ isAnimationActive: false }),
    )
    expect(vi.mocked(Pie).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ isAnimationActive: false }),
    )
    expect(vi.mocked(Bar).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ isAnimationActive: false }),
    )
    expect(vi.mocked(Area).mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({ isAnimationActive: false }),
    )
  })
})
