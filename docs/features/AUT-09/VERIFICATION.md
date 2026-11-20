# AUT-09 — Vérification

> Branche : `feature/AUT-09-customer-login-register-screens`
> Date : 16 novembre 2026
> Environnement : Angular 22, Vitest, Chrome headless, backend NestJS local.

---

## 1. Résultats des 18 vérifications

| # | Vérification | Résultat | Preuve |
|---|---|---|---|
| 1 | Branche dédiée active | ✅ | `git branch --show-current` → `feature/AUT-09-customer-login-register-screens` |
| 2 | Build storefront production | ✅ | `pnpm build:storefront` réussi |
| 3 | Build admin production | ✅ | `pnpm build:admin` réussi |
| 4 | Tests unitaires frontend | ✅ | `63` fichiers, `317` tests réussis |
| 5 | ESLint frontend | ✅ | `pnpm lint` sans erreur |
| 6 | Backend santé | ✅ | `GET /api/v1/health/ready` → `200`, DB et Redis `up` |
| 7 | Boutique locale | ✅ | `http://localhost:4200` → `200` |
| 8 | Login réel + redirection | ✅ | Playwright : `/connexion?returnUrl=/panier` → `/panier`, API login `200` |
| 9 | Login invalide | ✅ | Message « E-mail/téléphone ou mot de passe incorrect… », API `401` |
| 10 | Verrouillage brute force | ⚠️ | Mapping `TOO_MANY_ATTEMPTS` couvert par test unitaire ; pas de verrouillage réel forcé pour ne pas bloquer le compte de démonstration |
| 11 | Inscription réelle | ✅ | Playwright : API `201`, panneau « Votre compte est créé » |
| 12 | Doublon neutre | ✅ | Même e-mail soumis à nouveau : succès neutre, aucun message « existe déjà » |
| 13 | Validation en direct | ✅ | Tests composants + saisie Chrome : identifiant, mot de passe, confirmation, CGV |
| 14 | Toggle mot de passe | ✅ | Playwright : `password` → `text`, libellé « Masquer le mot de passe » |
| 15 | CAPTCHA | ⚠️ | `GET /config` renvoie `turnstileEnabled: false` ; le chemin activé est couvert par le code et les tests de contrôle, pas par un widget réel |
| 16 | SSR | ✅ | `curl /connexion` et `/inscription` → `200`, HTML avec formulaire |
| 17 | Accessibilité | ⚠️ | ARIA, labels, rôles et focus vérifiés par tests ; pas de test NVDA/VoiceOver réel |
| 18 | Non-régression | ✅ | `/`, `/boutique`, `/panier`, `/connexion`, `/inscription` → `200` sur le serveur de dev 4200 |

---

## 2. Commandes exécutées

```bash
cd frontend
pnpm test
pnpm lint
pnpm build:storefront
pnpm build:admin

cd ../backend
PORT=4000 pnpm dev
curl http://localhost:4000/api/v1/health/ready
```

Rendu SSR :

```bash
cd frontend
PORT=4000 node dist/apps/storefront/server/server.mjs
curl http://localhost:4000/connexion
curl http://localhost:4000/inscription
```

Parcours navigateur :

- Chrome headless, viewport 360 × 800 et 768 × 900.
- Connexion avec un compte créé via l’API réelle.
- Inscription avec e-mail, mot de passe fort, confirmation et CGV.
- Soumission du même e-mail pour vérifier la neutralité du doublon.
- Vérification de l’absence de débordement horizontal.

---

## 3. Corrections issues de la vérification

### SSR et configuration CAPTCHA

Le premier rendu SSR de `/connexion` bouclait : `PublicConfigService` appelait une URL relative `/api/v1/config` depuis le serveur SSR, qui se rappelait lui-même via la route wildcard.

Correction : le chargement de la configuration CAPTCHA est désormais limité au navigateur (`isPlatformBrowser`). Le CAPTCHA reste browser-only, conformément à AUT-11.

### Specs UI obsolètes

La suite frontend était rouge avant AUT-09 : 5 fichiers, 41 tests. Les specs `Input`, `PriceTag`, `ProductCard`, `SizeSelector` et `Skeleton` ont été réalignées sur les API actuelles. Elles passent désormais, sans modifier le comportement métier des composants.

### `InputComponent` et Reactive Forms

`InputComponent` ne supportait pas `formControlName`. Il implémente maintenant `ControlValueAccessor` (`writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`) tout en conservant `value` / `valueChange`.

---

## 4. Limites restantes

- Le CAPTCHA réel n’a pas été exercé : Turnstile est désactivé dans la configuration locale. Le chemin activé exige une clé de test et un environnement navigateur réseau.
- Le verrouillage brute force réel n’a pas été provoqué ; le mapping du code `TOO_MANY_ATTEMPTS` est testé unitairement.
- Aucun lecteur d’écran réel n’a été utilisé. Les vérifications portent sur les rôles, labels, `aria-invalid`, `aria-describedby`, `aria-live` et `role="alert"`.
- Les liens CGV et confidentialité pointent vers des routes P27 non encore livrées.
- La page `/compte` est volontairement provisoire : elle sert de cible de redirection par défaut avant P17.
- Le serveur SSR de production sans proxy API ne peut pas rendre les pages qui appellent l’API relative ; `/connexion` et `/inscription` sont SSR-safe car la config CAPTCHA est différée au navigateur.
- Le backend ne fournit pas de parcours de vérification d’e-mail ; le message de succès ne le promet pas.
- La 2FA client n’est pas implémentée dans la boutique ; un challenge admin est signalé sans ouvrir de session.
