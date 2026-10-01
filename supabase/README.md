# Pilote de transmission des tournées

Projet dédié : [gpl-tour-dispatch](https://supabase.com/dashboard/project/ppooruggjjmaezlpjxrv), organisation existante, région Paris. Aucun changement sur yolo-delivery.

Branches web et Android : `feature/tour-dispatch-supabase`. La livraison web est proposée en PR vers `develop` ; le dépôt Android est livré séparément.

## Connexion

Passerelle : `https://ppooruggjjmaezlpjxrv.supabase.co/functions/v1/gpl-dispatch`.
Le web utilise `VITE_API_MODE=http` et `VITE_API_BASE_URL` dans les configurations de développement/production et Vercel. Les autres écrans du POC conservent leurs référentiels de démonstration ; ceci n'est pas un backend métier complet.

Les six comptes provisionnés et leurs mots de passe aléatoires sont uniquement dans `supabase/dispatch-test-accounts.local` (ignoré par Git). Aucun e-mail envoyé. Choisir le même compte dans le sélecteur web et saisir son mot de passe. Pour Android, saisir l'adresse e-mail du livreur dans le champ identifiant.

APK : `C:/Users/User/Downloads/gpl-rfid-livraisons/app/build/outputs/apk/debug/app-debug.apk`.
Sur une installation Android existante, vérifier l'URL serveur dans les paramètres : la préférence enregistrée peut encore pointer vers l'ancien serveur. Une installation neuve utilise le projet dédié.

## Réception et périmètre

Une tournée interne est enregistrée avec ses étapes et son équipage en une seule écriture. Le mobile interroge le serveur toutes les cinq secondes lorsqu'il est visible, puis met à jour Room. L'intervalle est configurable par la propriété Gradle `dispatchPollIntervalMs`.

Seul le livreur affecté reçoit la tournée. Le marketeur reste dans son organisation ; le régulateur peut consulter les tournées. Une réaffectation retire l'accès distant à l'ancien livreur, et retire la tournée de sa liste locale après actualisation réussie. Les preuves hors ligne non synchronisées sont préservées. Aucune notification push lorsque l'application est fermée n'est implémentée. Une session expirée nécessite de se reconnecter.

Le pilote couvre la création et l'affectation internes, la consultation des étapes et le démarrage. L'accusé de réception par un transporteur externe, les scans RFID, les bons de livraison et la clôture sur ce nouveau backend ne sont pas implémentés. Ces opérations renvoient une erreur explicite ; ne pas utiliser ce projet comme backend complet de production.

## Vérifications

- 599 références et six comptes de démonstration importés avec autorisation explicite.
- `python supabase/test_dispatch.py` : onze contrôles réels de création, réception, réaffectation, visibilité régulateur et refus inter-organisations. Les identifiants de la tournée conservée sont dans `test-results.json`. Une nouvelle exécution crée une nouvelle tournée `TEST-DISPATCH-*`.
- Web : 551 tests existants et trois tests ciblés du mode distant validés ; compilation effectuée. Le lint global signale 22 erreurs existantes (types `any`, hooks), sans nouveau diagnostic introduit par ces changements.
- Android : huit tests de parsing/mapping et compilation de l'APK validés.
- Navigateur : connexion, affichage et création réelle de TRP-3690 (50 bouteilles, trois étapes) validés. La même tournée est ensuite reçue via API avec le compte du livreur affecté. Cette tournée est un test à conserver uniquement pour validation.
- PDA MBA5 connecté : APK installé en conservant les données existantes, connexion réelle du livreur SCTM validée. TRP-3690 et TEST-PDA-1790870394 affichées. Réaffectation vers le second livreur : disparition automatique ; retour au premier : réapparition automatique, sans navigation ni rafraîchissement. Les deux contrôles ont été effectués après sept secondes de délai.

## Sécurité du projet

Les trois tables ont RLS activé. Les clients ne peuvent écrire directement dans les tables. La passerelle contrôle chaque jeton via Supabase Auth, utilise un profil serveur non modifiable par le client et valide l'organisation de l'équipage. Aucune clé service-role n'est intégrée au web ou à Android. La fonction temporaire d'import est désactivée (HTTP 410, vérification JWT réactivée).

L'audit Supabase signale que la table des référentiels n'a aucune politique de lecture : c'est volontaire, son accès direct est interdit et passe par la passerelle ([explication RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Il signale aussi la [protection contre les mots de passe compromis](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) désactivée. Les mots de passe de ce pilote sont générés aléatoirement.
