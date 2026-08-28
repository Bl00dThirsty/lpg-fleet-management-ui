import { useMemo } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
} from '@lpg/ui'
import { curated } from '@lpg/mock-data'
import { ROLE_LABELS, getCreatableRoles, type Role } from '@lpg/permissions'
import { useRoleStore } from '@/store/role-store'
import { useUsersStore, type UserPatch } from '@/store/users-store'
import { SubmitButton } from '@/components/entity-crud/form-ui'
import type { UserView } from '../data/users'

type UserEditSheetProps = {
  user: UserView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function userFormSchema(creatableRoles: Role[]) {
  return z.object({
    first_name: z.string().trim().min(1, 'Le prénom est obligatoire.'),
    last_name: z.string().trim().min(1, 'Le nom est obligatoire.'),
    email: z.string().trim().email('Adresse e-mail invalide.'),
    system_role: z.enum(creatableRoles as [Role, ...Role[]]),
    org_id: z.string().min(1, 'Une organisation est obligatoire.'),
    is_active: z.boolean(),
  })
}

type UserFormValues = z.infer<ReturnType<typeof userFormSchema>>

function userToForm(u: UserView): UserFormValues {
  const parts = u.fullName.split(' ')
  return {
    first_name: parts[0] ?? '',
    last_name: parts.slice(1).join(' ') ?? '',
    email: u.email,
    system_role: u.role,
    org_id: u.orgId,
    is_active: u.status === 'ACTIVE',
  }
}

const EMPTY_FORM: UserFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  system_role: 'LIVREUR',
  org_id: '',
  is_active: true,
}

export function UserEditSheet({
  user,
  open,
  onOpenChange,
}: UserEditSheetProps) {
  const isCreate = user === null
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <UserEditForm
        key={isCreate ? 'new' : user!.id}
        user={user}
        onClose={() => onOpenChange(false)}
      />
    </Sheet>
  )
}

function UserEditForm({
  user,
  onClose,
}: {
  user: UserView | null
  onClose: () => void
}) {
  const activeRole = useRoleStore((s) => s.activeRole)
  const roleOptions = useMemo(() => {
    const roles = getCreatableRoles(activeRole)
    if (user && !roles.includes(user.role)) return [...roles, user.role]
    return roles
  }, [activeRole, user])
  const orgOptions = curated.organizations as Array<{ id: string; name: string }>
  const isCreate = user === null

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema(roleOptions)),
    defaultValues: user ? userToForm(user) : EMPTY_FORM,
  })

  function onSubmit(values: UserFormValues) {
    const patch: UserPatch = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      system_role: values.system_role,
      org_id: values.org_id,
      is_active: values.is_active,
    }
    if (isCreate) {
      useUsersStore.getState().createUser(patch as never)
      toast.success(`Utilisateur ${values.email} créé`)
    } else {
      useUsersStore.getState().updateUser(user!.id, patch)
      toast.success(`Utilisateur ${values.email} mis à jour`)
    }
    onClose()
  }

  return (
    <SheetContent className='flex w-full flex-col sm:max-w-xl'>
      <SheetHeader className='pb-2'>
        <SheetTitle>
          {isCreate ? 'Nouvel utilisateur' : 'Modifier l’utilisateur'}
        </SheetTitle>
        <SheetDescription>
          {isCreate
            ? 'Créez un utilisateur avec un rôle subordonné.'
            : `${user!.email} — ${ROLE_LABELS[user!.role]}`}
        </SheetDescription>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex min-h-0 flex-1 flex-col'
        >
          <div className='flex-1 space-y-4 overflow-y-auto px-4 pb-2'>
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='first_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder='Ex: Jean' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='last_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder='Ex: Dupont' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type='email' placeholder='exemple@domaine.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='system_role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v as Role)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='org_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisation</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder='Choisir...' />
                        </SelectTrigger>
                        <SelectContent>
                          {orgOptions.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='is_active'
              render={({ field }) => (
                <FormItem>
                  <div className='flex items-center justify-between rounded-md border p-3'>
                    <div>
                      <FormLabel className='cursor-pointer'>
                        Compte actif
                      </FormLabel>
                      <p className='text-xs text-muted-foreground'>
                        Désactiver bloque la connexion sans supprimer l’utilisateur.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <SheetFooter className='gap-2 border-t pt-4'>
            <Button type='button' variant='outline' onClick={onClose}>
              Annuler
            </Button>
            <SubmitButton>{isCreate ? 'Créer' : 'Enregistrer'}</SubmitButton>
          </SheetFooter>
        </form>
      </Form>
    </SheetContent>
  )
}
