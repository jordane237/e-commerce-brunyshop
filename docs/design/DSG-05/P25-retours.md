# P25 — Retours et échanges

> DSG-05 · groupe Information · route `/retours`
> Aucun endpoint dédié en MVP : demande via P22 ou WhatsApp avec la référence.

---

## 1. Objectif & rôle

Expliquer simplement les conditions, les délais et la procédure de retour ou d'échange, sans promettre un remboursement immédiat ni un portail de retour qui n'existe pas. La page doit permettre de savoir si une commande est éligible et comment agir.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header + fil d'Ariane « Accueil › Retours et échanges ».
2. `h1` « Retours et échanges » + chapô.
3. Encadré « L'essentiel » : 7 jours, produit non porté, emballage conservé, preuve d'achat.
4. **Critères d'éligibilité** en liste cochée/croix.
5. **Procédure en 4 étapes** : nous contacter, validation, remise du colis, traitement.
6. **Échange de taille** : explication prioritaire.
7. **Remboursement** : délai et moyen (à confirmer), hors frais de livraison.
8. **Produits non repris** : articles portés, personnalisés, soldés ? (à valider).
9. CTA « Demander un retour » → P22 prérempli + « Suivre ma commande ».
10. FAQ courte + footer.

### 768 px

- Deux colonnes : éligibilité à gauche, procédure à droite.
- Encadré « L'essentiel » pleine largeur.

### 1280 px

- Conteneur 900 px, sommaire sticky à gauche.

```text
┌───────────────┬──────────────────────────────────────────────┐
│ Sommaire      │ Retours et échanges                          │
│ L'essentiel   │ ┌──────────────────────────────────────────┐ │
│ Éligibilité   │ │ 7 jours • non porté • emballage conservé │ │
│ Procédure     │ └──────────────────────────────────────────┘ │
│ Échange       │ ✓ Le produit est dans son état d'origine     │
│ Remboursement │ ✗ Il a été porté à l'extérieur               │
└───────────────┴──────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `Button` | TEC-10 | primary, whatsapp, ghost | — |
| `Alert` | NOUVEAU | info, warning | — |
| `Accordion` | NOUVEAU | FAQ | fermé |
| `Breadcrumb` | NOUVEAU | — | — |
| `Icon` | TEC-10 | check, cross, info | décoratif |

---

## 4. États obligatoires

- **Chargement** : sans objet (contenu statique).
- **Vide** : aucune commande éligible → le CTA reste disponible, avec aide « Nous vérifierons ensemble votre commande. ».
- **Erreur** : contenu statique indisponible → page de secours avec e-mail support.
- **Succès** : CTA ouvre P22 avec sujet et référence préremplis.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Référence absente | « Indiquez votre référence de commande dans le message. » |
| Commande hors délai | « Votre commande dépasse le délai de 7 jours. Écrivez-nous : nous étudierons votre demande. » |
| Produit non éligible | « Ce produit ne peut pas être repris pour des raisons d'hygiène. » |
| Contenu indisponible | « La page est momentanément indisponible. Écrivez à support@brunyshop.cm. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Retours et échanges | neutre | `h1` |
| Chapô | Un problème de taille ou de produit ? Vous avez 7 jours après réception pour nous demander un retour ou un échange. | rassurant | — |
| Essentiel | L'essentiel en 4 points | neutre | `h2` |
| Point 1 | 7 jours après réception | clair | — |
| Point 2 | Produit non porté à l'extérieur | clair | — |
| Point 3 | Emballage et étiquettes conservés | clair | — |
| Point 4 | Preuve d'achat ou référence de commande | clair | — |
| Éligibilité | Le produit est-il éligible ? | neutre | `h2` |
| Éligible 1 | Le produit est dans son état d'origine, non porté à l'extérieur. | clair | ✓ |
| Éligible 2 | L'emballage, la boîte et les étiquettes sont conservés. | clair | ✓ |
| Éligible 3 | La demande est faite dans les 7 jours suivant la réception. | clair | ✓ |
| Éligible 4 | Vous pouvez fournir votre référence de commande. | clair | ✓ |
| Non éligible 1 | Le produit a été porté à l'extérieur ou endommagé. | clair | ✗ |
| Non éligible 2 | Il s'agit d'un article d'hygiène ou personnalisé. | clair | ✗ |
| Procédure | Comment faire ? | neutre | `h2` |
| Étape 1 | Écrivez-nous avec votre référence et le motif. | neutre | — |
| Étape 2 | Nous vérifions l'éligibilité et vous proposons un échange ou un retour. | neutre | — |
| Étape 3 | Déposez le colis au point convenu ou remettez-le au coursier. | neutre | — |
| Étape 4 | Nous contrôlons le produit et traitons votre demande. | neutre | — |
| Échange | Échanger une taille | neutre | `h2` |
| Échange corps | L'échange est possible selon les stocks disponibles. S'il n'est pas disponible, nous vous proposons un remboursement. | clair | — |
| Remboursement | Remboursement | neutre | `h2` |
| Remboursement corps | Après contrôle du produit, nous vous remboursons selon le moyen de paiement utilisé. Les frais de livraison initiaux ne sont pas remboursés, sauf erreur de notre part. | clair | — |
| Délai | Le remboursement est traité sous 7 jours ouvrés après réception du retour. | clair | — |
| CTA retour | Demander un retour | action | — |
| CTA suivi | Suivre ma commande | action | — |
| Aide | Pour une commande en cours, indiquez sa référence : nous répondrons plus vite. | aide | — |

---

## 6. Interactions & comportements

- « Demander un retour » → P22, sujet « Un retour ou un échange », référence préremplie si disponible en session.
- « Suivre ma commande » → P13.
- Aucun formulaire de retour intégré, aucun upload de photos en MVP.
- Les critères sont indicatifs ; la validation finale est humaine.
- Aucun calcul automatique de remboursement.
- FAQ courte : délai, échange, frais, produit porté.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, sections `h2`.
- Listes éligible/non éligible avec texte, pas seulement icône couleur.
- Icônes décoratives `aria-hidden="true"`.
- CTA explicites, ordre logique.
- Sommaire : liens d'ancre avec focus visible.
- Cibles ≥ 44 px, contraste AA, zoom 200 %.
- Aucun contenu clignotant ou animé.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Contenu | statique | — |
| Commande | `GET /orders/:reference` **à créer** | Saisie manuelle dans P22 |

Aucune donnée personnelle affichée sur la page publique.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Délai de 7 jours non défini dans le brief | Décision éditoriale à valider par l'exploitation |
| Aucun portail de retour | Demande via contact, pas de faux formulaire |
| Frais de retour | À la charge du client sauf erreur BRUNY, à confirmer |
| Produits soldés | Non exclus explicitement, à valider juridiquement |
| Remboursement Mobile Money | Moyen à confirmer |

---

## 10. Wireframe de référence

Aucun fichier dédié ; patterns éditoriaux de la planche et DSG-04 (retours).
