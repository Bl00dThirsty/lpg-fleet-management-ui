import {
  ExecutionError,
  validateLoading,
  recordLoading,
  recordDelivery,
} from './execution.ts'
// Dedicated POC gateway. Authentication is verified with Supabase Auth on every request.
const base = Deno.env.get('SUPABASE_URL')!
const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
}
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
const fail = (status: number, message: string): never => {
  throw new HttpError(status, message)
}
const reply = (data: unknown, status = 200, pagination?: unknown) =>
  new Response(
    JSON.stringify({
      success: status < 400,
      message: status < 400 ? 'OK' : String(data),
      data: status < 400 ? data : null,
      ...(pagination ? { pagination } : {}),
    }),
    { status, headers: { ...cors, 'Content-Type': 'application/json' } },
  )
async function rest(
  path: string,
  method = 'GET',
  body?: unknown,
  token = adminKey,
) {
  const res = await fetch(`${base}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: adminKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    console.error('Database operation failed', res.status)
    fail(502, 'Enregistrement impossible.')
  }
  return res.status === 204 ? null : res.json()
}
async function resource(kind: string, id: string) {
  const rows = await rest(
    `dispatch_resources?kind=eq.${encodeURIComponent(kind)}&id=eq.${encodeURIComponent(id)}`,
  )
  return rows[0]?.payload
}
function writable(profile: any, tour: any) {
  return (
    (profile.org_type === 'REGULATEUR' &&
      ['SUPERADMIN', 'ADMIN'].includes(profile.system_role)) ||
    (profile.system_role === 'MARKETEUR' &&
      profile.org_id === tour.marketeur_org_id)
  )
}
function canPlanPickup(profile: any, orgId = profile.org_id) {
  const custom = (profile.details?.custom_roles ?? []).some(
    (role: any) =>
      role.is_active &&
      !role.deleted_at &&
      ['pickups.create', 'pickups.write', 'pickups.manage'].some(
        (code) => role.permissions_json?.[code] === true,
      ),
  )
  return (
    writable(profile, { marketeur_org_id: orgId }) ||
    (custom && profile.org_type === 'MARKETEUR' && profile.org_id === orgId)
  )
}
function pickupSiteAllowed(profile: any, siteId: string) {
  const sites = profile.details?.site_ids ?? []
  return (
    profile.org_type === 'REGULATEUR' || !sites.length || sites.includes(siteId)
  )
}
async function proofExpiry() {
  const rows = await rest(
    'dispatch_resources?kind=eq.settings&payload->>setting_key=eq.storage.proof_url_expiry_seconds',
  )
  const value = Number(rows[0]?.payload?.setting_value)
  if (!Number.isSafeInteger(value) || value <= 0)
    fail(503, 'Expiration des justificatifs non configurée.')
  return value
}
function isPickupSupplier(org: any) {
  return (
    ['SNH', 'SCDP'].includes(String(org?.code ?? '').toUpperCase()) ||
    /^(SNH|SCDP)\b/i.test(org?.name ?? '')
  )
}
async function validateCrew(tour: any) {
  const org =
    tour.execution_mode === 'EXTERNAL'
      ? tour.transporter_org_id
      : tour.marketeur_org_id
  for (const [kind, field] of [
    ['drivers', 'driver_id'],
    ['users', 'livreur_user_id'],
    ['vehicles', 'vehicle_id'],
  ]) {
    if (!tour[field]) fail(400, 'Véhicule, chauffeur et livreur obligatoires.')
    const row = await resource(kind, tour[field])
    if (
      !row ||
      row.org_id !== org ||
      row.is_active === false ||
      row.deleted_at ||
      (kind === 'users' && row.system_role !== 'LIVREUR') ||
      (kind === 'vehicles' && row.type !== tour.type)
    )
      fail(403, 'Affectation hors organisation ou personnel indisponible.')
  }
}
async function save(tour: any, revision?: number) {
  const row = {
    id: tour.id,
    marketeur_org_id: tour.marketeur_org_id,
    livreur_user_id: tour.livreur_user_id ?? null,
    payload: { ...tour, updated_at: new Date().toISOString() },
    revision: (revision ?? 0) + 1,
    updated_at: new Date().toISOString(),
  }
  const result = await rest(
    revision == null
      ? 'dispatch_tours'
      : `dispatch_tours?id=eq.${tour.id}&revision=eq.${revision}`,
    revision == null ? 'POST' : 'PATCH',
    row,
  )
  if (!result?.length)
    fail(409, 'Cette tournée a été modifiée. Actualisez avant de réessayer.')
  return result[0].payload
}
async function checkpoint(input: any, tour: any, index: number) {
  let siteId = input.site_id ?? input.siteId ?? null
  let clientId = input.client_site_id ?? input.clientSiteId ?? null
  if (siteId && (await resource('client-sites', siteId))) {
    clientId = siteId
    siteId = null
  }
  const site = await resource(
    clientId ? 'client-sites' : 'sites',
    clientId ?? siteId ?? '',
  )
  if (!site) fail(400, 'Site de tournée introuvable.')
  if (clientId && site.current_marketeur_org_id !== tour.marketeur_org_id)
    fail(403, 'Site client hors organisation.')
  return {
    id: crypto.randomUUID(),
    tournee_id: tour.id,
    tourneeId: tour.id,
    site_id: siteId,
    client_site_id: clientId,
    sequence: input.sequence ?? index + 1,
    expected_quantity: input.expected_quantity ?? input.planned_quantity ?? 0,
    plannedQuantity: input.expected_quantity ?? input.planned_quantity ?? 0,
    status: 'PENDING',
    expected_arrival: input.expected_arrival ?? null,
    latitude: site.geo_point?.[1],
    longitude: site.geo_point?.[0],
    name: site.name,
  }
}
async function storage(
  path: string,
  method = 'GET',
  body?: BodyInit,
  contentType = 'application/json',
) {
  const res = await fetch(`${base}/storage/v1/${path}`, {
    method,
    headers: {
      apikey: adminKey,
      Authorization: `Bearer ${adminKey}`,
      'Content-Type': contentType,
    },
    body,
  })
  if (!res.ok) fail(502, 'Stockage du bon de commande indisponible.')
  return res.json()
}
async function uploadOrderImage(tourId: string, encoded: string) {
  if (encoded.length > 7_000_000)
    fail(400, 'Image trop volumineuse (5 Mo maximum).')
  let bytes: Uint8Array
  try {
    bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
  } catch {
    fail(400, 'Image invalide.')
  }
  const jpeg = bytes![0] === 255 && bytes![1] === 216 && bytes![2] === 255
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
    (value, index) => bytes![index] === value,
  )
  const pdf =
    bytes![0] === 0x25 &&
    bytes![1] === 0x50 &&
    bytes![2] === 0x44 &&
    bytes![3] === 0x46
  if ((!jpeg && !png && !pdf) || bytes!.length < 100 || bytes!.length > 5_242_880)
    fail(400, 'Document JPEG, PNG ou PDF requis (5 Mo maximum).')
  const bucket = await fetch(`${base}/storage/v1/bucket/dispatch-proofs`, {
    headers: { Authorization: `Bearer ${adminKey}`, apikey: adminKey },
  })
  if (!bucket.ok) {
    const created = await fetch(`${base}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminKey}`,
        apikey: adminKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'dispatch-proofs',
        name: 'dispatch-proofs',
        public: false,
        file_size_limit: 5242880,
        allowed_mime_types: ['image/jpeg', 'image/png', 'application/pdf'],
      }),
    })
    if (!created.ok && created.status !== 409)
      fail(502, 'Stockage privé indisponible.')
  }
  const ext = pdf ? 'pdf' : jpeg ? 'jpg' : 'png'
  const mime = pdf ? 'application/pdf' : jpeg ? 'image/jpeg' : 'image/png'
  const path = `${tourId}/${crypto.randomUUID()}.${ext}`
  await storage(
    `object/dispatch-proofs/${path}`,
    'POST',
    bytes!,
    mime,
  )
  return path
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  try {
    const url = new URL(req.url)
    const path =
      url.pathname.replace(/^.*?\/gpl-dispatch/, '').replace(/\/$/, '') || '/'
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method)
      ? await req.json().catch(() => ({}))
      : {}
    if (
      ['/auth/login', '/auth/refresh'].includes(path) &&
      req.method === 'POST'
    ) {
      const refresh = path.endsWith('/refresh')
      const res = await fetch(
        `${base}/auth/v1/token?grant_type=${refresh ? 'refresh_token' : 'password'}`,
        {
          method: 'POST',
          headers: { apikey: anonKey, 'Content-Type': 'application/json' },
          body: JSON.stringify(
            refresh
              ? { refresh_token: body.refresh_token }
              : { email: body.email ?? body.username, password: body.password },
          ),
        },
      )
      if (!res.ok) fail(401, 'Identifiants invalides ou session expirée.')
      const auth = await res.json()
      const profiles = await rest(
        `dispatch_profiles?auth_id=eq.${auth.user.id}`,
      )
      if (!profiles[0]) fail(403, 'Compte non autorisé pour cette application.')
      const profile = profiles[0]
      return reply({
        access_token: auth.access_token,
        accessToken: auth.access_token,
        refresh_token: auth.refresh_token,
        user: {
          ...profile.details,
          username: profile.account_id,
          firstName: profile.details.first_name,
          lastName: profile.details.last_name,
        },
      })
    }
    const authorization = req.headers.get('Authorization') ?? ''
    if (!authorization.startsWith('Bearer '))
      fail(401, 'Authentification requise.')
    const token = authorization.slice(7)
    const authRes = await fetch(`${base}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: authorization },
    })
    if (!authRes.ok) fail(401, 'Session expirée. Reconnectez-vous.')
    const auth = await authRes.json()
    const profiles = await rest(`dispatch_profiles?auth_id=eq.${auth.id}`)
    const profile = profiles[0]
    if (!profile) fail(403, 'Compte non autorisé.')
    if (path === '/me') return reply(profile.details)
    if (path === '/auth/logout' && req.method === 'POST') {
      await fetch(`${base}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: anonKey, Authorization: authorization },
      })
      return reply(null)
    }
    if (
      (path === '/tours' || path === '/delivery-tours') &&
      req.method === 'GET'
    ) {
      const rows = await rest(
        'dispatch_tours?select=payload&order=updated_at.desc',
        'GET',
        undefined,
        token,
      )
      const page = Math.max(0, Number(url.searchParams.get('page') ?? 0))
      const size = Math.min(
        500,
        Math.max(1, Number(url.searchParams.get('size') ?? 50)),
      )
      const tours = rows.map((row: any) => row.payload)
      return reply(tours.slice(page * size, (page + 1) * size), 200, {
        page,
        limit: size,
        total: tours.length,
        pages: Math.ceil(tours.length / size),
      })
    }
    if (path === '/pickup-options' && req.method === 'GET') {
      if (!canPlanPickup(profile)) fail(403, 'Planification non autorisée.')
      const rows = await rest(
        'dispatch_resources?kind=in.(sites,organizations,vehicles,drivers,users)',
      )
      const active = rows.filter(
        (r: any) => !r.payload.deleted_at && r.payload.is_active !== false,
      )
      const orgs = active
        .filter((r: any) => r.kind === 'organizations')
        .map((r: any) => r.payload)
      const suppliers = orgs.filter((o: any) => isPickupSupplier(o))
      const all =
        profile.org_type === 'REGULATEUR' &&
        ['SUPERADMIN', 'ADMIN'].includes(profile.system_role)
      return reply({
        sources: active
          .filter(
            (r: any) =>
              r.kind === 'sites' &&
              suppliers.some((o: any) => o.id === r.payload.org_id),
          )
          .map((r: any) => r.payload),
        organizations: orgs.filter(
          (o: any) =>
            o.type === 'MARKETEUR' && (all || o.id === profile.org_id),
        ),
        destinations: active
          .filter(
            (r: any) =>
              r.kind === 'sites' &&
              (all || r.payload.org_id === profile.org_id) &&
              pickupSiteAllowed(profile, r.payload.id),
          )
          .map((r: any) => r.payload),
        vehicles: active
          .filter(
            (r: any) =>
              r.kind === 'vehicles' &&
              (all || r.payload.org_id === profile.org_id),
          )
          .map((r: any) => r.payload),
        drivers: active
          .filter(
            (r: any) =>
              r.kind === 'drivers' &&
              (all || r.payload.org_id === profile.org_id),
          )
          .map((r: any) => r.payload),
        users: active
          .filter(
            (r: any) =>
              r.kind === 'users' &&
              r.payload.system_role === 'LIVREUR' &&
              (all || r.payload.org_id === profile.org_id),
          )
          .map((r: any) => r.payload),
      })
    }
    if ((path === '/tours' || path === '/pickups') && req.method === 'POST') {
      const tour = {
        id: crypto.randomUUID(),
        tour_code: String(body.tour_code ?? '').trim(),
        marketeur_org_id: body.marketeur_org_id,
        type: body.type,
        execution_mode: body.execution_mode,
        requested_quantity: Number(body.requested_quantity),
        vehicle_id: body.vehicle_id ?? null,
        driver_id: body.driver_id ?? null,
        livreur_user_id: body.livreur_user_id ?? null,
        transporter_org_id: body.transporter_org_id ?? null,
        status:
          body.execution_mode === 'INTERNAL'
            ? 'PLANNED'
            : 'PENDINGTRANSPORTERACK',
        created_at: new Date().toISOString(),
        created_by: profile.account_id,
        checkpoints: [] as any[],
      }
      if (
        !(path === '/pickups'
          ? canPlanPickup(profile, tour.marketeur_org_id)
          : writable(profile, tour))
      )
        fail(403, 'Organisation non autorisée.')
      if (
        !['VRAC', 'BOUTEILLES50KG'].includes(tour.type) ||
        !['INTERNAL', 'EXTERNAL'].includes(tour.execution_mode) ||
        !Number.isFinite(tour.requested_quantity) ||
        tour.requested_quantity <= 0 ||
        !tour.tour_code
      )
        fail(400, 'Données de tournée invalides.')
      if (path === '/pickups') {
        if (
          tour.type === 'BOUTEILLES50KG' &&
          !Number.isSafeInteger(tour.requested_quantity)
        )
          fail(400, 'Le nombre de bouteilles doit être entier.')
        if (!pickupSiteAllowed(profile, body.destination_site_id))
          fail(403, 'Site destinataire non affecté.')
        if (tour.execution_mode !== 'INTERNAL')
          fail(400, 'Affectez votre propre équipage à cet enlèvement.')
        const source = await resource('sites', body.source_site_id)
        const destination = await resource('sites', body.destination_site_id)
        const supplier = source
          ? await resource('organizations', source.org_id)
          : null
        if (
          !source ||
          source.deleted_at ||
          source.is_active === false ||
          !supplier ||
          !isPickupSupplier(supplier)
        )
          fail(400, 'Sélectionnez un dépôt SNH ou SCDP actif.')
        if (
          !destination ||
          destination.deleted_at ||
          destination.is_active === false ||
          destination.org_id !== tour.marketeur_org_id ||
          destination.id === source.id
        )
          fail(403, 'Le site destinataire doit appartenir au marketeur.')
        if (
          !body.scheduled_at ||
          !Number.isFinite(Date.parse(body.scheduled_at))
        )
          fail(400, 'Date de planification invalide.')
        Object.assign(tour, {
          mission_kind: 'PICKUP',
          pickup_status: 'VALIDATED',
          scheduled_at: new Date(body.scheduled_at).toISOString(),
          source_site_id: source.id,
          destination_site_id: destination.id,
        })
        body.checkpoints = [
          {
            site_id: source.id,
            sequence: 1,
            expected_quantity: tour.requested_quantity,
          },
          {
            site_id: destination.id,
            sequence: 2,
            expected_quantity: tour.requested_quantity,
          },
        ]
      }
      if (tour.execution_mode === 'INTERNAL') await validateCrew(tour)
      else {
        const transporter = await resource(
          'organizations',
          tour.transporter_org_id,
        )
        if (
          !transporter ||
          transporter.type !== 'TRANSPORTEUR' ||
          tour.driver_id ||
          tour.livreur_user_id ||
          tour.vehicle_id
        )
          fail(400, 'Transporteur externe invalide.')
      }
      if (!Array.isArray(body.checkpoints) || body.checkpoints.length < 2)
        fail(400, 'Au moins deux étapes sont nécessaires.')
      tour.checkpoints = await Promise.all(
        body.checkpoints.map((cp: any, i: number) => checkpoint(cp, tour, i)),
      )
      if (
        new Set(tour.checkpoints.map((cp) => cp.sequence)).size !==
        tour.checkpoints.length
      )
        fail(400, 'Séquences dupliquées.')
      tour.checkpoints.sort((a, b) => a.sequence - b.sequence)
      return reply(await save(tour), 201)
    }
    const match = path.match(/^\/tours\/([^/]+)(?:\/(.+))?$/)
    if (match) {
      const rows = await rest(
        `dispatch_tours?id=eq.${encodeURIComponent(match[1])}`,
        'GET',
        undefined,
        token,
      )
      if (!rows[0]) fail(404, 'Tournée introuvable ou non affectée.')
      const { payload: tour, revision } = rows[0]
      const action = match[2]
      if (req.method === 'GET' && action === 'documents') {
        const documents = []
        if (tour.loading?.order_image_path)
          documents.push({
            id: 'loading',
            label:
              tour.mission_kind === 'PICKUP'
                ? 'Bon d’enlèvement'
                : 'Bon de chargement',
            captured_at: tour.loading.validated_at,
            path: tour.loading.order_image_path,
          })
        for (const cp of tour.checkpoints ?? [])
          if (cp.proof_image_path)
            documents.push({
              id: cp.id,
              label: `Bon de réception — ${cp.name}`,
              captured_at: cp.completed_at,
              path: cp.proof_image_path,
            })
        for (const doc of tour.extra_documents ?? [])
          if (doc.path)
            documents.push({
              id: doc.id,
              label: doc.label,
              captured_at: doc.captured_at,
              path: doc.path,
            })
        const signed = await Promise.all(
          documents.map(async ({ path, ...document }) => {
            if (!path.startsWith(`${tour.id}/`))
              fail(403, 'Document hors mission.')
            const result = await storage(
              `object/sign/dispatch-proofs/${path}`,
              'POST',
              JSON.stringify({ expiresIn: await proofExpiry() }),
            )
            return { ...document, url: `${base}/storage/v1${result.signedURL}` }
          }),
        )
        return reply(signed)
      }
      if (req.method === 'POST' && action === 'documents') {
        const body = await req.json().catch(() => ({}))
        const rawBase64 =
          body.file_base64 ||
          body.document_base64 ||
          body.proof_base64 ||
          body.order_image_base64
        if (!rawBase64 || typeof rawBase64 !== 'string')
          fail(400, 'Fichier base64 manquant.')
        const path = await uploadOrderImage(
          tour.id,
          rawBase64.replace(/^data:[^;]+;base64,/, ''),
        )
        const label =
          body.label ||
          (tour.mission_kind === 'PICKUP'
            ? 'Bon d’enlèvement (PDF)'
            : 'Bon de livraison (PDF)')
        const docId = body.checkpoint_id || crypto.randomUUID()
        if (body.checkpoint_id) {
          const cp = (tour.checkpoints ?? []).find(
            (c: any) => c.id === body.checkpoint_id,
          )
          if (cp) cp.proof_image_path = path
        } else if (!tour.loading?.order_image_path) {
          if (!tour.loading) tour.loading = {}
          tour.loading.order_image_path = path
          tour.loading.validated_at =
            tour.loading.validated_at || new Date().toISOString()
        } else {
          if (!tour.extra_documents) tour.extra_documents = []
          tour.extra_documents.push({
            id: docId,
            label,
            path,
            captured_at: new Date().toISOString(),
          })
        }
        await save(tour, revision)
        const result = await storage(
          `object/sign/dispatch-proofs/${path}`,
          'POST',
          JSON.stringify({ expiresIn: await proofExpiry() }),
        )
        return reply({
          id: docId,
          label,
          captured_at: new Date().toISOString(),
          path,
          url: `${base}/storage/v1${result.signedURL}`,
        })
      }
      if (req.method === 'GET' && action === 'loading-proof') {
        const path = tour.loading?.order_image_path
        if (!path) fail(404, 'Aucun bon de commande disponible.')
        const signed = await storage(
          `object/sign/dispatch-proofs/${path}`,
          'POST',
          JSON.stringify({ expiresIn: await proofExpiry() }),
        )
        return reply({ url: `${base}/storage/v1${signed.signedURL}` })
      }
      if (req.method === 'GET')
        return reply(action === 'checkpoints' ? tour.checkpoints : tour)
      if (req.method !== 'POST') fail(405, 'Opération non prise en charge.')
      if (action === 'loading' || action === 'deliveries') {
        if (
          profile.system_role !== 'LIVREUR' ||
          tour.livreur_user_id !== profile.account_id
        )
          fail(403, 'Cette tournée ne vous est pas affectée.')
        const now = new Date().toISOString()
        if (action === 'loading') {
          if (tour.loading_validated) return reply(tour)
          const tags = validateLoading(
            tour,
            body.tags ?? [],
            typeof body.order_image_base64 === 'string' &&
              body.order_image_base64.length > 0,
          )
          const proof =
            tour.type === 'VRAC' || tour.mission_kind === 'PICKUP'
              ? await uploadOrderImage(tour.id, body.order_image_base64)
              : null
          recordLoading(tour, tags, proof, profile.account_id, now)
        } else {
          const existing = tour.checkpoints.find(
            (cp: any) => cp.id === body.checkpoint_id,
          )
          const alreadyCompleted = existing?.status === 'COMPLETED'
          recordDelivery(tour, body, profile.account_id, now)
          if (
            !alreadyCompleted &&
            typeof body.proof_image_base64 === 'string' &&
            body.proof_image_base64
          ) {
            existing.proof_image_path = await uploadOrderImage(
              tour.id,
              body.proof_image_base64,
            )
          }
        }
        return reply(await save(tour, revision))
      }
      if (action === 'cancel') {
        if (!writable(profile, tour)) fail(403, 'Annulation non autorisée.')
        if (
          !['PLANNED', 'ACKNOWLEDGED', 'DRAFT'].includes(tour.status) ||
          tour.loading_validated
        )
          fail(409, 'Une mission commencée ne peut pas être annulée.')
        tour.status = 'CANCELLED'
        if (tour.mission_kind === 'PICKUP') tour.pickup_status = 'CANCELLED'
      } else if (action === 'assign-driver' || action === 'assign-vehicle') {
        if (
          !writable(profile, tour) ||
          !['DRAFT', 'PLANNED', 'ACKNOWLEDGED'].includes(tour.status)
        )
          fail(403, 'Affectation non autorisée.')
        if (action === 'assign-driver') {
          tour.driver_id = url.searchParams.get('driverId') ?? tour.driver_id
          tour.livreur_user_id =
            url.searchParams.get('driverPersonId') ??
            body.livreur_user_id ??
            tour.livreur_user_id
        } else tour.vehicle_id = url.searchParams.get('vehicleId')
        await validateCrew(tour)
      } else if (action === 'checkpoints') {
        if (!writable(profile, tour)) fail(403, 'Modification non autorisée.')
        const existing = tour.checkpoints.find(
          (cp: any) => cp.sequence === body.sequence,
        )
        if (existing) return reply(existing)
        if (
          !['DRAFT', 'PLANNED', 'PENDINGTRANSPORTERACK'].includes(tour.status)
        )
          fail(409, 'Tournée déjà démarrée.')
        tour.checkpoints.push(
          await checkpoint(body, tour, tour.checkpoints.length),
        )
      } else if (
        action === 'plan' &&
        tour.status === 'PLANNED' &&
        writable(profile, tour)
      )
        return reply(tour)
      else if (action === 'start') {
        fail(
          409,
          'Validez le chargement. La tournée démarre à la première livraison confirmée.',
        )
      } else if (action === 'close') {
        if (
          profile.system_role !== 'LIVREUR' ||
          tour.livreur_user_id !== profile.account_id
        )
          fail(403, 'Clôture non autorisée.')
        if (tour.status === 'CLOSED') return reply(tour)
        if (
          !tour.started_at ||
          tour.checkpoints.some(
            (cp: any) => cp.sequence > 1 && cp.status !== 'COMPLETED',
          )
        )
          fail(409, 'Terminez toutes les livraisons avant la clôture.')
        tour.status = 'CLOSED'
        if (tour.mission_kind === 'PICKUP') tour.pickup_status = 'COMPLETED'
        tour.closed_at = new Date().toISOString()
        tour.activity = [
          ...(tour.activity ?? []),
          {
            id: crypto.randomUUID(),
            type: 'TOUR_CLOSED',
            actor_id: profile.account_id,
            at: tour.closed_at,
          },
        ]
      } else
        fail(
          405,
          'Cette opération ne fait pas partie du pilote de transmission.',
        )
      return reply(await save(tour, revision))
    }
    if (req.method === 'GET') {
      const [kind, id] = path.slice(1).split('/')
      const rows = await rest(
        `dispatch_resources?kind=eq.${encodeURIComponent(kind)}${id ? `&id=eq.${encodeURIComponent(id)}` : ''}`,
      )
      let data = rows
        .map((r: any) => r.payload)
        .filter((r: any) => !r.deleted_at)
      if (profile.org_type !== 'REGULATEUR') {
        if (['users', 'drivers', 'vehicles'].includes(kind))
          data = data.filter((r: any) => r.org_id === profile.org_id)
        if (kind === 'client-sites')
          data = data.filter(
            (r: any) => r.current_marketeur_org_id === profile.org_id,
          )
      }
      if (id) {
        if (!data[0]) fail(404, 'Ressource introuvable.')
        return reply(data[0])
      }
      return reply(data, 200, {
        page: 0,
        limit: data.length,
        total: data.length,
        pages: 1,
      })
    }
    fail(405, 'Opération non prise en charge.')
  } catch (error) {
    return reply(
      error instanceof HttpError || error instanceof ExecutionError
        ? error.message
        : 'Erreur du service de transmission.',
      error instanceof HttpError || error instanceof ExecutionError
        ? error.status
        : 500,
    )
  }
})
