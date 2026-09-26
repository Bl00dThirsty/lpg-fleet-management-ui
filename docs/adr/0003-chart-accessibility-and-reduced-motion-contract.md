<!-- generated-by: gsd-doc-writer -->
# Canonical shadcn chart accessibility and reduced-motion contract

Charts are built only from the shared primitives exported by
`apps/web/src/components/charts` (`ChartCard`, `TrendLine`, `CompositionBar`,
`StatusDistribution`, `Sparkline`, `MetricCardWithChart`) on top of Recharts and the
`@lpg/ui` shadcn `ChartContainer` / `ChartTooltip` family. Ad-hoc Recharts usage in a
feature page is not the house style.

Two rules are enforced by the shared layer rather than left to each page:

1. **Accessibility layer on.** Every chart primitive passes Recharts'
   `accessibilityLayer`, so the SVG exposes roles, labels, and a tabular equivalent to
   assistive technology instead of being an opaque graphic.
2. **Motion follows the OS preference.** Every primitive reads
   `usePrefersReducedMotion()` (`apps/web/src/hooks/use-prefers-reduced-motion.ts`) and
   sets `isAnimationActive={!reducedMotion}`. Skeletons and section animations carry
   `motion-reduce:animate-none` / equivalent utility classes.

`ChartCard` owns the surrounding state contract: a `status` of
`ready | loading | empty | error` with an `aria-live` status message, `aria-busy` on the
content while loading, a skeleton (non-animated under reduced motion), an `EmptyState`
for empty, and a destructive `Alert` with a retry action for errors. Colours come from
semantic chart tokens via `chart-config.ts` (`CHART_TOKENS`), not hardcoded hex values.

The contract is locked by
`apps/web/src/components/charts/chart-primitives-accessibility.test.tsx`, which asserts
that `accessibilityLayer: true` is set on every chart root and that animation is enabled
normally and disabled when reduced motion is preferred.

## Considered options

- **Relying on each page to set `accessibilityLayer` and `isAnimationActive`** —
  rejected: these are two props on every series; omitting one is invisible in review and
  ships an inaccessible or motion-hostile chart.
- **A global CSS kill-switch for motion** — rejected: Recharts animates via JS, not CSS,
  so a stylesheet rule does not disable it.
