// Dedicated POC gateway. Authentication is verified with Supabase Auth on every request.
const base = Deno.env.get('SUPABASE_URL')!;
const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const fail = (status: number, message: string): never => { throw new HttpError(status, message); };
const reply = (data: unknown, status = 200, pagination?: unknown) => new Response(JSON.stringify({ success: status < 400, message: status < 400 ? 'OK' : String(data), data: status < 400 ? data : null, ...(pagination ? { pagination } : {}) }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
async function rest(path: string, method = 'GET', body?: unknown, token = adminKey) {
  const res = await fetch(`${base}/rest/v1/${path}`, { method, headers: { apikey: adminKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation,resolution=merge-duplicates' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!res.ok) { console.error('Database operation failed', res.status); fail(502, 'Enregistrement impossible.'); }
  return res.status === 204 ? null : res.json();
}
async function resource(kind: string, id: string) {
  const rows = await rest(`dispatch_resources?kind=eq.${encodeURIComponent(kind)}&id=eq.${encodeURIComponent(id)}`);
  return rows[0]?.payload;
}
function writable(profile: any, tour: any) {
  return (profile.org_type === 'REGULATEUR' && ['SUPERADMIN','ADMIN'].includes(profile.system_role)) ||
    (profile.system_role === 'MARKETEUR' && profile.org_id === tour.marketeur_org_id);
}
async function validateCrew(tour: any) {
  const org = tour.execution_mode === 'EXTERNAL' ? tour.transporter_org_id : tour.marketeur_org_id;
  for (const [kind, field] of [['drivers','driver_id'],['users','livreur_user_id'],['vehicles','vehicle_id']]) {
    if (!tour[field]) fail(400, 'Véhicule, chauffeur et livreur obligatoires.');
    const row = await resource(kind, tour[field]);
    if (!row || row.org_id !== org || row.is_active === false || row.deleted_at || (kind === 'users' && row.system_role !== 'LIVREUR') || (kind === 'vehicles' && row.type !== tour.type)) fail(403, 'Affectation hors organisation ou personnel indisponible.');
  }
}
async function save(tour: any, revision?: number) {
  const row = { id: tour.id, marketeur_org_id: tour.marketeur_org_id, livreur_user_id: tour.livreur_user_id ?? null, payload: { ...tour, updated_at: new Date().toISOString() }, revision: (revision ?? 0) + 1, updated_at: new Date().toISOString() };
  const result = await rest(revision == null ? 'dispatch_tours' : `dispatch_tours?id=eq.${tour.id}&revision=eq.${revision}`, revision == null ? 'POST' : 'PATCH', row);
  if (!result?.length) fail(409, 'Cette tournée a été modifiée. Actualisez avant de réessayer.');
  return result[0].payload;
}
async function checkpoint(input: any, tour: any, index: number) {
  let siteId = input.site_id ?? input.siteId ?? null;
  let clientId = input.client_site_id ?? input.clientSiteId ?? null;
  if (siteId && await resource('client-sites', siteId)) { clientId = siteId; siteId = null; }
  const site = await resource(clientId ? 'client-sites' : 'sites', clientId ?? siteId ?? '');
  if (!site) fail(400, 'Site de tournée introuvable.');
  if (clientId && site.current_marketeur_org_id !== tour.marketeur_org_id) fail(403, 'Site client hors organisation.');
  return { id: crypto.randomUUID(), tournee_id: tour.id, tourneeId: tour.id, site_id: siteId, client_site_id: clientId, sequence: input.sequence ?? index + 1, expected_quantity: input.expected_quantity ?? input.planned_quantity ?? 0, plannedQuantity: input.expected_quantity ?? input.planned_quantity ?? 0, status: 'PENDING', expected_arrival: input.expected_arrival ?? null, latitude: site.geo_point?.[1], longitude: site.geo_point?.[0], name: site.name };
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^.*?\/gpl-dispatch/, '').replace(/\/$/, '') || '/';
    const body = ['POST','PUT','PATCH'].includes(req.method) ? await req.json().catch(() => ({})) : {};
    if (['/auth/login','/auth/refresh'].includes(path) && req.method === 'POST') {
      const refresh = path.endsWith('/refresh');
      const res = await fetch(`${base}/auth/v1/token?grant_type=${refresh ? 'refresh_token' : 'password'}`, { method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify(refresh ? { refresh_token: body.refresh_token } : { email: body.email ?? body.username, password: body.password }) });
      if (!res.ok) fail(401, 'Identifiants invalides ou session expirée.');
      const auth = await res.json();
      const profiles = await rest(`dispatch_profiles?auth_id=eq.${auth.user.id}`);
      if (!profiles[0]) fail(403, 'Compte non autorisé pour cette application.');
      const profile = profiles[0];
      return reply({ access_token: auth.access_token, accessToken: auth.access_token, refresh_token: auth.refresh_token, user: { ...profile.details, username: profile.account_id, firstName: profile.details.first_name, lastName: profile.details.last_name } });
    }
    const authorization = req.headers.get('Authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) fail(401, 'Authentification requise.');
    const token = authorization.slice(7);
    const authRes = await fetch(`${base}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: authorization } });
    if (!authRes.ok) fail(401, 'Session expirée. Reconnectez-vous.');
    const auth = await authRes.json();
    const profiles = await rest(`dispatch_profiles?auth_id=eq.${auth.id}`);
    const profile = profiles[0];
    if (!profile) fail(403, 'Compte non autorisé.');
    if (path === '/me') return reply(profile.details);
    if (path === '/auth/logout' && req.method === 'POST') {
      await fetch(`${base}/auth/v1/logout`, { method: 'POST', headers: { apikey: anonKey, Authorization: authorization } });
      return reply(null);
    }
    if ((path === '/tours' || path === '/delivery-tours') && req.method === 'GET') {
      const rows = await rest('dispatch_tours?select=payload&order=updated_at.desc', 'GET', undefined, token);
      const page = Math.max(0, Number(url.searchParams.get('page') ?? 0));
      const size = Math.min(500, Math.max(1, Number(url.searchParams.get('size') ?? 50)));
      const tours = rows.map((row: any) => row.payload);
      return reply(tours.slice(page * size, (page + 1) * size), 200, { page, limit: size, total: tours.length, pages: Math.ceil(tours.length / size) });
    }
    if (path === '/tours' && req.method === 'POST') {
      const tour = { id: crypto.randomUUID(), tour_code: String(body.tour_code ?? '').trim(), marketeur_org_id: body.marketeur_org_id, type: body.type, execution_mode: body.execution_mode, requested_quantity: Number(body.requested_quantity), vehicle_id: body.vehicle_id ?? null, driver_id: body.driver_id ?? null, livreur_user_id: body.livreur_user_id ?? null, transporter_org_id: body.transporter_org_id ?? null, status: body.execution_mode === 'INTERNAL' ? 'PLANNED' : 'PENDINGTRANSPORTERACK', created_at: new Date().toISOString(), created_by: profile.account_id, checkpoints: [] as any[] };
      if (!writable(profile, tour)) fail(403, 'Organisation non autorisée.');
      if (!['VRAC','BOUTEILLES50KG'].includes(tour.type) || !['INTERNAL','EXTERNAL'].includes(tour.execution_mode) || !Number.isFinite(tour.requested_quantity) || tour.requested_quantity <= 0 || !tour.tour_code) fail(400, 'Données de tournée invalides.');
      if (tour.execution_mode === 'INTERNAL') await validateCrew(tour);
      else {
        const transporter = await resource('organizations', tour.transporter_org_id);
        if (!transporter || transporter.type !== 'TRANSPORTEUR' || tour.driver_id || tour.livreur_user_id || tour.vehicle_id) fail(400, 'Transporteur externe invalide.');
      }
      if (!Array.isArray(body.checkpoints) || body.checkpoints.length < 2) fail(400, 'Au moins deux étapes sont nécessaires.');
      tour.checkpoints = await Promise.all(body.checkpoints.map((cp: any, i: number) => checkpoint(cp, tour, i)));
      if (new Set(tour.checkpoints.map(cp => cp.sequence)).size !== tour.checkpoints.length) fail(400, 'Séquences dupliquées.');
      tour.checkpoints.sort((a, b) => a.sequence - b.sequence);
      return reply(await save(tour), 201);
    }
    const match = path.match(/^\/tours\/([^/]+)(?:\/(.+))?$/);
    if (match) {
      const rows = await rest(`dispatch_tours?id=eq.${encodeURIComponent(match[1])}`, 'GET', undefined, token);
      if (!rows[0]) fail(404, 'Tournée introuvable ou non affectée.');
      const { payload: tour, revision } = rows[0];
      const action = match[2];
      if (req.method === 'GET') return reply(action === 'checkpoints' ? tour.checkpoints : tour);
      if (req.method !== 'POST') fail(405, 'Opération non prise en charge.');
      if (action === 'assign-driver' || action === 'assign-vehicle') {
        if (!writable(profile, tour) || !['DRAFT','PLANNED','ACKNOWLEDGED'].includes(tour.status)) fail(403, 'Affectation non autorisée.');
        if (action === 'assign-driver') { tour.driver_id = url.searchParams.get('driverId') ?? tour.driver_id; tour.livreur_user_id = url.searchParams.get('driverPersonId') ?? body.livreur_user_id ?? tour.livreur_user_id; }
        else tour.vehicle_id = url.searchParams.get('vehicleId');
        await validateCrew(tour);
      } else if (action === 'checkpoints') {
        if (!writable(profile, tour)) fail(403, 'Modification non autorisée.');
        const existing = tour.checkpoints.find((cp: any) => cp.sequence === body.sequence);
        if (existing) return reply(existing);
        if (!['DRAFT','PLANNED','PENDINGTRANSPORTERACK'].includes(tour.status)) fail(409, 'Tournée déjà démarrée.');
        tour.checkpoints.push(await checkpoint(body, tour, tour.checkpoints.length));
      } else if (action === 'plan' && tour.status === 'PLANNED' && writable(profile, tour)) return reply(tour);
      else if (action === 'start') {
        if (profile.system_role !== 'LIVREUR' || tour.livreur_user_id !== profile.account_id) fail(403, 'Cette tournée ne vous est pas affectée.');
        if (!['PLANNED','ACKNOWLEDGED'].includes(tour.status)) fail(409, 'Cette tournée ne peut pas démarrer.');
        tour.status = 'INPROGRESS'; tour.started_at = new Date().toISOString();
        const loaded = url.searchParams.get('loadedQuantity');
        if (loaded !== null && (!Number.isFinite(Number(loaded)) || Number(loaded) < 0)) fail(400, 'Quantité chargée invalide.');
        tour.loaded_quantity = loaded === null ? null : Number(loaded);
      } else fail(405, 'Cette opération ne fait pas partie du pilote de transmission.');
      return reply(await save(tour, revision));
    }
    if (req.method === 'GET') {
      const [kind, id] = path.slice(1).split('/');
      const rows = await rest(`dispatch_resources?kind=eq.${encodeURIComponent(kind)}${id ? `&id=eq.${encodeURIComponent(id)}` : ''}`);
      let data = rows.map((r: any) => r.payload).filter((r: any) => !r.deleted_at);
      if (profile.org_type !== 'REGULATEUR') {
        if (['users','drivers','vehicles'].includes(kind)) data = data.filter((r: any) => r.org_id === profile.org_id);
        if (kind === 'client-sites') data = data.filter((r: any) => r.current_marketeur_org_id === profile.org_id);
      }
      if (id) { if (!data[0]) fail(404, 'Ressource introuvable.'); return reply(data[0]); }
      return reply(data, 200, { page: 0, limit: data.length, total: data.length, pages: 1 });
    }
    fail(405, 'Opération non prise en charge.');
  } catch (error) { return reply(error instanceof HttpError ? error.message : 'Erreur du service de transmission.', error instanceof HttpError ? error.status : 500); }
});
