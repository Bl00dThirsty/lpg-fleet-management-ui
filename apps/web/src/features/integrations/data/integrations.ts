import { integration_auth } from '@lpg/mock-data'

export interface IntegrationView {
  id: string
  serviceName: string
  isActive: boolean
  certificateExpiry: string | null
  lastAuthAt: string | null
  successCount: number
  failureCount: number
  allowedIps: string[]
}

export function getIntegrations(): IntegrationView[] {
  return integration_auth.map((auth) => {
    const record = auth as {
      id?: string
      user_id?: string | null
      is_active?: boolean
      certificate_expiry?: string | null
      last_auth_at?: string | null
      auth_success_count?: number
      auth_failure_count?: number
      allowed_ip_ranges?: string[]
    }
    return {
      id: record.id ?? 'ia',
      serviceName: 'Client API',
      isActive: record.is_active ?? false,
      certificateExpiry: record.certificate_expiry ?? null,
      lastAuthAt: record.last_auth_at ?? null,
      successCount: record.auth_success_count ?? 0,
      failureCount: record.auth_failure_count ?? 0,
      allowedIps: record.allowed_ip_ranges ?? [],
    }
  })
}

export function getIntegrationSummary() {
  const integrations = getIntegrations()
  return {
    total: integrations.length,
    active: integrations.filter((i) => i.isActive).length,
    totalSuccess: integrations.reduce((acc, i) => acc + i.successCount, 0),
    totalFailures: integrations.reduce((acc, i) => acc + i.failureCount, 0),
  }
}