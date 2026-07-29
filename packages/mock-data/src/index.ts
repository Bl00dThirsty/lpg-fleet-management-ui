import sites from './seed/sites.json'
import trucks from './seed/trucks.json'
import tours from './seed/tours.json'
import declarations from './seed/declarations.json'
import anomalies from './seed/anomalies.json'
import reports from './seed/reports.json'
import pda from './seed/pda.json'
import infra from './seed/infra.json'
import organizations from './seed/organizations.json'
import users from './seed/users.json'
import transporters from './seed/transporters.json'
import { AUTH_FIXTURES } from './fixtures-auth.ts'
import {
  drivers,
  rfidTags,
  pickups,
  checkpoints,
  scans,
  reconciliations,
  redressements,
  customRoles,
  userAssignments,
  userCustomRoles,
  notificationGroups,
  notificationRules,
  risks,
  auditLogs,
  vehicleTypes,
  deliveryTypes,
  tourStatuses,
} from './seed-extended.ts'

export type SeedName =
  | 'sites'
  | 'trucks'
  | 'tours'
  | 'declarations'
  | 'anomalies'
  | 'reports'
  | 'pda'
  | 'infra'
  | 'organizations'
  | 'users'
  | 'transporters'
  | 'drivers'
  | 'rfid-tags'
  | 'pickups'
  | 'checkpoints'
  | 'scans'
  | 'reconciliations'
  | 'redressements'
  | 'custom-roles'
  | 'user-assignments'
  | 'user-custom-roles'
  | 'notification-groups'
  | 'notification-rules'
  | 'risks'
  | 'audit-logs'
  | 'vehicle-types'
  | 'delivery-types'
  | 'tour-statuses'

export const seeds: Record<SeedName, unknown[]> = {
  sites,
  trucks,
  tours,
  declarations,
  anomalies,
  reports,
  pda,
  infra,
  organizations,
  users,
  transporters,
  drivers,
  'rfid-tags': rfidTags,
  pickups,
  checkpoints,
  scans,
  reconciliations,
  redressements,
  'custom-roles': customRoles,
  'user-assignments': userAssignments,
  'user-custom-roles': userCustomRoles,
  'notification-groups': notificationGroups,
  'notification-rules': notificationRules,
  risks,
  'audit-logs': auditLogs,
  'vehicle-types': vehicleTypes,
  'delivery-types': deliveryTypes,
  'tour-statuses': tourStatuses,
}

export { AUTH_FIXTURES }

export interface FakeProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'INTEGRATEUR' | 'AGENT' | 'MARKETEUR' | 'LIVREUR'
}

export const fakeProfiles: FakeProfile[] = AUTH_FIXTURES.map((f) => ({
  id: f.id,
  email: f.email,
  firstName: f.firstName,
  lastName: f.lastName,
  role: f.role,
}))
