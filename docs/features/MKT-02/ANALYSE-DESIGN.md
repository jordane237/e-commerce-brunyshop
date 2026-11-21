# MKT-02 — Analyse de design et décisions

> Formulaire de contact protégé du storefront BRUNY SHOPPING.
> Branche : `feature/MKT-02-contact-form`.
> Références : DSG-05 P22, `docs/security/CAPTCHA.md`, NTF-01, AUT-11, MKT-01.
> Statut : **implémenté et vérifié localement**, non validé pour la production.

---

## 1. Objectif et périmètre

MKT-02 livre un canal de contact public fiable pour les visiteurs qui n’ont pas
de compte. Le formulaire couvre les demandes générales et les questions liées à
une commande ; les canaux directs restent disponibles pour les urgences.

| Élément | Statut |
| --- | --- |
| Page `/contact` responsive et SSR | Livrée |
| Formulaire Reactive Forms typé | Livré |
| CAPTCHA Cloudflare Turnstile | Actif |
| Rate limiting IP | 5 requêtes/minute |
| Honeypot | Actif |
| Persistance PostgreSQL | Livrée, statut `NEW` |
| Notification support et confirmation visiteur | Livrées via NTF-01 |
| Audit de la soumission | Livré |
| Boutons WhatsApp, téléphone, Facebook | Livrés avec coordonnées provisoires |
| Confirmation avec référence | Livrée |
| Interface d’administration du tri | Hors périmètre |

Hors périmètre : pièces jointes, carte, suivi de commande P13, préremplissage du
sujet depuis les pages info, tableau de bord de traitement des messages.

---

## 2. Parcours livré

1. Le visiteur ouvre `/contact` depuis le header, le footer, le layout légal ou
   une URL directe.
2. Il consulte les canaux directs, les horaires et la promesse de réponse.
3. Il remplit le formulaire, coche le consentement et résout le CAPTCHA.
4. Le frontend normalise les valeurs (e-mail minuscule, téléphone `+237…`,
   référence en majuscules) puis appelle `POST /api/v1/contact`.
5. En cas de succès, le formulaire est remplacé par une confirmation contenant
   la référence du message et le focus est placé sur le titre.
6. En cas d’échec, les valeurs restent saisies, l’erreur est annoncée et le
   CAPTCHA est réinitialisé.

---

## 3. Architecture

```text
backend/src/modules/contact/
├── contact.controller.ts          # POST public, TurnstileGuard, throttle
├── contact.module.ts              # Database, Turnstile, Notifications, Audit
├── contact.service.ts             # validation métier, persistance, notifications
├── dto/contact.dto.ts             # validation stricte + honeypot
├── dto/contact-response.dto.ts    # schéma OpenAPI 201
└── contact.service.test.ts        # 3 tests unitaires

backend/src/modules/notifications/templates/fr/
├── contact.message.v1.ts          # notification interne support
└── contact.confirmation.v1.ts     # accusé de réception visiteur

frontend/apps/storefront/src/app/features/contact/
├── contact.component.ts|html|scss
├── contact.component.spec.ts
└── components/contact-textarea/   # textarea accessible locale

frontend/libs/data-access/src/lib/contact-api.ts
frontend/libs/ui/src/lib/icon/icon.component.ts  # icône Facebook ajoutée
```

Le client `ContactApi` est écrit manuellement car `pnpm api:generate` ne génère
que `api-types.ts`. Le contrat OpenAPI reste la source de vérité pour les types
du payload et de la réponse.

---

## 4. Backend

### Contrat

`POST /api/v1/contact`

| Champ | Règle |
| --- | --- |
| `name` | 2 à 100 caractères, espaces normalisés |
| `email` | e-mail valide, 254 caractères maximum, minuscules |
| `phone` | facultatif, `+237` + 9 chiffres |
| `subject` | `order`, `product`, `return`, `delivery`, `other` |
| `orderReference` | facultatif, `BRN-AAAA-XXXX`, majuscules |
| `message` | 20 à 2 000 caractères |
| `consent` | doit valoir `true` |
| `turnstileToken` | facultatif dans le DTO, exigé par le guard |
| `_honey` | masqué d’OpenAPI, anti-bot |

Réponse `201` : `{ id, receivedAt, message }`. Les erreurs utilisent les codes
normalisés `CAPTCHA_REQUIRED`, `CAPTCHA_INVALID`, `CAPTCHA_UNAVAILABLE`,
`VALIDATION_ERROR` et `RATE_LIMITED`.

### Persistance et tri

La migration `20261116120000_mkt02_contact_triage` est **additive** : elle ajoute
`ContactMessageStatus` (`NEW`, `READ`, `REPLIED`, `SPAM`, `CLOSED`), `status`,
`handledAt`, `handledBy`, la relation `User` et l’index `status`. La table et les
colonnes existantes d’AUT-11 sont conservées.

Chaque soumission valide crée une ligne avec `status = NEW`. Le service ne
supprime ni ne modifie les messages ; le tri est prévu pour une interface
d’administration future.

### Notifications et audit

- `contact.message` v1 est envoyé à `CONTACT_EMAIL_TO` (défaut :
  `support@brunyshop.cm`). C’est le chemin principal : si la mise en file échoue,
  la requête échoue explicitement.
- `contact.confirmation` v1 est envoyé au visiteur. Son échec est journalisé mais
  ne transforme pas un message pourtant persisté en erreur de soumission.
- Les métadonnées de notification contiennent `contactId` et le sujet.
- `renderTemplate` échappe le HTML de toutes les valeurs interpolées et neutralise
  les retours chariot dans le sujet. Aucun template ne doit échapper à nouveau les
  variables.
- L’audit enregistre `CONTACT_SUBMITTED` avec l’identifiant du message, le sujet,
  l’e-mail masqué et la présence éventuelle d’un téléphone. Le message complet,
  l’e-mail et le téléphone ne sont pas écrits dans les logs.

---

## 5. Défenses anti-spam

| Couche | Comportement |
| --- | --- |
| CAPTCHA | `TurnstileGuard` exige un jeton valide ; 400 si absent/invalide, 503 si le service est indisponible |
| Rate limit | `@Throttle({ default: { limit: 5, ttl: 60_000 } })`, par IP |
| Honeypot | Champ `_honey` masqué, non focusable ; s’il est rempli, réponse 201 factice sans persistance ni e-mail |

Le honeypot est volontairement gardé dans la whitelist du DTO : un bot qui le
remplit reçoit le même succès qu’un visiteur, sans révéler la détection.

---

## 6. Frontend

- Reactive Forms typés, sans formulaire basé sur `ngModel`.
- CAPTCHA chargé **uniquement côté navigateur** via `PublicConfigService` ; le
  SSR ne charge ni script ni iframe Turnstile.
- Si Turnstile est activé sans clé publique, ou si la configuration ne répond
  pas, le formulaire affiche une erreur et désactive l’envoi.
- Le champ référence de commande est toujours visible, facultatif et validé.
- Textarea locale accessible avec compteur `aria-live` ; aucun composant
  générique Textarea n’a été ajouté au Design System.
- La confirmation remplace le formulaire et propose « Envoyer un autre message ».
- Les canaux directs sont des liens natifs, sans carte ni iframe :
  - WhatsApp : `https://wa.me/237600000000` (placeholder) ;
  - téléphone : `tel:+237600000000` (placeholder) ;
  - Facebook : page réelle `https://www.facebook.com/BrunyShopping` ;
  - e-mail : `mailto:support@brunyshop.cm`.
- Les liens externes utilisent `target="_blank"` et
  `rel="noopener noreferrer"`.

### SEO

`SeoService` produit le titre « Contact | BRUNY SHOPPING », une description
française, l’URL canonique `https://brunyshop.cm/contact`, Open Graph et Twitter.
La route est lazy-loadée et ajoutée au sitemap statique.

### Accessibilité

- Un seul `h1`, sections `h2`, fil d’Ariane du layout légal.
- Labels liés, `autocomplete` (`name`, `email`, `tel`).
- Erreurs par champ, `aria-invalid` et `aria-describedby` fournis par les
  composants ; focus sur le premier champ invalide après soumission.
- Confirmation focusée sur son titre `tabindex="-1"`.
- Compteur de caractères annoncé poliment.
- Honeypot hors de l’arbre d’accessibilité et hors tabulation.
- Cibles ≥ 44 px, focus visible, contrastes issus des tokens.

---

## 7. Configuration et secrets

| Variable | Rôle | Défaut |
| --- | --- | --- |
| `CONTACT_EMAIL_TO` | destinataire support | `support@brunyshop.cm` |
| `TURNSTILE_ENABLED` | active le CAPTCHA | selon environnement |
| `TURNSTILE_SITE_KEY` | clé publique exposée par `/config` | — |
| `TURNSTILE_SECRET_KEY` | vérification serveur, jamais exposée | — |

Aucun secret n’est commité. `.env.example` ne contient que des valeurs non
sensibles ou des placeholders.

---

## 8. Écarts assumés par rapport à P22

| Spec P22 | Implémentation | Raison |
| --- | --- | --- |
| Champ référence conditionnel au sujet « commande » | Toujours visible et facultatif | Évite un changement de layout et couvre les demandes arrivant par un autre sujet |
| WhatsApp masqué si non configuré | Visible avec un placeholder | Le bouton est demandé par le ticket ; les coordonnées réelles manquent |
| CAPTCHA inactif dans le MVP | Turnstile actif | AUT-11 est disponible et le ticket exige un formulaire protégé |
| Composants `Alert` et `Breadcrumb` | Alerte locale, fil d’Ariane du layout | Pas de nouvelle abstraction générique sans besoin partagé |
| Bloc FAQ dans la page | Absent | La FAQ existe déjà et reste liée depuis le header et le footer |
| Endpoint `POST /contact` à créer | `POST /api/v1/contact` | Préfixe et versionnement globaux de l’API |
| Réponse `{ id, receivedAt }` | `{ id, receivedAt, message }` | Permet au frontend d’afficher le microtexte de confirmation du serveur |

---

## 9. Limites connues

- **Coordonnées provisoires** : téléphone et WhatsApp utilisent
  `+237600000000`. Ils ne doivent pas être publiés en l’état.
- **Pas d’interface de tri** : les statuts existent en base, mais aucun écran
  admin ne permet de traiter les messages.
- **Livraison e-mail dépendante de l’infrastructure** : le formulaire persiste
  le message, mais l’e-mail support dépend de BullMQ et de la configuration
  SMTP. En l’absence de SMTP, l’adaptateur console est utilisé en développement.
- **Pas de pièce jointe ni de suivi de commande intégré.**
- **Pas de préremplissage du sujet** depuis les CTA des pages info ; ceux-ci
  conservent des liens `mailto` contextualisés.
- **Validation éditoriale** : la promesse « sous 24 h ouvrées » et les horaires
  restent à confirmer par l’exploitation.
- **Pas d’audit visuel** : aucune capture d’écran, aucun Lighthouse ni test
  lecteur d’écran n’a été réalisé pour MKT-02.

---

## 10. Vérifications associées

Les commandes exécutées, leurs résultats et les contrôles SSR sont consignés
dans [`VERIFICATION.md`](./VERIFICATION.md).
