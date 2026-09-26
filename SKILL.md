---
name: lpg-platform
description: Work on the CSPH GPL Traceability Platform UI (Cameroon LPG regulator). Encodes the project conventions from AGENTS.md — settings-driven rules, dual-layer RBAC, site-level scope, status lifecycles, soft-delete, feature folder pattern — and the domain glossary (Flux 1/2, tournee, VRAC/TM, etc.). Load when touching apps/web/src/features/*, packages/{types,permissions,api-client,mock-data}/*, or designing/auditing a new screen.
disable-model-invocation: true
---

# LPG Platform — CSPH GPL Traceability UI

L'interface de la plateforme de traçabilité du GPL (gaz de pétrole liquéfié) au Cameroun. Construit le backoffice + le tracker public pour le régulateur (CSPH), les dépôts, les marketeurs, les transporteurs et les clients finaux.

## 1. Source of truth (always re-read before answering)

| Besoin | Fichier |
|---|---|
| Conventions + règles non-négociables | `lpg-fleet-management-ui/AGENTS.md` |
| Audit + plan d'implémentation | `../TODO.md` |
| Schéma canonique (noms de tables, colonnes, ENUMs) | `../csph_gpl_schema_v6_2.sql` |
| Doc interne | `lpg-fleet-management-ui/docs/` (architecture, state-machines, workflows, api-endpoints, etc.) |

**Toute décision de design** (statut, transition, seuil, type) se résout contre ces fichiers d'abord. Le code local ne fait que refléter le schéma.

## 2. Domain glossary (vocabulaire de référence)

Termes à employer **tels quels** quand on parle d'un module — pas de paraphrase:

- **GPL** — gaz de pétrole liquéfié (LPG en anglais).
- **VRAC** — GPL en vrac livré par camion-citerne. **Unité = TM (tonnes métriques).** Pas de litres, pas de kg, pas de tonnes nues.
- **Bouteille (btl)** — bouteille individuelle de **50 kg**. Compter en unités, pas en kg.
- **MARKETEUR** — importateur/distributeur (ex. Tradex, Ola Energy). Possède des dépôts, sous-traite le transport via contrats à des TRANSPORTEURS.
- **TRANSPORTEUR** — société de transport qui exécute les tournées de livraison avec son propre équipage (véhicule + chauffeur + livreur).
- **CLIENT (final)** — point de consommation revendu par le MARKETEUR (ménages, restaurants, industries).
- **DEPOT** — centre de stockage/chargement exploité par un MARKETEUR.
- **LIVREUR** — chauffeur-livreur sur le terrain. Exécute les tournées, ramasse les RFID, ferme les missions.
- **Tournee (DeliveryTour)** — mission planifiée d'un véhicule qui dessert un ensemble de checkpoints.
- **Tournee_checkpoint (DeliveryStop)** — arrêt dans une tournee, lié à un site client (ou dépôt en ramassage).
- **Pickup (flux 1)** — enlèvement de VRAC au dépôt vers le site d'un MARKETEUR.
- **Declaration (flux 2a)** — déclaration journalière de stock par le MARKETEUR (entrée/sortie/variation).
- **Reconciliation (flux 2b)** — croisement entre la déclaration et la mesure réelle.
- **Redressement** — action corrective déclenchée par un écart de réconciliation.
- **Anomalie** — déviation détectée (geo-fence, battery, offline, siphonnage estimé).
- **Risque (risk score)** — score calculé d'un site/d'un véhicule/d'un livreur.
- **RFID tag** — étiquette NFC/UID fixée sur une bouteille 50 kg, lue au point de livraison.
- **Device (IoT)** — boîtier GPS/LoRa sur le véhicule ou la bouteille. État géré dans une machine d'état (ACTIVE/INACTIVE/MAINTENANCE/RETIRED).
- **Geo-fence** — polygone géographique associé à un site ou un corridor de tournée.
- **Geo-verification** — preuve de présence au checkpoint via confiance GPS + tolérance.
- **Tour (interne vs externe)** — INTERNAL = l'équipage du MARKETEUR ; EXTERNAL = l'équipage d'un TRANSPORTEUR contractant.
- **Contrat (TransporterContract)** — contrat-cadre entre MARKETEUR et TRANSPORTEUR, état dérivé : `PENDING` / `PENDINGTRANSPORTERACK` / `ACTIVE` / `UPCOMING` / `EXPIRED` / `SUSPENDED` / `CANCELLED`.
- **OrgType** — `REGULATEUR | DEPOT | MARKETEUR | TRANSPORTEUR | CLIENT`.
- **Role (system_role)** — `SUPERADMIN > ADMIN > SUPERVISOR > INTEGRATEUR > AGENT > MARKETEUR > TRANSPORTEUR > LIVREUR`.

Si un nouveau concept doit être nommé, **l'ajouter dans `apps/web/src/features/<domaine>/data/glossary.md`** (le créer paresseusement) plutôt que de l'inventer localement.

## 3. Architecture: feature-folder pattern (mandatory)

```
apps/web/src/features/<domaine>/
  index.tsx                       # page entry — exports <Domain>Page
  components/                     # présentations, tables, colonnes
  data/                           # modèles, fixtures, builders, schémas
  lib/                            # logique pure + tests colocated
  utils/                          # helpers purs
```

Règles non-négociables (toute feature) :
- **Un fichier par responsabilité.** Pas de doublon (root vs `components/` vs `data/` avec le même nom). Si tu déplaces, tu déplaces — jamais copier.
- **Modèles/types dans `data/`**, jamais redéclarés à la racine.
- **Si `components/` ou `data/` existe déjà**, c'est la version vivante. Supprimer toute copie à la racine et rediriger les imports.
- **Tests vivent à côté** (`lib/*.test.ts`, `data/*.test.ts`).
- **Imports `@lpg/ui`** (et `components/ui` pour le local à la webapp) — pas de fork import path au sein d'une feature.
- **Pas de routeur dynamique `$role/$module`**, pas de `ModuleScreen`, pas de `MODULE_CATALOG`. Toutes les routes sont statiques sous `routes/_authenticated/<domaine>/`.
- **Post-login landing** = `/overview` pour tous les rôles.

**Routes de référence à copier** : `/trucks`, `/transporters`, `/marketers`, `/routes`, `/activity/trip-tracking`, `/dashboard`. Si la convention dérive d'une feature existante, **revenir à l'une de ces six**.

## 4. Conventions de nommage

- **Anglais** dans le code : dossiers, fichiers, exports, URLs, types, variables.
- **Français** uniquement dans les `label` exposés à l'utilisateur (`react-i18next`).
- **UPPERCASE** pour les `ENUM` values et les `type` qui les représentent (règle schéma). Pas de `snake_case` enum.
- **Unités** : VRAC = **TM** (tonnes métriques), pas L, pas kg. Bouteilles = **btl** (compte unitaire).
- **Pas de seuils codés en dur.** Lire le `settings` (cf. §5).

## 5. Trois invariants du système

### a) Settings-driven (zéro seuil en dur)

Toute valeur métier — seuils geo (`geo.confidence_*`), alertes batterie/offline (`device.battery_critical_threshold`, `device.offline_alert_minutes`), SLA tournée (`tournee.*`), tolérance reconciliation (`reconciliation.volume_gap_tolerance_percent`), années de rétention (`audit.retention_years`), MFA (`mfa.enforced_for_roles`), intervalle GPS, expiry rapport — **provient de `getSetting(key)` / `getSettingNumber(key)`** (`packages/mock-data/src/settings.ts`). Le fixture source est `packages/mock-data/src/seed/curated/10_system_config.json`.

Si on te demande un seuil en dur, refuse. Utilise `getSettingNumber`. Si la clé n'existe pas, **l'ajouter au fixture** et au schéma, ne pas la réinventer.

### b) RBAC à deux couches + hiérarchie

- **Hiérarchie :** `SUPERADMIN > ADMIN > SUPERVISOR / AGENT / INTEGRATEUR > MARKETEUR / TRANSPORTEUR > LIVREUR`. Un utilisateur ne crée que des subordonnés ≤ lui-même (`HIERARCHY_LEVEL` / `canCreate` dans `@lpg/permissions`).
- **Permissions effectives =** `system_role` (grants de base, dans `packages/permissions/src/ROLE_GRANTS`) **∪** `custom_roles` (JSONB overrides), scopé par `user_site_assignments`.
- La matrice web (`ROLE_GRANTS`) modèle la couche de base. **Aucune feature ne peut se reposer uniquement sur `system_role`.**
- **Sidebar et route guards** consomment `hasPermission(code)` (depuis `@lpg/permissions`) — pas de préfixe d'URL par rôle.
- **MARKETEUR n'a pas de vue org.** MARKETEUR voit **son propre site + ce qu'il a créé**, jamais `/marketers` ou `/organizations`. Idem LIVREUR (ses missions uniquement) et AGENT (ses sites assignés). Seuls les rôles du régulateur ont la vue organisationnelle.

### c) Site-level data isolation (scope)

Le filtrage de scope s'applique via `features/scope/scope.ts` :
- `getScope(user)` → `UserScope { view: 'org' | 'site' | 'transporter' | 'agent' | 'livreur', orgId?, siteIds, userId? }`.
- `scopeFilter(rows, scope, keyBy)` filtre par site.
- `scopeBySiteOrCreator(rows, scope, siteKey, creatorKey)` pour les flux où l'auteur a aussi accès à ses propres lignes.
- `scopeWithOrgId(scope)` étend `siteIds` avec `orgId` **uniquement** pour `site`/`transporter` (l'org EST leur scope opérationnel). `agent`/`livreur` ne voient jamais leur org entière.

**Toute data-builder opérationnelle** (pickups, tours, declarations, vehicles, trucks, dashboard data) **doit** appeler l'un de ces helpers avec le scope courant. Pas de filtrage « à la main ».

## 6. Defense-in-depth : trois couches de garde-fous

Toute mutation est gérée à **trois endroits** :
1. **Bouton UI** — `hasPermission(code)` cache/affiche.
2. **Store** — `lib/security/guards.ts` (`assertPermission`, `assertSiteAccess`) à l'écriture.
3. **Form** — champs scopés (MARKETEUR ne peut pas choisir un autre site, TRANSPORTEUR ne peut pas assigner un livreur hors de son org).

**Aucun store ne peut écrire en bypassant les guards.** Toute feature qui crée un sous-enregistrement doit vérifier avant.

## 7. Formulaires

- `react-hook-form` + `zod` + shadcn `Form` (cf. `packages/ui/src/components/ui/form.tsx`).
- **Erreurs inline** via `<FormMessage />` par champ. **Jamais de toast** pour les erreurs de validation.
- Bouton submit = spinner + disabled tant que `pending`.
- **Champs auto-collectés cachés** : `org_id` (depuis auth), `created_by`, timestamps, statuts par défaut.

## 8. Toasts

- **Exactement un toast par outcome.**
- Inline validation errors → jamais toastées.
- Helper : `hooks/use-toast-feedback.ts` (`runMutation`, `extractErrorMessage`).
- Le réseau : `extractErrorMessage(error)` rend un texte FR localisé.

## 9. Notifications + WS

- Centre de notifications piloté par `tour:update`, `anomaly:new`, `device:telemetry` (cf. `lib/ws/use-ws-client.ts`, `hooks/use-notification-center.ts`).
- Badge non-lu incrémenté sur `ws:notify` (anomalies + tours).
- Son court sur réception, **respecter** `hooks/use-notification-sound.ts` (mute côté user).

## 10. Async resources (rapports, risk-recompute)

- **Rapports** : états terminaux `READY` / `FAILED` / `EXPIRED`. Polling via `hooks/use-report.ts` (`createReportAndPoll`).
- **Risk recompute** : idem, spinner + freshness.
- Boutons de mutation désactivés tant que pending.

## 11. Enveloppe API + soft delete

- Réponse : `{ success, message, data, pagination?, filters? }` — toujours.
- **Soft delete partout** : `DELETE` sur une table avec `deleted_at` set `deleted_at = now()`. Reads filtrent `deleted_at IS NULL`. Le fake adapter mirroir ça. **Pas de hard delete** sauf ordre explicite.
- Pas d'endpoint de restore documenté.
- **Aucune chaîne de statut n'est inventée localement** — elle vient du schéma.

## 12. Storage

- Images, certificats, preuves → **MinIO (S3-compatible)**. Seules des URLs sont stockées en base.
- Pas de base64 en DB.

## 13. Cache invalidation

- Chaque mutation invalide la query key de la ressource via `lib/api/invalidation.ts` (`invalidateResource(qc, 'tours')`).
- Les événements WS invalident les mêmes clés (`tour:update`, `anomaly:new`, `device:telemetry`).
- **Toujours** coupler mutation + invalidation. Pas d'exception.

## 14. Optimistic updates

- Toggle de statut bas-risque → optimistic UI avec rollback sur erreur. Bouton disabled pendant pending.

## 15. Workflows canoniques

### a) Tournee (DeliveryTour)
**MARKETEUR** crée via wizard :
- INTERNAL → assignation à son équipage → `PLANNED`.
- EXTERNAL → choix d'un TRANSPORTEUR avec contrat **ACTIVE** → `PENDINGTRANSPORTERACK`.
**TRANSPORTEUR** acknowledges avec **son propre** véhicule / chauffeur / livreur → `ACKNOWLEDGED`.
**LIVREUR** démarre / ferme. Transitions pilotées par `features/tours/data/tour-machine.ts`.

### b) Contrats MARKETEUR ↔ TRANSPORTEUR
- MARKETEUR déclare (PDF proof, `started_at`/`ended_at`, `is_primary`).
- TRANSPORTEUR accepte (`transporter_accepted_at`).
- Statut dérivé par `features/transporter-contracts/lib/contract-status.ts` (sept valeurs, cf. §2).
- **EXTERNAL** éligible seulement si statut = `ACTIVE`.
- Permissions centralisées `contracts.*` dans `@lpg/permissions` (MARKETEUR gère, TRANSPORTEUR lit/accepte, ADMIN/SUPERADMIN suspend).
- DELETE = soft delete.

### c) Pickup (flux 1)
MARKETEUR déclare → ADMIN valide → véhicule chargé → GPS track.

### d) Reconciliation → Redressement
Déclaration journalière → comparaison avec mesure réelle (tolerance `reconciliation.volume_gap_tolerance_percent`) → si écart, redressement.

## 16. Type safety & duplication budget

- **Pas de re-déclaration locale** de `Site`, `PickupStatus`, `VehicleType`, `Role`, etc. → venir de `@lpg/types` (et RBAC de `@lpg/permissions`).
- `noUnusedLocals` strict (tsconfig). Si on ajoute un import et qu'il n'est pas utilisé, le build casse. C'est voulu.
- **Budget de duplication = zéro.** Avant d'ajouter un fichier → grep pour un équivalent. Une nouvelle feature = un nouveau dossier. Une mise à jour = édite l'existant, n'ajoute pas un parallèle.

## 17. Commandes utiles

```bash
# depuis la racine du monorepo (pnpm workspace)
pnpm dev                       # turbo, démarre tous les apps (port 5173 par défaut web)
pnpm mock                      # uniquement le mock API
pnpm lint                      # turbo lint
pnpm format                    # prettier sur tout

# depuis apps/web
pnpm typecheck                 # tsc --noEmit (rapide, surface toutes les dérives de types)
pnpm test                      # vitest run --browser.headless (tous les tests, navigateur)
pnpm test:unit                 # tests unitaires purs, sans browser (CI-friendly)
pnpm build                     # tsc -b && vite build
pnpm knip                      # détection de code mort / imports orphelins
pnpm i18n:check                # vérifie la couverture des locales FR/EN
```

**Bar de qualité** avant de dire « done » :
1. `pnpm typecheck` (apps/web) → **green**.
2. `pnpm test` (apps/web) → **green**.
3. `pnpm build` → **green**.
4. Si la feature ajoute une string UI, `pnpm i18n:check` → green (clé présente en FR **et** EN, pas d'orpheline).

## 18. Anti-patterns (stop-ship list)

| Anti-pattern | Pourquoi c'est faux |
|---|---|
| `as any` pour franchir un typage `@lpg/types` | Le type canonique existe pour ça. Le masquer casse la garantie. |
| Statut inventé (ex. `'PARTIAL_DELIVERY'`) | Le schéma le refuse ; le backend rejettera. |
| Seuil en dur (ex. `0.025` pour geo) | Toujours `getSettingNumber('geo.confidence_*')`. |
| `MODULE_CATALOG` / routage `$role/$module` | Banni par AGENTS.md §5. Routes statiques seulement. |
| Composant qui importe directement depuis `@lpg/mock-data/seed/curated` | Doit passer par `@lpg/api-client` (l'adapter fake mirror la prod). |
| Filtrer à la main `rows.filter(siteIds.includes(...))` au lieu de `scopeFilter` | Dérive des règles scope (agent ≠ transporter). |
| `delete ... from DB` | Soft delete obligatoire. |
| Toaster une erreur de validation | Inline only (`<FormMessage />`). |
| Toast par champ / par mutation | Exactement un toast par outcome. |
| Marketeur qui voit `/marketers` ou `/organizations` | Pas de vue org pour MARKETEUR. |
| Préfixer une URL par le rôle (`/admin/...`, `/marketeur/...`) | Sidebar RBAC-gated seulement. |
| Recopier `STATUS_LABELS` dans une nouvelle feature sans utiliser le pattern canonique (`data/<domaine>.ts`) | Doit vivre à un seul endroit par feature. |

## 19. What to do when stuck

| Tu rencontres | Fais ça |
|---|---|
| Une transition qui ne sait pas où aller | `docs/state-machines.md` + `csph_gpl_schema_v6_2.sql` (colonnes ENUM). |
| Un seuil qui devrait être configurable | `getSettingNumber('la.cle')` ; ajouter la clé à `10_system_config.json` si absente. |
| Un rôle qui devrait/que ne devrait pas voir un menu | `packages/permissions/src/index.ts` (`ROLE_GRANTS`) + `config/rbac/nav-items.ts`. |
| Une permission qui manque | Ajouter le code dans `@lpg/permissions` puis la consommer — ne pas dupliquer la logique dans la feature. |
| Un état dérivé (ex. statut contrat) | Le mettre dans `lib/<domaine>/<state>.ts` avec test colocalisé. |
| Une nouvelle feature | Brainstorm d'abord (cette skill §3), puis implémenter en miroir des routes de référence (§3). |
| Un doute sur le scope d'un acteur | `features/scope/scope.ts` + `scope.test.ts` (les cas sont déjà testés). |

## 20. Loading order when starting a new task

1. **Lis d'abord** : `AGENTS.md` + la section `TODO.md` correspondante au domaine.
2. **Vérifie le schéma** pour les colonnes / ENUMs / statuts.
3. **Charge cette skill**.
4. Identifie la feature cible dans `apps/web/src/features/<domaine>/`. Si le dossier existe, suis son pattern.
5. Vérifie l'état de l'arbre : `git status` puis `git log -5 -- <path>`.
6. Si créatif (nouvelle feature, refactor, redécoupage) → brainstorm d'abord (§3) avant de coder.
7. Implémente. Après : **typecheck + tests + build** (§17).

## 21. Quality bar (rappel)

Avant de dire qu'une tâche est **terminée** :

- `pnpm typecheck` (apps/web) — vert.
- `pnpm test:unit` — vert (rapide, couvre la logique pure).
- `pnpm test` — vert (inclut les tests navigateur si existants).
- `pnpm build` — vert.
- Si nouveau texte UI : `pnpm i18n:check` — vert.
- Pas de commit sauf si l'utilisateur le demande explicitement.

## 22. Citation format

Quand on invoque un fichier de référence dans une réponse à l'utilisateur :
`apps/web/src/features/tours/data/tour-machine.ts:82` (path + ligne, cliquable dans l'IDE).
