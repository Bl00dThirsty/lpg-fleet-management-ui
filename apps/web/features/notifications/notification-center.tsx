import {
  Bell,
  CheckCheck,
  CircleCheck,
  CircleX,
  Info,
  Plus,
  Send,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@lpg/ui'
import {
  useNotificationsStore,
  getNotificationsForRole,
  type NotificationLevel,
} from './notifications-store'
import { useRoleStore } from '@/store/role-store'
import { ROLE_LABELS } from '@/config/rbac/roles'
import type { Role } from '@/config/rbac/roles'
import { EmptyState } from '@/components/layout/page'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNotificationGroupsStore } from './notification-groups-store'

const LEVEL_ICON: Record<NotificationLevel, typeof Info> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
}

const LEVEL_CLASS: Record<NotificationLevel, string> = {
  info: 'text-muted-foreground',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  error: 'text-rose-600',
}

const EMPTY_BY_ROLE: Record<string, string> = {
  SUPER_ADMIN: 'Toutes les notifications système sont sous contrôle.',
  ADMIN: 'Aucune notification administrative en attente.',
  MARKETEUR: 'Aucune notification pour vos tournées.',
  LIVREUR: 'Aucune notification de mission.',
}

const sendSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(120, 'Titre trop long'),
  body: z.string().min(1, 'Le message est requis').max(500, 'Message trop long'),
  level: z.enum(['info', 'success', 'warning', 'error'] as const),
  target: z.string().optional(),
})

type SendFormValues = z.infer<typeof sendSchema>

function SendNotificationDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const addNotification = useNotificationsStore((s) => s.addNotification)
  const groups = useNotificationGroupsStore((s) => s.items)

  const form = useForm<SendFormValues>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      title: '',
      body: '',
      level: 'info',
      target: '',
    },
  })

  const handleSubmit = (values: SendFormValues) => {
    const target = values.target
    let roles: Role[] = []

    if (target) {
      const group = groups.find((g) => g.id === target)
      if (group) {
        roles = group.targetRoles
      }
    }

    for (const role of roles) {
      addNotification({
        title: values.title,
        body: values.body,
        level: values.level,
        role,
      })
    }

    if (roles.length === 0) {
      addNotification({
        title: values.title,
        body: values.body,
        level: values.level,
      })
    }

    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Envoyer une notification</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder='Titre de la notification' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='body'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Corps du message...'
                      className='resize-none'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='level'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='info'>Information</SelectItem>
                      <SelectItem value='success'>Succès</SelectItem>
                      <SelectItem value='warning'>Avertissement</SelectItem>
                      <SelectItem value='error'>Erreur</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='target'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Groupe cible</FormLabel>
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Tous les rôles' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value=''>Tous les rôles</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group.targetRoles.length} rôle{group.targetRoles.length > 1 ? 's' : ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {groups.length === 0 && (
                    <p className='text-xs text-muted-foreground'>
                      Aucun groupe défini.{' '}
                      <a
                        href='/settings/notification-groups'
                        className='underline underline-offset-2'
                      >
                        Créer des groupes
                      </a>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type='submit'>
                <Send className='size-4' />
                Envoyer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function NotificationCenter() {
  const activeRole = useRoleStore((s) => s.activeRole)
  const filtered = getNotificationsForRole(activeRole)
  const unread = filtered.filter((n) => !n.read).length
  const markRead = useNotificationsStore((s) => s.markRead)
  const markAllRead = useNotificationsStore((s) => s.markAllRead)
  const [sendOpen, setSendOpen] = useState(false)

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='relative rounded-full text-muted-foreground'
            aria-label='Notifications'
          >
            <Bell className='size-4' />
            {unread > 0 && (
              <span className='absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white'>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align='end' className='w-80 p-0'>
          <div className='flex items-center justify-between border-b p-3'>
            <p className='text-sm font-semibold'>Notifications</p>
            <div className='flex items-center gap-1'>
              {activeRole === 'SUPER_ADMIN' && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='h-7 gap-1 text-xs'
                  onClick={() => setSendOpen(true)}
                >
                  <Plus className='size-3.5' />
                  Nouvelle
                </Button>
              )}
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-7 gap-1 text-xs'
                onClick={markAllRead}
                disabled={unread === 0}
              >
                <CheckCheck className='size-3.5' />
                Tout lire
              </Button>
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              title='Aucune notification'
              description={
                EMPTY_BY_ROLE[activeRole] ??
                `Aucune notification pour ${ROLE_LABELS[activeRole as keyof typeof ROLE_LABELS] ?? 'votre rôle'}.`
              }
            />
          ) : (
            <ScrollArea className='max-h-80'>
              <ul className='divide-y'>
                {filtered.map((n) => {
                  const Icon = LEVEL_ICON[n.level]
                  return (
                    <li key={n.id}>
                      <button
                        type='button'
                        onClick={() => markRead(n.id)}
                        className={cn(
                          'flex w-full items-start gap-3 p-3 text-start',
                          !n.read && 'bg-primary/5'
                        )}
                      >
                        <Icon className={cn('mt-0.5 size-4 shrink-0', LEVEL_CLASS[n.level])} />
                        <span className='min-w-0'>
                          <span className='block truncate text-sm font-medium'>{n.title}</span>
                          <span className='block text-xs text-muted-foreground'>{n.body}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>

      <SendNotificationDialog open={sendOpen} onOpenChange={setSendOpen} />
    </>
  )
}
