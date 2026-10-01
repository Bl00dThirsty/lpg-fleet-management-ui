create table public.dispatch_profiles (
  auth_id uuid primary key references auth.users(id) on delete cascade,
  account_id text not null unique,
  org_id text not null,
  system_role text not null,
  org_type text not null,
  details jsonb not null
);
create table public.dispatch_resources (
  kind text not null, id text not null, payload jsonb not null,
  primary key (kind,id)
);
create table public.dispatch_tours (
  id uuid primary key default gen_random_uuid(),
  marketeur_org_id text not null,
  livreur_user_id text,
  payload jsonb not null,
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);
create index dispatch_tours_marketer on public.dispatch_tours(marketeur_org_id);
create index dispatch_tours_livreur on public.dispatch_tours(livreur_user_id);
alter table public.dispatch_profiles enable row level security;
alter table public.dispatch_resources enable row level security;
alter table public.dispatch_tours enable row level security;
revoke all on public.dispatch_profiles, public.dispatch_resources, public.dispatch_tours from anon, authenticated;
grant select on public.dispatch_profiles, public.dispatch_tours to authenticated;
create policy own_profile on public.dispatch_profiles for select to authenticated using (auth_id = (select auth.uid()));
create policy assigned_tours on public.dispatch_tours for select to authenticated using (
  exists (select 1 from public.dispatch_profiles p where p.auth_id = (select auth.uid()) and (
    (p.org_type = 'REGULATEUR' and p.system_role in ('SUPERADMIN','ADMIN','SUPERVISOR','AGENT','INTEGRATEUR'))
    or (p.system_role = 'MARKETEUR' and p.org_id = dispatch_tours.marketeur_org_id)
    or (p.system_role = 'LIVREUR' and p.account_id = dispatch_tours.livreur_user_id)
  ))
);
alter publication supabase_realtime add table public.dispatch_tours;
