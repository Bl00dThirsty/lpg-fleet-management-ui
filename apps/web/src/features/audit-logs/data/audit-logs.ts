import { audit_logs, curated } from '@lpg/mock-data'
import type { AuditAction, AuditLog } from '@lpg/types'

export type { AuditAction }

export interface AuditLogView {
  id: string
  action: AuditAction
  actionLabel: string
  actor: string
  resourceTable: string
  resourceId: string
  ipAddress: string
  riskScore: number
  createdAt: string
}

export const auditActionLabels: Record<AuditAction, string> = {
  LOGINSUCCESS: 'Connexion réussie',
  LOGINFAILURE: 'Échec de connexion',
  LOGOUT: 'Déconnexion',
  TOKENREFRESH: 'Rafraîchissement de jeton',
  PASSWORDRESET: 'Réinitialisation de mot de passe',
  MFAENABLED: 'MFA activé',
  MFADISABLED: 'MFA désactivé',
  MFACHALLENGEFAILED: 'Défi MFA échoué',
  MFACHALLENGESUCCESS: 'Défi MFA réussi',
  PERMISSIONDENIED: 'Permission refusée',
  DATAEXPORT: 'Export de données',
  BULKDELETE: 'Suppression en masse',
  DECLARATIONSUBMITTED: 'Déclaration soumise',
  RECONCILIATIONVERIFIED: 'Réconciliation vérifiée',
  TOURNEECREATED: 'Tournée créée',
  TOURNEEASSIGNED: 'Tournée assignée',
  TOURNEESENTTOTRANSPORTER: 'Tournée envoyée au transporteur',
  TOURNEEACKNOWLEDGED: 'Tournée accusée',
  TOURNESTARTED: 'Tournée démarrée',
  TOURNEECLOSED: 'Tournée clôturée',
  VEHICLECERTIFICATEEXPIRED: 'Certificat véhicule expiré',
  SITESUSPENDED: 'Site suspendu',
  CLIENTCREATED: 'Client créé',
  SCANEVENTRECEIVED: 'Événement de scan reçu',
  PDASYNCBULKUPLOAD: 'Chargement PDA en masse',
  ANOMALYRESOLVED: 'Anomalie résolue',
  DEVICEREMOVED: 'Dispositif retiré',
  GPSPOSITIONCAPTURED: 'Position GPS capturée',
  SETTINGCHANGED: 'Paramètre modifié',
}

const USER_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  curated.users.map((u) => [u.id, `${u.first_name} ${u.last_name}`.trim()]),
)

export function getAuditLogs(): AuditLogView[] {
  return (audit_logs as AuditLog[])
    .map((log) => ({
      id: log.id,
      action: log.action,
      actionLabel: auditActionLabels[log.action] ?? log.action,
      actor: log.user_id ? (USER_NAME_BY_ID[log.user_id] ?? log.user_id) : 'Système',
      resourceTable: log.resource_table ?? '',
      resourceId: log.resource_id ?? '',
      ipAddress: log.ip_address ?? '',
      riskScore: log.risk_score ?? 0,
      createdAt: log.created_at ?? '',
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getAuditSummary() {
  const rows = getAuditLogs()
  return {
    total: rows.length,
    denied: rows.filter((r) => r.action === 'PERMISSIONDENIED').length,
    highRisk: rows.filter((r) => r.riskScore >= 60).length,
  }
}