# 08 — CREATE FORMS & CREATION WORKFLOWS (derived from `csph_gpl_schema_v6_2.sql`)

This document walks every table that a user can create a row in, in **dependency order** (you cannot create B before A if B has a `NOT NULL` FK to A). For each: the form fields, which are required vs optional, validation rules (from CHECK constraints), defaults applied automatically, and who (which role) triggers the creation in the real workflow.

Legend: 🔴 required · 🟡 optional · 🤖 system-set (not on the form) · **[CHECK]** = DB-enforced validation rule the form must mirror client-side.

---

## LAYER 0 — Reference Data (seeded once, rarely user-created)

### Region
Pre-seeded (10 rows). No create form — reference dropdown only.
`code` (enum: ADAMAOUA, CENTRE, EST, EXTREMENORD, LITTORAL, NORD, NORDOUEST, OUEST, SUD, SUDOUEST)

---

## LAYER 1 — Organization (root of everything)

### Create Organization — `organizations`
**Actor:** SUPERADMIN only.

| Field | Req | Type/Validation |
|---|---|---|
| name | 🔴 | VARCHAR(255) |
| type | 🔴 | enum: REGULATEUR, DEPOT, MARKETEUR, TRANSPORTEUR, CLIENT |
| registration_number | 🟡 | VARCHAR(100), RC number |
| tax_id | 🟡 | VARCHAR(100) |
| is_active | 🤖 | default `true` |
| operational_site_count / client_site_count / vehicle_count / driver_count / user_count | 🤖 | all default 0, denormalized counters maintained by app on every child create/delete — **never editable on this form** |

**Workflow note:** the `type` chosen here determines which subsequent forms become relevant (e.g. only `MARKETEUR` orgs create declarations/tours; only `CLIENT` orgs get a `clients` profile).

---

## LAYER 2 — Users & Access (depends on Organization)

### Create User — `users`
**Actor:** SUPERADMIN (any role) or ADMIN (role ≤ own hierarchy_level).

| Field | Req | Validation |
|---|---|---|
| email | 🔴 | VARCHAR(255), UNIQUE |
| password_hash | 🔴 | set via temp-password flow, never entered raw on the form |
| first_name | 🔴 | VARCHAR(100) |
| last_name | 🔴 | VARCHAR(100) |
| system_role | 🔴 | enum: SUPERADMIN, ADMIN, SUPERVISOR, INTEGRATEUR, AGENT, MARKETEUR, LIVREUR, TRANSPORTEUR — **must be ≤ creator's hierarchy_level [app-layer rule]** |
| org_id | 🟡 | FK organizations — required in practice for every role except SUPERADMIN |
| must_change_password | 🤖 | default `true` on admin-created accounts |
| mfa_status | 🤖 | default `DISABLED`, flips to `PENDINGSETUP` on first login if role ∈ `settings.mfa.enforced_for_roles` |

### Create Custom Role — `custom_roles`
**Actor:** org ADMIN.
| Field | Req | Validation |
|---|---|---|
| org_id | 🔴 | FK organizations |
| name | 🔴 | UNIQUE per `(org_id, name)` |
| description | 🟡 | |
| permissions_json | 🔴 | JSONB, e.g. `{"tours.read": true, "tours.write": true}` |
| is_active | 🤖 | default `true` |

### Assign Custom Role to User — `user_custom_roles`
🔴 user_id · 🔴 custom_role_id · 🟡 site_id (scope to one site). UNIQUE `(user_id, custom_role_id, site_id)`.

### Assign Site to User — `user_site_assignments`
🔴 user_id · 🔴 site_id · 🟡 is_primary (default false). UNIQUE `(user_id, site_id)`.

### Enable MFA — `user_mfa`
🔴 user_id (UNIQUE, one per user) · 🔴 mfa_type (TOTP/SMS/EMAIL) · 🤖 secret_encrypted, backup_codes_hash generated server-side.

### Register Integration Auth — `integration_auth`
**Actor:** SUPERADMIN/INTEGRATEUR, for machine/device-integration users.
🔴 user_id (UNIQUE) · 🔴 auth_key_hash · 🟡 certificate_pem · 🟡 certificate_expiry · 🟡 allowed_ip_ranges (INET[]).

---

## LAYER 3 — Sites, Clients & Fleet (depend on Organization)

> ⚠️ **Scoping correction (applies to every form below that a MARKETEUR or TRANSPORTEUR user fills out):** MARKETEUR and TRANSPORTEUR users are **site-scoped via `user_site_assignments`**, not org-wide — same model as AGENT/SUPERVISOR. This has a direct, practical effect on these creation forms: `vehicles` and `drivers` have **no `site_id` column** in the live schema, only `org_id`. That means as soon as a MARKETEUR/TRANSPORTEUR user creates a vehicle or driver today, there is no field to record *which of their assigned sites* it belongs to — the row is only attributable at the org level. Two options, both noted inline below where relevant:
> - **(A) Schema fix:** add `home_site_id UUID` (FK → `sites`) to `vehicles` and `drivers`, required when the creating user's role is MARKETEUR/TRANSPORTEUR, so the create form can capture it directly.
> - **(B) No schema change:** keep these forms org-scoped as a deliberate, documented exception, and rely on `pickup_requests`/`delivery_tours`/`checkpoints` (which already carry real site references) to derive "which sites has this vehicle/driver actually operated at" retroactively for any scoped view.
> This document assumes **(A)** going forward (it's the cleaner fit for the stated requirement) and marks the new field 🆕 on the affected forms. If you choose (B) instead, drop the 🆕 fields below and see the note in each form.

### Create Site — `sites`
**Actor:** MARKETEUR/DEPOT-org staff, ADMIN.
| Field | Req | Validation |
|---|---|---|
| org_id | 🔴 | FK organizations |
| region | 🔴 | enum |
| name | 🔴 | UNIQUE per `(org_id, name)` |
| functions | 🔴 | `site_function[]`, **[CHECK chk_sites_functions]** array must be non-empty — at least one of CENTREEMPLISSEUR, ENTREPOT, POINTAPPROVISIONABLE |
| address | 🟡 | |
| geo_point | 🟡 | captured via map picker or first delivery scan; starts null |
| status | 🤖 | default `UNASSIGNED` |
| geo_confidence_score | 🤖 | default 0, rises with delivery activity |

**Scoping note:** creating a *new* site is inherently the one fleet-adjacent form that stays org/ADMIN-level — a MARKETEUR user can't be "site-scoped to a site that doesn't exist yet." In practice this form is filled by ADMIN or by a MARKETEUR user acting in an org-level onboarding capacity, and the newly created site should be immediately followed by a `user_site_assignments` grant if the creating MARKETEUR user is meant to operate it day-to-day.

### Create Client Profile — `clients`
**Actor:** ADMIN/MARKETEUR, for an org of `type=CLIENT`.
🔴 org_id (UNIQUE, one profile per client org) · 🟡 primary_contact_name/phone/email · 🟡 billing_address · 🟡 payment_terms (default 30 days) · 🟡 credit_limit (default 0) · 🟡 tax_id · 🟡 industry_sector.

### Create Client Site — `client_sites`
**Actor:** MARKETEUR (this is the delivery destination they're onboarding for a client).
| Field | Req | Validation |
|---|---|---|
| client_org_id | 🔴 | FK organizations (type=CLIENT) |
| region | 🔴 | |
| name | 🔴 | UNIQUE per `(client_org_id, name)` |
| address | 🟡 | |
| current_marketeur_org_id | 🟡 | which marketeur currently supplies this site |
| site_contact_name/phone | 🟡 | |
| status | 🤖 | default `UNASSIGNED` |

**Scoping note:** `client_sites` also has no `site_id`/depot-of-origin column linking it back to which of the marketeur's own sites services it. If a MARKETEUR user is scoped to Site A, should they see client sites regardless of which depot supplies them, or only client sites currently supplied *from* Site A? The schema doesn't record that relationship explicitly — `checkpoints` records it only per-tour, after the fact. Worth a product decision; the practical fallback is "a MARKETEUR user sees a client_site once a checkpoint at one of their assigned sites has touched it," which is retroactive and won't work for a brand-new client onboarding form (the marketeur creating this row won't yet have a checkpoint proving the link). Recommend adding an explicit `origin_site_id` column to `client_sites` if clean scoping matters here.

### Create Vehicle — `vehicles`
**Actor:** MARKETEUR/TRANSPORTEUR fleet staff — **site-scoped user**.
| Field | Req | Validation |
|---|---|---|
| license_plate | 🔴 | UNIQUE, format `AB1234C` (Cameroon plates) |
| type | 🔴 | VRAC or BOUTEILLES50KG |
| org_id | 🔴 | |
| home_site_id 🆕 | 🔴 *(if option A adopted)* | FK → sites; must be one of the creating user's `user_site_assignments` rows (server-side check, not just a form default) — **this field does not exist in the live v6.2 schema; requires a migration before this form can capture it** |
| max_volume | conditional | **[CHECK chk_vehicle_capacity]** required + >0 if type=VRAC, must be NULL if BOUTEILLES50KG |
| max_bottle_count | conditional | required + >0 if type=BOUTEILLES50KG, must be NULL if VRAC |
| certificate_number | conditional | **[CHECK chk_vehicle_vrac_cert]** required if type=VRAC |
| certificate_expiry_at | conditional | required if type=VRAC |
| certificate_issued_at | 🟡 | |
| certificate_url | 🟡 | uploaded PDF/image → MinIO |
| tare_weight | 🟡 | ≥0 |

**Form UX implication:** the type selector must dynamically toggle which capacity + certificate fields are shown/required. **If option B is chosen instead of the schema migration:** drop `home_site_id` from this form entirely, and every "my fleet" view for MARKETEUR/TRANSPORTEUR users must explicitly say "showing all vehicles for your organization" rather than implying it's filtered to their assigned site — don't let the UI silently claim a scoping guarantee the data model can't back up.

### Create Driver — `drivers`
🔴 first_name · 🔴 last_name · 🔴 license_number (UNIQUE) · 🔴 org_id · 🟡 user_id (link to a system login, optional) · 🆕 home_site_id (conditional, same caveat as vehicles above — requires the same schema migration; omit if option B is chosen).

### Create Device — `devices`
**Actor:** INTEGRATEUR — **note:** INTEGRATEUR is treated as org/system-scoped for provisioning purposes (devices aren't inherently site-bound until assigned), so this form is unaffected by the MARKETEUR/TRANSPORTEUR scoping correction.
| Field | Req | Validation |
|---|---|---|
| serial_number | 🔴 | UNIQUE |
| device_type | 🔴 | GPS, PDA, or RFIDREADER |
| metadata_json | conditional | **[CHECK chk_device_gps_imei]** must contain a non-null `"imei"` key if device_type=GPS |
| firmware_version | 🟡 | |
| battery_level | 🤖 | default 100 |
| org_id | 🟡 | |
| config_json | 🟡 | default `{}` |
| assigned_to_user_id / assigned_to_vehicle_id | 🟡 | set on a separate "assign" action, not necessarily at creation |

### Bulk-Create RFID Tags — `rfid_tags`
**Actor:** INTEGRATEUR, typically CSV/bulk import.
🔴 tag_id (UNIQUE) · 🟡 bottle_serial — **[CHECK chk_rfid_bottle_serial]** must match `^[A-Z0-9]{8,}$` if provided · 🤖 status default `AVAILABLE` · 🟡 current_site_id — **[CHECK chk_rfid_location]** at most one of `current_site_id`/`current_client_site_id` may be set.

### Create Transporter Contract — `transporter_contracts`
**Actor:** MARKETEUR — **note:** this form is a deliberate exception to site-scoping. A contract is inherently an agreement between two *organizations*, not tied to a site, so it stays visible/editable by MARKETEUR users at the org level (or is restricted to ADMIN only — a product decision, see `02_RBAC_ROLES_PERMISSIONS.md`) regardless of which sites the creating user is assigned to.
🔴 marketeur_org_id · 🔴 transporter_org_id (must differ from marketeur_org_id — **[CHECK]** implied by app; UNIQUE pair enforced at DB) · 🟡 is_primary (default false — **note:** DB does not prevent multiple primaries; the "set primary" action must unset any prior primary in the same transaction) · 🟡 contract_reference · 🟡 started_at/ended_at.

---

## LAYER 4 — Operations: Pickups & Tours (depend on Sites/Vehicles/Drivers)

### Create Pickup Request — `pickup_requests`
**Actor:** MARKETEUR.
🔴 marketeur_org_id · 🔴 source_site_id · 🔴 destination_site_id — **[CHECK]** must differ from source · 🔴 requested_quantity (>0) · 🟡 approved_quantity (set later by ADMIN on validation) · 🤖 status default `DRAFT`.

**Follow-on sub-form:** `pickup_request_vehicles` — 🔴 pickup_request_id · 🔴 vehicle_id (multi-select, UNIQUE per pair).

### Create Delivery Tour — `delivery_tours`
**Actor:** MARKETEUR — **site-scoped user**. This is the most conditionally-complex form in the system, and now also the clearest place the vehicle/driver scoping gap bites: a site-scoped MARKETEUR user should only be able to pick from vehicles/drivers belonging to *their* site, but since `vehicles`/`drivers` have no site column today, the vehicle/driver picker on this form cannot be correctly filtered without either the schema fix (🆕 `home_site_id`) or an explicit fallback showing the whole org's fleet with a visible "not site-filtered" disclaimer.

| Field | Req | Validation |
|---|---|---|
| marketeur_org_id | 🔴 | |
| execution_mode | 🔴 | INTERNAL or EXTERNAL — **drives all the conditional fields below** |
| type | 🔴 | VRAC or BOUTEILLES50KG |
| requested_quantity | 🔴 | >0 |
| **If INTERNAL:** vehicle_id, driver_id, livreur_user_id | 🔴 each | **[CHECK chk_tournee_internal]** all three required; must belong to marketeur's own org; **should additionally be restricted to the creating user's assigned site(s) once vehicle/driver site-scoping exists** |
| **If EXTERNAL:** transporter_org_id | 🔴 | **[CHECK chk_tournee_external]**; must have an active `transporter_contracts` row with this marketeur; vehicle/driver/livreur must be left **empty** at creation — **[CHECK chk_tournee_no_double_assign]** forbids `assigned_by_transporter_user_id` being set while INTERNAL, and by extension the transporter's crew fields are only filled in later by the transporter's own "acknowledge" action, not this form |
| loaded_quantity, delivered_quantity | 🤖 | computed later from scans, not entered on the form |
| status | 🤖 | default `DRAFT` |

**Follow-on sub-form (built inline with the tour or immediately after):** Checkpoints —

### Create Checkpoint — `checkpoints`
🔴 tournee_id · 🔴 sequence (UNIQUE per tournee, integer ordering) · **exactly one of:** 🔴 site_id **or** 🔴 client_site_id — **[CHECK chk_checkpoint_exclusive + chk_checkpoint_has_destination]** — the form must present a single "destination" picker that internally sets one or the other, never both, never neither · 🟡 expected_arrival.

**Workflow implication:** the tour-creation form should let the marketeur add an ordered list of checkpoints (drag-to-reorder → sets `sequence`), each with a single destination type toggle (internal Site vs external Client Site).

---

## LAYER 5 — Field Execution (LIVREUR, mobile/offline forms)

### Reach Checkpoint — updates `checkpoints` (not a create, but the next "form" a livreur fills)
🔴 actual_arrival (auto GPS-stamped) → status → REACHED.

### Skip Checkpoint
🔴 skip_reason (mandatory text — **not DB-enforced but must be enforced at the app/form layer**, since the column is nullable in the schema) → status → SKIPPED.

### Create Scan Event — `scan_events`
**Actor:** LIVREUR, via PDA (this is the single highest-volume create form in the system, executed dozens of times per tour).

| Field | Req | Validation |
|---|---|---|
| checkpoint_id | 🔴 | |
| livreur_user_id | 🔴 | auto-filled from logged-in user |
| direction | 🔴 | IN or OUT |
| geo_point | 🔴 | **NOT NULL** — auto GPS-captured, cannot be manually typed |
| rfid_tag_id | conditional | required for bottle scans (type=BOUTEILLES50KG tours), left null for VRAC |
| meter_reading | conditional | for VRAC tours only, ≥0 |
| photo_url | 🟡 | proof photo → MinIO |
| pda_sync_id | 🤖 | batch id, set automatically when synced from offline storage |
| conflict_status | 🤖 | app-computed on ingestion, free-text (recommend constraining to NONE/SEQUENCE_MISMATCH/TIMESTAMP_INVALID/DUPLICATE at the form/validation layer) |

**Bulk variant — `POST /scans/bulk`:** same field set, submitted as an array with a shared `pda_sync_id`, used for offline-first sync. Each row validated independently; partial success must be supported (don't reject the whole batch for one bad row).

---

## LAYER 6 — Péréquation (Compliance) Forms

### Create Declaration — `declarations`
**Actor:** MARKETEUR (monthly).
🔴 marketeur_org_id · 🔴 period_start · 🔴 period_end — **[CHECK]** must be > period_start · 🔴 declared_volume (≥0) · 🤖 status default `DRAFT` · 🤖 submitted_by auto-filled on submit action.

### Trigger Reconciliation — `reconciliations`
**Actor:** AGENT/system, not really a user-filled "create form" — triggered by a "Reconcile" button on a submitted declaration.
🔴 declaration_id (UNIQUE — one reconciliation per declaration) · 🔴 tracked_volume (≥0, computed by summing `scan_events` for the period, not typed by hand) · 🟡 tracked_bottles_out/in · 🔴 subsidy_impact (business formula — **not defined in the schema, must be specified**) · 🤖 volume_gap **auto-computed by DB trigger**, never on the form.

### Issue Redressement — `redressements`
**Actor:** ADMIN, from a reconciliation showing an out-of-tolerance gap.
🔴 reconciliation_id · 🔴 amount (≥0) · 🔴 due_date · 🤖 status default `ISSUED` · 🤖 issued_at default now(). Later: `mark-paid` action sets 🔴 transaction_ref + paid_at (**[CHECK]** paid_at may only be set when status=PAID).

---

## LAYER 7 — Anomalies & Notifications

### Create Anomaly (mostly system-generated, occasionally manual)
🔴 type (19-value enum) · 🔴 category (INVESTIGATION/TECHNICAL, derivable from type) · 🔴 severity (risk_level) · 🔴 entity_type (risk_entity_type) · 🔴 entity_id (polymorphic UUID, no FK) · 🟡 site_id / client_site_id · 🔴 evidence_json · 🔴 assigned_to_group (resolved via `notification_rules` lookup on `(anomaly_type, min_severity)`) · 🤖 status default `NOUVEAU`.

**Manual creation form** (AGENT/SUPERVISOR raising something they observed directly) would need the same fields, minus the automatic `notification_rules` lookup convenience — group must be picked manually or the same lookup reused.

### Assign/Reassign Anomaly — `anomaly_assignments`
🔴 anomaly_id · 🔴 assigned_to_user_id · 🤖 assigned_by_user_id (current user) · 🤖 assigned_at (now()). Each reassignment is a **new row**, never an update.

### Create Notification Group — `notification_groups`
🔴 name · 🔴 type (enum) — UNIQUE per `(name, type)` · 🤖 is_active default true.

### Add Group Member — `notification_group_members`
🔴 group_id · 🔴 user_id — UNIQUE pair.

### Create Notification Rule — `notification_rules`
🔴 name · 🔴 anomaly_type · 🔴 min_severity · 🔴 target_group_id — UNIQUE per `(anomaly_type, min_severity)`.

---

## LAYER 8 — Reporting & Settings

### Request Report — `reports`
🔴 name · 🔴 type (free text convention: OPERATIONAL/FINANCIAL/COMPLIANCE) · 🔴 format (PDF/EXCEL/CSV/JSON) · 🔴 parameters_json (form varies by report type — e.g. `{org_id, period}` or `{region}`) · 🤖 status default `PENDING` · 🤖 generated_by = current user.

### Update Setting — `settings` (not a create, org already seeded, but the "edit" form matters)
🔴 setting_value — **[CHECK chk_settings_numeric_check]** if value_type ∈ INTEGER/DECIMAL/NUMERIC, value must respect `min_value ≤ value ≤ max_value` when both are set. Editing this table is the **only** action that auto-writes its own audit log (via `trg_settings_audit`) — no other create form does this automatically.

---

## Master Dependency Graph (what must exist before what)

```
Region (seeded)
  └─ Organization
       ├─ User ─────────────┬─ user_mfa
       │                    ├─ user_sessions (auto, login)
       │                    ├─ integration_auth
       │                    └─ user_site_assignments ──(needs Site)
       ├─ custom_roles ──── user_custom_roles ──(needs User)
       ├─ Site ─────────────── Checkpoint ──(needs Tour)
       ├─ Client (org type=CLIENT) 
       ├─ client_sites ─────── Checkpoint ──(needs Tour)
       ├─ Vehicle ──────────┬─ pickup_request_vehicles ──(needs Pickup)
       │                    └─ Delivery Tour (INTERNAL)
       ├─ Driver ──────────── Delivery Tour (INTERNAL)
       ├─ Device ──────────── device_status_history (auto)
       ├─ rfid_tags ────────── scan_events (needs Checkpoint)
       ├─ transporter_contracts ── Delivery Tour (EXTERNAL, gates transporter_org_id choice)
       ├─ pickup_requests ──── pickup_request_vehicles
       ├─ delivery_tours ────── checkpoints ────── scan_events
       ├─ declarations ──────── reconciliations ──── redressements
       └─ anomalies ─────────── anomaly_assignments
```

## Practical Build Order for the Onboarding Wizard

If you're building a guided "set up a new marketeur" wizard, the mandatory sequence (things that will 500-error if skipped) is:

1. **Organization** (type=MARKETEUR)
2. **User** (system_role=MARKETEUR, org_id = step 1)
3. **Site** (org_id = step 1) — at least one, functions non-empty
4. **Vehicle** (org_id = step 1) — capacity fields conditional on type
5. **Driver** (org_id = step 1)
6. Optionally **transporter_contracts** if this marketeur will ever run EXTERNAL tours
7. Only *then* can **pickup_requests** or **delivery_tours** be created.

For a **client onboarding wizard** (marketeur adding a new customer):
1. **Organization** (type=CLIENT) — likely created by ADMIN, not the marketeur
2. **Client** profile (org_id = step 1)
3. **client_sites** (client_org_id = step 1) — as many delivery addresses as needed
4. Now `checkpoints` on future tours can target these sites.
