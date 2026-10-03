import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { curated } from '@lpg/mock-data'
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
import { toast } from 'sonner'
import { SubmitButton } from '@/components/entity-crud/form-ui'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'
import { useUsersStore } from '@/store/users-store'
import type { LivreurView } from '../data/livreurs'

const schema = z.object({
  first_name: z.string().trim().min(1, 'Le prénom est obligatoire.'),
  last_name: z.string().trim().min(1, 'Le nom est obligatoire.'),
  email: z.string().trim().email('Adresse e-mail invalide.'),
  org_id: z.string().min(1, 'Une organisation est obligatoire.'),
  is_active: z.boolean(),
})

type Values = z.infer<typeof schema>

type LivreurEditSheetProps = {
  livreur: LivreurView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LivreurEditSheet({ livreur, open, onOpenChange }: LivreurEditSheetProps) {
  const scope = useScope()
  const isRegulateur = scope.view === 'org'
  const isCreate = livreur === null
  const defaultValues = useMemo<Values>(() => ({
    first_name: livreur?.fullName.split(' ')[0] ?? '',
    last_name: livreur?.fullName.split(' ').slice(1).join(' ') ?? '',
    email: livreur?.email ?? '',
    org_id: livreur?.orgId ?? scope.orgId ?? '',
    is_active: livreur?.status !== 'INACTIVE',
  }), [livreur, scope.orgId])
  const resetKey = useMemo(
    () => JSON.stringify({ livreur, orgId: scope.orgId }),
    [livreur, scope.orgId],
  )
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
    // resetKey changes only when the selected entity or its form inputs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, resetKey])

  function onSubmit(values: Values) {
    try {
      if (isCreate) {
        useUsersStore.getState().createUser({
          ...values,
          system_role: 'LIVREUR',
        } as never)
        toast.success(`Livreur ${values.email} créé`)
      } else {
        useUsersStore.getState().updateUser(livreur.id, {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          ...(isRegulateur ? { org_id: values.org_id } : {}),
          is_active: values.is_active,
        })
        toast.success(`Livreur ${values.email} mis à jour`)
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(extractErrorMessage(error))
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{isCreate ? 'Nouveau livreur' : 'Modifier le livreur'}</SheetTitle>
          <SheetDescription>
            {isCreate
              ? isRegulateur
                ? 'Créez un utilisateur avec le rôle Livreur.'
                : 'Créez un livreur dans votre organisation.'
              : livreur.email}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex min-h-0 flex-1 flex-col'>
            <div className='flex-1 space-y-4 overflow-y-auto px-4 pb-2'>
              <div className='grid grid-cols-2 gap-3'>
                <FormField control={form.control} name='first_name' render={({ field }) => (
                  <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name='last_name' render={({ field }) => (
                  <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name='email' render={({ field }) => (
                <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type='email' {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              {isRegulateur ? (
                <FormField control={form.control} name='org_id' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisation</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder='Choisir...' /></SelectTrigger></FormControl>
                      <SelectContent>
                        {curated.organizations.map((organization) => (
                          <SelectItem key={organization.id} value={organization.id}>{organization.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              ) : null}
              <FormField control={form.control} name='is_active' render={({ field }) => (
                <FormItem><div className='flex items-center justify-between rounded-md border p-3'><div><FormLabel>Compte actif</FormLabel><p className='text-xs text-muted-foreground'>Désactiver bloque la connexion sans supprimer.</p></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></div></FormItem>
              )} />
            </div>
            <SheetFooter className='gap-2 border-t pt-4'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Annuler</Button>
              <SubmitButton>{isCreate ? 'Créer' : 'Enregistrer'}</SubmitButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

function useScope() {
  const user = useAuthStore((state) => state.user)
  return useMemo(() => getScope(user), [user])
}
