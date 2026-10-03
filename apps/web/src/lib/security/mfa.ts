import { getSetting } from '@lpg/mock-data'

function parseRoles(raw: string): string[] {
  if (raw.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map((r) => String(r).trim()).filter(Boolean)
    } catch {
      // fall through to the comma-separated form
    }
  }
  return raw.split(',').map((r) => r.trim()).filter(Boolean)
}

export function isMfaRequired(role: string): boolean {
  const raw = getSetting('mfa.enforced_for_roles') ?? ''
  return parseRoles(raw).includes(role)
}
