import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

function flattenKeys(obj: unknown, prefix = ''): string[] {
  const out: string[] = []
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    if (prefix) out.push(prefix)
    return out
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flattenKeys(v, key))
    } else {
      out.push(key)
    }
  }
  return out
}

function resolveLocalesDir(): string {
  const cwdFr = resolve(process.cwd(), 'public', 'locales', 'fr')
  if (existsSync(cwdFr)) return resolve(process.cwd(), 'public', 'locales')
  const scriptDir = import.meta.dirname ?? process.cwd()
  const alt = resolve(scriptDir, '..', 'public', 'locales')
  if (existsSync(join(alt, 'fr'))) return alt
  return cwdFr.replace(/[/\\]fr$/, '')
}

function main(): void {
  const localesDir = resolveLocalesDir()
  const frDir = join(localesDir, 'fr')
  const enDir = join(localesDir, 'en')

  if (!existsSync(frDir)) {
    console.error(`Missing locales dir: ${frDir}`)
    process.exit(1)
  }

  const ns = readdirSync(frDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))

  // Allowlist for keys intentionally present only in fr (e.g. fallback test fixture)
  // Empty at strict gate Phase 2b; keep minimal here to allow fallback test to pass.
  const allowlist = new Set<string>(['common:onlyInFr', 'common.onlyInFr'])

  let failed = false
  for (const n of ns) {
    const frPath = join(frDir, `${n}.json`)
    const enPath = join(enDir, `${n}.json`)

    let fr: unknown
    let en: unknown
    try {
      fr = JSON.parse(readFileSync(frPath, 'utf8'))
    } catch (e) {
      console.error(`Failed to read ${frPath}: ${e}`)
      failed = true
      continue
    }
    if (!existsSync(enPath)) {
      console.error(`Missing en/${n}.json (fr exists)`)
      failed = true
      continue
    }
    try {
      en = JSON.parse(readFileSync(enPath, 'utf8'))
    } catch (e) {
      console.error(`Failed to read ${enPath}: ${e}`)
      failed = true
      continue
    }

    const frKeys = new Set(flattenKeys(fr))
    const enKeys = new Set(flattenKeys(en))

    for (const k of frKeys) {
      if (!enKeys.has(k)) {
        const fullColon = `${n}:${k}`
        const fullDot = `${n}.${k}`
        if (allowlist.has(fullColon) || allowlist.has(fullDot) || allowlist.has(k)) continue
        console.error(`Missing en/${n}: ${k}`)
        failed = true
      }
    }
  }

  if (failed) {
    console.error('\ni18n coverage FAILED: some English keys missing (fr → en parity required)')
    process.exit(1)
  } else {
    console.log(`i18n coverage PASS: ${ns.length} namespaces checked, all keys present in en/`)
  }
}

main()

export { flattenKeys }
