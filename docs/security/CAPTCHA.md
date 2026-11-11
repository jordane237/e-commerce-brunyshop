# CAPTCHA Cloudflare Turnstile (AUT-11)

## Périmètre livré

- Widget Turnstile **invisible** (`appearance: interaction-only`) sur la connexion de l’administration.
- Vérification serveur centralisée dans `TurnstileService`, avec timeout et **fail-closed**.
- Guard réutilisable `TurnstileGuard` sur :
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/orders`
  - `POST /api/v1/contact`
- Endpoint public `GET /api/v1/config` qui ne renvoie que `turnstileEnabled` et `turnstileSiteKey`.
- Formulaire de contact public persisté dans `ContactMessage` (un contact anonyme ne peut pas alimenter `AuditLog`, qui exige un utilisateur).
- CSP Nginx autorisant `challenges.cloudflare.com` pour le script, le cadre et les appels du widget.

## Ce qui n’est pas encore intégré

Le storefront ne possède pas encore de pages d’inscription, de commande ou de contact client. Les guards backend sont prêts, mais le widget n’est affiché côté storefront que lorsque ces parcours seront créés (P14/P15/P11/P22 dans la documentation de design). À ce stade, le seul formulaire réellement équipé est la connexion admin existante. Ne pas présenter les parcours client comme complets.

## Configuration

Variables backend (voir `backend/.env.example` et `.env.example`) :

| Variable | Défaut dev/test | Description |
| --- | --- | --- |
| `TURNSTILE_ENABLED` | désactivé en dev/test, activé en staging/production | Active la vérification serveur. |
| `TURNSTILE_SITE_KEY` | aucune | Clé publique du widget. |
| `TURNSTILE_SECRET_KEY` | aucune | Clé secrète, jamais exposée au frontend. |
| `TURNSTILE_VERIFY_URL` | `https://challenges.cloudflare.com/turnstile/v0/siteverify` | URL de vérification. |
| `TURNSTILE_TIMEOUT_MS` | `5000` | Timeout réseau, borné entre 1 000 et 15 000 ms. |

Quand `TURNSTILE_ENABLED=true`, le démarrage échoue si la clé publique ou la clé secrète manque. Les valeurs de test Cloudflare fournies dans les fichiers d’exemple ne doivent jamais être utilisées en production.

Le widget est chargé uniquement dans le navigateur. Le rendu SSR ne contient pas `<ngx-turnstile>` et le composant Angular n’accède pas à `window` côté serveur.

## Contrat API

Le jeton est accepté dans le corps JSON :

```json
{ "turnstileToken": "..." }
```

ou dans l’en-tête `cf-turnstile-response`.

Réponses d’erreur :

| Code | Statut | Signification |
| --- | --- | --- |
| `CAPTCHA_REQUIRED` | 400 | Jeton absent alors que le CAPTCHA est actif. |
| `CAPTCHA_INVALID` | 400 | Jeton refusé par Cloudflare. |
| `CAPTCHA_UNAVAILABLE` | 503 | Timeout, erreur réseau, 5xx ou réponse invalide de Cloudflare. |

Une indisponibilité est **fail-closed** : la requête protégée n’est pas exécutée. Le service émet une alerte Pino `TURNSTILE_UNAVAILABLE` avec la cause et un aperçu tronqué du jeton, jamais le jeton complet ni la clé secrète.

`GET /api/v1/config` renvoie par exemple :

```json
{ "turnstileEnabled": true, "turnstileSiteKey": "1x00000000000000000000BB" }
```

La clé secrète n’est jamais sérialisée par cet endpoint.

## Désactivation explicite

`TURNSTILE_ENABLED=false` est prévu pour les environnements de développement, les tests génériques et une urgence opérationnelle. Le guard laisse alors passer les requêtes sans jeton. Cette désactivation doit être tracée et évitée en production ; les tests e2e génériques la forcent pour ne pas dépendre du CAPTCHA.

## Clés de test Cloudflare

| Usage | Clé site | Clé secrète | Jeton |
| --- | --- | --- | --- |
| Toujours valide | `1x00000000000000000000BB` | `1x0000000000000000000000000000000AA` | `XXXX.DUMMY.TOKEN.XXXX` |
| Toujours invalide | `2x00000000000000000000BB` | `2x0000000000000000000000000000000AA` | `XXXX.DUMMY.TOKEN.XXXX` |

Ces valeurs sont publiques et réservées aux tests.

## Vérification

```bash
pnpm -C backend test -- turnstile
pnpm -C backend test:e2e
pnpm -C frontend exec vitest run \
  libs/ui/src/lib/captcha/captcha.component.spec.ts \
  libs/data-access/src/lib/public-config.service.spec.ts
pnpm lint
```

Les e2e CAPTCHA utilisent un **stub local** de `siteverify` : le service Cloudflare de test timeout lorsqu’il reçoit trop de requêtes successives, ce qui rendrait la CI instable. Le stub reçoit le même POST `application/x-www-form-urlencoded`, applique les clés de test et renvoie le même contrat JSON. Le vrai appel HTTP reste couvert par les tests unitaires et peut être vérifié manuellement :

```bash
curl -sS -X POST https://challenges.cloudflare.com/turnstile/v0/siteverify \
  -d 'secret=1x0000000000000000000000000000000AA&response=XXXX.DUMMY.TOKEN.XXXX'
```

## Avant la production

- [ ] Créer un widget Turnstile pour le domaine réel dans le tableau de bord Cloudflare.
- [ ] Remplacer les clés de test par les clés de production, via le gestionnaire de secrets.
- [ ] Vérifier que la CSP autorise uniquement `https://challenges.cloudflare.com`.
- [ ] Tester un échec Cloudflare et confirmer l’alerte `TURNSTILE_UNAVAILABLE`.
- [ ] Vérifier que `GET /config` ne contient jamais la clé secrète.
- [ ] Ne pas désactiver le CAPTCHA en production sans procédure d’urgence documentée.
