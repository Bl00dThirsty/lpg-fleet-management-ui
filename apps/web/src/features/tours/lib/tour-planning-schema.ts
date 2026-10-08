import { z } from 'zod'
export const tourPlanningSchema = z
  .object({
    scheduledAt: z.string().optional().refine(value => !value || Number.isFinite(Date.parse(value)), 'Date invalide.'),
    executionMode: z.enum(['INTERNAL', 'EXTERNAL']),
    cargoType: z.enum(['VRAC', 'BOUTEILLES50KG']),
    quantity: z.number().positive('Saisissez une quantité positive.'),
    marketerId: z.string().min(1, 'Sélectionnez un marketeur.'),
    depotSiteId: z.string().min(1, 'Sélectionnez un dépôt.'),
    transporterId: z.string(),
    vehicleId: z.string(),
    driverId: z.string(),
    livreurId: z.string(),
    clientStops: z
      .array(
        z.object({
          kind: z.literal('CLIENT_SITE'),
          sequence: z.number().int(),
          destinationId: z.string().min(1, 'Sélectionnez un site.'),
          plannedQuantity: z
            .number()
            .positive('Saisissez une quantité positive.'),
        })
      )
      .min(1, 'Ajoutez au moins un arrêt client.'),
  })
  .superRefine((value, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message })
    if (value.executionMode === 'EXTERNAL' && !value.transporterId)
      issue(['transporterId'], 'Sélectionnez un transporteur.')
    if (value.executionMode === 'INTERNAL')
      for (const field of ['vehicleId', 'driverId', 'livreurId'] as const)
        if (!value[field])
          issue(
            [field],
            'Sélectionnez un membre de votre équipage ou un véhicule.'
          )
    if (value.cargoType === 'BOUTEILLES50KG') {
      if (!Number.isSafeInteger(value.quantity))
        issue(['quantity'], 'Saisissez un nombre entier de bouteilles.')
      value.clientStops.forEach((stop, i) => {
        if (!Number.isSafeInteger(stop.plannedQuantity))
          issue(
            ['clientStops', i, 'plannedQuantity'],
            'Saisissez un nombre entier de bouteilles.'
          )
      })
    }
    const seen = new Set<string>()
    value.clientStops.forEach((stop, i) => {
      if (seen.has(stop.destinationId))
        issue(
          ['clientStops', i, 'destinationId'],
          'Ce site est déjà dans la tournée.'
        )
      seen.add(stop.destinationId)
    })
    if (
      value.clientStops.reduce((sum, stop) => sum + stop.plannedQuantity, 0) >
      value.quantity +
        Number.EPSILON * Math.max(1, value.quantity) * value.clientStops.length
    )
      issue(
        ['quantity'],
        'La quantité chargée doit couvrir toutes les livraisons.'
      )
  })
export type TourPlanningValues = z.infer<typeof tourPlanningSchema>
