import { z } from 'zod'

export const pickupWizardSchema = z
  .object({
    marketeur_org_id: z.string().min(1, 'Sélectionnez un marketeur'),
    source_site_id: z.string().min(1, 'Sélectionnez un dépôt SNH ou SCDP'),
    destination_site_id: z.string().min(1, 'Sélectionnez le site destinataire'),
    scheduled_at: z
      .string()
      .min(1, 'Indiquez la date prévue')
      .refine((v) => Number.isFinite(Date.parse(v)), 'Date invalide'),
    requested_quantity: z.number().positive('Indiquez une quantité positive'),
    type: z.enum(['VRAC', 'BOUTEILLES50KG']),
    vehicle_id: z.string().min(1, 'Sélectionnez un véhicule'),
    driver_id: z.string().min(1, 'Sélectionnez un chauffeur'),
    livreur_user_id: z.string().min(1, 'Sélectionnez un livreur'),
  })
  .superRefine((value, ctx) => {
    if (value.source_site_id === value.destination_site_id)
      ctx.addIssue({
        code: 'custom',
        path: ['destination_site_id'],
        message: 'Le dépôt et la destination doivent être différents',
      })
    if (
      value.type === 'BOUTEILLES50KG' &&
      !Number.isInteger(value.requested_quantity)
    )
      ctx.addIssue({
        code: 'custom',
        path: ['requested_quantity'],
        message: 'Indiquez un nombre entier de bouteilles',
      })
  })
export type PickupWizardValues = z.infer<typeof pickupWizardSchema>
