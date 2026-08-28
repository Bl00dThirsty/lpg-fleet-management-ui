# Recherche globale (palette de commandes) — Design

- **Date**: 2026-07-31
- **Status**: Approved (pending user review of written spec)
- **Target repo**: `C:\Users\DTA_WorkStation\Documents\manga\lpg-fleet-management-ui`
- **Scope**: `apps/web` only
- **Compatibility bar**: `typecheck + lint + build` must pass; existing routes/behavior untouched (the header search bar is currently decorative — it becomes functional, nothing else changes)

---

## 1. Goal

Rendre fonctionnelle la barre de recherche du header (`app-header.tsx`) qui est aujourd'hui purement décorative (aucun `<input>`, hint `Ctrl K` affiché sans effet). Elle doit ouvrir une **palette de commandes** permettant une **recherche globale** dans le système :

- navigation rapide vers les **pages** du système (filtrées par le rôle actif, comme la barre latérale) ;
- recherche d'**entités** (camions, sites, transporteurs, marketeurs) avec ouverture directe de leur fiche détail quand elle existe, sinon de leur page liste pré-filtrée.

Choix validés par l'utilisateur :

1. Périmètre : **Pages + entités**.
2. Déclenchement : **palette au clic sur la barre + `Ctrl/⌘+K`** (le focus reste dans la barre cliquable).
3. Navigation entités : **fiche détail si disponible, sinon page liste pré-filtrée**.
4. Approche : **palette cmdk** (suite `Command` déjà exportée par `@lpg/ui`, dépendance `cmdk` déjà installée dans `apps/web`).

---

## 2. Architecture

### 2.1 Fichiers

| Fichier | Type | Rôle |
|---|---|---|
| `apps/web/src/features/command-palette/global-search-store.ts` | créé | Store zustand non persisté `{ open, open(), close(), toggle() }` |
| `apps/web/src/features/command-palette/global-search.tsx` | créé | Composant `GlobalSearch` : dialogue + raccourci clavier + index + navigation |
| `apps/web/src/components/layout/app-header.tsx` | modifié | La barre décorative devient un `<button>` cliquable (même visuel) qui ouvre la palette |

Note : le dossier `apps/web/src/features/command-palette/` existe déjà (vide) — on l'utilise.

### 2.2 Composant `GlobalSearch`

- Rendu via `CommandDialog` (exporté par `@lpg/ui`, basé sur `cmdk`).
- Écouteur global `keydown` : `(metaKey || ctrlKey) && key === 'k'` → `e.preventDefault()` + `toggle()`.
- À l'ouverture : construction de l'index (mémorisé) depuis le rôle actif + les données d'entités.
- Structure cmdk : `CommandInput` (placeholder : "Rechercher une page, un camion, un site…"), `CommandList`, un `CommandGroup` par catégorie (`Pages`, `Camions`, `Sites`, `Transporteurs`, `Marketeurs`), un `CommandItem` par résultat, `CommandEmpty` ("Aucun résultat pour « … »").
- Limite **6 résultats par groupe** pour garder un dialogue compact.
- Filtrage : cmdk filtre sur la prop `value` de chaque `CommandItem` (concaténation normalisée des champs recherchables).
- Sélection : `useNavigate()` de `@tanstack/react-router` puis `close()`.

### 2.3 Barre du header

- Le div décoratif (`app-header.tsx:38`) devient un `<button type="button">` avec le **même visuel** (icône `Search` à gauche, badge `Ctrl K` à droite) et `aria-label="Rechercher dans le système"`.
- `onClick` → `useGlobalSearchStore.getState().open()`.
- La classe de largeur actuelle (`w-72 md:w-80`) est conservée.

---

## 3. Index de recherche & navigation

### 3.1 Pages (navigation)

- Source : `getSidebarData(activeRole)` (`apps/web/src/config/rbac/sidebar-by-role.ts`), aplati en items feuilles `{ title, url }`.
- Chaque item hérite du **titre de son groupe** comme mot-clé (ex. groupe « Camions » → mot-clé pour « Parc camions »).
- **Automatiquement filtré par rôle actif** (le sidebar l'est déjà via `useRoleStore`).
- Affichage : icône du module (si disponible) + titre ; sous-titre = nom du groupe.
- Cible : l'`url` de l'item.

### 3.2 Entités (fiches statiques)

Sources de données et champs recherchés :

| Type | Source | Champs | Cible au clic |
|---|---|---|---|
| Camions | `features/trucks/data/trucks` | `plateNumber`, `tenantName`, `marketer`, `assignedDriver`, `operatingRegion` | `/trucks/{id}` |
| Transporteurs | `features/transporters/data/transporters` | `name`, `region`, `contactEmail` | `/transporters/{id}` |
| Marketeurs | `features/marketers/data/marketers` | `name`, `region` | `/marketers/{id}` |
| Sites | `features/sites/data/sites` | `name`, `city`, `region`, `operator` | page sites du rôle + `?q={name}` |

Règles :

- **Camions / Transporteurs / Marketeurs** : les fiches détail existent (`/trucks/$truckId`, `/transporters/$transporterId`, `/marketers/$marketerId`) → navigation directe par `id`.
- **Sites** : aucune fiche liée aux données `features/sites/data/sites` (la page `/dashboard/sites/$siteId` utilise un autre dataset, `reserveSites` du dashboard — ne pas l'utiliser). Cible = page sites du **rôle actif**, dérivée du sidebar (URL dont le module contient `sites` ou `site-verification`), avec `search.q = nom du site` (la page module générique `/$role/$module` supporte `?q=`). Si le rôle actif n'a **pas** de page sites → les sites ne sont **pas** inclus dans les résultats pour ce rôle.
- Affichage entités : titre = libellé principal (immatriculation / nom), sous-titre = contexte (ex. camion : `tenantName · assignedDriver · operatingRegion` ; site : `city · region`).
- Icônes par type : `Truck`, `MapPin`, `Handshake`, `Building2` (lucide-react, déjà utilisées dans le projet).

---

## 4. Comportement & erreurs

- **Ouverture** : clic barre, `Ctrl/⌘+K`. Fermeture : `Esc` (cmdk), clic extérieur (`CommandDialog`), sélection d'un résultat.
- **Sélection d'un item sans cible valide** : impossible par construction (les entités sont pré-filtrées par rôle) ; en cas de rôle actif sans page sites, les sites ne sont simplement pas proposés.
- **Dialogue ouvert pendant navigation** : la palette se ferme avant/sur navigation → pas d'état incohérent.
- **Aucun résultat** : `CommandEmpty` avec la requête affichée.

---

## 5. Testing

- `global-search-store.test.ts` : `open/close/toggle` (états initiaux et transitions).
- `global-search.test.tsx` : rendu du dialogue à l'ouverture, liste des groupes selon le rôle (ex. SUPER_ADMIN voit les 5 groupes, un rôle sans page sites n'a pas le groupe Sites), sélection d'un camion navigue vers `/trucks/{id}` et ferme la palette, saisie d'une requête filtre les `CommandItem` via `value`.
- Convention tests : vitest (browser) existant dans `apps/web` (`pnpm -C apps/web test`).
- Barre de compatibilité : `typecheck` (tsc -b), `lint`, `build` sans erreur.

---

## 6. Hors périmètre

- Recherche asynchrone via l'API (`trucksHooks`, `sitesHooks`) — les données restent les fichiers statiques actuels.
- Recherche sur d'autres entités (déclarations, tournées, anomalies…) — futures fiches détail non couvertes aujourd'hui.
- Modification du layout/des classes du header en dehors de la transformation div → bouton.
