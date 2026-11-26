# MKT-02 — Vérification

> Date des vérifications : **16 novembre 2026**.
> Branche : `feature/MKT-02-contact-form`.
> Environnement : Node.js `v24.15.0`, Angular `22.2.2`, NestJS `12`, Prisma `7.10`, Vitest, PostgreSQL et Redis locaux.
> Les résultats ci-dessous proviennent des commandes réellement exécutées dans le dépôt.

---

## 1. Base de données et contrats

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm -C backend exec prisma validate` | ✅ | Schéma valide |
| `pnpm -C backend exec prisma migrate status` | ✅ | 15 migrations, base à jour |
| `pnpm openapi:export` | ✅ | 31 chemins exportés dans `backend/openapi.json` |
| `pnpm api:generate` | ✅ | `api-types.ts` régénéré |
| Comparaison SHA-256 avant/après | ✅ | `openapi.json` et `api-types.ts` stables, aucune dérive |

La migration `20261116120000_mkt02_contact_triage` a été appliquée. Elle est
additive et conserve la table `ContactMessage` d’AUT-11.

---

## 2. Compilation et lint

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm typecheck` | ✅ | Backend `tsc --noEmit`, storefront et admin |
| `pnpm lint` | ✅ | Backend et frontend, aucune erreur ni avertissement |
| `pnpm -C frontend build:storefront` | ✅ | Build SSR réussi, chunk `contact-component` ≈ 24 kB brut |
| `pnpm -C frontend build:admin` | ✅ | Build production admin réussi |

### Incident lint corrigé

Le premier `pnpm lint` signalait 7 erreurs de frontière de module pour les imports
`contact → audit` et `contact → notifications`. La configuration ESLint a reçu une
exception explicite pour `src/modules/contact/**`, comme pour `inventory`, et
`contact` a été ajouté à la liste des modules protégés. Le lint complet repasse
ensuite sans erreur. Aucun import n’a été masqué par un commentaire de suppression.

---

## 3. Tests backend

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm -C backend test` | ✅ | **27 fichiers, 253 tests passés** |
| `pnpm -C backend test:e2e` | ✅ | **15 fichiers, 209 tests passés, 0 erreur** |

Les tests MKT-02 couvrent notamment :

- les 3 cas du `ContactService` : persistance + notifications + audit, honeypot,
  fallback de l’adresse support ;
- l’échappement HTML, la neutralisation CR/LF du sujet et le texte brut des
  templates de contact ;
- le formulaire public protégé : CAPTCHA requis, jeton valide dans le body ou le
  header, validation stricte, persistance avec statut `NEW`, audit sans e-mail,
  deux notifications (`contact.message` et `contact.confirmation`), honeypot sans
  persistance et rate limit 429 `RATE_LIMITED`.

### Incident e2e corrigé

La première exécution complète a révélé des rejets `P2025` provenant de jobs
BullMQ résiduels : le nettoyage supprimait des notifications encore en cours de
traitement. Le test CAPTCHA utilise désormais l’adaptateur e-mail console,
attend la fin des notifications de contact et purge la queue Redis e2e avant et
après l’exécution. La suite complète repasse **209/209 sans erreur non gérée**.

---

## 4. Tests frontend

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm -C frontend exec vitest run --maxWorkers=2` | ✅ | **77 fichiers, 368 tests passés** |
| `pnpm -C frontend exec vitest run apps/storefront/src/app/features/contact/contact.component.spec.ts` | ✅ | **6/6 tests** |

Les specs de la page vérifient le contenu P22, les liens WhatsApp/téléphone/Facebook,
l’absence d’iframe, la validation, la normalisation du payload, la confirmation
avec référence, l’erreur de rate limit et l’exigence du jeton quand Turnstile est
activé. Les specs de routes et de footer ont été mises à jour pour `/contact`.

---

## 5. Vérification SSR

Le build storefront a été servi avec :

```bash
cd frontend
NODE_OPTIONS=--max-old-space-size=8192 PORT=4000 \
  node dist/apps/storefront/server/server.mjs
```

| Contrôle | Résultat |
| --- | --- |
| `GET /contact` | **200** |
| Titre | `Contact \| BRUNY SHOPPING` |
| `h1` | 1 seul, « Contactez-nous » |
| Canonical | `https://brunyshop.cm/contact` |
| Meta description | Présente, en français |
| IDs dupliqués dans le HTML SSR | Aucun |
| Champs | `contact-name`, `contact-email`, `contact-phone`, `contact-subject`, `contact-order-reference`, `contact-message`, `contact-consent` |
| Script/iframe Turnstile dans le SSR | Absent |
| Liens `/contact` | 3 (header, footer, layout légal) |
| Footer | Présent |
| WhatsApp / téléphone / Facebook | Liens rendus avec les valeurs de `APP_CONFIG` |

Contrôles annexes :

- `GET /sitemap.xml` → **200**, `application/xml`, **11 URL**, dont `/contact` ;
- `GET /robots.txt` → **200**, `text/plain`, sitemap déclaré ;
- le HTML SSR ne contient aucun script Cloudflare : le CAPTCHA est chargé
  uniquement côté navigateur après récupération de la configuration publique.

---

## 6. Accessibilité — contrôles réalisés

Contrôlés par les specs, le HTML SSR et l’inspection du code :

- un seul `h1`, sections `h2` ;
- labels associés aux champs et IDs uniques dans le HTML SSR ;
- `aria-invalid`, `aria-describedby`, `aria-required` exposés par les composants ;
- focus sur le premier champ invalide et sur le titre de confirmation ;
- compteur de caractères en `aria-live="polite"` ;
- honeypot hors tabulation et hors arbre d’accessibilité ;
- liens externes avec `rel="noopener noreferrer"` ;
- cibles ≥ 44 px, focus visible et contrastes basés sur les tokens.

Non réalisés : audit axe-core, navigation clavier manuelle, lecteur d’écran,
zoom 200 % et test de contraste outillé.

---

## 7. Ce qui n’a pas été vérifié ou reste bloqué

| Élément | Raison |
| --- | --- |
| Envoi réel via Cloudflare Turnstile | E2E avec faux serveur `siteverify`, pas de clé de production |
| Livraison e-mail réelle | E2E en adaptateur console ; SMTP/Mailpit non validé pour ce parcours |
| Téléphone et WhatsApp réels | Coordonnées absentes ; placeholders `+237600000000` |
| Interface de tri des messages | Hors périmètre MKT-02 |
| Validation propriétaire des microtextes | « Sous 24 h ouvrées » et horaires à confirmer |
| Lighthouse et audit visuel | Aucun outil ni capture demandés pour MKT-02 |
| Préremplissage du sujet depuis les pages info | Non implémenté ; les CTA conservent des liens `mailto` |

---

## 8. Fichiers exclus du commit

- `frontend/angular.json` : modification antérieure à MKT-02, non liée au ticket.
- `.~lock.Tickets_BRUNY_SHOPPING.docx#` : fichier de verrou bureautique non suivi.
- `frontend/dist/**`, `backend/dist/**` : artefacts de build ignorés par Git.
