import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@lpg/ui'
import {
  notificationGroupFormSchema,
  type NotificationGroupFormValues,
} from './notification-group-schema'
import { ROLES, ROLE_LABELS } from '@/config/rbac/roles'
import type { NotificationGroup } from './notification-groups-store'

type NotificationGroupFormProps = {
  defaultValues?: NotificationGroupFormValues
  onSubmit: (values: NotificationGroupFormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function NotificationGroupForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Créer le groupe',
}: NotificationGroupFormProps) {
  const form = useForm<NotificationGroupFormValues>({
    resolver: zodResolver(notificationGroupFormSchema),
    defaultValues: defaultValues ?? {
      name: '',
      targetRoles: [],
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-6'
      >
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du groupe</FormLabel>
              <FormControl>
                <Input placeholder='Ex: Équipe terrain' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='targetRoles'
          render={() => (
            <FormItem>
              <FormLabel>Rôles cibles</FormLabel>
              <div className='grid grid-cols-2 gap-3 rounded-lg border p-4'>
                {ROLES.map((role) => (
                  <FormField
                    key={role}
                    control={form.control}
                    name='targetRoles'
                    render={({ field }) => {
                      const checked = field.value.includes(role)
                      return (
                        <FormItem
                          key={role}
                          className='flex flex-row items-center gap-2 space-y-0'
                        >
                          <FormControl>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) => {
                                const next = c
                                  ? [...field.value, role]
                                  : field.value.filter((r) => r !== role)
                                field.onChange(next)
                              }}
                            />
                          </FormControl>
                          <FormLabel className='cursor-pointer font-normal'>
                            {ROLE_LABELS[role]}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex items-center justify-end gap-3 pt-2'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Annuler
          </Button>
          <Button type='submit'>{submitLabel}</Button>
        </div>
      </form>
    </Form>
  )
}

export function groupToFormValues(group: NotificationGroup): NotificationGroupFormValues {
  return {
    name: group.name,
    targetRoles: group.targetRoles,
  }
}
