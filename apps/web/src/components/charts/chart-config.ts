import type { ChartConfig } from '@lpg/ui'

/**
 * Centralised token names for project charts. Resolves to CSS variables
 * declared in `src/styles/index.css` (`--chart-1` … `--chart-5`). Using
 * semantic tokens keeps both light and dark themes consistent.
 */
export const CHART_TOKENS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const
export type ChartToken = (typeof CHART_TOKENS)[number]

/** Build a `ChartConfig` from `{ key, label }` items, assigning colours by index. */
export function chartConfigFrom(
  items: ReadonlyArray<{ key: string; label: string }>
): ChartConfig {
  const cfg: ChartConfig = {}
  for (const [i, item] of items.entries()) {
    const token = CHART_TOKENS[i % CHART_TOKENS.length]
    cfg[item.key] = {
      label: item.label,
      color: `var(--color-${token})`,
    }
  }
  return cfg
}

/**
 * Build a config from a record-of-counts (e.g. status distributions).
 * Preserves caller-supplied ordering by giving it colour by index.
 */
export function chartConfigFromRecord<TKey extends string>(
  record: Readonly<Record<TKey, number>>,
  labels: Readonly<Record<TKey, string>>
): ChartConfig {
  const items = (Object.keys(record) as TKey[]).map((key) => ({ key, label: labels[key] ?? key }))
  return chartConfigFrom(items)
}
