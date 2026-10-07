import { OrganizationFormPage } from '@/features/organizations/components/organization-form-page'

/**
 * Client form page: thin wrapper around the unified OrganizationFormPage
 * with type fixed to 'CLIENT' (zero code duplication per AGENTS.md).
 */
export function ClientFormPage() {
  return (
    <OrganizationFormPage
      fixedType='CLIENT'
      backTo='/clients'
      title='Nouveau client distributeur'
      subtitle='Déclaration des données légales de l’entreprise et intégration de ses points de livraison.'
    />
  )
}
