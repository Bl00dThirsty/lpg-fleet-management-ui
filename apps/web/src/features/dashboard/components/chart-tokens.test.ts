import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { chartSeriesColors, fleetBucketColors } from './chart-tokens'
import { FLEET_BUCKET_LIMIT } from '../data/dashboard-fleets'

const stylesheet = readFileSync(
  join(process.cwd(), 'src/styles/index.css'),
  'utf8',
)

function oklchOf(token: `--chart-${number}`): { lightness: number; hue: number } {
  const matches = [...stylesheet.matchAll(
    new RegExp(`${token}:\\s*oklch\\(([^)]+)\\)`, 'g'),
  )]
  if (matches.length === 0) throw new Error(`${token} is not defined as oklch`)
  const [lightness, , hue] = matches[0]![1]!.split(' ').map(Number) as [
    number,
    number,
    number,
  ]
  return { lightness, hue }
}

describe('chart series colours', () => {
  it('uses semantic chart tokens, never a raw colour literal', () => {
    for (const color of Object.values(chartSeriesColors)) {
      expect(color).toMatch(/^var\(--color-chart-\d\)$/)
    }
  })

  it('gives loaded and delivered two different tokens', () => {
    expect(chartSeriesColors.loaded).not.toBe(chartSeriesColors.delivered)
  })

  it('keeps the two series clearly apart in lightness and hue', () => {
    const loaded = oklchOf('--chart-1')
    const delivered = oklchOf('--chart-2')

    expect(Math.abs(loaded.hue - delivered.hue)).toBeGreaterThan(20)
    expect(
      Math.abs(loaded.lightness - delivered.lightness),
    ).toBeGreaterThan(0.05)
  })
})

describe('fleet bucket colours', () => {
  it('uses one token per visible bucket and no more', () => {
    expect(fleetBucketColors).toHaveLength(FLEET_BUCKET_LIMIT)
  })

  it('uses semantic chart tokens only', () => {
    for (const color of fleetBucketColors) {
      expect(color).toMatch(/^var\(--color-chart-\d\)$/)
    }
  })

  it('gives every bucket a different token, so no colour is ever reused', () => {
    expect(new Set(fleetBucketColors).size).toBe(fleetBucketColors.length)
  })

  it('declares the token it uses in the stylesheet', () => {
    for (const color of [...fleetBucketColors, ...Object.values(chartSeriesColors)]) {
      const token = color.replace(/^var\(|\)$/g, '') as `--chart-${number}`
      expect(stylesheet).toContain(`${token}:`)
      expect(stylesheet).toContain(`--color-${token.slice(2)}:`)
    }
  })

  it('spreads its buckets across distinct hues', () => {
    const hues = fleetBucketColors.map((color) => {
      const token = color.replace(/^var\(|\)$/g, '') as `--chart-${number}`
      return oklchOf(token).hue
    })

    for (let index = 1; index < hues.length; index += 1) {
      expect(Math.abs(hues[index - 1]! - hues[index]!)).toBeGreaterThan(5)
    }
  })
})
