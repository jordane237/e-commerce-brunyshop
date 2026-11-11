# P22 — Contact

> DSG-05 · groupe Information · route `/contact`
> Endpoint à créer : `POST /contact` ; fallback `mailto:support@brunyshop.cm`.

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
| `Textarea` | NOUVEAU (DSG-04) | 5 lignes | normal, error |
| `Select` | TEC-10 | sujets | normal, error |
| `Checkbox` | TEC-10 | consentement | — |
| `Button` | TEC-10 | primary, whatsapp | loading |
| `Alert` | NOUVEAU | success, danger, info | — |
| `Breadcrumb` | NOUVEAU | — | — |

---

## 4. États obligatoires

- **Chargement** : bouton `loading` après envoi, formulaire désactivé.
- **Vide** : formulaire vierge, aucun message d'erreur avant interaction.
- **Erreur** : validation par champ, envoi échoué, réseau, rate limit.
- **Succès** : formulaire remplacé par un panneau de confirmation avec référence de message.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Nom vide | « Indiquez votre nom. » |
| E-mail invalide | « Saisissez un e-mail valide pour que nous puissions vous répondre. » |
| Téléphone invalide | « Saisissez un numéro camerounais à 9 chiffres après +237. » |
| Sujet vide | « Choisissez un sujet. » |
| Message vide | « Écrivez votre message. » |
| Message trop court | « Votre message doit contenir au moins 20 caractères. » |
| Consentement absent | « Acceptez que nous utilisions ces informations pour vous répondre. » |
| Envoi échoué | « Votre message n'a pas pu être envoyé. Réessayez ou écrivez à support@brunyshop.cm. » |
| Trop de messages | « Vous avez envoyé plusieurs messages récemment. Patientez quelques minutes. » |
| Réseau | « Connexion interrompue. Vérifiez votre connexion puis réessayez. » |

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

- Sujet « Une commande » → champ conditionnel « Référence de commande » (facultatif, format `BRN-…`).
- Le formulaire conserve les valeurs en cas d'échec.
- Après succès, le formulaire est remplacé ; aucun double envoi.
- Liens e-mail en `mailto:` ; WhatsApp uniquement si `WHATSAPP_SUPPORT_NUMBER` est configuré, sinon masqué.
- CAPTCHA : aucun widget en MVP ; l'emplacement est prévu dans le DOM (`#contact-captcha`) pour un ajout ultérieur.
- Anti-spam backend : rate limit par IP + honeypot invisible.
- Aucune pièce jointe.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, sections `h2`.
- Labels liés, `autocomplete` (`name`, `email`, `tel`).
- Sujet : `Select` avec label, pas de valeur vide ambiguë.
- Erreurs : `aria-invalid`, `aria-describedby`, résumé `role="alert"`, focus sur le premier champ en erreur.
- Confirmation : `role="status"`, focus sur le titre.
- Champs obligatoires indiqués par `*` + `aria-required`.
- Cibles ≥ 44 px, focus visible, contraste AA.
- Zoom 200 % : colonnes empilées.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Envoi | `POST /contact` **à créer** | `mailto:support@brunyshop.cm` |
| Sujets | statiques | — |

Payload : `{ name, email, phone?, subject, orderReference?, message, consent, captchaToken? }`.
Réponse : `201 { id, receivedAt }`.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucune page contact dans la planche | Conçue |
| Aucun endpoint contact | Dépendance backend ; fallback mailto |
| Numéro WhatsApp non fourni | Masqué tant qu'il n'est pas configuré |
| CAPTCHA absent du dépôt | Emplacement prévu, inactif |
| Délai « sous 24 h » | Engagement éditorial à confirmer par l'exploitation |

---

## 10. Wireframe de référence

Aucun fichier dédié ; patterns de formulaire P09 et footer de la planche.
