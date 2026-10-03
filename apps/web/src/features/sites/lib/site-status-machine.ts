import type { SiteFunction } from '@lpg/types'

export type SiteStatus =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'ACTIVE'
  | 'VERIFIED'
  | 'SUSPENDED'
  | 'REJECTED'

export type SiteRole =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'INTEGRATEUR'
  | 'AGENT'
  | 'MARKETEUR'
  | 'TRANSPORTEUR'

export interface SiteRow {
  id: string
  name: string
  status: SiteStatus
  region: string
  functions: SiteFunction[]
  delivery_count: number
  geo_confidence_score: number
  is_client_site: boolean
}

export type TransitionRequest =
  | { kind: 'verify' }
  | { kind: 'suspend'; reason: string }
  | { kind: 'reject'; reason: string }
  | { kind: 'reassign'; geo_point?: { lat: number; lng: number } }

export interface TransitionResult {
  ok: boolean
  reason?: string
  nextStatus?: SiteStatus
}

const VERIFY_ROLES: ReadonlySet<SiteRole> = new Set(['AGENT', 'ADMIN', 'SUPERADMIN'])
const SUSPEND_ROLES: ReadonlySet<SiteRole> = new Set(['AGENT', 'ADMIN', 'SUPERADMIN'])
const REJECT_ROLES: ReadonlySet<SiteRole> = new Set(['AGENT', 'ADMIN', 'SUPERADMIN'])
const REASSIGN_ROLES: ReadonlySet<SiteRole> = new Set(['ADMIN', 'SUPERADMIN'])

const NON_VERIFIABLE: ReadonlySet<SiteStatus> = new Set(['UNASSIGNED', 'SUSPENDED', 'REJECTED'])

export function canTransition(
  row: SiteRow,
  role: SiteRole,
  request: TransitionRequest,
): TransitionResult {
  switch (request.kind) {
    case 'verify': {
      if (!VERIFY_ROLES.has(role)) {
        return { ok: false, reason: 'role cannot verify' }
      }
      if (NON_VERIFIABLE.has(row.status)) {
        return { ok: false, reason: `cannot verify from ${row.status}` }
      }
      return { ok: true, nextStatus: 'VERIFIED' }
    }
    case 'suspend': {
      if (!SUSPEND_ROLES.has(role)) {
        return { ok: false, reason: 'role cannot suspend' }
      }
      if (request.reason.trim().length === 0) {
        return { ok: false, reason: 'reason required' }
      }
      return { ok: true, nextStatus: 'SUSPENDED' }
    }
    case 'reject': {
      if (!REJECT_ROLES.has(role)) {
        return { ok: false, reason: 'role cannot reject' }
      }
      if (request.reason.trim().length === 0) {
        return { ok: false, reason: 'reason required' }
      }
      return { ok: true, nextStatus: 'REJECTED' }
    }
    case 'reassign': {
      if (!REASSIGN_ROLES.has(role)) {
        return { ok: false, reason: 'role cannot reassign' }
      }
      if (row.status !== 'UNASSIGNED' && row.status !== 'ASSIGNED') {
        return {
          ok: false,
          reason: `cannot reassign from ${row.status}`,
        }
      }
      return { ok: true, nextStatus: 'ASSIGNED' }
    }
  }
}
