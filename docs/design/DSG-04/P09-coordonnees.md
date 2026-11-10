# P09 — Coordonnées

> DSG-04 · étape 1 sur 3 · route proposée `/commande/coordonnees`

---

## 1. Objectif

Collecter le strict nécessaire pour joindre le client et organiser la livraison : **nom** et **numéro WhatsApp**. Aucune inscription, aucun e-mail, aucun mot de passe.

L'écran doit être rempli en moins de 30 secondes sur un téléphone, avec une validation immédiate et des messages qui expliquent comment corriger.

**Indicateur de succès** : ≥ 95 % des arrivées valident l'étape sans aide ; taux d'erreur téléphone < 5 %.

---

## 2. Wireframes

### 2.1 Mobile — 360 px

```text
┌──────────────────────────────────────┐
│ ←   BRUNY SHOPPING      🔒 Sécurisé   │
├──────────────────────────────────────┤
│ ① Coordonnées  ② Livraison  ③ Paiement│
│  ●──────────────○──────────────○      │
├──────────────────────────────────────┤
│ Commande directe, sans inscription    │
│                                      │
│ Vos coordonnées                      │
│ Nous en avons besoin pour vous       │
│ appeler et livrer.                   │
│                                      │
│ Nom et prénom *                      │
│ ┌──────────────────────────────────┐ │
│ │ Jean-Paul Mbarga                 │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Numéro WhatsApp / appel livreur *    │
│ ┌───────┬──────────────────────────┐ │
│ │🇨🇲 +237│ 6 94 28 10 44           │ │
│ └───────┴──────────────────────────┘ │
│ Nous vous appelons avant la livraison│
│                                      │
│ ☑ Merci de m'appeler avant livraison │
│                                      │
│      Total à régler  52 500 FCFA     │
│ [   Continuer vers la livraison   → ] │
│                                      │
│ 🔒 Vos informations restent privées. │
│    Aucun paiement en ligne.          │
└──────────────────────────────────────┘
```

### 2.2 Tablette — 768 px

```text
┌─────────────────────────────────────────────┐
│ ←  BRUNY SHOPPING               🔒 Sécurisé  │
├─────────────────────────────────────────────┤
│      ① Coordonnées  ② Livraison  ③ Paiement │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────┬────────────┐ │
│  │ Vos coordonnées           │ RÉCAP      │ │
│  │ [Nom                     ]│ 52 500     │ │
│  │ [+237][Téléphone         ]│ Offerte    │ │
│  │ ☑ Appel avant livraison   │ [Continuer]│ │
│  │                           │            │ │
│  └───────────────────────────┴────────────┘ │
└─────────────────────────────────────────────┘
```

- Formulaire 7 colonnes, récapitulatif 5 colonnes, conteneur 960 px.
- Le récapitulatif est réduit au total + livraison (pas de lignes produit).

### 2.3 Desktop — 1280 px

```text
┌───────────────────────────────────────────────────────────────┐
│ ←  BRUNY SHOPPING                              🔒 Sécurisé     │
├───────────────────────────────────────────────────────────────┤
│              ① Coordonnées   ② Livraison   ③ Paiement          │
├───────────────────────────────────────────────────────────────┤
│   ┌──────────────────────────────────┐  ┌───────────────────┐ │
│   │ Vos coordonnées                  │  │ RÉCAPITULATIF     │ │
│   │ Nom et prénom *                  │  │ Sous-total 52 500 │ │
│   │ [_____________________________]  │  │ Livraison  Offerte│ │
│   │ Numéro WhatsApp *                │  │ ────────────────  │ │
│   │ [+237][______________________]   │  │ Total     52 500  │ │
│   │ ☑ Appel avant livraison          │  │ [Continuer vers   │ │
│   │                                  │  │  la livraison →]  │ │
│   └──────────────────────────────────┘  └───────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

- Colonnes 640 / 480 px, gouttière 48 px, conteneur 1 200 px.
- Largeur des champs limitée à 420 px pour éviter les lignes trop longues.

---

## 3. Composants

| Composant | Statut | Usage |
| --- | --- | --- |
| `CheckoutHeader` | à créer | Retour + logo + badge |
| `StepIndicator` | à créer | Étape 1 active |
| `Input` | existant | Nom, téléphone (type `tel`, `inputMode="tel"`) |
| `Checkbox` | existant | Appel avant livraison |
| `Button` | existant | CTA |
| `Alert` | à créer | Erreur globale / réseau |
| `OrderSummaryCard` | à créer | Variante compacte |
| `StickyActionBar` | à créer | Mobile : total + CTA |
| `TrustPanel` | à créer | Mention vie privée (variante 1 ligne) |

### 3.1 Détail des champs

| Champ | Type | Obligatoire | Autocomplete | Validation |
| --- | --- | --- | --- | --- |
| Nom et prénom | `text` | oui | `name` | 2–80 caractères, lettres/espaces/`'`/`-` |
| Téléphone | `tel` | oui | `tel-national` | 9 chiffres, commence par `6` |
| Appel avant livraison | `checkbox` | non, coché par défaut | — | — |

Le préfixe `+237` est **affiché mais non éditable** en MVP. Il est annoncé par `aria-label="Indicatif pays, Cameroun, plus 237"`.

### 3.2 Comportement de saisie

- Le téléphone accepte les espaces et les tirets à la saisie, puis est normalisé en 9 chiffres.
- L'utilisateur peut coller `+237 6 94 28 10 44` : le préfixe est retiré automatiquement.
- Le nom est nettoyé des espaces multiples en fin de champ.

---

## 4. États

### 4.1 Nominal

Champs vides (ou préremplis depuis le brouillon) ; CTA actif. Aucune erreur avant interaction.

### 4.2 Chargement

- Clic sur CTA : bouton `loading` avec libellé « Enregistrement… ».
- Aucun appel réseau n'est requis en MVP (stockage local), le chargement est visuel et bref (< 300 ms).
- Si un appel de vérification du panier est ajouté, limite de 8 s.

### 4.3 Vide

Champs vides, aucune erreur affichée. Le CTA reste actif mais la validation bloque avec les messages de champ.

### 4.4 Erreurs

| Cas | Message |
| --- | --- |
| Nom vide (au blur ou submit) | « Indiquez votre nom et prénom. » |
| Nom trop court | « Votre nom doit contenir au moins 2 caractères. » |
| Nom invalide | « Utilisez uniquement des lettres, des espaces, des apostrophes ou des tirets. » |
| Téléphone vide | « Indiquez un numéro pour que le coursier vous joigne. » |
| Téléphone trop court | « Le numéro doit contenir 9 chiffres après +237. Exemple : 6 94 28 10 44. » |
| Téléphone ne commence pas par 6 | « Saisissez un numéro mobile commençant par 6. » |
| Réseau (si vérification) | « Impossible de vérifier votre panier. Vérifiez votre connexion puis réessayez. » |

Règles d'affichage :

- Première validation au **blur**.
- Correction en direct dès que le champ redevient valide.
- Au submit, focus sur le **premier champ en erreur** et annonce via `aria-live`.
- L'erreur est liée au champ par `aria-describedby`, jamais seulement par la couleur.

---

## 5. Microtextes FR

| Élément | Texte |
| --- | --- |
| Bandeau | « Commande directe, sans inscription » |
| Titre | « Vos coordonnées » |
| Sous-titre | « Nous en avons besoin pour vous appeler et organiser la livraison. » |
| Label nom | « Nom et prénom * » |
| Placeholder nom | « Ex. Jean-Paul Mbarga » |
| Label téléphone | « Numéro WhatsApp / appel livreur * » |
| Aide téléphone | « Nous vous appelons avant la livraison. » |
| Option appel | « Merci de m'appeler avant livraison » |
| CTA | « Continuer vers la livraison » |
| Total | « Total à régler » |
| Confidentialité | « Vos informations restent privées. Aucun paiement en ligne. » |
| Mention obligatoire | « Les champs marqués * sont obligatoires. » |

---

## 6. Interactions

| Action | Résultat |
| --- | --- |
| Focus initial | Sur le champ nom (ou le premier champ vide) |
| Entrée dans un champ | Validation au blur uniquement |
| CTA | Valide, enregistre le brouillon, navigue vers P10, focus sur le titre de P10 |
| Retour | Vers P08, saisie conservée |
| Étape 2/3 du stepper | Désactivée, non cliquable |
| Collage téléphone avec `+237` | Préfixe retiré, espacement normalisé |
| Clic sur WhatsApp (header) | Ouvre la discussion sans perdre la saisie |

### 6.1 Raccourcis clavier

- `Entrée` dans un champ ne soumet pas le formulaire : elle passe au champ suivant.
- `Entrée` sur le CTA soumet.

---

## 7. Accessibilité — WCAG 2.1 AA

- **Formulaire** : `<form>` avec `novalidate`, un `h1`, champs `required` marqués visuellement et via `aria-required="true"`.
- **Labels** : explicites, jamais remplacés par le placeholder ; `for`/`id` corrects.
- **Erreurs** : `role="alert"` sur le résumé, `aria-invalid="true"`, `aria-describedby` pointant vers le message.
- **Stepper** : liste ordonnée, `aria-current="step"` sur l'étape 1, étapes futures `aria-disabled`.
- **Contraste** : texte d'aide ≥ 4,5:1 sur blanc ; bordure de champ ≥ 3:1.
- **Cibles** : 44 px minimum, y compris la case à cocher et le préfixe.
- **Clavier** : ordre logique nom → téléphone → case → CTA ; focus visible.
- **Zoom 200 %** : aucune perte de contenu, pas de défilement horizontal à 360 px.
- **Annonce** : après validation réussie, « Étape validée. Passage à la livraison. » via `aria-live="polite"`.
- **Autofill** : `autocomplete="name"` et `autocomplete="tel-national"` pour faciliter la saisie.

---

## 8. Données API

| Donnée | Sens | Destination | Remarque |
| --- | --- | --- | --- |
| `guestName` | saisie | brouillon local → `POST /orders` | Champ `Order.guestName` |
| `guestPhone` | saisie | brouillon local → `POST /orders` | Normalisé `6XXXXXXXX` |
| `callBeforeDelivery` | option | `addressSnapshot` ou `source` | Non modélisé dédié ; à ranger dans le snapshot |
| `cartFingerprint` | calcul | brouillon | Détecte un changement de panier |

Aucun endpoint dédié P09. La validation téléphone est locale (regex) ; une vérification d'existence n'est **pas** faite en MVP.

**Dépendance manquante** : `POST /orders` accepte `guestName`, `guestPhone`, `addressSnapshot` (déjà au schéma).

---

## 9. Écarts et décisions

| Constat maquette | Décision |
| --- | --- |
| Champs préremplis « Jean-Paul », « 694 28 10 44 » | Ce sont des exemples ; l'état initial est vide, les placeholders reprennent ces valeurs |
| Badge « Appel avant livraison » non interactif | Devient une case à cocher, cochée par défaut |
| « Nom et Prénom * » avec casse marketing | « Nom et prénom * », casse de phrase |
| Aucune mention de vie privée | Ajout d'une ligne de confidentialité |
| Aucune erreur dessinée | 6 messages d'erreur spécifiques définis |
| Pas de CTA | CTA « Continuer vers la livraison » ajouté |
| Préfixe `🇨🇲` | Conservé, doublé d'un libellé accessible |

---

## 10. Référence

- Maquette : zone C, carte 1 « Vos Coordonnées ».
- `PARCOURS.md` §5.1, §6, §9.
- `MICROTEXTES.md` §P09.
- `COMPOSANTS-REQUIS.md` — `StepIndicator`, `Alert`, `StickyActionBar`.
- Existant : `frontend/libs/ui/src/lib/input/input.component.ts`, `checkbox.component.ts`.
