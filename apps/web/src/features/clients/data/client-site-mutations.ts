import { api } from '@lpg/api-client'
import type { ClientSite } from '@lpg/types'
import { useAuthStore } from '@/store/auth-store'
import { assertActorPermission, PERMISSION_DENIED } from '@/lib/security/guards'
import {
  clientSiteFormSchema,
  type ClientSiteFormValues,
} from '../lib/client-site-schema'

export async function saveClientSite(
  clientOrgId: string,
  values: ClientSiteFormValues,
  id?: string
): Promise<ClientSite> {
  const user = useAuthStore.getState().user
  if (!user) throw new Error(PERMISSION_DENIED)
  assertActorPermission(user, 'clients.write')
  const parsed = clientSiteFormSchema.parse(values)
  if (id) {
    const existing = (await api.clientSites.getById(id)) as ClientSite
    if (
      existing.client_org_id !== clientOrgId ||
      existing.deleted_at ||
      (user.org_type !== 'REGULATEUR' &&
        existing.current_marketeur_org_id !== user.org_id)
    )
      throw new Error(PERMISSION_DENIED)
  }
  const payload = {
    name: parsed.name.trim(),
    region: parsed.region,
    address: parsed.address?.trim() || null,
    geo_point: [parsed.longitude, parsed.latitude],
    client_org_id: clientOrgId,
    is_active: parsed.is_active,
    site_contact_name: parsed.site_contact_name || null,
    site_contact_phone: parsed.site_contact_phone || null,
  }
  const saved = (await (id
    ? api.clientSites.patch(id, payload)
    : api.clientSites.create(payload))) as ClientSite
  if (!saved?.id) throw new Error('Réponse serveur invalide')
  return saved
}
