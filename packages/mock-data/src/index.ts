/**
 * @lpg/mock-data — single source of truth for the entire system.
 *
 * Data lives in `seed/curated/*.json` (snake_case, mirrors the production
 * Postgres schema). This package exposes only that curated data plus pure
 * analytics selectors. There is no second source of mock data.
 */

export { curated } from './curated.ts'
export {
  organizations,
  users,
  sites,
  clients,
  client_sites,
  vehicles,
  drivers,
  devices,
  transporter_contracts,
  pickup_requests,
  delivery_tours,
  checkpoints,
  scan_events,
  declarations,
  reconciliations,
  redressements,
  risk_scores,
  anomalies,
  anomaly_assignments,
  notification_groups,
  notification_group_members,
  notification_rules,
  notifications,
  user_mfa,
  integration_auth,
  system_roles,
  permissions,
  regions,
  rfid_tags,
  settings,
  reports,
  audit_logs,
  custom_roles,
  user_custom_roles,
} from './entities.ts'

export type {
  Region,
  Organization,
  SystemRole,
  Permission,
  User,
  Site,
  Client,
  ClientSite,
  Vehicle,
  Driver,
  Device,
  TransporterContract,
  PickupRequest,
  DeliveryTour,
  Checkpoint,
  ScanEvent,
  Declaration,
  Reconciliation,
  Redressement,
  RiskScore,
  Anomaly,
  AnomalyAssignment,
  NotificationGroup,
  NotificationGroupMember,
  NotificationRule,
  Notification,
  CuratedFixtures,
} from './curated.ts'

export type {
  Setting,
  Report,
  AuditLog,
  RfidTag,
  CustomRole,
  UserCustomRole,
} from '@lpg/types'

export * from './analytics.ts'

export { getSetting, getSettingNumber, getSettingFunctions } from './settings.ts'

import { curated } from './curated.ts'

export interface AuthFixture {
  id: string
  email: string
  first_name: string
  last_name: string
  system_role: string
  password: string
  org_id: string
  org_name: string
}

export const AUTH_FIXTURES: AuthFixture[] = curated.users.map((u) => {
  const org = (curated.organizations as any[]).find((o) => o.id === u.org_id)
  return {
    id: u.id,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    system_role: u.system_role,
    password: 'password',
    org_id: u.org_id ?? '',
    org_name: org?.name ?? 'Organisation inconnue',
  }
})

export interface FakeProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  system_role: string
  org_id: string
  org_name: string
  org_type?: string
  site_ids: string[]
}

export const fakeProfiles: FakeProfile[] = AUTH_FIXTURES.map((f) => {
  const org = (curated.organizations as any[]).find((o) => o.id === f.org_id)
  const assignments = (curated as any).user_site_assignments ?? []
  const site_ids = assignments
    .filter((a: any) => a.user_id === f.id)
    .map((a: any) => a.site_id)
  return {
    id: f.id,
    email: f.email,
    first_name: f.first_name,
    last_name: f.last_name,
    system_role: f.system_role,
    org_id: f.org_id,
    org_name: f.org_name,
    org_type: org?.type,
    site_ids,
  }
})