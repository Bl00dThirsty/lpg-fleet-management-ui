import { z } from 'zod'

/**
 * Step schemas for the tour creation wizard (Plan 5, Task 4).
 *
 * One combined `tourCreateSchema` drives the react-hook-form resolver (final
 * submit validates every field); the per-step schemas validate only the fields
 * of the active step on "Suivant". The rules mirror the schema's constraints:
 *  - `chk_tournee_internal` — INTERNAL requires vehicle + driver + livreur.
 *  - `chk_tournee_external` — EXTERNAL requires a transporter_org_id (active
 *    contract is checked in the store via `validateTour`).
 *  - `chk_checkpoint_exclusive` — a checkpoint references exactly one of
 *    site_id / client_site_id.
 *  - The tour source site (the marketeur's loading point) must not be a
 *    checkpoint destination.
 */

export const executionModeSchema = z.enum(['INTERNAL', 'EXTERNAL'])
export const tourneeTypeSchema = z.enum(['VRAC', 'BOUTEILLES50KG'])

export const checkpointRowSchema = z
  .object({
    site_id: z.string().optional(),
    client_site_id: z.string().optional(),
    sequence: z.number().int().positive('Séquence invalide'),
    expected_quantity: z.number().positive('La quantité attendue doit être positive'),
  })
  .refine((row) => Boolean(row.site_id) !== Boolean(row.client_site_id), {
    message: 'Choisissez un site ou un site client (pas les deux)',
    path: ['site_id'],
  })

const baseTourSchema = z.object({
  marketeur_org_id: z.string().min(1, 'Organisation marketeur requise'),
  sourceSiteId: z.string().min(1, 'Site source requis'),
  execution_mode: executionModeSchema,
  type: tourneeTypeSchema,
  requested_quantity: z.number().positive('La quantité demandée doit être positive'),
  transporter_org_id: z.string().optional(),
  vehicle_id: z.string().optional(),
  driver_id: z.string().optional(),
  livreur_user_id: z.string().optional(),
  checkpoints: z.array(checkpointRowSchema).min(1, 'Ajoutez au moins un point de livraison'),
})

export const step1Schema = baseTourSchema.pick({
  marketeur_org_id: true,
  sourceSiteId: true,
  execution_mode: true,
  type: true,
  requested_quantity: true,
})

export const step2Schema = baseTourSchema
  .pick({
    execution_mode: true,
    transporter_org_id: true,
    vehicle_id: true,
    driver_id: true,
    livreur_user_id: true,
  })
  .superRefine((draft, ctx) => {
    if (draft.execution_mode === 'INTERNAL') {
      if (!draft.vehicle_id) {
        ctx.addIssue({ code: 'custom', path: ['vehicle_id'], message: 'Véhicule requis' })
      }
      if (!draft.driver_id) {
        ctx.addIssue({ code: 'custom', path: ['driver_id'], message: 'Chauffeur requis' })
      }
      if (!draft.livreur_user_id) {
        ctx.addIssue({ code: 'custom', path: ['livreur_user_id'], message: 'Livreur requis' })
      }
    } else if (!draft.transporter_org_id) {
      ctx.addIssue({ code: 'custom', path: ['transporter_org_id'], message: 'Transporteur requis' })
    }
  })

export const step3Schema = baseTourSchema
  .pick({
    sourceSiteId: true,
    requested_quantity: true,
    type: true,
    checkpoints: true,
  })
  .superRefine((draft, ctx) => {
    draft.checkpoints.forEach((checkpoint, index) => {
      if (checkpoint.site_id && draft.sourceSiteId && checkpoint.site_id === draft.sourceSiteId) {
        ctx.addIssue({
          code: 'custom',
          path: ['checkpoints', index, 'site_id'],
          message: 'Le point de livraison ne peut pas être le site source',
        })
      }
    })
    addQuantityOverrunIssues(draft, ctx)
  })

export const tourCreateSchema = baseTourSchema.superRefine((draft, ctx) => {
  if (draft.execution_mode === 'INTERNAL') {
    if (!draft.vehicle_id) {
      ctx.addIssue({ code: 'custom', path: ['vehicle_id'], message: 'Véhicule requis' })
    }
    if (!draft.driver_id) {
      ctx.addIssue({ code: 'custom', path: ['driver_id'], message: 'Chauffeur requis' })
    }
    if (!draft.livreur_user_id) {
      ctx.addIssue({ code: 'custom', path: ['livreur_user_id'], message: 'Livreur requis' })
    }
  } else if (!draft.transporter_org_id) {
    ctx.addIssue({ code: 'custom', path: ['transporter_org_id'], message: 'Transporteur requis' })
  }

  draft.checkpoints.forEach((checkpoint, index) => {
    if (checkpoint.site_id && draft.sourceSiteId && checkpoint.site_id === draft.sourceSiteId) {
      ctx.addIssue({
        code: 'custom',
        path: ['checkpoints', index, 'site_id'],
        message: 'Le point de livraison ne peut pas être le site source',
      })
    }
  })

  addQuantityOverrunIssues(draft, ctx)
})

type RefinementContext = {
  addIssue: (issue: { code: 'custom'; path?: (string | number)[]; message: string }) => void
}

function addQuantityOverrunIssues(
  draft: { requested_quantity: number; type: 'VRAC' | 'BOUTEILLES50KG'; checkpoints: CheckpointRowValue[] },
  ctx: RefinementContext,
) {
  const total = draft.checkpoints.reduce((sum, checkpoint) => sum + checkpoint.expected_quantity, 0)
  if (total > draft.requested_quantity) {
    ctx.addIssue({
      code: 'custom',
      path: ['checkpoints'],
      message:
        `La quantité totale des points (${total} ${draft.type === 'VRAC' ? 'TM' : 'btl'}) ` +
        `dépasse la quantité demandée (${draft.requested_quantity} ${draft.type === 'VRAC' ? 'TM' : 'btl'})`,
    })
  }
}

export type TourDraftValues = z.infer<typeof tourCreateSchema>
export type CheckpointRowValue = z.infer<typeof checkpointRowSchema>
