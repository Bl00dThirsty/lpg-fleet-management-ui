/**
 * Centralized writer for any externally-hosted URL/asset reference
 * (certificate, proof, photo, MinIO object). Per backend-patterns, all
 * link-writes route through this single helper so future wiring (auto-archiver
 * / MinIO presign) is one change in one place.
 *
 * TODO: route through auto-archiver / MinIO presign once available on the
 * backend. For now it returns the provided URL unchanged (fake backend).
 */

export type LinkContext =
  | 'certificate'
  | 'proof'
  | 'photo'
  | 'report'
  | 'other'

export async function saveLink(url: string, _context: LinkContext): Promise<string> {
  // No raw link is ever stored ad-hoc: every caller goes through here.
  return url
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim())
}
