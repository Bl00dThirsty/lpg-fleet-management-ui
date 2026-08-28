import { z } from 'zod'
import { ROLES } from '@/config/rbac/roles'

export const notificationGroupFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(80, 'Le nom ne doit pas dépasser 80 caractères'),
  targetRoles: z
    .array(z.enum(ROLES as unknown as [string, ...string[]]))
    .min(1, 'Sélectionnez au moins un rôle cible'),
})

export type NotificationGroupFormValues = z.infer<typeof notificationGroupFormSchema>
