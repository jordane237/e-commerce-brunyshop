# BO-01 — Analyse du design et décisions

## 1. Sources examinées

| Source                                        | Contenu utilisé                                        |
| --------------------------------------------- | ------------------------------------------------------ |
| `docs/design/DSG-06/README.md`                | 21 vues A01–A16, conventions FR, rôles et dépendances  |
| `docs/design/DSG-06/A01-connexion-admin.md`   | Connexion, redirection après authentification          |
| `docs/design/DSG-06/A03-dashboard.md`         | Structure desktop 1280, tablette 768, mobile 360       |
| `docs/design/DSG-06/A09b-my-deliveries.md`    | Accès LIVREUR et prévisualisation administrateur       |
| `docs/design/DSG-06/A04` à `A16`              | Cartographie des modules et rôles autorisés            |
| `docs/design/DSG-06/CARTOGRAPHIE.md`          | Routes cibles, guards et navigation par rôle           |
| `docs/design/DSG-06/RESPONSIVE-PATTERNS.md`   | Ruptures 360/768/1024/1280, drawer et tables → cartes  |
| `docs/design/DSG-06/COMPOSANTS-REQUIS.md`     | Composants attendus et niveaux de priorité             |
| `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md` | Microtextes canoniques FR, dont 403 et session expirée |
| `docs/design/DSG-07/DESIGN-FREEZE.md`         | Gel MVP v1.0.0                                         |
| `docs/design-1/ANALYSE-MAQUETTES.md`          | Inventaire visuel des maquettes existantes             |

Les maquettes ne sont pas stockées comme fichiers PNG/SVG dans le dépôt : les
sources exploitables sont les specs Markdown DSG-06 et l'analyse visuelle
`docs/design-1/ANALYSE-MAQUETTES.md`. Les chemins `/design` et `/design-1`
mentionnés dans le brief correspondent à ces dossiers de documentation, pas à
des dossiers d'images à la racine.

## 2. Existant avant BO-01

- Coquille admin minimale dans `app.html` : sidebar « Catalogue », profil et
  déconnexion, sans navigation par rôle ni responsive.
- Une seule route métier réelle : `/produits` (`ProductsPage`).
- Noyau TEC-12 réutilisable : `SessionService`, `AuthService`, `authGuard`,
  `roleGuard`, `guestGuard`, `RefreshQueueService`, toasts et interception HTTP.
- `AUTH_LOGIN_PATH`, `AUTH_FORBIDDEN_PATH` et `AUTH_HOME_PATH` injectables.
- Composants UI disponibles : `IconComponent`, `ToastComponent` et composants
  DSG-06 ; aucune sidebar, bottom nav, breadcrumb ou cloche réutilisable.
- Routes cibles DSG-06 écrites avec le préfixe `/admin`; le base href admin vaut
  `/`, donc BO-01 conserve les routes racine (`/produits`, `/commandes`, etc.).

## 3. Structure de layout retenue

| Breakpoint  | Comportement                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| ≥ 1024 px   | Sidebar persistante de 240 px, repliable à 64 px ; header collant ; contenu max 1200 px                                 |
| 768–1023 px | Sidebar forcée en mode icônes (64 px) ; header avec fil d'Ariane                                                        |
| < 768 px    | Sidebar masquée ; barre basse de 4 entrées + profil (ou 1 + profil pour LIVREUR) ; burger ouvrant un drawer plein écran |

La préférence de repli desktop est conservée dans
`localStorage['admin-sidebar-collapsed']`. Il s'agit uniquement d'une préférence
d'interface : aucun jeton ni donnée de session n'est stocké dans `localStorage`.

## 4. Mapping rôles → menus

La source unique est
`frontend/apps/admin/src/app/layout/navigation/nav-items.config.ts`. Les routes
consomment les mêmes rôles via `navRoles(id)` ; la sidebar et la barre basse
filtrent la même liste avec `SessionService.hasAnyRole`.

| Module          | SUPER_ADMIN | ADMIN | ORDER_MANAGER | STOCK_MANAGER | LIVREUR |
| --------------- | ----------- | ----- | ------------- | ------------- | ------- |
| Tableau de bord | ✅          | ✅    | ✅            | ✅            | —       |
| Produits        | ✅          | ✅    | —             | ✅            | —       |
| Stock           | ✅          | ✅    | —             | ✅            | —       |
| Commandes       | ✅          | ✅    | ✅            | —             | —       |
| Livraisons      | ✅          | ✅    | ✅            | —             | —       |
| Mes livraisons  | —           | —     | —             | —             | ✅      |
| Clients         | ✅          | ✅    | ✅            | —             | —       |
| Utilisateurs    | ✅          | ✅    | —             | —             | —       |
| Promotions      | ✅          | ✅    | —             | —             | —       |
| Avis            | ✅          | ✅    | —             | —             | —       |
| Paramètres      | ✅          | ✅    | —             | —             | —       |
| Audit           | ✅          | ✅    | —             | —             | —       |
| Mon profil      | ✅          | ✅    | ✅            | ✅            | ✅      |

Écarts assumés par rapport à DSG-06 :

- DSG-06 accorde Promotions et Avis en lecture à `ORDER_MANAGER` ; le brief
  BO-01 limite ses entrées à Commandes, Livraisons et Clients. La config du
  ticket fait foi, ces deux écrans restent réservés aux administrateurs.
- A03 est décrit comme accessible à tous les internes, mais le brief exclut le
  LIVREUR du dashboard. Le livreur atterrit directement sur Mes livraisons ;
  le logo de la sidebar et du header pointe vers son premier module autorisé.
- DSG-06 prévoit une prévisualisation administrateur de A09b. Pour BO-01,
  « Mes livraisons » reste réservé au LIVREUR dans le menu ; `SUPER_ADMIN`
  conserve toutefois la possibilité technique de forcer la route, car
  `roleGuard` le laisse toujours passer.

## 5. Fil d'Ariane, titre et notifications

- Chaque route porte `data.title` et `data.breadcrumb`.
- `RouteMetaService` écoute `NavigationEnd`, construit le fil « Accueil > … »
  et expose le titre courant.
- `PageTitleComponent` rend l'unique `<h1>` de la page. La page Produits
  existante a été alignée pour ne plus produire de second `<h1>`.
- Les notifications d'actions utilisent le `ToastService` TEC-12 et le
  `ToastComponent` monté dans `App`.
- `NotificationBellComponent` affiche l'état « 0 non lue » et accepte déjà un
  `unreadCount` : l'endpoint de notifications reste à créer dans un ticket NTF-\*.

## 6. Microtextes retenus (DSG-07)

| Situation         | Texte                                     |
| ----------------- | ----------------------------------------- |
| Titre 403         | Accès refusé                              |
| Message 403       | Vous n'avez pas accès à cette page.       |
| Action 403        | Retour au tableau de bord                 |
| Session expirée   | Votre session a expiré. Reconnectez-vous. |
| Profil            | Mon profil                                |
| Déconnexion       | Déconnexion                               |
| Navigation mobile | Navigation mobile                         |

## 7. Tokens et composants

- Couleurs, espacements, rayons, ombres et z-index viennent des tokens
  `--bs-*` de `libs/design-tokens`.
- Composants réutilisés : `IconComponent`, `ToastComponent`.
- Composants créés dans `layout/components/` car spécifiques au back-office :
  sidebar, header, bottom nav, drawer mobile, breadcrumb, page title et cloche.
- Aucun composant du layout n'importe une feature ; les routes composent les
  features par lazy loading.

## 8. Limites de BO-01

- Les modules autres que Produits sont des placeholders « Page en construction ».
- La cloche de notifications n'est pas encore alimentée par une API.
- A02 (2FA) et les écrans de détail A05/A08/A09c/A10b/A12b restent à implémenter
  dans leurs tickets dédiés.
- Aucun endpoint backend n'a été ajouté ou modifié.
