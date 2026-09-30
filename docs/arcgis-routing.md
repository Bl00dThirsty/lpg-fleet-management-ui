# Itinéraires routiers ArcGIS

Les vues de cartographie nationale, de tournée et de camions calculent la
géométrie de leurs itinéraires via ArcGIS Route, en conservant les données
métier simulées.

- Configuration : `apps/web/.env`, variable `VITE_ARCGIS_API_KEY`. La clé doit
  autoriser le fond de carte et le service de routage
  (`premium:user:networkanalysis`), ainsi que les domaines de l’application.
- Les étapes sont transmises dans leur ordre initial. Seuls les doublons
  consécutifs sont supprimés. Aucun point intermédiaire invalide n’est ignoré.
- Le tracé affiché est la géométrie routière complète en WGS84 retournée par
  ArcGIS. Aucun segment fictif ne remplace un calcul en échec.
- Les fiches VRAC présentent la distance et la durée du calcul. Les horaires
  du scénario restent simulés. Le calcul utilise le routage standard du service,
  sans profil spécifique aux citernes GPL.
- Les positions de démonstration sont projetées sur le tracé pour l’affichage.
  Dans les vues tournées/camions, ceci ne s’applique qu’en mode
  `VITE_API_MODE=fake`. Les coordonnées stockées ne sont jamais modifiées.
- Les résultats sont partagés en mémoire par liste d’étapes, conservés 30 minutes
  après leur dernière utilisation. Un changement de thème ne déclenche pas
  un nouvel appel. Aucun cache permanent de géométrie n’est écrit.
- Une connexion au service reste nécessaire au premier calcul. Sans carte
  accessible, un état indisponible remplace le schéma décoratif précédent.

Le module partagé est `features/map/lib/road-routing.ts`; les requêtes React
sont dans `features/map/data/road-routes.ts`.

Documentation : [ArcGIS Route service](https://developers.arcgis.com/rest/routing/).

