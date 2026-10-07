import { api } from '@lpg/api-client'
import type { Client, ClientSite, Organization, Site } from '@lpg/types'
import {
  defaultRoleForOrgType,
  type OrganizationFormValues,
} from './organization-form-schema'

export interface CreatedUserAccount {
  id: string
  email: string
  first_name: string
  last_name: string
  system_role: string
  password?: string
}

export interface OrganizationSubmitResult {
  org: Organization
  client?: Client
  sites: (Site | ClientSite)[]
  createdUser?: CreatedUserAccount
}

export async function submitOrganizationForm(
  values: OrganizationFormValues,
): Promise<OrganizationSubmitResult> {
  // 1. Création de l'organisation
  const org: Organization = await api.organizations.create({
    name: values.name,
    type: values.type,
    registration_number: values.registration_number,
    tax_id: values.tax_id,
    industry_sector: values.industry_sector,
    billing_address: values.billing_address,
    payment_terms: values.payment_terms,
    credit_limit: values.credit_limit,
    primary_contact_name: values.primary_contact_name,
    primary_contact_phone: values.primary_contact_phone,
    primary_contact_email: values.primary_contact_email,
    is_active: values.is_active,
  })

  const orgId = org?.id ?? `org-${Date.now()}`
  let client: Client | undefined = undefined
  const createdSites: (Site | ClientSite)[] = []

  // 2. Création des entités dépendantes du type
  if (values.type === 'CLIENT') {
    client = await api.clients.create({
      org_id: orgId,
      primary_contact_name: values.primary_contact_name,
      primary_contact_phone: values.primary_contact_phone,
      primary_contact_email: values.primary_contact_email,
      billing_address: values.billing_address,
      payment_terms: values.payment_terms,
      credit_limit: values.credit_limit,
      tax_id: values.tax_id,
      industry_sector: values.industry_sector,
      is_active: values.is_active,
    })

    for (const site of values.sites) {
      const siteRes: ClientSite = await api.clientSites.create({
        client_org_id: orgId,
        name: site.name,
        region: site.region,
        address: site.address,
        geo_point: [site.longitude, site.latitude],
        site_contact_name: site.site_contact_name || values.primary_contact_name,
        site_contact_phone: site.site_contact_phone || values.primary_contact_phone,
        capacity_info: site.capacity_info,
        is_active: true,
        is_verified: false,
      })
      createdSites.push(siteRes)
    }
  } else {
    for (const site of values.sites) {
      const siteRes: Site = await api.sites.create({
        org_id: orgId,
        name: site.name,
        region: site.region,
        address: site.address,
        geo_point: [site.longitude, site.latitude],
        functions: ['ENTREPOT'],
        site_contact_name: site.site_contact_name || values.primary_contact_name,
        site_contact_phone: site.site_contact_phone || values.primary_contact_phone,
        capacity_info: site.capacity_info,
        is_active: true,
        is_verified: false,
      })
      createdSites.push(siteRes)
    }
  }

  // 3. Provisionnement optionnel du compte utilisateur
  let createdUser: CreatedUserAccount | undefined = undefined
  if (values.create_account && values.account_email) {
    const role =
      values.account_system_role || defaultRoleForOrgType(values.type)
    createdUser = await api.usersCreateWithAuth({
      org_id: orgId,
      email: values.account_email.trim().toLowerCase(),
      first_name: (values.account_first_name ?? '').trim(),
      last_name: (values.account_last_name ?? '').trim(),
      system_role: role,
      phone: values.primary_contact_phone,
    })
  }

  return {
    org,
    client,
    sites: createdSites,
    createdUser,
  }
}
