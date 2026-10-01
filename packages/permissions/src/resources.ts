/**
 * Schema table → permission resource. Every table in csph_gpl_schema_v6_2.sql
 * must resolve to a resource with a `*.read` code (and, where the table has
 * write columns, `*.write`). `resources.test.ts` fails if a table is missing.
 *
 * Notes:
 *  - `regions` is surfaced in the UI as "Zones" (feature `features/zones`,
 *    resource `zones`).
 *  - `vehicles` is surfaced as trucks (feature `features/trucks`,
 *    resource `trucks`).
 *  - `client_sites` is managed within the clients/sites features (resource
 *    `clients`).
 *  - `custom_roles` / `user_custom_roles` resolve to `roles`: the catalog
 *    exposes only `custom-roles.manage`, so custom roles are governed by the
 *    CRUD-complete `roles` resource.
 */
export const SCHEMA_TABLES = [
  'regions', 'organizations', 'users', 'settings', 'permissions',
  'system_roles', 'system_role_permissions', 'user_mfa', 'integration_auth',
  'user_sessions', 'audit_logs', 'sites', 'clients', 'client_sites',
  'user_site_assignments', 'custom_roles', 'user_custom_roles', 'vehicles',
  'drivers', 'devices', 'device_status_history', 'vehicle_positions',
  'rfid_tags', 'transporter_contracts', 'pickup_requests',
  'pickup_request_vehicles', 'delivery_tours', 'checkpoints', 'scan_events',
  'declarations', 'reconciliations', 'redressements', 'risk_scores',
  'anomalies', 'anomaly_assignments', 'notification_groups',
  'notification_group_members', 'notification_rules', 'reports',
  'monitoring_metrics',
] as const

export const TABLE_TO_RESOURCE: Record<string, string> = {
  regions: 'zones',
  organizations: 'orgs',
  users: 'users',
  settings: 'settings',
  permissions: 'permissions',
  system_roles: 'roles',
  system_role_permissions: 'roles',
  user_mfa: 'users',
  integration_auth: 'integrations',
  user_sessions: 'users',
  audit_logs: 'audit-logs',
  sites: 'sites',
  clients: 'clients',
  client_sites: 'clients',
  user_site_assignments: 'sites',
  custom_roles: 'roles',
  user_custom_roles: 'roles',
  vehicles: 'trucks',
  drivers: 'drivers',
  devices: 'devices',
  device_status_history: 'devices',
  vehicle_positions: 'trucks',
  rfid_tags: 'rfid',
  transporter_contracts: 'contracts',
  pickup_requests: 'pickups',
  pickup_request_vehicles: 'pickups',
  delivery_tours: 'tours',
  checkpoints: 'checkpoints',
  scan_events: 'scans',
  declarations: 'declarations',
  reconciliations: 'reconciliations',
  redressements: 'redressements',
  risk_scores: 'risks',
  anomalies: 'anomalies',
  anomaly_assignments: 'anomalies',
  notification_groups: 'notification-groups',
  notification_group_members: 'notification-groups',
  notification_rules: 'notification-rules',
  reports: 'reports',
  monitoring_metrics: 'metrics',
}
