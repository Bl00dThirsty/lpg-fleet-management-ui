# Feature Roadmap

## Objectif

Faire evoluer l'application d'un simple module `Camions` vers une plateforme de pilotage GPL structurée autour de:

1. l'operationnel des tournées
2. le tableau de bord global

Le but est de garder une architecture simple, lisible et scalable, sans tout melanger dans la feature `trucks`.

Nous avons principalement 7 acteurs dans notre système
- La CSPH qui est le régulateur la plateforme lui est directement dédiée
- La SCDP chargé de l'approvisionnement et stockage
- La SNH chargé de la production locale de GPL
- Les Marketers qui eux sont chargés de la distribution et la commercialisation (ce sont leurs sactivités que nous devons mettre en évidence à travers notre plateforme)
- Le centres emplisseurs : ils servent à conditionner les bouteilles de GPL (un marketer peut posséder 0 ou 1 à plusieurs centres emplisseurs répendus sur l'ensemble du territoire nationale)
- Transporteurs : Achemenement des produits pétroliers (un marketer peut avoir ses propres camions ou passer par un transporteurs indépendants)
- Les clients : Industries, Hotels, restos, cafés, boulangeries etc ( vu qu'on veut mettre en évidence la vente du GPL vrac et bouteilles de 50kg destinés aux entreprises les infos sur les clients doivent être entrée dans le système )

Je veux hiérarchiser toutes ces informations pour avoir l'arborescence la plus propres possible 

Voici l'exemple d'un corps de réponse d'une demande de service SR (service request) dans IBM Maximo
je veux prendre l'utilisation de "org_id" et "site_id" pour les marketers qui ont plusieurs sites (dépôts et centres emplisseurs ou rien), ces sites sont géolocalisés dans le système, la traçabilité historique et le reporting de chaque modification por les dates de dernières modifications avoir une liste des modifications avec les dates et id de la personne ayant apporté ces modifis... dans le système, tout ce qui peut être nécessaire au bon fonctionnement de notre système 
{
            "historyflag": false,
            "actlabcost": 0.0,
            "createwomulti_description": "Create Multi Records",
            "imax_sr_criticality": "MAJR",
            "ticketuid": 3983,
            "plusgrelatetolocal": false,
            "plusgisreviewreqd": false,
            "plusgccf": false,
            "plusgislesslearned": false,
            "plusgmigrationreq": false,
            "imax_sr_type_description": "Corrective (COR)",
            "sitevisit": false,
            "_rowstamp": "86089935",
            "plusgrcfaapp": false,
            "siteid": "PAD_DLA",
            "isknownerror": false,
            "plusgrootcauseiden": false,
            "href": "http://localhost/maxrest/oslc/os/mxsr/_U1IvQ09SMDU2OQ--",
            "affectedperson": "MAXADMIN",
            "status_description": "ATTENTE APPROBATION",
            "plusghassafetycrit": false,
            "plusgmanrca": false,
            "changedate": "2025-10-19T09:30:16+00:00",
            "plusgreltoregional": false,
            "actlabhrs": 0.0,
            "imax_sr_type": "COR",
            "plusgmanhf": false,
            "orgid": "PAD_CM",
            "createwomulti": "MULTI",
            "plusganalysiscomp": false,
            "plusgmanrcfa": false,
            "plusgislocal": false,
            "reportedemail": "grp_dpisi_sisr@pad.cm",
            "plusgglobalincident": false,
            "plusgreportable": false,
            "status": "ATTAPPR",
            "plusgisinvestig": false,
            "template": false,
            "selfservsolaccess": true,
            "inheritstatus": true,
            "reportdate": "2025-10-19T09:30:16+00:00",
            "class_description": "Service Request",
            "plusgdefectelim": false,
            "description": "Le navire ne démarre pas",
            "reportedby": "MAXADMIN",
            "plusgisdefect": false,
            "assetnum": "NAVD001",
            "assetsiteid": "PAD_DLA",
            "class": "SR",
            "plusgfailfix": false,
            "plusgnonconaccept": false,
            "assetorgid": "PAD_CM",
            "plusgstrategic": false,
            "ticketid": "COR0569",
            "plusgacceptinc": false,
            "classstructureid": "SR0197",
            "changeby": "MAXADMIN",
            "affectedemail": "grp_dpisi_sisr@pad.cm",
            "imax_sr_criticality_description": "Majeur",
            "plusgisregional": false,
            "relatedtoglobal": false,
            "hasactivity": false,
            "statusdate": "2025-10-19T09:30:16+00:00",
            "failurecode": "F000691",
            "hassolution": false,
            "plusghfapp": false,
            "plusghighcontext": false,
            "plusginvestreqd": false,
            "location": "QUAI025",
            "isglobal": false,
            "plussisgis": false
}
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

## Regle pro à garder

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
