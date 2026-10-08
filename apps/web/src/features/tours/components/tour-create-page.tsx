import { TourCreateForm } from './tour-create-form'
import { Link, useNavigate } from '@tanstack/react-router'
import { hasEffectivePermission } from '@lpg/permissions'
import { useAuthStore } from '@/store/auth-store'
import { PageShell } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
export function TourCreatePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const back = () => {
    void navigate({ to: '/tour-tracking' })
  }
  return (
    <PageShell>
      <nav aria-label='Fil d’Ariane' className='text-sm text-muted-foreground'>
        <Link to='/tour-tracking' className='hover:underline'>
          Tournées
        </Link>
        <span aria-hidden='true'> / </span>
        <span aria-current='page'>Création</span>
      </nav>
      <PageHeader
        title='Nouvelle tournée'
        description='Renseignez les étapes, les quantités et les intervenants avant de confirmer.'
      />
      {user &&
      hasEffectivePermission(
        user.system_role,
        'tours.create',
        user.custom_roles
      ) ? (
        <TourCreateForm
          open
          onOpenChange={(open) => {
            if (!open) back()
          }}
          onSuccess={back}
        />
      ) : (
        <p role='alert'>Vous n’avez pas le droit de créer cette mission.</p>
      )}
    </PageShell>
  )
}
