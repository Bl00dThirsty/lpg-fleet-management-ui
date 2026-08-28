import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * Collect translation keys from source text.
 * Scans for `label: '...'` literals and `t('...')` / `t("...")` calls.
 */
export function collectKeys(src: string): string[] {
  const out: string[] = []
  for (const m of src.matchAll(/label:\s*['"`]([^'"`]+)['"`]/g)) out.push(m[1])
  for (const m of src.matchAll(/\bt\(['"`]([^'"`]+)['"`]/g)) out.push(m[1])
  return out
}

function walk(dir: string, out: string[]): void {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const e of entries) {
    const full = join(dir, e)
    let st: ReturnType<typeof statSync>
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      // skip node_modules/dist
      if (e === 'node_modules' || e === 'dist' || e === '.vite') continue
      walk(full, out)
    } else if (st.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) {
      out.push(full)
    }
  }
}

function resolveSrcRoot(): string {
  // when run via `pnpm --filter @lpg/web run i18n:check`, cwd is apps/web
  const cwdSrc = resolve(process.cwd(), 'src')
  if (existsSync(cwdSrc)) return cwdSrc
  // fallback: relative to this script (scripts/ -> ../src)
  const scriptSrc = resolve(import.meta.dirname ?? process.cwd(), '..', 'src')
  if (existsSync(scriptSrc)) return scriptSrc
  return cwdSrc
}

// Only run CLI scan when executed directly, not when imported for tests
const isMain =
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith('extract-i18n-keys.ts') ||
    process.argv[1].endsWith('extract-i18n-keys.js'))

if (isMain) {
  const srcRoot = resolveSrcRoot()
  const files: string[] = []
  walk(srcRoot, files)

  // Also support glob pattern for parity with plan: if glob package present, use it
  // but walk already covers src/**/*.{ts,tsx}
  let printed = 0
  for (const f of files) {
    const src = readFileSync(f, 'utf8')
    const keys = collectKeys(src)
    if (keys.length) {
      console.log(f, keys)
      printed++
    }
  }
  if (printed === 0) console.log('No i18n keys found')
}
