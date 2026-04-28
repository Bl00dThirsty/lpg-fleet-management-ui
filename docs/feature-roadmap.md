# Feature Roadmap

## Objectif

Faire evoluer l'application d'un simple module `Camions` vers une plateforme de pilotage GPL structuree autour de:

1. l'operationnel des tournées
2. le tableau de bord global

Le but est de garder une architecture simple, lisible et scalable, sans tout melanger dans la feature `trucks`.

## Sidebar cible

### Groupe `Operations`

- `Camions` -> `/trucks`
- `Tournees GPL` -> `/routes`

### Groupe `Pilotage`

- `Tableau de bord global` -> `/dashboard`

## Decoupage fonctionnel recommande

### 1. Feature `trucks`

Responsabilite:

- liste des camions
- details d'un camion
- position temps reel sur la carte
- etat du camion, chauffeur, pression, charge, ETA

Ne doit pas contenir:

- logique de simulation ou suivi de tournée multi-etapes
- agregats globaux de flotte
- catalogue des depots et centres

### 2. Feature `routes`

Responsabilite:

- suivi des tournées GPL
- evolution du niveau de GPL pendant le trajet
- comparaison `niveau au chargement` vs `niveau en cours` vs `niveau a la livraison`
- trajet entre depot, point de livraison, marketers, centres emplisseurs
- timeline d'une tournée
- carte de tournée avec etapes

Sous-domaines dans cette feature:

- `route-list`: liste des tournées
- `route-details`: détail d'une tournée
- `route-map`: carte et trace GPS
- `route-telemetry`: variation du GPL, pression, volumes delivres, anomalies

### 3. Feature `sites`

Responsabilite:

- referentiel geographique metier
- depots et centres
- points de chargement / dechargement

Premiers sites a integrer:

- Depot de Bipaga
- SCDP Douala
- SCDP Yaounde
- certains centres emplisseurs

Pourquoi separer `sites`:

- ces donnees seront reutilisees par `trucks`, `routes` et `dashboard`
- on evite de coder les marqueurs de sites directement dans `trucks-map.tsx`

### 4. Feature `dashboard`

Responsabilite:

- quantite totale de GPL transportee
- quantite en reserve
- repartition par flotte
- volumes par depot
- synthese journaliere / hebdomadaire / mensuelle
- alertes de stock ou baisse anormale

## Structure technique recommandee

```text
src/
  features/
    trucks/
      components/
      data/
      hooks/
      index.tsx
    routes/
      components/
      data/
      hooks/
      index.tsx
    sites/
      data/
      map/
      utils/
    dashboard/
      components/
      data/
      hooks/
      index.tsx
  routes/
    _authenticated/
      trucks/
        index.tsx
      routes/
        index.tsx
      dashboard/
        index.tsx
```

## Donnees a modeliser

### Truck

Donnees déjà presentes ou proches de l'existant:

- id
- immatriculation
- flotte / entreprise
- chauffeur
- position
- niveau GPL
- pression
- destination

### Site

```ts
type Site = {
  id: string
  name: string
  type: 'depot' | 'scdp' | 'filling-center' | 'marketer' | 'delivery-point'
  latitude: number
  longitude: number
  city: string
  status?: 'active' | 'inactive'
}
```

### Tournee

```ts
type RouteTrip = {
  id: string
  truckId: string
  originSiteId: string
  destinationSiteId: string
  waypoints?: string[]
  startedAt: string
  expectedArrivalAt?: string
  deliveredQuantityKg?: number
  loadedQuantityKg: number
  remainingQuantityKg: number
  status: 'planned' | 'in-progress' | 'completed' | 'incident'
}
```

### Télémétrie de tournée

```ts
type RouteTelemetryPoint = {
  id: string
  routeTripId: string
  recordedAt: string
  latitude: number
  longitude: number
  lpgLevelPercent: number
  pressureBar: number
  estimatedVolumeKg?: number
}
```

## Ordre de livraison conseille

### Epic 1 - Reseau logistique

Objectif:

- afficher sur la carte les sites metier fixes

Livrables:

- dataset mock `sites.ts`
- marqueurs des depots et centres
- legende simple
- filtres par type de site

### Epic 2 - Tournees GPL

Objectif:

- suivre une tournée de bout en bout

Livrables:

- page `Tournees GPL`
- liste des tournées
- detail d'une tournée
- courbe ou indicateur de variation du GPL
- trace sur la carte
- affichage chargement -> trajet -> livraison

### Epic 3 - Tableau de bord global

Objectif:

- piloter les volumes transportes et les reserves

Livrables:

- KPI principaux
- repartition par flotte
- volume transporte
- stock restant / reserve
- vue par depot

## Definition of Done par feature

Chaque feature doit avoir:

- sa route
- ses composants propres
- ses donnees mock ou ses appels API
- ses tests minimums sur les transformations critiques
- ses labels et textes metier coherents
- un build qui passe

## Tickets recommandes

### Feature 1

Nom de branche:

`feature/sites-map-seed`

Contenu:

- creer `src/features/sites/data/sites.ts`
- ajouter Bipaga, SCDP Douala, SCDP Yaounde, centres emplisseurs
- afficher ces points sur la carte

### Feature 2

Nom de branche:

`feature/routes-sidebar-and-page`

Contenu:

- ajouter `Tournees GPL` dans la sidebar
- creer la route `/routes`
- page placeholder propre avec structure future

### Feature 3

Nom de branche:

`feature/routes-lpg-variation`

Contenu:

- modeliser une tournée
- relier camion, origine, destination, niveau GPL
- afficher la variation du GPL sur la tournée

### Feature 4

Nom de branche:

`feature/global-dashboard`

Contenu:

- ajouter `Tableau de bord global` dans la sidebar
- creer la route `/dashboard`
- afficher volumes transportes et reserve

## Convention de branchement

Base de travail:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/routes-lpg-variation
```

Synchronisation avant push:

```bash
git fetch origin
git rebase origin/develop
git push origin feature/routes-lpg-variation --force-with-lease
```

## Regle pro a garder

Une feature = un objectif metier clair.

Exemples:

- bon: `feature/global-dashboard`
- bon: `feature/sites-map-seed`
- bon: `feature/routes-lpg-variation`
- moins bon: `feature/map-update`
- moins bon: `feature/trucks-improvements`

## Recommandation immediate

Le meilleur prochain pas pour ce projet est:

1. creer la feature `sites`
2. ajouter `Tournees GPL` dans la sidebar
3. ajouter `Tableau de bord global` dans la sidebar
4. ne pas mettre toute la logique de tournée dans `trucks`

En bref:

- `trucks` = le vehicule
- `sites` = les lieux metier
- `routes` = le trajet et la consommation / livraison
- `dashboard` = la vision de pilotage
