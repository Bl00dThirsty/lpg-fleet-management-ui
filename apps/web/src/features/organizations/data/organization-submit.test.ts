import { describe, expect, it, vi } from 'vitest'
import { submitOrganizationForm } from './organization-submit'
import type { OrganizationFormValues } from './organization-form-schema'
import { api } from '@lpg/api-client'

describe('submitOrganizationForm', () => {
  it('creates a CLIENT with client-profile and client-sites', async () => {
    const orgSpy = vi.spyOn(api.organizations, 'create').mockResolvedValueOnce({
      id: 'org-test-client',
      name: 'Client Test',
      type: 'CLIENT',
    })
    const clientSpy = vi.spyOn(api.clients, 'create').mockResolvedValueOnce({
      id: 'client-1',
      org_id: 'org-test-client',
    })
    const clientSiteSpy = vi
      .spyOn(api.clientSites, 'create')
      .mockResolvedValueOnce({
        id: 'cs-1',
        client_org_id: 'org-test-client',
        name: 'Site Douala',
      })

    const values: OrganizationFormValues = {
      name: 'Client Test',
      type: 'CLIENT',
      registration_number: 'RC/2026',
      tax_id: 'NIU12345',
      industry_sector: 'CHR',
      billing_address: 'Akwa',
      payment_terms: 30,
      credit_limit: 1000000,
      is_active: true,
      primary_contact_name: 'Contact A',
      primary_contact_phone: '+237699000000',
      primary_contact_email: 'contact@client.cm',
      sites: [
        {
          name: 'Site Douala',
          region: 'LITTORAL',
          address: 'Akwa',
          latitude: 4.05,
          longitude: 9.7,
        },
      ],
      create_account: false,
    }

    const result = await submitOrganizationForm(values)

    expect(orgSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Client Test', type: 'CLIENT' }),
    )
    expect(clientSpy).toHaveBeenCalledWith(
      expect.objectContaining({ org_id: 'org-test-client' }),
    )
    expect(clientSiteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        client_org_id: 'org-test-client',
        name: 'Site Douala',
      }),
    )
    expect(result.org.id).toBe('org-test-client')
    expect(result.client?.id).toBe('client-1')
    expect(result.sites).toHaveLength(1)
  })

  it('creates a TRANSPORTEUR with operational sites and user account', async () => {
    const orgSpy = vi.spyOn(api.organizations, 'create').mockResolvedValueOnce({
      id: 'org-test-transporter',
      name: 'Trans Log',
      type: 'TRANSPORTEUR',
    })
    const siteSpy = vi.spyOn(api.sites, 'create').mockResolvedValueOnce({
      id: 'site-trans-1',
      org_id: 'org-test-transporter',
      name: 'Base Logistique',
    })
    const userSpy = vi.spyOn(api, 'usersCreateWithAuth').mockResolvedValueOnce({
      id: 'user-trans-1',
      email: 'admin@translog.cm',
      first_name: 'Jean',
      last_name: 'Mukam',
      system_role: 'TRANSPORTEUR',
      password: 'TempPassword123!',
    })

    const values: OrganizationFormValues = {
      name: 'Trans Log',
      type: 'TRANSPORTEUR',
      registration_number: 'RC/2026/TR',
      tax_id: 'NIU99999',
      industry_sector: 'Transport & Logistique',
      billing_address: 'Bonabéri',
      payment_terms: 45,
      credit_limit: 0,
      is_active: true,
      primary_contact_name: 'Jean Mukam',
      primary_contact_phone: '+237677112233',
      primary_contact_email: 'admin@translog.cm',
      sites: [
        {
          name: 'Base Logistique',
          region: 'LITTORAL',
          address: 'Zone Industrielle',
          latitude: 4.07,
          longitude: 9.68,
        },
      ],
      create_account: true,
      account_first_name: 'Jean',
      account_last_name: 'Mukam',
      account_email: 'admin@translog.cm',
      account_system_role: 'TRANSPORTEUR',
    }

    const result = await submitOrganizationForm(values)

    expect(orgSpy).toHaveBeenCalled()
    expect(siteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-test-transporter',
        name: 'Base Logistique',
        functions: ['ENTREPOT'],
      }),
    )
    expect(userSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-test-transporter',
        email: 'admin@translog.cm',
        system_role: 'TRANSPORTEUR',
      }),
    )
    expect(result.createdUser?.password).toBe('TempPassword123!')
  })
})
