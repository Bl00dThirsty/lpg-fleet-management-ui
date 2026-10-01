import { z } from 'zod'
import { sites } from '@lpg/mock-data'
import { isSupplyOrigin } from '@/features/sites/lib/site-functions'
import type { TourneeType } from '@lpg/types'

export const pickupWizardSchema = z
  .object({
    marketeur_org_id: z.string().min(1, 'Le marketeur est obligatoire'),
    source_site_id: z.string().min(1, 'Le site source est obligatoire'),
    destination_site_id: z.string().min(1, 'Le site destination est obligatoire'),
    requested_quantity: z.number().positive('La quantité demandée doit être > 0'),
    type: z.enum(['VRAC', 'BOUTEILLES50KG'] satisfies readonly [TourneeType, TourneeType]),
  })
  .superRefine((val, ctx) => {
    if (val.source_site_id && val.destination_site_id && val.source_site_id === val.destination_site_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destination_site_id'],
        message: 'chk_pickup_sites_different: le site source et le site destination doivent différer',
      })
    }
    // Flux-1 enlèvement rule: an enlèvement origin must be a supply point
    // (POINTAPPROVISIONABLE) or a filling centre (CENTREEMPLISSEUR). A
    // pure storage depot (ENTREPOT) cannot be a pickup source.
    if (val.source_site_id) {
      const source = sites.find((s) => s.id === val.source_site_id)
      if (source && !isSupplyOrigin(source)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['source_site_id'],
          message:
            'chk_pickup_source_function: l\'enlèvement démarre sur un centre emplisseur ' +
            'ou un point d\'approvisionnement (CENTREEMPLISSEUR/POINTAPPROVISIONABLE), pas un entrepôt',
        })
      }
    }
  })

export type PickupWizardValues = z.infer<typeof pickupWizardSchema>
