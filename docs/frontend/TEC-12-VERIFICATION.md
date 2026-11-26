# TEC-12 — Vérification du noyau Angular (intercepteurs, gardes, session, erreurs)

Date : 11 novembre 2026  
Branche : `feature/TEC-12-angular-core-auth-session`

## Périmètre vérifié

- Librairie partagée `frontend/libs/core` (`@bruny/core`), taguée `type:core`.
- `SessionService` : état pur en signaux, jeton d’accès uniquement en mémoire.
- `AuthService`, `RefreshQueueService`, `SessionRestoreService`.
- `ToastService`, `LoadingService`, `GlobalErrorHandler`.
- Intercepteurs fonctionnels ordonnés : `requestIdInterceptor → authInterceptor → loadingInterceptor → errorInterceptor`.
- Gardes fonctionnels : `authGuard`, `roleGuard(allowedRoles)`, `guestGuard`.
- Tokens de chemins : `AUTH_LOGIN_PATH`, `AUTH_FORBIDDEN_PATH`, `AUTH_HOME_PATH`.
- `withFetch()` sur les deux applications.
- Restauration silencieuse de session au démarrage, navigateur uniquement.

## Vérifications exécutées

| Commande | Résultat |
| --- | --- |
| `pnpm -C frontend exec nx run-many -t typecheck` | OK (storefront, admin) |
| `pnpm -C frontend exec nx run-many -t lint` | OK (ui, admin, storefront, data-access, util) ; core OK après corrections |
| `pnpm -C frontend exec nx run-many -t build` | OK (admin, storefront) |
| `pnpm -C frontend exec vitest run libs/core` | OK — 10 fichiers, 44 tests |
| `pnpm -C frontend exec vitest run libs/core/src/lib/auth/refresh-queue.service.spec.ts` | OK — CA #1 : un seul refresh pour trois 401 concurrents, puis rejeu des trois requêtes |

## Points de contrôle fonctionnels

1. **CA #1 — un seul refresh pour trois 401** : `RefreshQueueService` partage une seule requête `/auth/refresh` via `shareReplay`, puis rejoue les trois requêtes initiales avec le nouveau Bearer.
2. **CA #4 — restauration silencieuse** : `SessionRestoreService.restore()` ne s’exécute qu’en navigateur (`isPlatformBrowser`) et ne bloque pas le boot grâce à `provideAppInitializer`.
3. **CA #5 — aucun stockage persistant** : `SessionService` n’écrit jamais dans `localStorage`, `sessionStorage` ni `document.cookie` ; seul un signal mémoire est mis à jour.
4. **401 sans toast** : `errorInterceptor` retourne l’erreur sans toast pour les 401 ordinaires ; la déconnexion forcée est déléguée à `RefreshQueueService`.
5. **`CAPTCHA_*` laissés au formulaire** : aucun toast global pour `CAPTCHA_REQUIRED`, `CAPTCHA_INVALID`, `CAPTCHA_UNAVAILABLE`.
6. **Microtextes français** : les toasts utilisent les formulations canoniques (`Connexion impossible…`, `Votre session a expiré…`, `Vous n’avez pas accès à cette page.`, `Une erreur est survenue…`).
7. **Gardes** : `authGuard`, `roleGuard(allowedRoles)` et `guestGuard` sont des `CanActivateFn` et redirigent via `createUrlTree`.
8. **SSR** : `withFetch()` est présent dans les deux `app.config.ts` ; la restauration de session est ignorée côté serveur.

## Limitations connues

- Le correctif UI minimal a rétabli les builds Angular (composant `SizeSelectorComponent.isEqual` et migration de la page design-system et de la fiche produit vers la nouvelle API `[items]`/`[selected]`/`(select)`).
- Les suites UI préexistantes non liées à TEC-12 (input, price-tag, product-card, skeleton et size-selector) ne font pas partie du périmètre de cette vérification ; elles n’ont pas été modifiées.
- Les applications storefront et admin n’exposent pas encore de routes `/connexion`, `/compte` ou `/403` côté storefront : les gardes y sont exportés et testés, mais non câblés à des routes.
- L’intégration transactionnelle complète (paiement, commandes) reste hors périmètre de BRUNY SHOPPING à ce stade.
