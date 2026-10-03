# LPG Fleet — CSPH GPL Traceability Platform (UI)

Interface web pour la plateforme de traçabilité GPL hors réseau (CSPH Cameroun).
Suivi opérationnel des tournées GPL : approvisionnement, livraison, réconciliation,
certificats, anomalies et pilotage national.

## Le système

La plateforme trace la distribution de GPL en bouteilles (50 kg) et en vrac
(tonnes métriques — **TM**, jamais en litres) depuis les dépôts jusqu'aux points de
livraison. Elle est bâtie sur PostgreSQL + PostGIS + TimescaleDB, MinIO, Kafka et un
frontend React (ce dépôt). Ce dépôt contient **uniquement le frontend** (SPA Vite),
avec un adaptateur mock qui simule l'API tant que le backend n'est pas branché
(`VITE_API_MODE`).

### Acteurs & rôles

| Rôle | Type d'organisation | Périmètre de données |
|---|---|---|
| SUPERADMIN | REGULATEUR (CSPH) | Vue organisationnelle nationale (`/dashboard`) |
| ADMIN | REGULATEUR | Vue organisationnelle régionale |
| SUPERVISOR | REGULATEUR | Vue organisationnelle système/technique |
| INTEGRATEUR | REGULATEUR | Vue organisationnelle (appareils/carte) |
| AGENT | REGULATEUR ou opérateur | **Sites assignés uniquement** (`user_site_assignments`) |
| MARKETEUR | MARKETEUR | **Son site** + ce qu'il a créé |
| TRANSPORTEUR | TRANSPORTEUR | Tournées/équipages assignés à son organisation |
| LIVREUR | opérateur | Ses missions |

> **Isolation par site :** un MARKETEUR voit uniquement les données de son site et ce
> qu'il a créé ; un TRANSPORTEUR voit les tournées assignées à son organisation ; un
> AGENT voit ses sites assignés. Seul le personnel d'une organisation REGULATEUR
> (SUPERADMIN/ADMIN) dispose de la vue organisationnelle. Implémenté via
> `apps/web/src/features/scope` (`getScope`/`scopeFilter`/`scopeBySiteOrCreator`).

## Contrats marketeur↔transporteur

Le MARKETEUR déclare un contrat avec preuve PDF, `started_at`/`ended_at` et
`is_primary` pour sélectionner le contrat principal. Le TRANSPORTEUR l'accepte
via `transporter_accepted_at`. Le statut est dérivé de la preuve PDF, de
`transporter_accepted_at`, de `started_at`/`ended_at`, de `is_active` et de
`deleted_at` (suppression douce → `CANCELLED`) : `PENDING`,
`PENDINGTRANSPORTERACK`, `ACTIVE`, `UPCOMING`, `EXPIRED`, `SUSPENDED` ou
`CANCELLED`.

Les tournées `EXTERNAL` ne sont éligibles que lorsque le contrat est `ACTIVE`.
Les permissions centralisées `contracts.*` gouvernent le workflow : le
MARKETEUR gère ses contrats, le TRANSPORTEUR les lit et les accepte, et
l'ADMIN/SUPERADMIN peut les suspendre ou les réactiver. Le TRANSPORTEUR crée et
assigne uniquement des livreurs de sa propre organisation.

API : `GET`/`POST`/`PATCH`/`DELETE` sur `/api/v1/transporter-contracts`, ainsi
que `attach-proof`, `accept`, `suspend`, `reactivate` et `set-primary`.

## Workflows

### Flux 1 — Approvisionnement (pickup)

1. MARKETEUR crée une requête (`pickup_request`, statut `DRAFT`) via l'assistant 2 étapes
   (type VRAC/bouteilles, quantité, site source/destination, véhicules recommandés).
2. ADMIN/SUPERADMIN valide (`VALIDATED`) et approuve la quantité.
3. Suivi des flux dans `/pickup-tracking` (TM / btl).

### Flux 2a — Tournée interne

1. MARKETEUR crée une tournée (`execution_mode=INTERNAL`) avec son équipage
   (véhicule + chauffeur + livreur) + points de livraison → **PLANNED**.
2. LIVREUR démarre (`start`) → INPROGRESS, passe les checkpoints (scan RFID / compteur
   vrac), puis clôt (`close`).

### Flux 2b — Tournée externe

1. MARKETEUR crée une tournée `EXTERNAL` avec un **transporteur sous contrat actif** →
   **PENDINGTRANSPORTERACK** ; notification poussée au groupe TRANSPORT.
2. TRANSPORTEUR accuse réception en assignant **son propre équipage**
   (véhicule/chauffeur/livreur de son organisation) → **ACKNOWLEDGED**.
3. Suite identique au flux interne.

Transitions régies par `apps/web/src/features/tours/data/tour-machine.ts`
(actions : `send-to-transporter`, `acknowledge`, `plan`, `start`, `close`, `cancel`).

### Déclaration & réconciliation

1. MARKETEUR soumet une déclaration de volume (`declared_volume`, TM).
2. Le backend calcule `tracked_volume` (somme des scans) et `volume_gap`
   (`declared − tracked`) ; l'écart en % est comparé à
   `reconciliation.volume_gap_tolerance_percent` (2,5 % par défaut).
3. Si écart > tolérance → signalé → vérification AGENT → redressement (ADMIN).

### Certificats & sites

- Certificats de jaugeage (véhicules VRAC) stockés dans MinIO ; URL seule en base.
- Vérification géo des sites : auto-promotion selon `geo.confidence_*` ;
  statuts `ASSIGNED`/`VERIFIED`/`ACTIVE`.

## Architecture

Monorepo pnpm + turbo :

- `apps/web` — l'application React (Vite, TanStack Router, TanStack Query, Tailwind/shadcn, Zustand).
- `packages/api-client` — adaptateur API (mock / HTTP) + types `AuthUser`.
- `packages/permissions` — matrice RBAC (`ROLE_GRANTS`), `hasPermission`, hiérarchie.
- `packages/types` — types partagés du domaine (mappés au schéma SQL).
- `packages/mock-data` — fixtures « curated » (seed) + accesseurs de settings.
- `packages/mock-api` — handlers mock.
- `packages/ui` — composants shadcn partagés (`Button`, `Dialog`, `Sheet`, …).

### Règles de structure (AGENTS.md)

- Un domaine = un dossier `features/<domaine>/` (index.tsx, components/, data/, lib/, utils/).
- Données dans `data/`, logique pure dans `lib/` (+ tests colocalisés).
- RBAC en couches : bouton (`hasPermission`) + store (`lib/security/guards`) + formulaire.
- Formulaires : react-hook-form + zod + shadcn Form, erreurs inline, bouton avec spinner.
- Suppression douce : `deleted_at = now()` (jamais de suppression physique).
- Règles métier pilotées par les settings (`packages/mock-data/.../10_system_config.json`).
- Unités : VRAC = TM, bouteilles = btl (jamais kg).
- Landing de tous les rôles : `/overview` (personnalisé). `/dashboard` = SUPERADMIN.

## Démarrage

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build            # turbo build (tous les packages + web)
pnpm exec turbo run build
```

## Tests & vérification

```bash
pnpm --filter @lpg/web run test:unit        # tests unitaires (sans navigateur)
pnpm --filter @lpg/web exec tsc --noEmit -p tsconfig.app.json   # typecheck
pnpm exec turbo run lint                     # lint monorepo
```

Note : les tests navigateur (vitest browser) nécessitent Playwright/chromium
(`pnpm --filter @lpg/web run test:browser`).

## Variables d'environnement

Copier `.env.example` vers `.env` :

```bash
VITE_ARCGIS_API_KEY=your_arcgis_api_key   # carte ArcGIS (optionnel, sans elle la carte ne charge pas)
VITE_API_MODE=mock                        # mock | http — branche l'adaptateur backend
```

## Déploiement

SPA Vite frontend-only, prête pour :

- Vercel (détection Vite, output `dist`, env `VITE_ARCGIS_API_KEY`)
- Netlify (`netlify.toml` + `public/_redirects`)
- toute plateforme statique servant `dist`

```bash
pnpm build
pnpm preview
```

## Conventions clés

- Anglais dans le code ; français dans les libellés UI.
- Enums en MAJUSCULES (schéma SQL).
- Chaque mutation invalide sa clé de cache React Query
  (`lib/api/invalidation`) ; événements WebSocket (`tour:update`,
  `anomaly:new`, `device:telemetry`) invalident les clés correspondantes.
- Les rapports et le recalcul de risque sont pollés jusqu'à un état terminal
  (`READY`/`FAILED`/`EXPIRED`) ; l'UI affiche un spinner et la fraîcheur.
