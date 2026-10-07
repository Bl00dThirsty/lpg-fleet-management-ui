-- Migration: activity_statuses table + seed (4 activities) + transporter RLS scope
-- Date: 2026-10-07

create table if not exists public.activity_statuses (
  activity text not null check (activity in ('TOUR', 'PICKUP', 'CHECKPOINT', 'CONTRACT')),
  status_value text not null,
  code varchar(4) not null,
  label text not null,
  description text not null,
  tone text not null default 'slate' check (tone in ('slate', 'sky', 'blue', 'amber', 'emerald', 'rose')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (activity, status_value)
);

create index if not exists idx_activity_statuses_activity on public.activity_statuses(activity, sort_order);

-- Enable RLS & public read access for reference data
alter table public.activity_statuses enable row level security;
revoke all on public.activity_statuses from anon, authenticated;
grant select on public.activity_statuses to anon, authenticated;

drop policy if exists read_activity_statuses on public.activity_statuses;
create policy read_activity_statuses on public.activity_statuses
  for select to authenticated, anon
  using (true);

-- Seed: 8 Statuts Tournées (TOUR)
insert into public.activity_statuses (activity, status_value, code, label, description, tone, sort_order)
values
  ('TOUR', 'DRAFT', 'BRN', 'Brouillon', 'Tournée en cours de préparation, non encore transmise.', 'slate', 1),
  ('TOUR', 'PLANNED', 'PLN', 'Planifiée', 'Tournée planifiée et validée, prête pour le chargement au dépôt.', 'sky', 2),
  ('TOUR', 'PENDINGTRANSPORTERACK', 'ATT', 'En attente accusé transporteur', 'Tournée externalisée transmise au transporteur, en attente d''affectation de l''équipage.', 'amber', 3),
  ('TOUR', 'ACKNOWLEDGED', 'ACC', 'Accusé de réception validé', 'Tournée acceptée par le transporteur avec véhicule, chauffeur et convoyeur assignés.', 'blue', 4),
  ('TOUR', 'INPROGRESS', 'CRS', 'En transit / En cours', 'Cargaison chargée au dépôt, camion en rotation vers les sites clients.', 'emerald', 5),
  ('TOUR', 'COMPLETED', 'TRM', 'Livrée / Clôturée', 'Toutes les livraisons clients ont été effectuées et attestées par preuve de dépotage.', 'emerald', 6),
  ('TOUR', 'CANCELLED', 'ANN', 'Annulée', 'Tournée annulée avant chargement de la cargaison.', 'rose', 7),
  ('TOUR', 'INCIDENT', 'INC', 'Incident / Litige', 'Anomalie ou écart de cargaison majeur constaté pendant la tournée.', 'rose', 8)
on conflict (activity, status_value) do update
set code = excluded.code,
    label = excluded.label,
    description = excluded.description,
    tone = excluded.tone,
    sort_order = excluded.sort_order,
    updated_at = now();

-- Seed: 5 Statuts Enlèvements (PICKUP)
insert into public.activity_statuses (activity, status_value, code, label, description, tone, sort_order)
values
  ('PICKUP', 'DRAFT', 'BRN', 'Brouillon', 'Demande d''enlèvement en cours de saisie.', 'slate', 1),
  ('PICKUP', 'VALIDATED', 'VAL', 'Planifié / Validé', 'Enlèvement validé sur quota au dépôt amont (SCDP/SNH).', 'sky', 2),
  ('PICKUP', 'INPROGRESS', 'CRS', 'En cours de chargement', 'Camion présent au dépôt source pour chargement et pesée.', 'amber', 3),
  ('PICKUP', 'COMPLETED', 'TRM', 'Enlevé & Scellé', 'Chargement achevé, scellés vérifiés et bon d''enlèvement émis.', 'emerald', 4),
  ('PICKUP', 'CANCELLED', 'ANN', 'Annulé', 'Demande d''enlèvement annulée.', 'rose', 5)
on conflict (activity, status_value) do update
set code = excluded.code,
    label = excluded.label,
    description = excluded.description,
    tone = excluded.tone,
    sort_order = excluded.sort_order,
    updated_at = now();

-- Seed: 4 Statuts Checkpoints (CHECKPOINT)
insert into public.activity_statuses (activity, status_value, code, label, description, tone, sort_order)
values
  ('CHECKPOINT', 'PENDING', 'ATT', 'En attente', 'Étape en attente d''exécution.', 'slate', 1),
  ('CHECKPOINT', 'INPROGRESS', 'CRS', 'En cours', 'Camion sur site pour opération de contrôle, chargement ou dépotage.', 'amber', 2),
  ('CHECKPOINT', 'COMPLETED', 'VAL', 'Validé / Dépoté', 'Pesée, livraison ou passage validé avec justificatif horodaté.', 'emerald', 3),
  ('CHECKPOINT', 'SKIPPED', 'IGN', 'Contourné / Ignoré', 'Étape non exécutée lors du trajet.', 'rose', 4)
on conflict (activity, status_value) do update
set code = excluded.code,
    label = excluded.label,
    description = excluded.description,
    tone = excluded.tone,
    sort_order = excluded.sort_order,
    updated_at = now();

-- Seed: 7 Statuts Contrats (CONTRACT)
insert into public.activity_statuses (activity, status_value, code, label, description, tone, sort_order)
values
  ('CONTRACT', 'PENDING', 'ATT', 'En attente validation', 'Contrat déclaré en attente d''instruction initiale.', 'amber', 1),
  ('CONTRACT', 'PENDINGTRANSPORTERACK', 'ACK', 'En attente acceptation transporteur', 'Contrat transmis au transporteur pour signature et acceptation.', 'amber', 2),
  ('CONTRACT', 'ACTIVE', 'ACT', 'Actif', 'Contrat en vigueur, éligible pour l''externalisation des tournées.', 'emerald', 3),
  ('CONTRACT', 'UPCOMING', 'AVN', 'À venir', 'Contrat validé dont la date de début est future.', 'sky', 4),
  ('CONTRACT', 'EXPIRED', 'EXP', 'Expiré', 'Contrat dont la date d''échéance est dépassée.', 'slate', 5),
  ('CONTRACT', 'SUSPENDED', 'SUS', 'Suspendu', 'Contrat temporairement gelé pour motif administratif ou réglementaire.', 'rose', 6),
  ('CONTRACT', 'CANCELLED', 'RES', 'Résilié', 'Contrat rompu ou annulé de façon définitive.', 'rose', 7)
on conflict (activity, status_value) do update
set code = excluded.code,
    label = excluded.label,
    description = excluded.description,
    tone = excluded.tone,
    sort_order = excluded.sort_order,
    updated_at = now();

-- RLS Update: Extend assigned_tours to include TRANSPORTEUR role
drop policy if exists assigned_tours on public.dispatch_tours;
create policy assigned_tours on public.dispatch_tours
  for select to authenticated
  using (
    exists (
      select 1 from public.dispatch_profiles p
      where p.auth_id = (select auth.uid()) and (
        (p.org_type = 'REGULATEUR' and p.system_role in ('SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'AGENT', 'INTEGRATEUR'))
        or (p.system_role = 'MARKETEUR' and p.org_id = dispatch_tours.marketeur_org_id)
        or (p.system_role = 'TRANSPORTEUR' and p.org_id = dispatch_tours.payload->>'transporter_org_id')
        or (p.system_role = 'LIVREUR' and p.account_id = dispatch_tours.livreur_user_id)
      )
    )
  );
