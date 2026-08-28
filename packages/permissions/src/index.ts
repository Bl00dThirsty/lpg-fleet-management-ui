import { type Role } from '@lpg/types'
import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from '@casl/ability'

/**
 * Single source of truth for the LPG platform permission model.
 *
 * The catalog (PERMISSION_CATALOG) defines every permission code; the
 * ROLE_GRANTS matrix assigns codes to each of the 8 system roles. Types are
 * derived from the catalog so the build enforces that grants reference real
 * codes and that every role is covered.
 *
 * LIVREUR is a data-layer role (PDA mobile app): it has grants, labels and a
 * hierarchy level, but the web app deliberately excludes it (no web UI).
 */

export type PermissionCategory =
  | 'identity'
  | 'governance'
  | 'sites'
  | 'fleet'
  | 'supply'
  | 'tours'
  | 'compliance'
  | 'risk'
  | 'reporting'

export const PERMISSION_CATEGORIES: readonly {
  id: PermissionCategory
  label: string
}[] = [
  { id: 'identity', label: 'Identité & accès' },
  { id: 'governance', label: 'Gouvernance' },
  { id: 'sites', label: 'Sites' },
  { id: 'fleet', label: 'Flotte & dispositifs' },
  { id: 'supply', label: 'Approvisionnement' },
  { id: 'tours', label: 'Tournées, scans & missions' },
  { id: 'compliance', label: 'Conformité & finances' },
  { id: 'risk', label: 'Risques & anomalies' },
  { id: 'reporting', label: 'Reporting & système' },
] as const

export const PERMISSION_CATALOG = [
  // ---- identity (16) -----------------------------------------------------
  { code: 'users.read', category: 'identity', label: 'Voir les utilisateurs' },
  { code: 'users.write', category: 'identity', label: 'Modifier les utilisateurs' },
  { code: 'users.create', category: 'identity', label: 'Créer des utilisateurs' },
  { code: 'users.invite', category: 'identity', label: 'Inviter des utilisateurs' },
  { code: 'users.delete', category: 'identity', label: 'Supprimer des utilisateurs' },
  { code: 'users.reset', category: 'identity', label: 'Réinitialiser les mots de passe' },
  { code: 'users.manage', category: 'identity', label: 'Gérer les utilisateurs' },
  { code: 'roles.read', category: 'identity', label: 'Voir les rôles' },
  { code: 'roles.write', category: 'identity', label: 'Modifier les rôles' },
  { code: 'roles.create', category: 'identity', label: 'Créer des rôles' },
  { code: 'roles.edit', category: 'identity', label: 'Éditer les rôles' },
  { code: 'roles.delete', category: 'identity', label: 'Supprimer des rôles' },
  { code: 'permissions.read', category: 'identity', label: 'Voir la matrice de permissions' },
  { code: 'permissions.write', category: 'identity', label: 'Modifier les permissions' },
  { code: 'permissions.manage', category: 'identity', label: 'Gérer les permissions' },
  { code: 'custom-roles.manage', category: 'identity', label: 'Gérer les rôles personnalisés' },
  // ---- governance (26) ----------------------------------------------------
  { code: 'orgs.read', category: 'governance', label: 'Voir les organisations' },
  { code: 'orgs.write', category: 'governance', label: 'Modifier les organisations' },
  { code: 'orgs.create', category: 'governance', label: 'Créer des organisations' },
  { code: 'orgs.delete', category: 'governance', label: 'Supprimer des organisations' },
  { code: 'orgs.manage', category: 'governance', label: 'Gérer les organisations' },
  { code: 'markets.read', category: 'governance', label: 'Voir les marketeurs' },
  { code: 'markets.write', category: 'governance', label: 'Modifier les marketeurs' },
  { code: 'markets.manage', category: 'governance', label: 'Gérer les marketeurs' },
  { code: 'transporters.read', category: 'governance', label: 'Voir les transporteurs' },
  { code: 'transporters.write', category: 'governance', label: 'Modifier les transporteurs' },
  { code: 'transporters.manage', category: 'governance', label: 'Gérer les transporteurs' },
  { code: 'zones.read', category: 'governance', label: 'Voir les zones géographiques' },
  { code: 'zones.write', category: 'governance', label: 'Modifier les zones' },
  { code: 'zones.manage', category: 'governance', label: 'Gérer les zones' },
  { code: 'clients.read', category: 'governance', label: 'Voir les clients' },
  { code: 'clients.write', category: 'governance', label: 'Modifier les clients' },
  { code: 'clients.create', category: 'governance', label: 'Créer des clients' },
  { code: 'clients.delete', category: 'governance', label: 'Supprimer des clients' },
  { code: 'clients.manage', category: 'governance', label: 'Gérer les clients' },
  { code: 'contracts.read', category: 'governance', label: 'Voir les contrats' },
  { code: 'contracts.write', category: 'governance', label: 'Modifier les contrats' },
  { code: 'contracts.create', category: 'governance', label: 'Créer des contrats' },
  { code: 'contracts.delete', category: 'governance', label: 'Supprimer des contrats' },
  { code: 'contracts.manage', category: 'governance', label: 'Gérer les contrats' },
  { code: 'contracts.validate', category: 'governance', label: 'Valider les contrats' },
  { code: 'contracts.suspend', category: 'governance', label: 'Suspendre les contrats' },
  // ---- sites (13) ----------------------------------------------------------
  { code: 'sites.read', category: 'sites', label: 'Voir les sites' },
  { code: 'sites.write', category: 'sites', label: 'Modifier les sites' },
  { code: 'sites.create', category: 'sites', label: 'Créer des sites' },
  { code: 'sites.delete', category: 'sites', label: 'Supprimer des sites' },
  { code: 'sites.manage', category: 'sites', label: 'Gérer les sites' },
  { code: 'sites.validate', category: 'sites', label: 'Valider les sites' },
  { code: 'sites.verify', category: 'sites', label: 'Vérifier les sites terrain' },
  { code: 'sites.affect', category: 'sites', label: 'Affecter les sites' },
  { code: 'certificates.read', category: 'sites', label: 'Voir les certificats' },
  { code: 'certificates.write', category: 'sites', label: 'Modifier les certificats' },
  { code: 'certificates.manage', category: 'sites', label: 'Gérer les certificats' },
  { code: 'site-types.read', category: 'sites', label: 'Voir les types de site' },
  { code: 'site-types.write', category: 'sites', label: 'Modifier les types de site' },
  // ---- fleet (21) ----------------------------------------------------------
  { code: 'trucks.read', category: 'fleet', label: 'Voir les camions' },
  { code: 'trucks.write', category: 'fleet', label: 'Modifier les camions' },
  { code: 'trucks.create', category: 'fleet', label: 'Créer des camions' },
  { code: 'trucks.delete', category: 'fleet', label: 'Supprimer des camions' },
  { code: 'trucks.manage', category: 'fleet', label: 'Gérer les camions' },
  { code: 'vehicle-types.read', category: 'fleet', label: 'Voir les types de véhicule' },
  { code: 'vehicle-types.write', category: 'fleet', label: 'Modifier les types de véhicule' },
  { code: 'drivers.read', category: 'fleet', label: 'Voir les chauffeurs' },
  { code: 'drivers.write', category: 'fleet', label: 'Modifier les chauffeurs' },
  { code: 'drivers.create', category: 'fleet', label: 'Créer des chauffeurs' },
  { code: 'drivers.delete', category: 'fleet', label: 'Supprimer des chauffeurs' },
  { code: 'drivers.manage', category: 'fleet', label: 'Gérer les chauffeurs' },
  { code: 'livreurs.read', category: 'fleet', label: 'Voir les livreurs PDA' },
  { code: 'livreurs.write', category: 'fleet', label: 'Modifier les livreurs PDA' },
  { code: 'livreurs.manage', category: 'fleet', label: 'Gérer les livreurs PDA' },
  { code: 'devices.read', category: 'fleet', label: 'Voir les équipements IoT' },
  { code: 'devices.write', category: 'fleet', label: 'Modifier les équipements IoT' },
  { code: 'devices.create', category: 'fleet', label: 'Créer des équipements IoT' },
  { code: 'devices.delete', category: 'fleet', label: 'Supprimer des équipements IoT' },
  { code: 'devices.manage', category: 'fleet', label: 'Gérer les équipements IoT' },
  { code: 'pda.read', category: 'fleet', label: 'Voir les PDA' },
  { code: 'pda.write', category: 'fleet', label: 'Modifier les PDA' },
  { code: 'pda.sync', category: 'fleet', label: 'Synchroniser les PDA' },
  { code: 'rfid.read', category: 'fleet', label: 'Voir les tags RFID' },
  { code: 'rfid.write', category: 'fleet', label: 'Modifier les tags RFID' },
  { code: 'rfid.delete', category: 'fleet', label: 'Supprimer les tags RFID' },
  // ---- supply (9) ------------------------------------------------------------
  { code: 'pickups.read', category: 'supply', label: 'Voir les enlèvements' },
  { code: 'pickups.write', category: 'supply', label: 'Modifier les enlèvements' },
  { code: 'pickups.create', category: 'supply', label: 'Créer des enlèvements' },
  { code: 'pickups.validate', category: 'supply', label: 'Valider les enlèvements' },
  { code: 'pickups.manage', category: 'supply', label: 'Gérer les enlèvements' },
  { code: 'quotas.read', category: 'supply', label: 'Voir les quotas' },
  { code: 'quotas.write', category: 'supply', label: 'Modifier les quotas' },
  { code: 'quotas.manage', category: 'supply', label: 'Gérer les quotas' },
  { code: 'supply.manage', category: 'supply', label: 'Gérer l’approvisionnement' },
  // ---- tours, scans & missions (19) ------------------------------------------
  { code: 'tours.read', category: 'tours', label: 'Voir les tournées' },
  { code: 'tours.write', category: 'tours', label: 'Modifier les tournées' },
  { code: 'tours.create', category: 'tours', label: 'Créer des tournées' },
  { code: 'tours.validate', category: 'tours', label: 'Valider les tournées' },
  { code: 'tours.assign', category: 'tours', label: 'Assigner les tournées' },
  { code: 'tours.manage', category: 'tours', label: 'Gérer les tournées' },
  { code: 'deliveries.read', category: 'tours', label: 'Voir les livraisons' },
  { code: 'deliveries.write', category: 'tours', label: 'Modifier les livraisons' },
  { code: 'deliveries.manage', category: 'tours', label: 'Gérer les livraisons' },
  { code: 'checkpoints.read', category: 'tours', label: 'Voir les points de contrôle' },
  { code: 'checkpoints.write', category: 'tours', label: 'Modifier les points de contrôle' },
  { code: 'checkpoints.manage', category: 'tours', label: 'Gérer les points de contrôle' },
  { code: 'scans.read', category: 'tours', label: 'Voir les scans RFID' },
  { code: 'scans.write', category: 'tours', label: 'Enregistrer des scans' },
  { code: 'scans.manage', category: 'tours', label: 'Gérer les scans' },
  { code: 'missions.read', category: 'tours', label: 'Voir les missions' },
  { code: 'missions.write', category: 'tours', label: 'Modifier les missions' },
  { code: 'missions.assign', category: 'tours', label: 'Assigner les missions' },
  { code: 'missions.manage', category: 'tours', label: 'Gérer les missions' },
  // ---- compliance & finance (14) ----------------------------------------------
  { code: 'declarations.read', category: 'compliance', label: 'Voir les déclarations' },
  { code: 'declarations.write', category: 'compliance', label: 'Modifier les déclarations' },
  { code: 'declarations.validate', category: 'compliance', label: 'Valider les déclarations' },
  { code: 'declarations.manage', category: 'compliance', label: 'Gérer les déclarations' },
  { code: 'reconciliations.read', category: 'compliance', label: 'Voir les réconciliations' },
  { code: 'reconciliations.write', category: 'compliance', label: 'Modifier les réconciliations' },
  { code: 'reconciliations.manage', category: 'compliance', label: 'Gérer les réconciliations' },
  { code: 'redressements.read', category: 'compliance', label: 'Voir les redressements' },
  { code: 'redressements.write', category: 'compliance', label: 'Modifier les redressements' },
  { code: 'redressements.manage', category: 'compliance', label: 'Gérer les redressements' },
  { code: 'subsidies.read', category: 'compliance', label: 'Voir les subventions' },
  { code: 'subsidies.write', category: 'compliance', label: 'Modifier les subventions' },
  { code: 'invoices.read', category: 'compliance', label: 'Voir les factures' },
  { code: 'invoices.write', category: 'compliance', label: 'Modifier les factures' },
  // ---- risk & anomalies (15) -----------------------------------------------------
  { code: 'anomalies.read', category: 'risk', label: 'Voir les anomalies' },
  { code: 'anomalies.write', category: 'risk', label: 'Modifier les anomalies' },
  { code: 'anomalies.investigate', category: 'risk', label: 'Investiguer les anomalies' },
  { code: 'anomalies.manage', category: 'risk', label: 'Gérer les anomalies' },
  { code: 'risks.read', category: 'risk', label: 'Voir les scores de risque' },
  { code: 'risks.write', category: 'risk', label: 'Modifier les scores de risque' },
  { code: 'risks.manage', category: 'risk', label: 'Gérer les scores de risque' },
  { code: 'alerts.read', category: 'risk', label: 'Voir les alertes' },
  { code: 'alerts.write', category: 'risk', label: 'Modifier les alertes' },
  { code: 'alerts.manage', category: 'risk', label: 'Gérer les alertes' },
  { code: 'incidents.read', category: 'risk', label: 'Voir les incidents' },
  { code: 'incidents.write', category: 'risk', label: 'Modifier les incidents' },
  { code: 'incidents.manage', category: 'risk', label: 'Gérer les incidents' },
  { code: 'fraud.read', category: 'risk', label: 'Voir le suivi fraude' },
  { code: 'fraud.manage', category: 'risk', label: 'Gérer le suivi fraude' },
  // ---- reporting & system (21) ----------------------------------------------------
  { code: 'reports.read', category: 'reporting', label: 'Voir les rapports' },
  { code: 'reports.generate', category: 'reporting', label: 'Générer des rapports' },
  { code: 'reports.export', category: 'reporting', label: 'Exporter des rapports' },
  { code: 'reports.manage', category: 'reporting', label: 'Gérer les rapports' },
  { code: 'metrics.read', category: 'reporting', label: 'Voir les métriques' },
  { code: 'metrics.write', category: 'reporting', label: 'Modifier les métriques' },
  { code: 'audit-logs.read', category: 'reporting', label: 'Voir le journal d’audit' },
  { code: 'audit-logs.write', category: 'reporting', label: 'Enregistrer des traces d’audit' },
  { code: 'audit-logs.export', category: 'reporting', label: 'Exporter le journal d’audit' },
  { code: 'notification-groups.read', category: 'reporting', label: 'Voir les groupes de notification' },
  { code: 'notification-groups.write', category: 'reporting', label: 'Modifier les groupes de notification' },
  { code: 'notification-rules.read', category: 'reporting', label: 'Voir les règles de notification' },
  { code: 'notification-rules.write', category: 'reporting', label: 'Modifier les règles de notification' },
  { code: 'notification-rules.manage', category: 'reporting', label: 'Gérer les règles de notification' },
  { code: 'settings.read', category: 'reporting', label: 'Voir les paramètres' },
  { code: 'settings.write', category: 'reporting', label: 'Modifier les paramètres' },
  { code: 'settings.manage', category: 'reporting', label: 'Gérer les paramètres' },
  { code: 'system-health.read', category: 'reporting', label: 'Voir la santé du système' },
  { code: 'integrations.read', category: 'reporting', label: 'Voir les intégrations' },
  { code: 'integrations.write', category: 'reporting', label: 'Modifier les intégrations' },
  { code: 'national-map.read', category: 'reporting', label: 'Voir la carte nationale (SUPERADMIN)' },
  { code: 'dashboard.read', category: 'reporting', label: 'Voir le tableau de bord national' },
  { code: 'overview.read', category: 'reporting', label: 'Voir l\'aperçu' },
] as const satisfies readonly {
  code: string
  category: PermissionCategory
  label: string
}[]

/** Literal union of every valid permission code. */
export type PermissionCode = (typeof PERMISSION_CATALOG)[number]['code']

/** Resource part of a permission code, derived from the catalog. */
export type Resource = (typeof PERMISSION_CATALOG)[number]['code'] extends `${infer R}.${string}`
  ? R
  : never

export type Action =
  | 'read'
  | 'write'
  | 'create'
  | 'delete'
  | 'manage'
  | 'invite'
  | 'reset'
  | 'validate'
  | 'verify'
  | 'affect'
  | 'sync'
  | 'assign'
  | 'reconcile'
  | 'investigate'
  | 'generate'
  | 'export'
  | 'edit'
  | 'suspend'

export type AppAbility = MongoAbility<[Action, Resource]>

export interface CatalogEntry {
  code: PermissionCode
  category: PermissionCategory
  label: string
}

export function getCatalogEntry(code: string): CatalogEntry {
  const entry = PERMISSION_CATALOG.find((e) => e.code === code)
  if (!entry) throw new Error(`Unknown permission code: ${code}`)
  return entry
}

export function parseCode(code: string): { resource: Resource; action: Action } {
  const [resource, action] = code.split('.') as [Resource, Action]
  if (!resource || !action) throw new Error(`Malformed permission code: ${code}`)
  return { resource, action }
}

/** Grants each action implies (what `can(action, …)` accepts). */
const ACTION_IMPLICATIONS: Record<Action, readonly Action[]> = {
  manage: ['manage', 'read', 'write', 'create', 'delete', 'invite', 'reset', 'validate', 'verify', 'affect', 'sync', 'assign', 'reconcile', 'investigate', 'generate', 'export', 'edit', 'suspend'],
  read: ['read'],
  write: ['write', 'create'],
  create: ['create'],
  delete: ['delete'],
  invite: ['invite'],
  reset: ['reset'],
  validate: ['validate'],
  verify: ['verify'],
  affect: ['affect'],
  sync: ['sync'],
  assign: ['assign'],
  reconcile: ['reconcile'],
  investigate: ['investigate'],
  generate: ['generate'],
  export: ['export'],
  edit: ['edit', 'write', 'create'],
  suspend: ['suspend'],
}

const ADMIN_GRANTS = [
  'users.read', 'users.write', 'users.create', 'users.invite', 'users.delete', 'users.reset', 'users.manage',
  'roles.read', 'roles.write', 'roles.create', 'roles.edit', 'roles.delete',
  'permissions.read', 'permissions.write', 'custom-roles.manage',
  'orgs.read', 'orgs.write', 'orgs.create', 'orgs.delete', 'orgs.manage',
  'markets.read', 'markets.write', 'markets.manage',
  'transporters.read', 'transporters.write', 'transporters.manage',
  'zones.read', 'zones.write', 'zones.manage',
  'clients.read', 'clients.write', 'clients.create', 'clients.delete', 'clients.manage',
  'contracts.read', 'contracts.write', 'contracts.create', 'contracts.delete', 'contracts.manage', 'contracts.validate', 'contracts.suspend',
  'sites.read', 'sites.write', 'sites.create', 'sites.delete', 'sites.manage', 'sites.validate',
  'certificates.read', 'certificates.write', 'certificates.manage',
  'site-types.read', 'site-types.write',
  'trucks.read',
  'drivers.read', 'drivers.write', 'drivers.create', 'drivers.delete',
  'devices.read', 'devices.write', 'devices.create', 'devices.delete',
  'livreurs.read', 'livreurs.write', 'livreurs.manage', 'tours.read', 'deliveries.read',
  'declarations.read', 'declarations.write', 'declarations.validate',
  'pickups.read', 'pickups.write', 'pickups.validate',
  'reconciliations.read', 'reconciliations.write', 'reconciliations.manage',
  'redressements.read', 'redressements.write', 'redressements.manage',
  'subsidies.read', 'subsidies.write', 'invoices.read', 'invoices.write',
  'anomalies.read', 'anomalies.write', 'risks.read', 'risks.write',
  'alerts.read', 'incidents.read', 'fraud.read',
  'reports.read', 'reports.generate', 'reports.export', 'metrics.read',
  'audit-logs.read', 'audit-logs.write', 'audit-logs.export',
  'notification-groups.read', 'notification-groups.write',
  'notification-rules.read', 'notification-rules.write', 'notification-rules.manage',
  'settings.read', 'settings.write', 'settings.manage', 'system-health.read',
  'dashboard.read',
  'overview.read',
] as const satisfies readonly PermissionCode[]

const SUPERVISOR_GRANTS = [
  'metrics.read', 'system-health.read', 'alerts.read', 'alerts.write',
  'risks.read', 'risks.write', 'anomalies.read', 'incidents.read', 'fraud.read',
  'audit-logs.read', 'notification-groups.read', 'notification-rules.read',
  'reports.read', 'reports.export', 'integrations.read',
  'pda.read', 'devices.read', 'trucks.read', 'tours.read', 'checkpoints.read', 'scans.read',
  'overview.read',
] as const satisfies readonly PermissionCode[]

const INTEGRATEUR_GRANTS = [
  'devices.read', 'devices.write', 'devices.create', 'devices.delete', 'devices.manage',
  'pda.read', 'pda.write', 'pda.sync',
  'rfid.read', 'rfid.write', 'rfid.delete',
  'trucks.read', 'vehicle-types.read', 'vehicle-types.write', 'drivers.read',
  'sites.read', 'tours.read', 'missions.read', 'checkpoints.read', 'scans.read',
  'alerts.read', 'risks.read', 'metrics.read',
  'integrations.read', 'integrations.write',
  'notification-groups.read', 'notification-rules.read',
  'audit-logs.read', 'anomalies.read', 'incidents.read',
  'overview.read',
] as const satisfies readonly PermissionCode[]

const AGENT_GRANTS = [
  'users.read', 'users.reset', 'users.invite',
  'roles.read', 'permissions.read',
  'declarations.read', 'declarations.write', 'declarations.validate',
  'reconciliations.read', 'reconciliations.write',
  'redressements.read',
  'anomalies.read', 'anomalies.investigate', 'risks.read', 'alerts.read',
  'sites.read', 'sites.verify', 'certificates.read',
  'reports.read', 'metrics.read',
  'deliveries.read', 'tours.read',
  'markets.read', 'transporters.read', 'livreurs.read', 'quotas.read', 'clients.read', 'contracts.read',
  'notification-groups.read', 'notification-rules.read',
  'overview.read',
] as const satisfies readonly PermissionCode[]

const MARKETEUR_GRANTS = [
  'trucks.read', 'trucks.write', 'trucks.create', 'trucks.delete', 'trucks.manage',
  'vehicle-types.read', 'vehicle-types.write',
  'drivers.read', 'drivers.write', 'drivers.manage',
  'livreurs.read', 'livreurs.write', 'livreurs.manage',
  'tours.read', 'tours.write', 'tours.create', 'tours.assign', 'tours.manage',
  'deliveries.read', 'deliveries.write', 'deliveries.manage',
  'checkpoints.read', 'scans.read',
  'pickups.read', 'pickups.write', 'pickups.create', 'pickups.manage',
  'quotas.read', 'quotas.write', 'quotas.manage', 'supply.manage',
  'contracts.read', 'contracts.write', 'contracts.create', 'contracts.delete', 'contracts.manage',
  'declarations.read', 'declarations.write',
  'subsidies.read', 'invoices.read',
  'sites.read',
  'anomalies.read', 'risks.read', 'alerts.read',
  'reports.read', 'reports.generate', 'reports.export', 'metrics.read',
  'overview.read',
] as const satisfies readonly PermissionCode[]

const TRANSPORTEUR_GRANTS = [
  'trucks.read', 'trucks.write', 'trucks.create', 'trucks.manage',
  'vehicle-types.read',
  'drivers.read', 'drivers.write', 'drivers.manage',
  'livreurs.read', 'livreurs.write', 'livreurs.manage',
  'tours.read', 'tours.write', 'tours.create', 'tours.assign', 'tours.manage',
  'missions.read', 'missions.write', 'missions.assign', 'missions.manage',
  'deliveries.read', 'deliveries.write', 'deliveries.manage',
  'checkpoints.read', 'checkpoints.write', 'checkpoints.manage',
  'scans.read', 'scans.write', 'scans.manage',
  'pda.read', 'pda.write', 'pda.sync',
  'rfid.read', 'rfid.write',
  'devices.read',
  'pickups.read', 'quotas.read',
  'contracts.read', 'contracts.validate',
  'declarations.read', 'subsidies.read',
  'anomalies.read', 'risks.read', 'alerts.read',
  'reports.read', 'metrics.read',
  'overview.read',
] as const satisfies readonly PermissionCode[]

const LIVREUR_GRANTS = [
  'missions.read', 'missions.assign',
  'tours.read', 'tours.write', 'tours.assign',
  'deliveries.read', 'deliveries.write',
  'checkpoints.read', 'checkpoints.write',
  'scans.read', 'scans.write',
  'pda.read', 'pda.write', 'pda.sync',
  'rfid.read', 'rfid.write',
  'anomalies.read', 'alerts.read', 'metrics.read', 'livreurs.read',
] as const satisfies readonly PermissionCode[]

/**
 * Role → granted permission codes. Exhaustive over `Role`; the build enforces
 * every role is present and every code exists in the catalog.
 */
export const ROLE_GRANTS: Record<Role, readonly PermissionCode[]> = {
  SUPERADMIN: PERMISSION_CATALOG.map((e) => e.code),
  ADMIN: ADMIN_GRANTS,
  SUPERVISOR: SUPERVISOR_GRANTS,
  INTEGRATEUR: INTEGRATEUR_GRANTS,
  AGENT: AGENT_GRANTS,
  MARKETEUR: MARKETEUR_GRANTS,
  TRANSPORTEUR: TRANSPORTEUR_GRANTS,
  LIVREUR: LIVREUR_GRANTS,
}

/** Coarse (action, resource) pairs, kept for backward compatibility. */
export const ROLE_PERMISSIONS: Record<Role, Array<[Action, Resource]>> = {
  SUPERADMIN: ROLE_GRANTS.SUPERADMIN.map((code) => {
    const { resource, action } = parseCode(code)
    return [action, resource]
  }),
  ADMIN: ADMIN_GRANTS.map((code) => {
    const { resource, action } = parseCode(code)
    return [action, resource]
  }),
  SUPERVISOR: SUPERVISOR_GRANTS.map((code) => {
    const { resource, action } = parseCode(code)
    return [action, resource]
  }),
  INTEGRATEUR: INTEGRATEUR_GRANTS.map((code) => {
    const { resource, action } = parseCode(code)
    return [action, resource]
  }),
  AGENT: AGENT_GRANTS.map((code) => {
    const { resource, action } = parseCode(code)
    return [action, resource]
  }),
  MARKETEUR: MARKETEUR_GRANTS.map((code) => {
    const { resource, action } = parseCode(code)
    return [action, resource]
  }),
  TRANSPORTEUR: TRANSPORTEUR_GRANTS.map((code) => {
    const { resource, action } = parseCode(code)
    return [action, resource]
  }),
  LIVREUR: LIVREUR_GRANTS.map((code) => {
    const { resource, action } = parseCode(code)
    return [action, resource]
  }),
}

/** Returns true when a role can perform `action` on `resource`. */
export function can(role: Role, action: Action, resource: Resource): boolean {
  return ROLE_GRANTS[role].some((code) => {
    const { resource: grantedResource, action: grantedAction } = parseCode(code)
    if (grantedResource !== resource) return false
    // Forward implication only: a granted action is at least as powerful as
    // the actions it implies. Checking the reverse direction would let a
    // weak grant (e.g. `read`) satisfy a strong check (e.g. `manage`).
    return ACTION_IMPLICATIONS[grantedAction].includes(action)
  })
}

/** Returns true when a role holds the given permission code. */
export function hasPermission(role: Role, code: PermissionCode): boolean {
  const { resource, action } = parseCode(code)
  return can(role, action, resource)
}

export function defineAbilityFor(role: Role): AppAbility {
  const { can: allow, build } = new AbilityBuilder<AppAbility>(createMongoAbility)
  for (const code of ROLE_GRANTS[role]) {
    const { resource, action } = parseCode(code)
    allow([...ACTION_IMPLICATIONS[action]], resource)
  }
  return build()
}

/** App-facing alias; `GUEST` yields an empty (no-access) ability. */
export function defineAbilitiesFor(role: Role | 'GUEST'): AppAbility {
  if (role === 'GUEST') return createMongoAbility([])
  return defineAbilityFor(role)
}

/** Canonical, ordered list of every platform role (incl. PDA-only LIVREUR). */
export const ROLES = [
  'SUPERADMIN',
  'ADMIN',
  'SUPERVISOR',
  'INTEGRATEUR',
  'AGENT',
  'MARKETEUR',
  'TRANSPORTEUR',
  'LIVREUR',
] as const

/** Numeric authority level; a user may create roles at or below their own. */
export const HIERARCHY_LEVEL: Record<Role, number> = {
  SUPERADMIN: 100,
  ADMIN: 80,
  SUPERVISOR: 60,
  INTEGRATEUR: 60,
  AGENT: 60,
  MARKETEUR: 40,
  TRANSPORTEUR: 40,
  LIVREUR: 20,
}

export function roleLevel(role: Role): number {
  return HIERARCHY_LEVEL[role]
}

/** A user may create subordinates at or below their own hierarchy level. */
export function canCreate(actor: Role, target: Role): boolean {
  return HIERARCHY_LEVEL[actor] >= HIERARCHY_LEVEL[target]
}

export function getCreatableRoles(actor: Role): Role[] {
  return ROLES.filter((role) => canCreate(actor, role))
}

/** Human-readable labels (French) shown across the UI. */
export const ROLE_LABELS: Record<Role, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Administrateur',
  SUPERVISOR: 'Superviseur',
  INTEGRATEUR: 'Intégrateur',
  AGENT: 'Agent validateur',
  MARKETEUR: 'Marketeur',
  TRANSPORTEUR: 'Transporteur',
  LIVREUR: 'Livreur',
}

/** Short descriptions of each role's mandate. */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SUPERADMIN: 'Supervision totale — carte ultra-détaillée, tous modules',
  ADMIN: 'Staff CSPH / RH — gestion utilisateurs, agents, marketeurs, rapports',
  SUPERVISOR: 'DevOps / monitoring — Prometheus, Grafana, alertes, scores de risque',
  INTEGRATEUR:
    'Spécialiste domaine — activation, authentification, maintenance matériel PDA+GPS+RFID',
  AGENT: 'Validateur terrain — suivi marketeurs, reset passwords, validation déclarations',
  MARKETEUR:
    'Société pétrolière — flotte, tournées, quotas, chauffeurs, règles personnalisées',
  TRANSPORTEUR:
    'Transporteur — flotte, tournées, scans RFID/PDA, points de contrôle et chauffeurs',
  LIVREUR:
    'Application PDA mobile — missions, scans RFID et livraisons (sans interface web)',
}

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role]
}

export type { Role } from '@lpg/types'

export { SCHEMA_TABLES, TABLE_TO_RESOURCE } from './resources'
