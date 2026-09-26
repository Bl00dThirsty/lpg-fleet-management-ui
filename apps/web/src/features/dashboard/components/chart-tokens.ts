/**
 * The only colour source of the dashboard charts.
 *
 * Colours are semantic design tokens, never literals, so light and dark themes
 * stay in sync and the palette is validated once by the stylesheet. `chart-1`
 * and `chart-2` are deliberately far apart in hue and lightness: chart-1 is a
 * warm red-orange, chart-2 a violet, so the loaded and delivered series never
 * read as one bar in either theme.
 */
export const chartSeriesColors = {
  loaded: 'var(--color-chart-1)',
  delivered: 'var(--color-chart-2)',
} as const

/**
 * One token per visible fleet bucket. Buckets beyond this list are folded into
 * one explicitly labelled `Other` bucket rather than silently reusing a token,
 * so two segments on the same chart can never share a colour.
 */
export const fleetBucketColors = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
] as const
