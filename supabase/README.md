# Pilote de transmission des tournées et enlèvements

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

Le pilote couvre les tournées internes et les enlèvements SNH/SCDP : planification, affectation de l’équipage du marketeur, réception sur le mobile, validation du chargement, scans des bouteilles, livraison et clôture. Le bon photographié est obligatoire au départ d’un enlèvement, y compris pour les bouteilles. Les justificatifs sont conservés dans le bucket privé Supabase `dispatch-proofs` ; la base ne stocke que leur chemin. Le détail web des tournées et enlèvements permet de consulter les justificatifs.

L’enlèvement est transmis dans la même liste de missions que les tournées, avec `mission_kind=PICKUP`, `scheduled_at` et `pickup_status`. Il possède deux étapes (dépôt fournisseur et destination du marketeur). Le web distingue les deux types dans ses listes. La clôture reste réservée au livreur affecté après la réception. Le workflow transporteur externe n’est pas couvert par la planification d’enlèvement de ce pilote.

Les sites affectés, lorsqu’ils sont renseignés dans le profil du POC, limitent la destination sélectionnable et sont contrôlés côté serveur. Les comptes de démonstration sans affectation restent au périmètre de leur organisation. Les liens privés des justificatifs expirent selon `storage.proof_url_expiry_seconds` dans les ressources `settings`.

## Vérifications du parcours d’enlèvement (5 octobre 2026)

- Web : `npm run typecheck`, `npm run lint`, `npm test` ; tests du formulaire, de ses validations, des permissions et de l’ouverture des justificatifs.
- Passerelle : `node --experimental-transform-types --test supabase/functions/gpl-dispatch/execution.test.ts supabase/functions/gpl-dispatch/index.test.ts` ; dix tests couvrant les preuves obligatoires, quantités, cycles d’exécution, planification, accès et expiration des liens. Les tests HTTP emploient un référentiel simulé.
- Android : `gradlew.bat :app:testDebugUnitTest :app:assembleDebug` ; migration Room additive version 10 pour le type de mission et la date planifiée.
- Intégration réelle : `python supabase/test_dispatch.py` requiert le fichier local des comptes ci-dessus. Le script crée des missions de test, contrôle l’isolation entre livreurs/organisations, transmet un justificatif de test et vérifie son téléchargement privé. Il conserve une mission `TEST-PDA-ENL-*` pour le PDA et écrit ses identifiants dans `test-results.json`.
- Cette dernière vérification d’enlèvement avec les comptes réels reste à exécuter : le fichier local des comptes manque dans ce checkout, la session Chrome n’est pas accessible par l’outil et aucun PDA n’était connecté lors de la vérification. Les anciens résultats de `test-results.json` ne prouvent pas ce nouveau parcours.

### Essai manuel SCTM

1. Sur le web, ouvrir **Enlèvements → Planifier un enlèvement** et choisir un dépôt SNH/SCDP, le site SCTM destinataire, la date, le produit, la quantité et l’équipage SCTM.
2. Sur Android, se connecter avec le livreur affecté et ouvrir la mission. Photographier le bon au dépôt ; pour des bouteilles, scanner le nombre exact attendu. Valider le chargement.
3. Confirmer la réception à destination et terminer la mission.
4. Sur le web, actualiser les enlèvements et ouvrir le détail : le bon doit être consultable dans **Documents scannés**. La même section est disponible dans les détails des tournées.

## Sécurité du projet

Les trois tables ont RLS activé. Les clients ne peuvent écrire directement dans les tables. La passerelle contrôle chaque jeton via Supabase Auth, utilise un profil serveur non modifiable par le client et valide l'organisation de l'équipage. Aucune clé service-role n'est intégrée au web ou à Android. La fonction temporaire d'import est désactivée (HTTP 410, vérification JWT réactivée).

L'audit Supabase signale que la table des référentiels n'a aucune politique de lecture : c'est volontaire, son accès direct est interdit et passe par la passerelle ([explication RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Il signale aussi la [protection contre les mots de passe compromis](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) désactivée. Les mots de passe de ce pilote sont générés aléatoirement.
