import type { QueryClient } from '@tanstack/react-query'

export const QUERY_KEYS: Record<string, string[]> = {
  vehicles: ['vehicles'],
  trucks: ['trucks'],
  tours: ['tours'],
  pickups: ['pickups'],
  declarations: ['declarations'],
  reconciliations: ['reconciliations'],
  sites: ['sites'],
  clientSites: ['client-sites'],
  users: ['users'],
  anomalies: ['anomalies'],
  risks: ['risks'],
  reports: ['reports'],
  devices: ['devices'],
  drivers: ['drivers'],
  settings: ['settings'],
}

export function invalidateResource(qc: QueryClient, resource: keyof typeof QUERY_KEYS | string): void {
  const key = QUERY_KEYS[resource] ?? [resource]
  void qc.invalidateQueries({ queryKey: key })
}
