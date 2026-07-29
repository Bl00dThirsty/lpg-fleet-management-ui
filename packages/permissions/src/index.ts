import { type Role } from '@lpg/types'
import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from '@casl/ability'

/** Actions a role can perform on a resource. */
export type Action = 'read' | 'write' | 'delete' | 'validate' | 'reset'

export type Resource =
  | 'organizations'
  | 'users'
  | 'sites'
  | 'trucks'
  | 'tours'
  | 'declarations'
  | 'anomalies'
  | 'reports'
  | 'pda'
  | 'infra'
  | 'risks'
  | 'custom-roles'
  | 'rfid-tags'
  | 'pickups'
  | 'checkpoints'
  | 'scans'
  | 'reconciliations'
  | 'redressements'
  | 'notification-groups'
  | 'notification-rules'
  | 'audit-logs'
  | 'vehicle-types'
  | 'delivery-types'
  | 'tour-statuses'
  | 'drivers'
  | 'certificates'
  | 'site-verification'
  | 'deliveries'
  | 'metrics'

export type AppAbility = MongoAbility<[Action, Resource]>

/** Coarse RBAC matrix: role -> allowed (action, resource) pairs. */
export const ROLE_PERMISSIONS: Record<Role, Array<[Action, Resource]>> = {
  SUPER_ADMIN: [
    ['read', 'organizations'],
    ['write', 'organizations'],
    ['read', 'users'],
    ['write', 'users'],
    ['read', 'sites'],
    ['read', 'trucks'],
    ['read', 'tours'],
    ['read', 'declarations'],
    ['read', 'anomalies'],
    ['read', 'reports'],
    ['read', 'infra'],
    ['read', 'pda'],
    ['read', 'risks'],
    ['write', 'risks'],
    ['read', 'custom-roles'],
    ['write', 'custom-roles'],
    ['read', 'rfid-tags'],
    ['write', 'rfid-tags'],
    ['read', 'pickups'],
    ['write', 'pickups'],
    ['read', 'checkpoints'],
    ['write', 'checkpoints'],
    ['read', 'scans'],
    ['write', 'scans'],
    ['read', 'reconciliations'],
    ['write', 'reconciliations'],
    ['read', 'redressements'],
    ['write', 'redressements'],
    ['read', 'notification-groups'],
    ['write', 'notification-groups'],
    ['read', 'notification-rules'],
    ['write', 'notification-rules'],
    ['read', 'audit-logs'],
    ['write', 'audit-logs'],
    ['read', 'vehicle-types'],
    ['write', 'vehicle-types'],
    ['read', 'delivery-types'],
    ['write', 'delivery-types'],
    ['read', 'tour-statuses'],
    ['write', 'tour-statuses'],
    ['read', 'drivers'],
    ['write', 'drivers'],
    ['read', 'certificates'],
    ['write', 'certificates'],
    ['read', 'site-verification'],
    ['write', 'site-verification'],
    ['read', 'deliveries'],
    ['write', 'deliveries'],
    ['read', 'metrics'],
    ['write', 'metrics'],
  ],
  ADMIN: [
    ['read', 'users'],
    ['write', 'users'],
    ['read', 'organizations'],
    ['read', 'declarations'],
    ['validate', 'declarations'],
    ['read', 'reports'],
    ['read', 'anomalies'],
    ['read', 'sites'],
    ['read', 'risks'],
    ['read', 'custom-roles'],
    ['read', 'rfid-tags'],
    ['write', 'rfid-tags'],
    ['read', 'pickups'],
    ['write', 'pickups'],
    ['read', 'checkpoints'],
    ['write', 'checkpoints'],
    ['read', 'scans'],
    ['write', 'scans'],
    ['read', 'reconciliations'],
    ['write', 'reconciliations'],
    ['read', 'redressements'],
    ['write', 'redressements'],
    ['read', 'notification-groups'],
    ['read', 'notification-rules'],
    ['read', 'audit-logs'],
    ['read', 'vehicle-types'],
    ['write', 'vehicle-types'],
    ['read', 'delivery-types'],
    ['write', 'delivery-types'],
    ['read', 'tour-statuses'],
    ['write', 'tour-statuses'],
    ['read', 'drivers'],
    ['write', 'drivers'],
    ['read', 'certificates'],
    ['write', 'certificates'],
    ['read', 'site-verification'],
    ['write', 'site-verification'],
    ['read', 'deliveries'],
    ['write', 'deliveries'],
    ['read', 'metrics'],
    ['write', 'metrics'],
  ],
  SUPERVISOR: [
    ['read', 'infra'],
    ['read', 'pda'],
    ['read', 'trucks'],
    ['read', 'anomalies'],
    ['read', 'risks'],
    ['read', 'notification-groups'],
    ['read', 'notification-rules'],
    ['read', 'audit-logs'],
    ['read', 'metrics'],
  ],
  INTEGRATEUR: [
    ['read', 'pda'],
    ['write', 'pda'],
    ['read', 'trucks'],
    ['read', 'rfid-tags'],
    ['write', 'rfid-tags'],
    ['read', 'tour-statuses'],
    ['read', 'delivery-types'],
  ],
  AGENT: [
    ['read', 'declarations'],
    ['validate', 'declarations'],
    ['reset', 'users'],
    ['read', 'users'],
    ['read', 'anomalies'],
    ['write', 'declarations'],
    ['read', 'reconciliations'],
    ['write', 'reconciliations'],
    ['read', 'risks'],
    ['read', 'sites'],
  ],
  MARKETEUR: [
    ['read', 'trucks'],
    ['write', 'trucks'],
    ['read', 'tours'],
    ['write', 'tours'],
    ['read', 'reports'],
    ['read', 'pickups'],
    ['write', 'pickups'],
    ['read', 'deliveries'],
    ['write', 'deliveries'],
    ['read', 'declarations'],
    ['write', 'declarations'],
    ['read', 'drivers'],
  ],
  LIVREUR: [
    ['read', 'tours'],
    ['write', 'tours'],
    ['read', 'pda'],
    ['read', 'scans'],
    ['write', 'scans'],
    ['read', 'checkpoints'],
    ['write', 'checkpoints'],
    ['read', 'rfid-tags'],
  ],
}

export function defineAbilityFor(role: Role): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)
  for (const [action, resource] of ROLE_PERMISSIONS[role]) {
    can(action, resource)
  }
  return build()
}

/** App-facing alias; `GUEST` yields an empty (no-access) ability. */
export function defineAbilitiesFor(role: Role | 'GUEST'): AppAbility {
  if (role === 'GUEST') return createMongoAbility([])
  return defineAbilityFor(role)
}

export function can(role: Role, action: Action, resource: Resource): boolean {
  return defineAbilityFor(role).can(action, resource)
}

/** Canonical, ordered list of every platform role. */
export const ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'SUPERVISOR',
  'INTEGRATEUR',
  'AGENT',
  'MARKETEUR',
  'LIVREUR',
] as const

/** Human-readable labels (French) shown across the UI. */
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrateur',
  SUPERVISOR: 'Superviseur',
  INTEGRATEUR: 'Intégrateur',
  AGENT: 'Agent validateur',
  MARKETEUR: 'Marketeur',
  LIVREUR: 'Livreur',
}

/** Short descriptions of each role's mandate. */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SUPER_ADMIN: 'Supervision totale — carte ultra-détaillée, tous modules',
  ADMIN: 'Staff CSPH / RH — gestion utilisateurs, agents, marketeurs, rapports',
  SUPERVISOR: 'DevOps / monitoring — Prometheus, Grafana, alertes, scores de risque',
  INTEGRATEUR:
    'Spécialiste domaine — activation, authentification, maintenance matériel PDA+GPS+RFID',
  AGENT: 'Validateur terrain — suivi marketeurs, reset passwords, validation déclarations',
  MARKETEUR:
    'Société pétrolière — flotte, tournées, quotas, chauffeurs, règles personnalisées',
  LIVREUR: 'Chauffeur livreur — scan bouteilles (vide/plein) via PDA, missions de tournée',
}

export type { Role } from '@lpg/types'
