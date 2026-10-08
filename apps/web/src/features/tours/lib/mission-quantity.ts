import { z } from 'zod'
import type { Checkpoint, TourneeType } from '@lpg/types'
export const missionQuantitySchema = (type: TourneeType) =>
  z.object({
    quantity: z
      .number()
      .positive('Saisissez une quantité positive.')
      .refine(
        (value) => type !== 'BOUTEILLES50KG' || Number.isSafeInteger(value),
        'Le nombre de bouteilles doit être entier.'
      ),
  })
export function planCheckpointQuantity(
  checkpoints: Checkpoint[],
  checkpointId: string,
  quantity: number,
  requestedQuantity: number,
  type: TourneeType
) {
  missionQuantitySchema(type).parse({ quantity })
  const target = checkpoints.find((cp) => cp.id === checkpointId)
  if (!target || !target.client_site_id)
    throw new Error('Point de livraison introuvable.')
  const total = requestedQuantity + quantity - (target.expected_quantity ?? 0)
  missionQuantitySchema(type).parse({ quantity: total })
  return {
    requested_quantity: total,
    checkpoints: checkpoints.map((cp) => ({
      ...cp,
      site_id: cp.site_id ?? undefined,
      client_site_id: cp.client_site_id ?? undefined,
      expected_quantity:
        cp.id === checkpointId
          ? quantity
          : cp.sequence === 1
            ? total
            : (cp.expected_quantity ?? 0),
    })),
  }
}
