/**
 * Single-source-of-truth navigation manifest for the LPG platform.
 *
 * Every navigation link the UI can show is declared exactly once here,
 * tagged with the permission codes (from @lpg/permissions PERMISSION_CATALOG)
 * that an actor must hold in order to see it.
 *
 * `buildSidebarFor(role)` projects this master list onto a `Role` by checking
 * each item's `requires` against `ROLE_GRANTS[role]`. That means:
 *
 *   • adding a navigation item is a one-line change here,
 *   • removing a feature privilege from a role automatically hides the link,
 *   • screens and modules cannot accidentally expose routes a role cannot
 *     legitimately access, since the same matrix that gates the link also
 *     gates the screen (via AbilityContext).
 *
 * No role/feature/literal is hardcoded in sidebar-by-role.ts — that file
 * simply renders the projected tree for the active role.
 */

import {
  hasPermission,
  ROLES,
  ROLE_LABELS,
  type PermissionCode,
  type Role,
} from '@lpg/permissions'
import {
  Activity,
  AlertTriangle,
  Building2,
  ClipboardList,
  FileBarChart,
  FileText,
  FileWarning,
  Gauge,
  Globe,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListChecks,
  Map as MapIcon,
  MapPin,
  PackageCheck,
  Plug,
  RadioTower,
  Receipt,
  RefreshCw,
  Route,
  ScanLine,
  ScrollText,
  Search,
  ServerCog,
  Settings,
  ShieldCheck,
  Truck,
  Upload,
  UserCog,
  Users,
  Wallet,
  Warehouse,
  Wrench,
} from 'lucide-react'
import type { SidebarData } from '@/components/layout/types'

export type NavIcon = React.ComponentType<{ className?: string }>

export interface NavItemDecl {
  /** Stable identifier. Becomes a render key and a programmatic hook target. */
  id: string
  /** Permission codes the active role MUST hold to see this link. */
  requires: readonly PermissionCode[]
  /** i18n label (kept simple — French by default, fallback). */
  label: string
  /** Translation key in nav namespace, e.g. 'nav:overview'. */
  labelKey?: string
  /** Lucide icon component. */
  icon?: NavIcon
  /** Bare URL segment of the feature route (e.g. 'users' → '/users'). Static items use a literal path. */
  path?: string
  /** Set to true for items with a literal absolute path (e.g. '/grafana') that never takes a role prefix. */
  static?: boolean
  /** Visual badge (e.g. '!' for alerts). */
  badge?: string
  /** Optional secondary items only rendered when the parent is visible. */
  children?: readonly NavItemDecl[]
}

/** Section header — groups nav items under a titled bucket. */
export interface NavGroupDecl {
  id: string
  title: string
  items: readonly NavItemDecl[]
}

/** Top-level container — exactly one per role's sidebar. */
export interface NavRoleDecl {
  id: string
  title: string
  groups: readonly NavGroupDecl[]
}

/* --------------------------------------------------------------------------
 * MASTER CATALOG
 *
 * Every item the UI could ever render is declared exactly once below. Nothing
 * is hardcoded in consumers — `buildSidebarFor(role)` does the projection.
 *
 * The schema (TODO.md section 4 + CsphGplSchema v6.2) is the canonical authority
 * for which routes exist; permission codes come from @lpg/permissions.
 * --------------------------------------------------------------------------*/

export const NAV_CATALOG: readonly NavItemDecl[] = [
  /* ----------- Overview / piloting ----------- */
  {
    id: 'overview',
    label: 'Vue d\'ensemble',
    labelKey: 'nav:overview',
    icon: LayoutDashboard,
    path: 'overview',
    requires: ['overview.read'],
  },

  /* ----------- Dashboards ----------- */
  {
    id: 'dashboard',
    label: 'Tableau de bord national',
    labelKey: 'nav:dashboard',
    icon: LayoutDashboard,
    path: 'dashboard',
    requires: ['dashboard.read'],
  },
  {
    id: 'dashboard-admin',
    label: 'Tableau de bord région',
    labelKey: 'nav:dashboard-admin',
    icon: LayoutDashboard,
    path: 'dashboard-admin',
    requires: ['dashboard.read'],
  },
  {
    id: 'dashboard-supervisor',
    label: 'Tableau de bord technique',
    labelKey: 'nav:dashboard-supervisor',
    icon: LayoutDashboard,
    path: 'dashboard-supervisor',
    requires: ['dashboard.read'],
  },
  {
    id: 'dashboard-marketeur',
    label: 'Tableau de bord marketeur',
    labelKey: 'nav:dashboard-marketeur',
    icon: LayoutDashboard,
    path: 'dashboard-marketeur',
    requires: ['dashboard.read'],
  },
  {
    id: 'dashboard-transporteur',
    label: 'Tableau de bord transporteur',
    labelKey: 'nav:dashboard-transporteur',
    icon: LayoutDashboard,
    path: 'dashboard-transporteur',
    requires: ['dashboard.read'],
  },
  {
    id: 'super-admin',
    label: 'Tours nationales (Super Admin)',
    labelKey: 'nav:super-admin',
    icon: LayoutDashboard,
    path: 'super-admin/tours',
    requires: ['dashboard.read'],
  },

  /* ----------- Cartography ----------- */
  {
    id: 'map',
    label: 'Carte interactive',
    labelKey: 'nav:map',
    icon: MapIcon,
    path: 'map',
    requires: ['national-map.read'],
  },

  /* ----------- Entities: organizations, transporters, marketeurs, depots ----------- */
  {
    id: 'organizations',
    label: 'Toutes les organisations',
    labelKey: 'nav:organizations',
    icon: Building2,
    path: 'organizations',
    requires: ['orgs.read'],
  },
  {
    id: 'marketers',
    label: 'Marketeurs',
    labelKey: 'nav:marketers',
    icon: Building2,
    path: 'marketers',
    requires: ['markets.read'],
  },
  {
    id: 'transporters',
    label: 'Transporteurs',
    labelKey: 'nav:transporters',
    icon: Truck,
    path: 'transporters',
    requires: ['transporters.read'],
  },
  {
    id: 'depots',
    label: 'Dépôts (SCDP/SNH)',
    labelKey: 'nav:depots',
    icon: Warehouse,
    path: 'depots',
    requires: ['orgs.read'],
  },

  /* ----------- Sites & client sites (schema splits these into two tables) ----------- */
  {
    id: 'sites',
    label: 'Sites opérationnels',
    labelKey: 'nav:sites',
    icon: MapPin,
    path: 'sites',
    requires: ['sites.read'],
  },
  {
    id: 'client-sites',
    label: 'Sites clients',
    labelKey: 'nav:client-sites',
    icon: MapPin,
    path: 'client-sites',
    requires: ['sites.read'],
  },
  {
    id: 'zones',
    label: 'Zones géographiques',
    labelKey: 'nav:zones',
    icon: Globe,
    path: 'zones',
    requires: ['zones.read'],
  },
  {
    id: 'site-verifications',
    label: 'Vérification sites',
    labelKey: 'nav:site-verifications',
    icon: MapPin,
    path: 'site-verifications',
    requires: ['sites.verify'],
  },

  /* ----------- Users, roles, RBAC ----------- */
  {
    id: 'users',
    label: 'Utilisateurs & RBAC',
    labelKey: 'nav:users',
    icon: Users,
    path: 'users',
    requires: ['users.read'],
  },
  {
    id: 'permissions',
    label: 'Matrice de permissions',
    labelKey: 'nav:permissions',
    icon: ShieldCheck,
    path: 'permissions',
    requires: ['permissions.read'],
  },
  {
    id: 'custom-roles',
    label: 'Rôles personnalisés',
    labelKey: 'nav:custom-roles',
    icon: ShieldCheck,
    path: 'custom-roles',
    requires: ['custom-roles.manage', 'roles.read'],
  },

  /* ----------- Vehicles, certificates, devices (unified GPS/PDA/RFIDREADER) ----------- */
  {
    id: 'trucks',
    label: 'Véhicules (Parc national)',
    labelKey: 'nav:trucks',
    icon: Truck,
    path: 'trucks',
    requires: ['trucks.read'],
  },
  {
    id: 'vehicles',
    label: 'Ma flotte véhicules',
    labelKey: 'nav:vehicles',
    icon: Truck,
    path: 'vehicles',
    requires: ['trucks.read'],
  },
  {
    id: 'certificates',
    label: 'Certificats de jaugeage',
    labelKey: 'nav:certificates',
    icon: ShieldCheck,
    path: 'certificates',
    requires: ['certificates.read'],
  },
  {
    id: 'devices',
    label: 'Appareils IoT',
    labelKey: 'nav:devices',
    icon: RadioTower,
    path: 'devices',
    requires: ['devices.read'],
  },
  {
    id: 'rfid-tags',
    label: 'Tags RFID',
    labelKey: 'nav:rfid-tags',
    icon: ScanLine,
    path: 'rfid-tags',
    requires: ['rfid.read'],
  },
  {
    id: 'gps-config',
    label: 'Config GPS',
    labelKey: 'nav:gps-config',
    icon: MapPin,
    path: 'gps-config',
    requires: ['devices.write'],
  },
  {
    id: 'device-assignments',
    label: 'Affectations appareils',
    labelKey: 'nav:device-assignments',
    icon: Link2,
    path: 'device-assignments',
    requires: ['devices.read'],
  },
  {
    id: 'firmware',
    label: 'Mises à jour firmware',
    labelKey: 'nav:firmware',
    icon: Upload,
    path: 'firmware',
    requires: ['devices.manage'],
  },
  {
    id: 'maintenance',
    label: 'Maintenance préventive',
    labelKey: 'nav:maintenance',
    icon: Wrench,
    path: 'maintenance',
    requires: ['devices.manage'],
  },

  /* ----------- Operations: pickups + tours ----------- */
  {
    id: 'pickups',
    label: 'Approvisionnements (Flux 1)',
    labelKey: 'nav:pickups',
    icon: PackageCheck,
    path: 'pickups',
    requires: ['pickups.read'],
  },
  {
    id: 'pickup-tracking',
    label: 'Suivi enlèvements',
    labelKey: 'nav:pickup-tracking',
    icon: MapIcon,
    path: 'pickup-tracking',
    requires: ['pickups.read'],
  },
  {
    id: 'tours',
    label: 'Tournées de livraison',
    labelKey: 'nav:tours',
    icon: Route,
    path: 'tours',
    requires: ['tours.read'],
  },
  {
    id: 'tour-tracking',
    label: 'Suivi des tournées',
    labelKey: 'nav:tour-tracking',
    icon: MapIcon,
    path: 'tour-tracking',
    requires: ['tours.read'],
  },

  /* ----------- Compliance: declarations → reconciliations → redressements ----------- */
  {
    id: 'declarations',
    label: 'Déclarations',
    labelKey: 'nav:declarations',
    icon: ClipboardList,
    path: 'declarations',
    requires: ['declarations.read'],
  },
  {
    id: 'reconciliations',
    label: 'Réconciliations',
    labelKey: 'nav:reconciliations',
    icon: FileBarChart,
    path: 'reconciliations',
    requires: ['reconciliations.read'],
  },
  {
    id: 'redressements',
    label: 'Redressements',
    labelKey: 'nav:redressements',
    icon: Receipt,
    path: 'redressements',
    requires: ['redressements.read'],
  },

  /* ----------- Anomalies (dual-track INVESTIGATION vs TECHNICAL) ----------- */
  {
    id: 'anomalies',
    label: 'Anomalies',
    labelKey: 'nav:anomalies',
    icon: AlertTriangle,
    path: 'anomalies',
    requires: ['anomalies.read'],
  },
  {
    id: 'anomalies-investigation',
    label: 'Piste Investigation',
    labelKey: 'nav:anomalies-investigation',
    icon: Search,
    path: 'anomalies/investigation',
    requires: ['anomalies.investigate'],
  },
  {
    id: 'anomalies-technical',
    label: 'Piste Technique',
    labelKey: 'nav:anomalies-technical',
    icon: ServerCog,
    path: 'anomalies/technical',
    requires: ['devices.read', 'anomalies.read'],
  },

  /* ----------- Risk + anomalies management ----------- */
  {
    id: 'risk-scores',
    label: 'Scores de risque',
    labelKey: 'nav:risk-scores',
    icon: FileWarning,
    path: 'risk-scores',
    requires: ['risks.read'],
  },
  {
    id: 'recompute',
    label: 'Recompute manuel',
    labelKey: 'nav:recompute',
    icon: RefreshCw,
    path: 'recompute',
    requires: ['risks.manage'],
  },

  /* ----------- MARKEUR-specific ----------- */
  {
    id: 'drivers',
    label: 'Chauffeurs',
    labelKey: 'nav:drivers',
    icon: Users,
    path: 'drivers',
    requires: ['drivers.read'],
  },
  {
    id: 'livreurs',
    label: 'Livreurs PDA',
    labelKey: 'nav:livreurs',
    icon: RadioTower,
    path: 'livreurs',
    requires: ['livreurs.read'],
  },
  {
    id: 'transporter-contracts',
    label: 'Contrats transporteurs',
    labelKey: 'nav:transporter-contracts',
    icon: FileText,
    path: 'transporter-contracts',
    requires: ['contracts.read'],
  },
  {
    id: 'clients',
    label: 'Clients & sites livraison',
    labelKey: 'nav:clients',
    icon: Building2,
    path: 'clients',
    requires: ['sites.read'],
  },
  {
    id: 'performance',
    label: 'Performance',
    labelKey: 'nav:performance',
    icon: Activity,
    path: 'performance',
    requires: ['reports.read'],
  },
  {
    id: 'quotas',
    label: 'Quotas & volumes',
    labelKey: 'nav:quotas',
    icon: Gauge,
    path: 'quotas',
    requires: ['quotas.read'],
  },
  {
    id: 'supply',
    label: 'Requête d\'enlèvement',
    labelKey: 'nav:supply',
    icon: PackageCheck,
    path: 'supply',
    requires: ['pickups.create'],
  },

  /* ----------- TRANSPORTEUR-specific ----------- */
  {
    id: 'contracts',
    label: 'Contrats marketeurs',
    labelKey: 'nav:contracts',
    icon: ShieldCheck,
    path: 'contracts',
    requires: ['transporters.read'],
  },

  /* ----------- LIVREUR/PDA-specific -----------
   * Deferred: 9 PDA screens (missions, tour-start, checkpoints, scan-rfid,
   * scan-vrac, photos, sync, sync-status, offline-data) removed from nav.
   * Re-introduce when a dedicated LIVREUR milestone adds the routes.
   */

  /* ----------- AGENT-specific ----------- */
  {
    id: 'visits',
    label: 'Rapports de visite terrain',
    labelKey: 'nav:visits',
    icon: ListChecks,
    path: 'visits',
    requires: ['tours.read'],
  },
  {
    id: 'passwords',
    label: 'Reset mots de passe',
    labelKey: 'nav:passwords',
    icon: KeyRound,
    path: 'passwords',
    requires: ['users.reset'],
  },

  /* ----------- ADMIN-specific ----------- */
  {
    id: 'alert-rules',
    label: 'Règles d\'alerte',
    labelKey: 'nav:alert-rules',
    icon: ShieldCheck,
    path: 'alert-rules',
    requires: ['alerts.write'],
  },

  /* ----------- FINANCE ----------- */
  {
    id: 'finance',
    label: 'Indicateurs financiers',
    labelKey: 'nav:finance',
    icon: Wallet,
    path: 'finance',
    requires: ['subsidies.read'],
  },

  /* ----------- NOTIFICATIONS ----------- */
  {
    id: 'notification-rules',
    label: 'Règles de notification',
    labelKey: 'nav:notification-rules',
    icon: Settings,
    path: 'notification-rules',
    requires: ['notification-rules.write'],
  },
  {
    id: 'notification-groups',
    label: 'Groupes de notification',
    labelKey: 'nav:notification-groups',
    icon: UserCog,
    path: 'settings/notification-groups',
    requires: ['notification-groups.write'],
  },

  /* ----------- REPORTS / AUDIT ----------- */
  {
    id: 'reports',
    label: 'Rapports & exports',
    labelKey: 'nav:reports',
    icon: FileBarChart,
    path: 'reports',
    requires: ['reports.read'],
  },
  {
    id: 'audit-logs',
    label: 'Journal d\'audit',
    labelKey: 'nav:audit-logs',
    icon: ScrollText,
    path: 'audit-logs',
    requires: ['audit-logs.read'],
  },

  /* ----------- CONFIG ----------- */
  {
    id: 'settings',
    label: 'Paramètres globaux',
    labelKey: 'nav:settings',
    icon: Gauge,
    path: 'settings/system',
    requires: ['settings.read'],
  },

  /* ----------- OPS / MONITORING ----------- */
  {
    id: 'system-health',
    label: 'Santé système',
    labelKey: 'nav:system-health',
    icon: HeartPulse,
    path: 'system-health',
    requires: ['system-health.read'],
  },
  {
    id: 'system-metrics',
    label: 'Métriques système',
    labelKey: 'nav:system-metrics',
    icon: Gauge,
    path: 'system-metrics',
    requires: ['metrics.read'],
  },
  {
    id: 'infra',
    label: 'Dashboards Grafana',
    labelKey: 'nav:infra',
    icon: ServerCog,
    path: 'infra',
    requires: ['metrics.read'],
  },
  {
    id: 'alerts',
    label: 'Alertes infrastructure',
    labelKey: 'nav:alerts',
    icon: AlertTriangle,
    path: 'alerts',
    badge: '!',
    requires: ['alerts.read'],
  },
  {
    id: 'gps-tracking',
    label: 'Tracking GPS',
    labelKey: 'nav:gps-tracking',
    icon: MapIcon,
    path: 'gps-tracking',
    requires: ['metrics.read'],
  },
  {
    id: 'device-health',
    label: 'Santé appareils',
    labelKey: 'nav:device-health',
    icon: RadioTower,
    path: 'device-health',
    requires: ['devices.read'],
  },
  {
    id: 'integrations',
    label: 'État intégrations',
    labelKey: 'nav:integrations',
    icon: Plug,
    path: 'integrations',
    requires: ['integrations.read'],
  },
  {
    id: 'logs',
    label: 'Logs centralisés',
    labelKey: 'nav:logs',
    icon: Activity,
    path: 'logs',
    requires: ['audit-logs.read'],
  },

  /* ----------- Static / external links ----------- */
  {
    id: 'grafana',
    label: 'Dashboards Grafana',
    labelKey: 'nav:grafana',
    icon: ServerCog,
    path: '/grafana',
    static: true,
    requires: ['metrics.read'],
  },
  {
    id: 'prometheus',
    label: 'Métriques Prometheus',
    labelKey: 'nav:prometheus',
    icon: Activity,
    path: '/prometheus',
    static: true,
    requires: ['metrics.read'],
  },

  /* ----------- Visits / show screens ----------- */
] as const

/* --------------------------------------------------------------------------
 * ROLE → GROUP DECLARATIONS
 *
 * Roles are declared once here. Group titles use ROLE_LABELS from
 * @lpg/permissions so this remains the single source for human-readable
 * role names. Items within each group are referenced by id from the
 * NAV_CATALOG so adding/removing items requires zero changes in this file.
 * --------------------------------------------------------------------------*/

interface RoleGroupSpec {
  /** Nav item ids (from NAV_CATALOG) — order is the rendering order. */
  items: readonly string[]
  /** Group title shown in the sidebar (French fallback). */
  title: string
  /** Translation key for the group title, e.g. 'nav:groups.pilotageNational'. */
  titleKey?: string
}

interface RoleDecl {
  groups: readonly RoleGroupSpec[]
}

/**
 * Web-facing roles only. LIVREUR is PDA-only — no web UI is rendered for it;
 * any appearance here is purely defensive (e.g. role switcher integrity).
 */
export const WEB_ROLES = ['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'INTEGRATEUR', 'AGENT', 'MARKETEUR', 'TRANSPORTEUR'] as const

const ROLE_NAV_DECL: Record<Role, RoleDecl> = {
  SUPERADMIN: {
    groups: [
      { title: 'Pilotage national', titleKey: 'nav:groups.pilotageNational', items: ['overview', 'map', 'finance', 'risk-scores', 'dashboard'] },
      {
        title: 'Entités',
        titleKey: 'nav:groups.entities',
          items: [
          'organizations',
          'marketers',
          'transporters',
          'depots',
          'sites',
          'client-sites',
          'zones',
           'users',
           'trucks',
           'certificates',
          'devices',
        ],
      },
      {
        title: 'Opérations & Contrôle',
        titleKey: 'nav:groups.operationsControl',
        items: [
          'pickups',
          'tours',
          'tour-tracking',
          'declarations',
          'reconciliations',
          'redressements',
          'anomalies-investigation',
          'anomalies-technical',
        ],
      },
      {
        title: 'Configuration système',
        titleKey: 'nav:groups.systemConfig',
        items: [
          'settings',
          'custom-roles',
          'notification-rules',
          'transporter-contracts',
          'reports',
          'audit-logs',
        ],
      },
      {
        title: 'Monitoring infrastructure',
        titleKey: 'nav:groups.monitoringInfra',
        items: ['grafana', 'prometheus', 'system-health'],
      },
    ],
  },
  ADMIN: {
    groups: [
      { title: 'Gestion', titleKey: 'nav:groups.gestion', items: ['overview', 'users', 'marketers', 'transporters', 'dashboard-admin'] },
      {
        title: 'Validation & Contrôle',
        titleKey: 'nav:groups.validationControl',
        items: ['site-verifications', 'pickups', 'declarations', 'reconciliations'],
      },
      {
        title: 'Anomalies & Risques',
        titleKey: 'nav:groups.anomaliesRisks',
        items: ['anomalies', 'risk-scores', 'alert-rules'],
      },
      { title: 'Rapports', titleKey: 'nav:groups.rapports', items: ['reports', 'audit-logs'] },
    ],
  },
  SUPERVISOR: {
    groups: [
      { title: 'Monitoring technique', titleKey: 'nav:groups.monitoringTechnique', items: ['overview', 'infra', 'system-metrics', 'system-health', 'dashboard-supervisor'] },
      {
        title: 'Piste technique (Anomalies)',
        titleKey: 'nav:groups.pisteTechnique',
        items: ['device-health', 'gps-tracking', 'alerts', 'anomalies-technical'],
      },
      { title: 'Risque & Recompute', titleKey: 'nav:groups.risqueRecompute', items: ['risk-scores', 'recompute'] },
      { title: 'Logs & Intégration', titleKey: 'nav:groups.logsIntegration', items: ['logs', 'integrations'] },
    ],
  },
  INTEGRATEUR: {
    groups: [
      {
        title: 'Matériel IoT',
        titleKey: 'nav:groups.materielIoT',
        items: ['overview', 'devices', 'rfid-tags', 'gps-config'],
      },
      {
        title: 'Authentification & Sécurité',
        titleKey: 'nav:groups.authSecurite',
        items: ['users', 'device-assignments'],
      },
      { title: 'Maintenance', titleKey: 'nav:groups.maintenance', items: ['maintenance', 'firmware', 'logs'] },
    ],
  },
  AGENT: {
    groups: [
      { title: 'Suivi terrain', titleKey: 'nav:groups.suiviTerrain', items: ['overview', 'marketers', 'client-sites'] },
      {
        title: 'Investigation (Piste métier)',
        titleKey: 'nav:groups.investigation',
        items: ['declarations', 'anomalies-investigation', 'tours', 'tour-tracking', 'visits'],
      },
      { title: 'Actions', titleKey: 'nav:groups.actions', items: ['reconciliations', 'passwords'] },
    ],
  },
  MARKETEUR: {
    groups: [
       { title: 'Ma flotte', titleKey: 'nav:groups.maFlotte', items: ['overview', 'vehicles', 'drivers', 'devices', 'dashboard-marketeur'] },
      {
        title: 'Flux 1 — Approvisionnement',
        titleKey: 'nav:groups.flux1',
        items: ['pickups', 'pickup-tracking'],
      },
      {
        title: 'Flux 2 — Livraison',
        titleKey: 'nav:groups.flux2',
         items: ['tours', 'tour-tracking', 'transporter-contracts', 'clients'],
      },
      {
        title: 'Déclarations & Performance',
        titleKey: 'nav:groups.declarationsPerformance',
        items: ['declarations', 'performance', 'reports'],
      },
    ],
  },
TRANSPORTEUR: {
    groups: [
      {
        title: 'Opérations',
        titleKey: 'nav:groups.operations',
         items: ['overview', 'tours', 'tour-tracking', 'dashboard-transporteur'],
      },
       { title: 'Ma flotte', titleKey: 'nav:groups.maFlotte', items: ['vehicles', 'drivers', 'livreurs'] },
      { title: 'Contrats & Clients', titleKey: 'nav:groups.contratsClients', items: ['contracts', 'performance'] },
    ],
  },
  LIVREUR: {
    groups: [
      // PDA group deferred: 9 screens (missions, tour-start, checkpoints,
      // scan-rfid, scan-vrac, photos, sync, sync-status, offline-data) had no
      // on-disk route. Re-introduce when a dedicated LIVREUR milestone lands.
    ],
  },
}

/* --------------------------------------------------------------------------
 * PROJECTION (the entire reason this file exists)
 *
 * Filter the master catalog against `ROLE_GRANTS[role]`, then assemble a
 * `SidebarData` per the role's group declarations. Empty groups drop out
 * automatically — so dropping a role's grants on a permission naturally
 * hides the link.
 * --------------------------------------------------------------------------*/

const ITEM_BY_ID = new Map(NAV_CATALOG.map((item) => [item.id, item]))

function isVisibleTo(role: Role, item: NavItemDecl): boolean {
  return item.requires.some((code) => hasPermission(role, code))
}

function visibleIdsFor(role: Role): Set<string> {
  const visible = new Set<string>()
  for (const item of NAV_CATALOG) if (isVisibleTo(role, item)) visible.add(item.id)
  return visible
}

/**
 * Resolve a nav item's absolute feature path (AGENTS.md §5 — bare paths only,
 * no role prefix). Static items keep their literal path (e.g. '/grafana');
 * others become `/<path>` (or `/<id>` when no path is declared).
 *
 * Single source of truth — the sidebar and the route guard both use this so
 * a link can never exist that the guard doesn't know how to authorize.
 */
export function resolveFeaturePath(decl: NavItemDecl): string {
  return decl.static ? decl.path ?? '/' : `/${decl.path ?? decl.id}`
}

export type TranslateFn = (key: string) => string

function toSidebarItem(decl: NavItemDecl, t?: TranslateFn) {
  let title = decl.label
  if (t && decl.labelKey) {
    const translated = t(decl.labelKey)
    if (translated !== decl.labelKey) title = translated
  }
  return {
    title,
    url: resolveFeaturePath(decl),
    icon: decl.icon,
    badge: decl.badge,
  }
}

function resolveGroupTitle(group: RoleGroupSpec, t?: TranslateFn): string {
  if (t && group.titleKey) {
    const translated = t(group.titleKey)
    if (translated !== group.titleKey) return translated
  }
  return group.title
}

/**
 * Build the sidebar for a role. Pure — recompute on role change.
 * @param t - optional translator (e.g. `i18n.t` bound to `nav` namespace). Falls back to French `label`/`title`.
 */
export function buildSidebarFor(role: Role, t?: TranslateFn): SidebarData {
  const decl = ROLE_NAV_DECL[role]
  const visible = visibleIdsFor(role)
  if (!decl) return { navGroups: [] }

  const navGroups = decl.groups
    .map((group) => {
      const items = group.items
        .map((id) => ITEM_BY_ID.get(id))
        .filter((item): item is NavItemDecl => {
          if (!item) return false
          return visible.has(item.id)
        })
        .map((item) => toSidebarItem(item, t))
      return items.length ? { title: resolveGroupTitle(group, t), items } : null
    })
    .filter((group): group is { title: string; items: ReturnType<typeof toSidebarItem>[] } => group !== null)

  return { navGroups }
}

/**
 * Roles that get a web sidebar at all. LIVREUR is PDA-only.
 */
export function isWebRole(role: Role): boolean {
  return (WEB_ROLES as readonly Role[]).includes(role)
}

/* Re-export for consumers that want the canonical human label. */
export { ROLES, ROLE_LABELS }