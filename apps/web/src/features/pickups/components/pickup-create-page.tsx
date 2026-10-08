import { PickupsCreateWizard } from './pickups-create-wizard'
import { Link, useNavigate } from '@tanstack/react-router'
import { hasEffectivePermission } from '@lpg/permissions'
import { useAuthStore } from '@/store/auth-store'
import { PageShell } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
export function PickupCreatePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const back = () => {
    void navigate({ to: '/pickups' })
  }
  return (
    <PageShell>
      <nav aria-label='Fil d’Ariane' className='text-sm text-muted-foreground'>
        <Link to='/pickups' className='hover:underline'>
          Enlèvements
        </Link>
        <span aria-hidden='true'> / </span>
        <span aria-current='page'>Création</span>
      </nav>
      <PageHeader
        title='Nouvel enlèvement'
        description='Renseignez les étapes, les quantités et les intervenants avant de confirmer.'
      />
      {user &&
      hasEffectivePermission(
        user.system_role,
        'pickups.create',
        user.custom_roles
      ) ? (
        <PickupsCreateWizard
          open
          fullPage
          onOpenChange={(open) => {
            if (!open) back()
          }}
          onCreated={back}
        />
      ) : (
        <p role='alert'>Vous n’avez pas le droit de créer cette mission.</p>
      )}
    </PageShell>
  )
}
