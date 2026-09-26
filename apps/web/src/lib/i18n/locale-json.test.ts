import { describe, expect, it } from 'vitest'

const rawLocaleFiles = import.meta.glob<string>(
  '../../../public/locales/*/*.json',
  { query: '?raw', import: 'default', eager: true },
)

/**
 * JSON.parse silently keeps the last value of a duplicated key, so translation
 * files can hide conflicting copy. Scan the raw text instead and report every
 * duplicated key path.
 */
function findDuplicateJsonKeys(raw: string): string[] {
  const duplicates: string[] = []
  const stack: { keys: Set<string>; path: string; lastKey: string }[] = []
  let index = 0

  const readString = (): string => {
    let value = ''
    index += 1
    while (index < raw.length) {
      const char = raw[index]
      if (char === '\\') {
        value += raw[index + 1]
        index += 2
        continue
      }
      if (char === '"') {
        index += 1
        return value
      }
      value += char
      index += 1
    }
    return value
  }

  const skipWhitespace = () => {
    while (index < raw.length && /\s/.test(raw[index]!)) index += 1
  }

  while (index < raw.length) {
    const char = raw[index]

    if (char === '"') {
      const key = readString()
      const afterString = index
      skipWhitespace()
      if (raw[index] === ':' && stack.length > 0) {
        const frame = stack[stack.length - 1]!
        if (frame.keys.has(key)) duplicates.push(`${frame.path}${key}`)
        frame.keys.add(key)
        frame.lastKey = key
      }
      index = afterString
      continue
    }

    if (char === '{') {
      const parent = stack[stack.length - 1]
      stack.push({
        keys: new Set<string>(),
        path: parent ? `${parent.path}${parent.lastKey}.` : '',
        lastKey: '',
      })
      index += 1
      continue
    }

    if (char === '}') {
      stack.pop()
      index += 1
      continue
    }

    index += 1
  }

  return duplicates
}

describe('locale resource files', () => {
  const files = Object.entries(rawLocaleFiles).sort(([left], [right]) =>
    left.localeCompare(right),
  )

  it('covers every shipped language folder', () => {
    expect(files.length).toBeGreaterThan(0)
    expect([...new Set(files.map(([path]) => path.split('/').slice(-2)[0]))].sort()).toEqual([
      'en',
      'fr',
    ])
  })

  it.each(files)('%s has no duplicate keys', (_path, raw) => {
    expect(findDuplicateJsonKeys(raw)).toEqual([])
  })
})
