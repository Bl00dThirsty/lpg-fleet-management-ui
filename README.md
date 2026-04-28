# LPG Fleet Dashboard

Interface web pour le suivi operationnel des camions GPL avec une base multi-tenant.

## Objectif actuel

Cette premiere etape livre:

- une structure de projet nettoyee du template admin generique
- une navigation recentree sur la flotte
- une page `Camions` avec liste et caracteristiques des trucks

## Stack

- React + TypeScript + Vite
- TanStack Router
- TanStack Query
- Tailwind CSS + shadcn/ui

## Demarrage

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Variables d'environnement

Copier `.env.example` vers `.env` en local et renseigner au minimum:

```bash
VITE_ARCGIS_API_KEY=your_arcgis_api_key
```

La carte ArcGIS ne se charge pas sans cette variable.

## Deploiement

Le projet est une SPA Vite frontend-only. Il est pret pour:

- Vercel
- Netlify
- toute plateforme statique qui publie le dossier `dist`

Les routes SPA sont déjà gerees:

- `vercel.json` pour Vercel
- `netlify.toml` et `public/_redirects` pour Netlify et les hebergeurs compatibles

### Vercel

1. Importer le repository dans Vercel
2. Laisser la detection Vite ou utiliser `npm run build` comme build command
3. Definir `dist` comme output directory
4. Ajouter la variable d'environnement `VITE_ARCGIS_API_KEY`
5. Deployer

### Netlify

1. Importer le repository dans Netlify
2. Utiliser `npm run build` comme build command
3. Definir `dist` comme publish directory
4. Ajouter la variable d'environnement `VITE_ARCGIS_API_KEY`
5. Deployer

### Verification rapide en local avant push

```bash
npm install
npm run build
npm run preview
```

## Prochaine suite logique

- isolation des donnees par tenant
- gestion utilisateurs/roles par tenant
- programmation des livraisons GPL