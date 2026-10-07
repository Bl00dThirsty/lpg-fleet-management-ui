const tmFmt = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const btlFmt = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
})

/** Format a VRAC volume in TM (tonnes métriques). VRAC is never displayed in kg. */
export function formatTm(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${tmFmt.format(value)} TM`
}

/** Format a bottle count in `btl` (individual 50 kg bottles). */
export function formatBtl(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${btlFmt.format(value)} btl`
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${Math.round(value)} %`
}

/** Format a number with French locale separators (virgule décimale, espaces fines). */
export function formatNumberFr(value: number, fractionDigits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

/** Format a percentage with French locale (espace avant le %, virgule décimale). */
export function formatPercentFr(value: number, fractionDigits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return `${formatNumberFr(value, fractionDigits)} %`
}

