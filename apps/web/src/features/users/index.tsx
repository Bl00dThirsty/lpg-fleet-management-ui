import { useCallback, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UsersTable } from './components/users-table'
import { UserDetailsSheet } from './components/user-details-sheet'
import { UserEditSheet } from './components/user-edit-sheet'
import { useUsersStore } from '@/store/users-store'
import { userToView, type UserView } from './data/users'
import { hasPermission } from '@lpg/permissions'
import { useRoleStore } from '@/store/role-store'

const route = getRouteApi('/_authenticated/users/')

export function UsersPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const activeRole = useRoleStore((s) => s.activeRole)

  const [detailsUser, setDetailsUser] = useState<UserView | null>(null)
  const [editingUser, setEditingUser] = useState<UserView | null | 'new'>(null)

  const users = useUsersStore((s) => s.users)
  const view = useMemo(() => users.map(userToView), [users])
  const canCreate = hasPermission(activeRole, 'users.create')

  const handleViewDetails = useCallback((user: UserView) => {
    setDetailsUser(user)
  }, [])

  const handleEdit = useCallback((user: UserView) => {
    setEditingUser(user)
  }, [])

  const sheetOpen =
    editingUser !== null && editingUser !== undefined
  const editing = editingUser === 'new' ? null : editingUser

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <Users className='h-6 w-6 text-primary' />
          <h1 className='text-2xl font-bold tracking-tight'>Utilisateurs</h1>
          <Badge variant='outline' className='ml-auto'>
            {view.length}
          </Badge>
          {canCreate && (
            <Button onClick={() => setEditingUser('new')}>
              <Plus className='mr-1 h-4 w-4' /> Nouvel utilisateur
            </Button>
          )}
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <UsersTable
          data={view}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
        />
      </section>

      <UserDetailsSheet
        user={detailsUser}
        open={detailsUser !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsUser(null)
        }}
      />

      <UserEditSheet
        user={editing}
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null)
        }}
      />
    </main>
  )
}
