# BO-01 — Note de sécurité

## Principe

Le filtrage des menus et les guards Angular sont une **commodité d'interface**,
pas un mécanisme de sécurité. La sécurité réelle est appliquée par l'API NestJS :

- `JwtAuthGuard` global, avec exceptions explicites `@Public()` ;
- `RolesGuard` global en default-deny, avec `@Roles(...)` sur les routes métier
  (AUT-05) ;
- rôles lus dans le JWT `{ sub, email, roles }`, jamais dans un champ envoyé par
  le client.

Un utilisateur qui force `/audit` dans la barre d'adresse est redirigé vers la
page 403 par `roleGuard`. S'il appelle directement l'API d'audit sans le rôle
requis, le backend répond 403 indépendamment du frontend.

## Ce que fait le frontend

| Élément                       | Rôle                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `authGuard` sur le layout     | Exige une session restaurée ; sinon redirection vers `/connexion?returnUrl=…`      |
| `guestGuard` sur `/connexion` | Empêche un utilisateur déjà connecté de rouvrir le formulaire                      |
| `roleGuard(roles)`            | Autorise les rôles déclarés ; `SUPER_ADMIN` passe toujours ; sinon `/acces-refuse` |
| `nav-items.config.ts`         | Source unique des libellés, routes et rôles ; les routes appellent `navRoles(id)`  |
| Sidebar / bottom nav          | Masquent les modules non autorisés (pas de bouton grisé)                           |
| Page 403                      | Explique le refus et propose le retour au tableau de bord ou la déconnexion        |

## Session et redirections

Le noyau TEC-12 est partagé entre la boutique et l'admin. Les chemins sont
injectés au boot de chaque application :

- admin : `AUTH_LOGIN_PATH = '/connexion'`,
  `AUTH_FORBIDDEN_PATH = '/acces-refuse'`, `AUTH_HOME_PATH = '/'` ;
- en cas d'échec du refresh, `RefreshQueueService` vide la session, affiche
  « Votre session a expiré. Reconnectez-vous. » et redirige vers le chemin de
  connexion injecté.

Après connexion, la destination `returnUrl` n'est acceptée que si elle commence
par `/` sans être protocol-relative (`//`), ce qui évite une redirection
ouverte. À défaut, un LIVREUR va sur `/livraisons/mes-livraisons`, les autres
rôles sur `/`.

## Données locales

`localStorage['admin-sidebar-collapsed']` ne contient qu'un booléen de
préférence visuelle. Aucun access token, refresh token ou donnée personnelle
n'y est écrit.

## Tests

Les tests e2e admin interceptent `/api/v1/auth/refresh`, `/api/v1/me` et les
appels produits pour simuler chaque rôle sans créer de comptes dans le seed.
Cette interception reste confinée à Playwright : elle ne modifie ni le code de
production ni les contrôles backend.

## Risques résiduels

1. Les rôles du JWT peuvent rester périmés jusqu'au prochain refresh ; une
   révocation de rôle n'est donc pas instantanée côté interface.
2. Une modification des rôles backend doit être répercutée dans
   `nav-items.config.ts` ; les routes frontend et les menus restent cohérents
   entre eux, mais pas automatiquement avec l'API.
3. La cloche de notifications est un placeholder : aucune donnée sensible ne
   doit y être affichée avant la mise en place de l'endpoint et de son contrôle
   d'accès.
4. Aucun changement backend n'a été effectué dans BO-01 ; la vérification du
   RBAC serveur reste celle d'AUT-05.
