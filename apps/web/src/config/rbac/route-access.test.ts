import { describe, expect, it } from 'vitest'
import { canAccessPath, deniedPathRedirect } from './route-access'

describe('route-access', () => {
  describe('landings are always allowed (AGENTS.md §5)', () => {
    it('TRANSPORTEUR can reach its own /overview landing', () => {
      expect(canAccessPath('TRANSPORTEUR', '/overview')).toBe(true)
    })

    it('MARKETEUR can reach /overview (its landing)', () => {
      expect(canAccessPath('MARKETEUR', '/overview')).toBe(true)
    })

    it('SUPERADMIN landing /overview is allowed', () => {
      expect(canAccessPath('SUPERADMIN', '/overview')).toBe(true)
    })

    it('SUPERADMIN can reach the national /dashboard via dashboard.read', () => {
      expect(canAccessPath('SUPERADMIN', '/dashboard')).toBe(true)
    })
  })

  describe('declared feature paths require the matching permission', () => {
    it('MARKETEUR is denied /organizations (orgs.read is not granted)', () => {
      expect(canAccessPath('MARKETEUR', '/organizations')).toBe(false)
    })

    it('MARKETEUR is denied /marketers (no organizational view — works on-site)', () => {
      expect(canAccessPath('MARKETEUR', '/marketers')).toBe(false)
    })

    it('TRANSPORTEUR is denied from /audit-logs (no audit-logs.read)', () => {
      expect(canAccessPath('TRANSPORTEUR', '/audit-logs')).toBe(false)
    })

    it('TRANSPORTEUR can reach /devices (devices.read granted)', () => {
      expect(canAccessPath('TRANSPORTEUR', '/devices')).toBe(true)
    })

    it('INTEGRATEUR can reach /devices and /rfid-tags', () => {
      expect(canAccessPath('INTEGRATEUR', '/devices')).toBe(true)
      expect(canAccessPath('INTEGRATEUR', '/rfid-tags')).toBe(true)
    })

    it('AGENT can reach /client-sites (READS sites.read)', () => {
      expect(canAccessPath('AGENT', '/client-sites')).toBe(true)
    })

    it('SUPERADMIN can reach every declared path', () => {
      for (const p of ['/organizations', '/devices', '/rfid-tags', '/pickups', '/sites', '/marketers']) {
        expect(canAccessPath('SUPERADMIN', p)).toBe(true)
      }
    })
  })

  describe('detail / child routes inherit the parent feature path', () => {
    it('transporters/:id is authorized through the /transporters path', () => {
      expect(canAccessPath('ADMIN', '/transporters/t-123')).toBe(true)
    })
  })

  describe('chrome-reachable pages are open to every authenticated role', () => {
    it('/settings hub and profile stay open even though settings.read is SUPERADMIN-only', () => {
      expect(canAccessPath('TRANSPORTEUR', '/settings')).toBe(true)
      expect(canAccessPath('TRANSPORTEUR', '/settings/profile')).toBe(true)
      expect(canAccessPath('MARKETEUR', '/settings')).toBe(true)
    })
  })

  describe('distinct global-config screen is gated by settings.read', () => {
    it('SUPERADMIN and ADMIN can reach /settings/system', () => {
      expect(canAccessPath('SUPERADMIN', '/settings/system')).toBe(true)
      expect(canAccessPath('ADMIN', '/settings/system')).toBe(true)
    })

    it('roles without settings.read are denied /settings/system', () => {
      expect(canAccessPath('TRANSPORTEUR', '/settings/system')).toBe(false)
      expect(canAccessPath('MARKETEUR', '/settings/system')).toBe(false)
    })
  })

  describe('auxiliary routes are gated by their nav declaration', () => {
    it('/tour-tracking is granted to roles holding tours.read', () => {
      expect(canAccessPath('TRANSPORTEUR', '/tour-tracking')).toBe(true)
      expect(canAccessPath('MARKETEUR', '/tour-tracking')).toBe(true)
    })

    it('undeclared paths remain open by default', () => {
      expect(canAccessPath('TRANSPORTEUR', '/health')).toBe(true)
    })
  })

  describe('deniedPathRedirect', () => {
    it('redirects a denied role to its own landing (never loops)', () => {
      expect(deniedPathRedirect('MARKETEUR', '/organizations')).toBe('/overview')
      expect(deniedPathRedirect('MARKETEUR', '/marketers')).toBe('/overview')
    })

    it('returns /overview when the path is denied for TRANSPORTEUR', () => {
      expect(deniedPathRedirect('TRANSPORTEUR', '/audit-logs')).toBe('/overview')
    })

    it('never redirects a role off its own landing (AGENTS.md §5)', () => {
      expect(deniedPathRedirect('TRANSPORTEUR', '/overview')).toBeNull()
      expect(deniedPathRedirect('MARKETEUR', '/overview')).toBeNull()
    })
  })
})