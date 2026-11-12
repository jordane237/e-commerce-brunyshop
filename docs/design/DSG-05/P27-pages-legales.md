# P27 — Pages légales

> DSG-05 · groupe Information · routes `/mentions-legales`, `/cgv`, `/confidentialite`
> Aucun endpoint : contenu statique versionné.

---

## 1. Objectif & rôle

Rendre accessibles et lisibles les informations légales obligatoires : mentions légales, conditions générales de vente et politique de confidentialité. Les trois pages partagent la même structure, la même navigation et le même ton ; seul le contenu change.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header + fil d'Ariane « Accueil › Mentions légales » (ou CGV, Confidentialité).
2. `h1` + date de dernière mise à jour.
3. **Sommaire repliable** (`Accordion`) avec les sections.
4. Contenu : titres `h2`, paragraphes, listes, tableaux simples.
5. Encadré « Une question ? » avec e-mail support.
6. Liens croisés vers les deux autres pages légales.
7. Footer.

### 768 px

- Sommaire en accordéon en haut, contenu 680 px.
- Tableaux à 2 colonnes.

### 1280 px

- Sommaire sticky à gauche (240 px), contenu 760 px.
- Largeur de lecture limitée à 72 caractères.

```text
┌───────────────┬──────────────────────────────────────────────┐
│ Sommaire      │ Mentions légales                             │
│ Éditeur       │ Dernière mise à jour : 10 novembre 2026      │
│ Hébergeur     │ 1. Éditeur du site                           │
│ Propriété     │ …                                            │
│ Données       │ 2. Hébergement                               │
│ Cookies       │ …                                            │
└───────────────┴──────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `Accordion` | NOUVEAU | sommaire | fermé |
| `Breadcrumb` | NOUVEAU | — | — |
| `Alert` | NOUVEAU | info | — |
| `Table` | TEC-10 | données | — |
| `Button` | TEC-10 | ghost | — |

---

## 4. États obligatoires

- **Chargement** : sans objet, contenu statique.
- **Vide** : aucune section vide ; si une donnée légale n'est pas fournie, la section correspondante n'est pas publiée plutôt que remplie d'un faux contenu.
- **Erreur** : route inconnue → P27b ; contenu indisponible → message + support.
- **Succès** : page rendue, sommaire fonctionnel, ancre active.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Section absente | Masquée, aucun espace vide |
| Lien profond invalide | Retour en haut de la page |
| Contenu indisponible | « Cette page est momentanément indisponible. Écrivez à support@brunyshop.cm. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre mentions | Mentions légales | neutre | `h1` |
| Titre CGV | Conditions générales de vente | neutre | `h1` |
| Titre confidentialité | Politique de confidentialité | neutre | `h1` |
| Mise à jour | Dernière mise à jour : {date} | info | `<time>` |
| Sommaire | Sommaire | neutre | `h2` |
| Section éditeur | Éditeur du site | neutre | `h2` |
| Section hébergeur | Hébergement | neutre | `h2` |
| Section propriété | Propriété intellectuelle | neutre | `h2` |
| Section données | Données personnelles | neutre | `h2` |
| Section cookies | Cookies et traceurs | neutre | `h2` |
| Section droit | Vos droits | neutre | `h2` |
| Section réclamation | Réclamation | neutre | `h2` |
| Section commande | Commande | neutre | `h2` |
| Section prix | Prix et paiement | neutre | `h2` |
| Section livraison | Livraison | neutre | `h2` |
| Section retours | Retours et remboursements | neutre | `h2` |
| Section garanties | Garanties et responsabilité | neutre | `h2` |
| Section droit applicable | Droit applicable et litiges | neutre | `h2` |
| Section responsable | Responsable du traitement | neutre | `h2` |
| Section finalités | Finalités et bases légales | neutre | `h2` |
| Section durées | Durées de conservation | neutre | `h2` |
| Section destinataires | Destinataires | neutre | `h2` |
| Section transferts | Transferts hors Cameroun | neutre | `h2` |
| Section sécurité | Sécurité | neutre | `h2` |
| Section contact | Contact | neutre | `h2` |
| Aide | Une question sur cette page ? | chaleureux | `h2` |
| Aide corps | Écrivez-nous à support@brunyshop.cm. | aide | — |
| Liens croisés | Voir aussi : CGV · Politique de confidentialité | neutre | nav |

Le contenu rédigé de chaque section est dans `CONTENUS.md`, sections « Mentions légales », « CGV » et « Politique de confidentialité ».

---

## 6. Interactions & comportements

- Sommaire : clic → ancre + focus sur le titre ; section active mise en évidence au scroll (desktop).
- Accordéon mobile : un seul panneau ouvert.
- Date de mise à jour affichée en haut et en pied de page.
- Les CGV affichent la version acceptée à l'inscription (`termsVersion` 1.0) ; toute nouvelle version doit être datée.
- Aucun formulaire de consentement cookies sur ces pages : le bandeau, s'il est ajouté, est global.
- Liens croisés entre les trois pages.
- Aucun téléchargement PDF en MVP.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, hiérarchie stricte `h2`/`h3`.
- Sommaire : `nav aria-label="Sommaire de la page"`, `aria-current="true"` sur la section active.
- Contenu textuel : contraste AA, interlignage ≥ 1,5, largeur ≤ 72 caractères.
- Tableaux avec `caption` et en-têtes.
- Liens : soulignés ou différenciés autrement que par la couleur.
- Cibles ≥ 44 px, focus visible, zoom 200 % sans perte.
- Aucune justification de texte.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Contenu | statique `CONTENUS.md` | — |
| Identité légale | configuration `legal.ts` fournie par l'exploitation | Sections non publiées |
| Version CGV | `termsVersion` backend (`1.0`) | — |

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucune page légale dans la planche | Conçue |
| Raison sociale, RCCM, NIU, siège non fournis | Injectés depuis la configuration, jamais inventés |
| Version des CGV | 1.0, alignée sur l'inscription |
| Bandeau cookies | Hors périmètre DSG-05 |
| PDF | Non prévu en MVP |

---

## 10. Wireframe de référence

Aucun fichier dédié ; footer de la planche et patterns éditoriaux.
