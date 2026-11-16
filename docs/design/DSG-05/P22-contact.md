# P22 — Contact

> DSG-05 · groupe Information · route `/contact`
> Statut : **implémentée le 16 novembre 2026** (MKT-02).
> Endpoint livré : `POST /api/v1/contact` ; fallback `mailto:support@brunyshop.cm`.
> Détail technique et limites : [`docs/features/MKT-02/`](../../features/MKT-02/ANALYSE-DESIGN.md).

---

## 1. Objectif & rôle

Offrir un canal de contact simple et rassurant, sans promesse de réponse instantanée. Le formulaire couvre les demandes générales ; les demandes liées à une commande sont orientées vers le WhatsApp contextualisé ou l'espace compte.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header + fil d'Ariane « Accueil › Contact ».
2. `h1` « Contactez-nous » + chapô « Une question, une commande, un retour ? Écrivez-nous. ».
3. **Canaux** : carte e-mail `support@brunyshop.cm` (lien mailto), carte WhatsApp (si numéro configuré), horaires « Lundi – samedi, 8 h – 18 h ».
4. **Formulaire** : nom, e-mail, téléphone (facultatif), sujet (select), message, case de consentement.
5. Emplacement CAPTCHA inactif (rien affiché tant que non disponible).
6. Bouton « Envoyer le message ».
7. Aide : « Pour une commande en cours, indiquez sa référence : nous répondrons plus vite. »
8. Bloc « Questions fréquentes » avec 3 liens vers P23.
9. Footer.

### 768 px

- Deux colonnes : canaux + horaires à gauche, formulaire à droite.
- FAQ en pleine largeur sous le formulaire.

### 1280 px

- Conteneur 1 000 px, colonnes 320 / 600 px.
- Carte formulaire blanche, canaux sur fond sable.

```text
┌──────────────────────────────────────────────────────────────┐
│ Contactez-nous                                               │
│ ┌───────────────┐  ┌───────────────────────────────────────┐ │
│ │ E-mail        │  │ Nom *        [___________________]    │ │
│ │ WhatsApp      │  │ E-mail *     [___________________]    │ │
│ │ Horaires      │  │ Téléphone    [___________________]    │ │
│ │               │  │ Sujet *      [Choisir ▼]              │ │
│ │               │  │ Message *    [___________________]    │ │
│ │               │  │ ☐ J'accepte…  [ Envoyer ]             │ │
│ └───────────────┘  └───────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `Input` | TEC-10 | text, email, tel | normal, error |
| `ContactTextarea` | local P22 | 5 lignes + compteur | normal, error |
| `Select` | TEC-10 | sujets | normal, error |
| `Checkbox` | TEC-10 | consentement | — |
| `Button` | TEC-10 | primary, secondary | loading, disabled |
| `Captcha` | AUT-11 | Turnstile | chargé, indisponible |
| `Icon` | Design System | alert, whatsapp, phone, facebook | décoratif |
| `LegalPageLayout` | MKT-01 | éditorial | fil d’Ariane intégré |

Les composants génériques `Alert` et `Breadcrumb` n’ont pas été créés : l’alerte
reste locale à la page et le fil d’Ariane est fourni par `LegalPageLayout`.

---

## 4. États obligatoires

- **Chargement** : bouton `loading`, double envoi bloqué.
- **Vide** : formulaire vierge, aucun message d’erreur avant interaction.
- **Erreur** : validation par champ, CAPTCHA, envoi échoué, réseau, rate limit.
- **Succès** : formulaire remplacé par un panneau de confirmation avec référence de message.

### Erreurs détaillées (messages livrés)

| Cas | Message |
| --- | --- |
| Nom vide | « Indiquez votre nom. » |
| Nom trop court / long | « Votre nom doit contenir au moins 2 caractères. » / « … 100 caractères. » |
| E-mail vide / invalide | « Saisissez votre adresse e-mail. » / « Saisissez un e-mail valide, par exemple vous@exemple.com. » |
| Téléphone invalide | « Saisissez un numéro camerounais à 9 chiffres après +237. » |
| Sujet vide | « Choisissez le sujet de votre demande. » |
| Message vide | « Écrivez votre message. » |
| Message trop court / long | « Décrivez votre demande en au moins 20 caractères. » / « … 2 000 caractères. » |
| Référence invalide | « Utilisez le format BRN-2611-7K3F indiqué dans votre confirmation. » |
| Consentement absent | « Acceptez d’être recontacté(e) au sujet de votre demande. » |
| CAPTCHA requis / invalide | « La vérification de sécurité a échoué. Recommencez la vérification puis réessayez. » |
| CAPTCHA indisponible | « La vérification de sécurité est momentanément indisponible. Réessayez dans un instant. » |
| Envoi échoué | « Impossible d’envoyer votre message. Vérifiez votre connexion puis réessayez. » |
| Trop de messages | « Trop de messages ont été envoyés. Patientez une minute avant de réessayer. » |
| Réseau | Même message d’envoi échoué ; les valeurs restent saisies. |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Contactez-nous | chaleureux | `h1` |
| Chapô | Une question, une commande, un retour ? Écrivez-nous, nous vous répondons sous 24 h ouvrées. | rassurant | — |
| Canal e-mail | Par e-mail | neutre | `h2` |
| Lien e-mail | support@brunyshop.cm | action | — |
| Canal WhatsApp | Sur WhatsApp | neutre | `h2` |
| WhatsApp aide | Du lundi au samedi, de 8 h à 18 h. | info | — |
| Horaires | Horaires | neutre | `h2` |
| Horaires valeur | Lundi – samedi, 8 h – 18 h | info | — |
| Form titre | Envoyez-nous un message | neutre | `h2` |
| Label nom | Nom complet * | neutre | — |
| Label e-mail | E-mail * | neutre | — |
| Label téléphone | Téléphone (facultatif) | neutre | — |
| Label sujet | Sujet * | neutre | — |
| Sujet défaut | Choisissez un sujet | aide | — |
| Sujet commande | Une commande | neutre | — |
| Sujet produit | Un produit ou une taille | neutre | — |
| Sujet retour | Un retour ou un échange | neutre | — |
| Sujet livraison | Une livraison | neutre | — |
| Sujet autre | Autre demande | neutre | — |
| Label message | Message * | neutre | — |
| Placeholder message | Décrivez votre demande. Pour une commande, indiquez sa référence. | aide | — |
| Consentement | J'accepte que mes informations soient utilisées pour répondre à ma demande. | juridique | — |
| CTA | Envoyer le message | action | — |
| CTA chargement | Envoi en cours… | statut | — |
| Succès titre | Message envoyé | succès | `role="status"` |
| Succès corps | Merci, nous vous répondrons à l'adresse indiquée sous 24 h ouvrées. Référence : {id}. | rassurant | — |
| Succès CTA | Envoyer un autre message | action | — |
| Aide commande | Pour une commande en cours, indiquez sa référence : nous répondrons plus vite. | aide | — |
| FAQ titre | Questions fréquentes | neutre | `h2` |
| FAQ lien | Consulter la FAQ | action | — |

---

## 6. Interactions & comportements

- Le champ « Référence de commande » est toujours visible et facultatif, quel que soit le sujet. Il est validé au format `BRN-AAAA-XXXX` et normalisé en majuscules.
- Le formulaire conserve les valeurs en cas d’échec ; le CAPTCHA est réinitialisé.
- Après succès, le formulaire est remplacé ; aucun double envoi. « Envoyer un autre message » vide le formulaire et replace le focus sur le nom.
- Contacts directs : e-mail `mailto:`, téléphone `tel:`, WhatsApp et Facebook dans un nouvel onglet avec `rel="noopener noreferrer"`.
- Le numéro WhatsApp et le téléphone affiché sont des **placeholders** (`+237600000000`) tant que les coordonnées réelles ne sont pas fournies. Ils restent visibles, mais ne doivent pas être publiés en l’état.
- CAPTCHA : widget Cloudflare Turnstile actif (AUT-11), chargé uniquement côté navigateur. En SSR, aucun script tiers n’est exécuté.
- Anti-spam backend : CAPTCHA + rate limit 5/min/IP + honeypot invisible. Un honeypot rempli reçoit une réponse 201 factice sans persistance ni e-mail.
- Aucune pièce jointe, aucune carte, aucun bloc FAQ sur la page : la FAQ reste accessible depuis le header et le footer.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, sections `h2`.
- Labels liés, `autocomplete` (`name`, `email`, `tel`).
- Sujet : `Select` avec label, pas de valeur vide ambiguë.
- Erreurs : `aria-invalid`, `aria-describedby`, résumé `role="alert"`, focus sur le premier champ en erreur.
- Confirmation : focus programmatique sur le titre `tabindex="-1"` ; la zone est annoncée par la structure de la page.
- Champs obligatoires indiqués par `*` ; les composants exposent leurs erreurs via `aria-invalid` et `aria-describedby`.
- Compteur de caractères en `aria-live="polite"`.
- Honeypot masqué aux technologies d’assistance (`aria-hidden="true"`, `tabindex="-1"`).
- Cibles ≥ 44 px, focus visible, contraste AA.
- Zoom 200 % : colonnes empilées.
- CAPTCHA : le composant `bruny-captcha` gère son état et son alternative en cas d’échec de chargement.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Envoi | `POST /api/v1/contact` | `mailto:support@brunyshop.cm` |
| Configuration CAPTCHA | `GET /api/v1/config` | Widget absent si Turnstile est désactivé |
| Sujets | statiques | — |

Payload : `{ name, email, phone?, subject, orderReference?, message, consent, turnstileToken?, _honey? }`.
Réponse : `201 { id, receivedAt, message }`.

Le jeton Turnstile est accepté dans le body (`turnstileToken`) ou dans l’en-tête
`cf-turnstile-response`. Les erreurs sont normalisées (`CAPTCHA_REQUIRED`,
`CAPTCHA_INVALID`, `CAPTCHA_UNAVAILABLE`, `VALIDATION_ERROR`, `RATE_LIMITED`).

---

## 9. Écarts / points à valider

| Constat | Décision livrée |
| --- | --- |
| Aucune page contact dans la planche | Page `/contact` livrée, responsive et SSR |
| Aucun endpoint contact | `POST /api/v1/contact` livré avec persistance et notifications |
| Numéro WhatsApp non fourni | Placeholder `+237600000000` visible ; à remplacer avant production |
| CAPTCHA absent du dépôt | Turnstile actif sur le formulaire, avec gestion des erreurs |
| Délai « sous 24 h » | Microtexte « sous 24 h ouvrées » conservé ; engagement à confirmer par l’exploitation |
| Champ référence conditionnel | Toujours visible et facultatif, pour éviter un changement de layout |
| Composants `Alert` / `Breadcrumb` | Non créés ; alerte locale et fil d’Ariane du layout |
| Bloc FAQ dans la page | Non repris ; la FAQ existante est liée depuis le header et le footer |
| Tri des messages reçus | Statut `NEW/READ/REPLIED/SPAM/CLOSED` en base ; aucune interface d’administration livrée |

---

## 10. Wireframe de référence

Aucun fichier dédié ; patterns de formulaire P09 et footer de la planche.
