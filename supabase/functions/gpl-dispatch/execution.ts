// Server-owned execution rules. Loading does not start the delivery tour.
export class ExecutionError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
const reject = (message: string): never => {
  throw new ExecutionError(409, message)
}
export function normalizedTags(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    value.some(
      (tag) => typeof tag !== 'string' || !tag.trim() || tag.length > 128,
    )
  )
    reject('Liste de bouteilles invalide.')
  const tags = (value as string[]).map((tag) => tag.trim().toUpperCase())
  if (new Set(tags).size !== tags.length)
    reject('Une bouteille ne peut être comptée deux fois.')
  return tags.sort()
}
export function validateLoading(
  tour: any,
  tags: unknown,
  hasOrderImage: boolean,
) {
  if (!['PLANNED', 'ACKNOWLEDGED'].includes(tour.status))
    reject('Le chargement ne peut plus être modifié.')
  if (tour.mission_kind === 'PICKUP' && !hasOrderImage)
    reject('La photo du bon d’enlèvement est obligatoire.')
  if (tour.type === 'VRAC') {
    if (!hasOrderImage)
      reject('Une image du bon de commande est obligatoire pour le vrac.')
    return []
  }
  const bottles = normalizedTags(tags)
  if (
    !Number.isInteger(tour.requested_quantity) ||
    tour.requested_quantity <= 0 ||
    bottles.length !== tour.requested_quantity
  )
    reject(
      `Scannez toutes les bouteilles prévues (${bottles.length}/${tour.requested_quantity}).`,
    )
  return bottles
}
function event(tour: any, type: string, actor: string, at: string, extra = {}) {
  tour.activity = [
    ...(tour.activity ?? []),
    { id: crypto.randomUUID(), type, actor_id: actor, at, ...extra },
  ]
}
export function recordLoading(
  tour: any,
  tags: string[],
  proofPath: string | null,
  actor: string,
  at: string,
) {
  tour.loading = {
    validated_at: at,
    tags,
    bottle_count: tags.length,
    order_image_path: proofPath,
    actor_id: actor,
  }
  tour.loading_validated = true
  if (tour.mission_kind === 'PICKUP') {
    tour.pickup_status = 'INPROGRESS'
    tour.status = 'INPROGRESS'
    tour.started_at = at
    tour.loaded_quantity = tour.requested_quantity
  }
  if (tour.type === 'BOUTEILLES50KG') tour.loaded_quantity = tags.length
  const depot = tour.checkpoints.find(
    (cp: any) => cp.sequence === 1 && !cp.client_site_id,
  )
  if (depot) {
    depot.status = 'COMPLETED'
    depot.actual_arrival = at
    depot.completed_at = at
  }
  event(tour, 'LOADING_VALIDATED', actor, at, {
    bottle_count: tags.length,
    has_order_image: !!proofPath,
  })
  return tour
}
export function recordDelivery(
  tour: any,
  input: any,
  actor: string,
  at: string,
) {
  if (!tour.loading_validated || !tour.loading?.validated_at)
    reject('Validez le chargement avant la première livraison.')
  if (
    !['PLANNED', 'ACKNOWLEDGED', 'INPROGRESS', 'CHECKPOINTACTIVE'].includes(
      tour.status,
    )
  )
    reject('Cette tournée ne peut plus recevoir de livraison.')
  const cp = tour.checkpoints.find(
    (point: any) => point.id === input.checkpoint_id && point.sequence > 1,
  )
  if (!cp) reject('Arrêt de livraison introuvable.')
  const tags = tour.type === 'BOUTEILLES50KG' ? normalizedTags(input.tags) : []
  const quantity =
    tour.type === 'BOUTEILLES50KG' ? tags.length : Number(input.quantity)
  if (
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    quantity > Number(cp.expected_quantity)
  )
    reject('Quantité livrée invalide ou supérieure à la quantité prévue.')
  if (cp.status === 'COMPLETED') {
    if (
      cp.delivered_quantity === quantity &&
      JSON.stringify(cp.delivered_tags ?? []) === JSON.stringify(tags)
    )
      return tour
    reject('Une livraison déjà validée ne peut pas être remplacée.')
  }
  if (tour.type === 'BOUTEILLES50KG') {
    const delivered = new Set(
      tour.checkpoints.flatMap((point: any) => point.delivered_tags ?? []),
    )
    if (tags.some((tag) => !tour.loading.tags.includes(tag)))
      reject('Une bouteille livrée ne fait pas partie du chargement.')
    if (tags.some((tag) => delivered.has(tag)))
      reject('Une bouteille a déjà été livrée à un autre arrêt.')
  }
  if (!tour.started_at) {
    tour.started_at = at
    event(tour, 'TOUR_STARTED', actor, at)
  }
  tour.status = 'INPROGRESS'
  Object.assign(cp, {
    status: 'COMPLETED',
    actual_arrival: at,
    completed_at: at,
    delivered_quantity: quantity,
    actualDeliveredQuantity: quantity,
    delivered_tags: tags,
  })
  tour.delivered_quantity = tour.checkpoints
    .filter((point: any) => point.sequence > 1)
    .reduce(
      (sum: number, point: any) => sum + (point.delivered_quantity ?? 0),
      0,
    )
  event(tour, 'DELIVERY_COMPLETED', actor, at, {
    checkpoint_id: cp.id,
    site_name: cp.name,
    quantity,
    unit: tour.type === 'VRAC' ? 'TM' : 'btl',
  })
  return tour
}
