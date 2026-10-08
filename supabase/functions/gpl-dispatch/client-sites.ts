export function canEditClientSite(profile: any, site: any): boolean {
  const base = (profile.org_type === 'REGULATEUR' && ['SUPERADMIN', 'ADMIN'].includes(profile.system_role)) || profile.system_role === 'MARKETEUR'
  const custom = (profile.details?.custom_roles ?? []).some((role: any) => role.is_active && !role.deleted_at && role.permissions_json?.['clients.write'] === true)
  return !site.deleted_at && (base || custom) && (profile.org_type === 'REGULATEUR' || site.current_marketeur_org_id === profile.org_id)
}

export function buildClientSitePatch(current: any, body: any, actorId: string, now: string) {
  if (body.client_org_id !== undefined && body.client_org_id !== current.client_org_id) throw new Error('Le client du site ne peut pas être remplacé.')
  const next = { ...current }
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2) throw new Error('Nom du site invalide.')
    next.name = body.name.trim()
  }
  if (body.region !== undefined) {
    if (!['ADAMAOUA', 'CENTRE', 'EST', 'EXTREMENORD', 'LITTORAL', 'NORD', 'NORDOUEST', 'OUEST', 'SUD', 'SUDOUEST'].includes(body.region)) throw new Error('Région invalide.')
    next.region = body.region
  }
  if (body.geo_point !== undefined) {
    const point = body.geo_point
    if (!Array.isArray(point) || point.length !== 2 || point.some((n: unknown) => typeof n !== 'number' || !Number.isFinite(n)) || Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90) throw new Error('Coordonnées GPS invalides.')
    if (JSON.stringify(point) !== JSON.stringify(current.geo_point)) Object.assign(next, { is_verified: false, verified_at: null, verified_by: null, geo_confidence_score: 0 })
    next.geo_point = point
  }
  for (const field of ['address', 'site_contact_name', 'site_contact_phone']) {
    if (body[field] !== undefined) {
      if (body[field] !== null && typeof body[field] !== 'string') throw new Error('Champ texte invalide.')
      next[field] = body[field]?.trim() || null
    }
  }
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== 'boolean') throw new Error('Activation invalide.')
    next.is_active = body.is_active
  }
  return { ...next, updated_at: now, updated_by: actorId }
}
