import { z } from 'zod'

export const clientSiteFormSchema = z.object({
  name: z.string().min(2, 'Le nom du site doit contenir au moins 2 caractères'),
  region: z.string().min(1, 'Veuillez sélectionner une région'),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  site_contact_name: z.string().optional(),
  site_contact_phone: z.string().optional(),
  is_active: z.boolean().default(true),
})

export type ClientSiteFormValues = z.infer<typeof clientSiteFormSchema>
