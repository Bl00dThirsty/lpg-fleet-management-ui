/**
 * Static analysis of `t()` usage against the shipped locale resources.
 *
 * The parity check in `scripts/check-i18n-coverage.ts` only proves that fr and en
 * agree with each other. It cannot catch a key that is *used* in a component but
 * absent from both files, which renders the raw key to the user. These helpers
 * close that hole without a false positive per locale fallback.
 */

const STATIC_KEY = /\bt\(\s*'([A-Za-z][\w.]*)'\s*[,)]/g
const TEMPLATE_KEY = /\bt\(\s*`([^`]*\$\{[^`]*\*)`/g
const NAMESPACE_PREFIX = /^([a-z][\w-]*):/

/** Flatten a locale resource into dotted key paths. */
export function flattenLocaleKeys(resource: unknown): string[] {
  if (!resource || typeof resource !== 'object' || Array.isArray(resource)) {
    return []
  }
  const keys: string[] = []
  for (const [name, value] of Object.entries(resource as Record<string, unknown>)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenLocaleKeys(value).map((child) => `${name}.${child}`))
    } else {
      keys.push(name)
    }
  }
  return keys
}

/** Every `t('literal.key')` in a source file, namespaced prefixes removed. */
export function collectStaticKeys(source: string): string[] {
  return unique(matchAll(source, STATIC_KEY))
}

/** Every `t(`prefix.${value}.suffix`)` in a source file, as a `prefix.${}.suffix`. */
export function collectTemplates(source: string): string[] {
  return unique(
    matchAll(source, TEMPLATE_KEY).map((key) =>
      key.replace(/\$\{[^}]*\}/g, '${}'),
    ),
  )
}

function matchAll(source: string, pattern: RegExp): string[] {
  return [...source.matchAll(pattern)].map((match) => match[1]!)
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

/**
 * Resolve a `head.${}.tail` template against the keys that really exist. A
 * template with no candidate expands to nothing so the caller can report it.
 */
export function expandTemplates(
  templates: readonly string[],
  localeKeys: readonly string[],
): string[] {
  const expanded: string[] = []
  for (const template of templates) {
    const [head, tail] = template.split('${}')
    expanded.push(
      ...localeKeys.filter(
        (key) => key.startsWith(head ?? '') && key.endsWith(tail ?? ''),
      ),
    )
  }
  return unique(expanded)
}

/**
 * Keys a source file renders that the locale resource cannot resolve. A namespaced
 * key is checked against the resource of the namespace it names, so a feature may
 * share keys across namespaces without producing noise.
 */
export function findMissingKeys(
  source: string,
  resource: unknown,
  namespace: string,
): string[] {
  const available = flattenLocaleKeys(resource)
  const availableSet = new Set(available)
  const templates = collectTemplates(source)
  const unresolved = templates.filter(
    (template) => expandTemplates([template], available).length === 0,
  )
  const requested = [
    ...collectStaticKeys(source),
    ...expandTemplates(templates, available),
    ...unresolved,
  ]

  return unique(
    requested.filter((rawKey) => {
      const namespaced = NAMESPACE_PREFIX.exec(rawKey)
      // A key that names another namespace is validated by that namespace's scan.
      if (namespaced && namespaced[1] !== namespace) return false
      const key = namespaced ? rawKey.slice(namespaced[0].length) : rawKey
      return !availableSet.has(key)
    }),
  )
}
