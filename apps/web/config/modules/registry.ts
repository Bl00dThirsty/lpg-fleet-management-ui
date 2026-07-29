import { type ModuleField, type ModuleRegistry } from './types'

const STATUS = [
  { label: 'Actif', value: 'active' },
  { label: 'En attente', value: 'pending' },
  { label: 'Clôturé', value: 'closed' },
  { label: 'Anomalie', value: 'anomaly' },
]

const SYNC = [
  { label: 'Synchronisé', value: 'synced' },
  { label: 'En attente', value: 'pending' },
  { label: 'Hors-ligne', value: 'offline' },
]

const RISK = [
  { label: 'Faible', value: 'low' },
  { label: 'Moyen', value: 'medium' },
  { label: 'Élevé', value: 'high' },
]

const MARKETEUR_FIELDS: ModuleField[] = [
  { key: 'name', header: 'Marketeur', type: 'text', filterable: true },
  { key: 'quota', header: 'Quota (kg)', type: 'number' },
  {
    key: 'status',
    header: 'Statut',
    type: 'status',
    options: STATUS,
    filterable: true,
  },
  { key: 'declaredAt', header: 'Déclaration', type: 'date' },
]

export const MODULE_REGISTRY: ModuleRegistry = {
  // ---------- SUPER_ADMIN ----------
  'SUPER_ADMIN:organizations': {
    title: 'Organisations & sites',
    description: 'Toutes les organisations et leurs sites localisés.',
    mockCount: 30,
    fields: [
      { key: 'name', header: 'Organisation', type: 'text', filterable: true },
      {
        key: 'type',
        header: 'Type',
        type: 'badge',
        options: [
          { label: 'CSPH', value: 'csph' },
          { label: 'SCDP', value: 'scdp' },
          { label: 'SNH', value: 'snh' },
          { label: 'Marketeur', value: 'marketeur' },
          { label: 'Transporteur', value: 'transporteur' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'sites', header: 'Sites', type: 'number' },
      {
        key: 'status',
        header: 'Statut',
        type: 'status',
        options: STATUS,
        filterable: true,
      },
      { key: 'createdAt', header: 'Créé le', type: 'date' },
    ],
  },
  'SUPER_ADMIN:users': {
    title: 'Utilisateurs (RBAC)',
    description: 'Gestion des utilisateurs et rôles.',
    mockCount: 40,
    fields: [
      { key: 'name', header: 'Nom', type: 'text', filterable: true },
      { key: 'email', header: 'Email', type: 'text' },
      {
        key: 'role',
        header: 'Rôle',
        type: 'badge',
        options: [
          { label: 'Super Admin', value: 'SUPER_ADMIN' },
          { label: 'Admin', value: 'ADMIN' },
          { label: 'Superviseur', value: 'SUPERVISOR' },
          { label: 'Intégrateur', value: 'INTEGRATEUR' },
          { label: 'Agent', value: 'AGENT' },
          { label: 'Marketeur', value: 'MARKETEUR' },
          { label: 'Livreur', value: 'LIVREUR' },
        ],
        filterable: true,
        groupable: true,
      },
      {
        key: 'status',
        header: 'Statut',
        type: 'status',
        options: STATUS,
        filterable: true,
      },
      { key: 'lastLogin', header: 'Dernière connexion', type: 'date' },
    ],
  },
  'SUPER_ADMIN:anomalies': {
    title: 'Anomalies & fraude',
    description: 'Détection par régression linéaire et écarts déclarés/scannés.',
    mockCount: 35,
    fields: [
      { key: 'subject', header: 'Sujet', type: 'text', filterable: true },
      {
        key: 'type',
        header: 'Type',
        type: 'badge',
        options: [
          { label: 'Volume déclaré', value: 'volume' },
          { label: 'Déviation trajet', value: 'deviation' },
          { label: 'Scan hors séquence', value: 'scan' },
        ],
        filterable: true,
        groupable: true,
      },
      {
        key: 'risk',
        header: 'Risque',
        type: 'status',
        options: RISK,
        filterable: true,
      },
      { key: 'detectedAt', header: 'Détecté le', type: 'date' },
    ],
  },
  'SUPER_ADMIN:finance': {
    title: 'Indicateurs financiers',
    description: 'Subventions, écarts et économies réalisées.',
    mockCount: 20,
    fields: [
      { key: 'org', header: 'Organisation', type: 'text', filterable: true },
      { key: 'subsidy', header: 'Subvention', type: 'currency' },
      { key: 'gap', header: 'Écart', type: 'currency' },
      { key: 'saved', header: 'Économies', type: 'currency' },
      { key: 'period', header: 'Période', type: 'date' },
    ],
  },
  'SUPER_ADMIN:reports': {
    title: 'Rapports & exports',
    description: 'Rapports opérationnels, conformité et financiers.',
    mockCount: 25,
    fields: [
      { key: 'title', header: 'Rapport', type: 'text', filterable: true },
      {
        key: 'category',
        header: 'Catégorie',
        type: 'badge',
        options: [
          { label: 'Opérationnel', value: 'ops' },
          { label: 'Conformité', value: 'compliance' },
          { label: 'Financier', value: 'finance' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'generatedAt', header: 'Généré le', type: 'date' },
    ],
  },
  'SUPER_ADMIN:custom-roles': {
    title: 'Rôles personnalisés',
    description: 'Gestion des rôles et permissions personnalisés.',
    mockCount: 15,
    fields: [
      { key: 'name', header: 'Rôle', type: 'text', filterable: true },
      { key: 'permissions', header: 'Permissions', type: 'number' },
      { key: 'users', header: 'Utilisateurs', type: 'number' },
      { key: 'createdAt', header: 'Créé le', type: 'date' },
    ],
  },
  'SUPER_ADMIN:risks': {
    title: 'Scores de risque',
    description: 'Scoring par marketeur, transporteur et livreur.',
    mockCount: 26,
    fields: [
      { key: 'entity', header: 'Entité', type: 'text', filterable: true },
      {
        key: 'kind',
        header: 'Type',
        type: 'badge',
        options: [
          { label: 'Marketeur', value: 'marketeur' },
          { label: 'Transporteur', value: 'transporteur' },
          { label: 'Livreur', value: 'livreur' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'score', header: 'Score', type: 'number' },
      {
        key: 'level',
        header: 'Niveau',
        type: 'status',
        options: RISK,
        filterable: true,
      },
      { key: 'calculatedAt', header: 'Calculé le', type: 'date' },
    ],
  },
  'SUPER_ADMIN:audit-logs': {
    title: "Journal d'audit",
    description: 'Traçabilité des actions utilisateurs.',
    mockCount: 50,
    fields: [
      { key: 'action', header: 'Action', type: 'text', filterable: true },
      { key: 'user', header: 'Utilisateur', type: 'text', filterable: true },
      {
        key: 'resource',
        header: 'Ressource',
        type: 'badge',
        options: [
          { label: 'Utilisateur', value: 'user' },
          { label: 'Organisation', value: 'org' },
          { label: 'Déclaration', value: 'declaration' },
          { label: 'Tournée', value: 'tour' },
          { label: 'Rôle', value: 'role' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'timestamp', header: 'Horodatage', type: 'date' },
    ],
  },
  'SUPER_ADMIN:delivery-types': {
    title: 'Types de livraison',
    description: 'Configuration des modes de livraison.',
    mockCount: 12,
    fields: [
      { key: 'name', header: 'Type', type: 'text', filterable: true },
      { key: 'description', header: 'Description', type: 'text' },
      {
        key: 'active',
        header: 'Actif',
        type: 'badge',
        options: [
          { label: 'Oui', value: 'yes' },
          { label: 'Non', value: 'no' },
        ],
        filterable: true,
      },
    ],
  },
  'SUPER_ADMIN:tour-statuses': {
    title: 'Statuts de tournée',
    description: 'Configuration des statuts de tournée.',
    mockCount: 10,
    fields: [
      { key: 'name', header: 'Statut', type: 'text', filterable: true },
      { key: 'description', header: 'Description', type: 'text' },
      { key: 'order', header: 'Ordre', type: 'number' },
      { key: 'color', header: 'Couleur', type: 'text' },
    ],
  },
  'SUPER_ADMIN:vehicle-types': {
    title: 'Types de véhicule',
    description: 'Configuration des types de véhicules de la flotte.',
    mockCount: 14,
    fields: [
      { key: 'name', header: 'Type', type: 'text', filterable: true },
      { key: 'capacity', header: 'Capacité (kg)', type: 'number' },
      {
        key: 'active',
        header: 'Actif',
        type: 'badge',
        options: [
          { label: 'Oui', value: 'yes' },
          { label: 'Non', value: 'no' },
        ],
        filterable: true,
      },
    ],
  },

  // ---------- ADMIN ----------
  'ADMIN:users': {
    title: 'Utilisateurs & organisations',
    description: 'Administration des comptes et entités.',
    mockCount: 35,
    fields: [
      { key: 'name', header: 'Nom', type: 'text', filterable: true },
      { key: 'org', header: 'Organisation', type: 'text', filterable: true },
      {
        key: 'role',
        header: 'Rôle',
        type: 'badge',
        options: [
          { label: 'Agent', value: 'AGENT' },
          { label: 'Marketeur', value: 'MARKETEUR' },
          { label: 'Livreur', value: 'LIVREUR' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'status', header: 'Statut', type: 'status', options: STATUS, filterable: true },
      { key: 'updatedAt', header: 'Modifié le', type: 'date' },
    ],
  },
  'ADMIN:marketeurs': {
    title: 'Marketeurs',
    description: 'Suivi des marketeurs par l’administration CSPH.',
    mockCount: 28,
    fields: MARKETEUR_FIELDS,
  },
  'ADMIN:declarations': {
    title: 'Déclarations à valider',
    description: 'Déclarations de ventes en attente de validation.',
    mockCount: 30,
    fields: [
      { key: 'marketeur', header: 'Marketeur', type: 'text', filterable: true },
      { key: 'volume', header: 'Volume (kg)', type: 'number' },
      {
        key: 'status',
        header: 'Statut',
        type: 'status',
        options: STATUS,
        filterable: true,
        groupable: true,
      },
      { key: 'submittedAt', header: 'Soumis le', type: 'date' },
    ],
  },
  'ADMIN:alert-rules': {
    title: 'Règles d’alerte',
    description: 'Paramétrage des seuils et conditions.',
    mockCount: 18,
    fields: [
      { key: 'name', header: 'Règle', type: 'text', filterable: true },
      {
        key: 'severity',
        header: 'Sévérité',
        type: 'status',
        options: RISK,
        filterable: true,
        groupable: true,
      },
      { key: 'updatedAt', header: 'Modifié le', type: 'date' },
    ],
  },

  // ---------- SUPERVISOR ----------
  'SUPERVISOR:infra': {
    title: 'Dashboards infra (Grafana)',
    description: '8 dashboards dédiés — Prometheus, CPU, mémoire, réseau.',
    mockCount: 22,
    fields: [
      { key: 'dashboard', header: 'Dashboard', type: 'text', filterable: true },
      {
        key: 'health',
        header: 'Santé',
        type: 'status',
        options: [
          { label: 'OK', value: 'ok' },
          { label: 'Dégradé', value: 'degraded' },
          { label: 'Critique', value: 'critical' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'cpu', header: 'CPU %', type: 'number' },
      { key: 'checkedAt', header: 'Vérifié le', type: 'date' },
    ],
  },
  'SUPERVISOR:risk': {
    title: 'Scores de risque',
    description: 'Scoring par marketeur, transporteur et livreur.',
    mockCount: 26,
    fields: [
      { key: 'entity', header: 'Entité', type: 'text', filterable: true },
      {
        key: 'kind',
        header: 'Type',
        type: 'badge',
        options: [
          { label: 'Marketeur', value: 'marketeur' },
          { label: 'Transporteur', value: 'transporteur' },
          { label: 'Livreur', value: 'livreur' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'score', header: 'Score', type: 'number' },
      {
        key: 'level',
        header: 'Niveau',
        type: 'status',
        options: RISK,
        filterable: true,
      },
    ],
  },
  'SUPERVISOR:logs': {
    title: 'Logs centralisés',
    description: 'Traçabilité technique et corrélation de requêtes.',
    mockCount: 45,
    fields: [
      { key: 'service', header: 'Service', type: 'text', filterable: true },
      {
        key: 'level',
        header: 'Niveau',
        type: 'status',
        options: [
          { label: 'Info', value: 'info' },
          { label: 'Warn', value: 'warn' },
          { label: 'Error', value: 'error' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'message', header: 'Message', type: 'text' },
      { key: 'at', header: 'Horodatage', type: 'date' },
    ],
  },
  'SUPERVISOR:alerts': {
    title: 'Alertes infrastructure',
    description: 'Alertes techniques routées vers le SUPERVISOR.',
    mockCount: 30,
    fields: [
      { key: 'title', header: 'Alerte', type: 'text', filterable: true },
      {
        key: 'severity',
        header: 'Sévérité',
        type: 'status',
        options: RISK,
        filterable: true,
        groupable: true,
      },
      { key: 'raisedAt', header: 'Déclenchée le', type: 'date' },
    ],
  },

  // ---------- INTEGRATEUR ----------
  'INTEGRATEUR:pda': {
    title: 'PDA + GPS + RFID',
    description: 'Parc de terminaux PDA et modules IoT.',
    mockCount: 32,
    fields: [
      { key: 'serial', header: 'N° série', type: 'text', filterable: true },
      {
        key: 'model',
        header: 'Modèle',
        type: 'badge',
        options: [
          { label: 'PDA-UHF', value: 'pda-uhf' },
          { label: 'GPS-T', value: 'gps-t' },
          { label: 'RFID-R', value: 'rfid-r' },
        ],
        filterable: true,
        groupable: true,
      },
      {
        key: 'sync',
        header: 'Synchro',
        type: 'status',
        options: SYNC,
        filterable: true,
      },
      { key: 'activatedAt', header: 'Activé le', type: 'date' },
    ],
  },
  'INTEGRATEUR:fleet-iot': {
    title: 'Parc équipements',
    description: 'Maintenance matériel PDA, GPS, RFID.',
    mockCount: 30,
    fields: [
      { key: 'asset', header: 'Équipement', type: 'text', filterable: true },
      {
        key: 'state',
        header: 'État',
        type: 'status',
        options: [
          { label: 'Opérationnel', value: 'ok' },
          { label: 'Batterie faible', value: 'lowbattery' },
          { label: 'Défaillance', value: 'failure' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'lastSeen', header: 'Vu le', type: 'date' },
    ],
  },
  'INTEGRATEUR:auth': {
    title: 'Authentification',
    description: 'Activation et authentification des appareils.',
    mockCount: 20,
    fields: [
      { key: 'device', header: 'Appareil', type: 'text', filterable: true },
      {
        key: 'status',
        header: 'Statut',
        type: 'status',
        options: STATUS,
        filterable: true,
      },
      { key: 'enrolledAt', header: 'Enrôlé le', type: 'date' },
    ],
  },

  // ---------- AGENT ----------
  'AGENT:marketeurs': {
    title: 'Marketeurs',
    description: 'Vue consolidée des marketeurs assignés.',
    mockCount: 24,
    fields: MARKETEUR_FIELDS,
  },
  'AGENT:declarations': {
    title: 'Déclarations en attente',
    description: 'Déclarations à valider pour vos marketeurs.',
    mockCount: 28,
    fields: [
      { key: 'marketeur', header: 'Marketeur', type: 'text', filterable: true },
      { key: 'volume', header: 'Volume (kg)', type: 'number' },
      {
        key: 'status',
        header: 'Statut',
        type: 'status',
        options: STATUS,
        filterable: true,
        groupable: true,
      },
      { key: 'submittedAt', header: 'Soumis le', type: 'date' },
    ],
  },
  'AGENT:visits': {
    title: 'Rapports de visite',
    description: 'Comptes-rendus de visite terrain.',
    mockCount: 22,
    fields: [
      { key: 'marketeur', header: 'Marketeur', type: 'text', filterable: true },
      { key: 'agent', header: 'Agent', type: 'text' },
      { key: 'visitAt', header: 'Visite le', type: 'date' },
    ],
  },
  'AGENT:passwords': {
    title: 'Réinitialisation mots de passe',
    description: 'Reset des mots de passe marketeurs et chauffeurs.',
    mockCount: 18,
    fields: [
      { key: 'user', header: 'Utilisateur', type: 'text', filterable: true },
      { key: 'role', header: 'Rôle', type: 'badge', options: [{ label: 'Livreur', value: 'LIVREUR' }, { label: 'Marketeur', value: 'MARKETEUR' }], filterable: true, groupable: true },
      { key: 'resetAt', header: 'Réinitialisé le', type: 'date' },
    ],
  },
  'AGENT:anomalies': {
    title: 'Anomalies à investiguer',
    description: 'Alertes métier routées vers les AGENT.',
    mockCount: 26,
    fields: [
      { key: 'subject', header: 'Sujet', type: 'text', filterable: true },
      {
        key: 'severity',
        header: 'Sévérité',
        type: 'status',
        options: RISK,
        filterable: true,
        groupable: true,
      },
      { key: 'raisedAt', header: 'Déclenchée le', type: 'date' },
    ],
  },
  'AGENT:site-verification': {
    title: 'Vérification des Sites',
    description: 'Validation terrain des sites de distribution.',
    mockCount: 22,
    fields: [
      { key: 'site', header: 'Site', type: 'text', filterable: true },
      { key: 'address', header: 'Adresse', type: 'text' },
      {
        key: 'status',
        header: 'Statut',
        type: 'status',
        options: [
          { label: 'Vérifié', value: 'verified' },
          { label: 'En attente', value: 'pending' },
          { label: 'Rejeté', value: 'rejected' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'verifiedBy', header: 'Vérifié par', type: 'text' },
      { key: 'verifiedAt', header: 'Vérifié le', type: 'date' },
    ],
  },

  // ---------- MARKETEUR ----------
  'MARKETEUR:trucks': {
    title: 'Camions & chauffeurs',
    description: 'État de la flotte et affectation des chauffeurs.',
    mockCount: 30,
    fields: [
      { key: 'plate', header: 'Immatriculation', type: 'text', filterable: true },
      { key: 'driver', header: 'Chauffeur', type: 'text' },
      { key: 'capacity', header: 'Capacité (kg)', type: 'number' },
      {
        key: 'status',
        header: 'Statut',
        type: 'status',
        options: [
          { label: 'Disponible', value: 'available' },
          { label: 'En tournée', value: 'on_tour' },
          { label: 'Maintenance', value: 'maintenance' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'updatedAt', header: 'Modifié le', type: 'date' },
    ],
  },
  'MARKETEUR:quotas': {
    title: 'Quotas & volumes',
    description: 'Quotas alloués et volumes commercialisés.',
    mockCount: 20,
    fields: [
      { key: 'period', header: 'Période', type: 'text', filterable: true },
      { key: 'allocated', header: 'Alloué (kg)', type: 'number' },
      { key: 'sold', header: 'Vendu (kg)', type: 'number' },
      { key: 'remaining', header: 'Reste (kg)', type: 'number' },
    ],
  },
  'MARKETEUR:supply': {
    title: 'Requêtes d’enlèvement',
    description: 'Flux d’approvisionnement en vrac (Gaz Vrac).',
    mockCount: 28,
    fields: [
      { key: 'ref', header: 'Référence', type: 'text', filterable: true },
      { key: 'source', header: 'Source', type: 'text', filterable: true },
      { key: 'qty', header: 'Quantité (kg)', type: 'number' },
      {
        key: 'status',
        header: 'Statut',
        type: 'status',
        options: [
          { label: 'Demandée', value: 'requested' },
          { label: 'Chargée', value: 'loaded' },
          { label: 'Livrée', value: 'delivered' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'requestedAt', header: 'Demandée le', type: 'date' },
    ],
  },
  'MARKETEUR:delivery-tours': {
    title: 'Tournées de livraison',
    description: 'Tournées de bouteilles 50 kg et vrac vers clients.',
    mockCount: 32,
    fields: [
      { key: 'ref', header: 'Tournée', type: 'text', filterable: true },
      { key: 'driver', header: 'Livreur', type: 'text' },
      { key: 'checkpoints', header: 'Checkpoints', type: 'number' },
      {
        key: 'status',
        header: 'Statut',
        type: 'status',
        options: [
          { label: 'Planifiée', value: 'planned' },
          { label: 'En cours', value: 'running' },
          { label: 'Clôturée', value: 'closed' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'date', header: 'Date', type: 'date' },
    ],
  },
  'MARKETEUR:clients': {
    title: 'Clients & livraisons',
    description: 'Historique des livraisons par client.',
    mockCount: 35,
    fields: [
      { key: 'name', header: 'Client', type: 'text', filterable: true },
      { key: 'city', header: 'Ville', type: 'text', filterable: true },
      { key: 'orders', header: 'Commandes', type: 'number' },
      { key: 'lastOrder', header: 'Dernière commande', type: 'date' },
    ],
  },
  'MARKETEUR:performance': {
    title: 'Performance chauffeurs',
    description: 'Indicateurs de performance des chauffeurs/livreurs.',
    mockCount: 24,
    fields: [
      { key: 'driver', header: 'Chauffeur', type: 'text', filterable: true },
      { key: 'tours', header: 'Tournées', type: 'number' },
      { key: 'onTime', header: 'À l’heure %', type: 'number' },
      { key: 'rating', header: 'Note', type: 'number' },
    ],
  },
  'MARKETEUR:reports': {
    title: 'Rapports',
    description: 'Rapports opérationnels et financiers.',
    mockCount: 20,
    fields: [
      { key: 'title', header: 'Rapport', type: 'text', filterable: true },
      {
        key: 'category',
        header: 'Catégorie',
        type: 'badge',
        options: [
          { label: 'Opérationnel', value: 'ops' },
          { label: 'Financier', value: 'finance' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'generatedAt', header: 'Généré le', type: 'date' },
    ],
  },

  // ---------- LIVREUR ----------
  'LIVREUR:missions': {
    title: 'Missions du jour',
    description: 'Liste des missions de tournée journalière.',
    mockCount: 22,
    fields: [
      { key: 'ref', header: 'Mission', type: 'text', filterable: true },
      { key: 'client', header: 'Client', type: 'text', filterable: true },
      { key: 'bottles', header: 'Bouteilles', type: 'number' },
      {
        key: 'status',
        header: 'Statut',
        type: 'status',
        options: [
          { label: 'À faire', value: 'todo' },
          { label: 'En cours', value: 'running' },
          { label: 'Terminée', value: 'done' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'dueAt', header: 'Échéance', type: 'date' },
    ],
  },
  'LIVREUR:scan': {
    title: 'Scans RFID (IN/OUT)',
    description: 'Bouteilles pleines déposées (OUT) et vides récupérées (IN).',
    mockCount: 40,
    fields: [
      { key: 'tag', header: 'Tag RFID', type: 'text', filterable: true },
      {
        key: 'direction',
        header: 'Sens',
        type: 'badge',
        options: [
          { label: 'OUT (plein)', value: 'out' },
          { label: 'IN (vide)', value: 'in' },
        ],
        filterable: true,
        groupable: true,
      },
      { key: 'mission', header: 'Mission', type: 'text' },
      {
        key: 'sync',
        header: 'Synchro',
        type: 'status',
        options: SYNC,
        filterable: true,
      },
      { key: 'scannedAt', header: 'Scanné le', type: 'date' },
    ],
  },
  'LIVREUR:upload': {
    title: 'Téléversement',
    description: 'Section de téléversement manuel (quand en ligne).',
    mockCount: 18,
    fields: [
      { key: 'doc', header: 'Document', type: 'text', filterable: true },
      {
        key: 'type',
        header: 'Type',
        type: 'badge',
        options: [
          { label: 'Bon de livraison', value: 'bl' },
          { label: 'Bon d’enlèvement', value: 'be' },
          { label: 'Photo', value: 'photo' },
        ],
        filterable: true,
        groupable: true,
      },
      {
        key: 'status',
        header: 'Statut',
        type: 'status',
        options: SYNC,
        filterable: true,
      },
      { key: 'capturedAt', header: 'Capturé le', type: 'date' },
    ],
  },
  'LIVREUR:sync': {
    title: 'Rapport de synchronisation',
    description: 'Historique et statut des uploads PDA.',
    mockCount: 20,
    fields: [
      { key: 'session', header: 'Session', type: 'text', filterable: true },
      { key: 'items', header: 'Éléments', type: 'number' },
      {
        key: 'status',
        header: 'Statut',
        type: 'status',
        options: SYNC,
        filterable: true,
        groupable: true,
      },
      { key: 'syncedAt', header: 'Synchronisé le', type: 'date' },
    ],
  },
}
