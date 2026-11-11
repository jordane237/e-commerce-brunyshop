# Accessibilité — Design System BrunyShop

**Version** : 1.0.0
**Référentiel** : WCAG 2.1 niveau AA.
**Statut** : règles et audit documentaire. Aucune certification, aucun test utilisateur réel.

## 1. Principes

1. **Perceptible** : contraste, alternatives textuelles, structure.
2. **Utilisable** : clavier, focus visible, cibles 44 px, pas de piège.
3. **Compréhensible** : libellés explicites, erreurs localisées, vocabulaire constant.
4. **Robuste** : HTML natif d’abord, ARIA seulement si nécessaire.

## 2. Contrastes calculés

Méthode : luminance relative sRGB et formule WCAG 2.1. Les ratios sont arrondis à deux décimales.

### Texte

| Combinaison | Ratio | Seuil | Verdict | Usage autorisé |
|---|---:|---:|---|---|
| `#131B2E` sur `#FAFAF7` | **16,41:1** | 4,5:1 | ✅ AAA | Texte principal |
| `#FFFFFF` sur `#131B2E` | **17,16:1** | 4,5:1 | ✅ AAA | Texte sur navy |
| `#687087` sur `#FAFAF7` | **4,72:1** | 4,5:1 | ✅ AA | Texte secondaire |
| `#6B7280` sur `#FFFFFF` | **4,83:1** | 4,5:1 | ✅ AA | Aide, placeholder |
| `#8A6A1F` sur `#FAFAF7` | **4,83:1** | 4,5:1 | ✅ AA | Texte doré |
| `#C89B3C` sur `#FAFAF7` | **2,45:1** | 4,5:1 | ❌ Échec | Décor uniquement |
| `#FFFFFF` sur `#25D366` | **1,98:1** | 4,5:1 | ❌ Échec | Interdit |
| `#131B2E` sur `#25D366` | **8,65:1** | 4,5:1 | ✅ AAA | Icône/texte sur WhatsApp vif |
| `#FFFFFF` sur `#0F7A40` | **5,41:1** | 4,5:1 | ✅ AA | CTA WhatsApp |
| `#FFFFFF` sur `#1E8E5A` | **4,14:1** | 4,5:1 | ❌ Échec en texte normal ; ✅ large | Grand texte uniquement |
| `#FFFFFF` sur `#B98500` | **3,27:1** | 4,5:1 | ❌ Échec | Ne pas utiliser en texte |
| `#FFFFFF` sur `#D62839` | **4,97:1** | 4,5:1 | ✅ AA | Bouton danger |
| `#D62839` sur `#FAFAF7` | **4,76:1** | 4,5:1 | ✅ AA | Texte d’erreur |
| `#FFFFFF` sur `#A31727` | **7,75:1** | 4,5:1 | ✅ AAA | Danger fort |
| `#7A5B12` sur `#FFF3D6` | **5,71:1** | 4,5:1 | ✅ AA | Alerte warning |
| `#2F5D8A` sur `#E8EDF9` | **5,87:1** | 4,5:1 | ✅ AA | Alerte info |
| `#FFFFFF` sur `#2F5D8A` | **6,88:1** | 4,5:1 | ✅ AA | Fond info |
| `#8990A0` sur `#FFFFFF` | **3,20:1** | 4,5:1 | ❌ Échec | Ancien placeholder, interdit |

### Non textuel (3:1)

| Combinaison | Ratio | Verdict | Correction |
|---|---:|---|---|
| `#DCE0E7` sur `#FFFFFF` (bordure de champ) | **1,32:1** | ❌ | `#6B7280` |
| `#ECE9E2` sur `#FFFFFF` (bordure de carte) | **1,21:1** | ✅ décorative | Ne porte aucune information |
| Focus navy sur canvas | **16,41:1** | ✅ | Double anneau |
| Or sur canvas (bordure informative) | **2,45:1** | ❌ | Ne pas utiliser comme bordure de contrôle |

### Règles

- Le vert `#1E8E5A` n’est jamais utilisé avec du texte blanc en taille normale.
- Le vert `#25D366` n’est jamais utilisé avec du texte blanc.
- L’or `#C89B3C` n’est jamais utilisé comme texte sur fond clair.
- Le placeholder `#8990A0` est interdit ; utiliser `#6B7280`.
- Une bordure qui délimite un contrôle interactif doit atteindre 3:1.
- Les états désactivés sont exemptés de contraste, mais restent lisibles et annoncés.

## 3. Focus

- Anneau : `0 0 0 2px #FAFAF7, 0 0 0 4px #131B2E`.
- Visible sur tous les fonds, y compris navy et photos.
- Jamais supprimé sans remplacement.
- `:focus-visible` pour le clavier ; `:focus` conservé pour les champs.
- Le focus est déplacé sur le titre de l’étape suivante, la modale ou le message de confirmation.
- Le focus est restitué à l’élément déclencheur à la fermeture.
- Le focus ne part jamais derrière un overlay.

## 4. Clavier

| Composant | Touches attendues |
|---|---|
| Button | `Entrée`, `Espace` |
| Lien | `Entrée` |
| Input / Select | `Tab`, saisie, flèches pour le select natif |
| Checkbox | `Espace` |
| Radio | `Flèches` dans le groupe, `Tab` pour entrer/sortir |
| Toggle | `Espace` ou `Entrée` |
| Modal | `Échap`, `Tab` piégé, focus initial |
| Tabs | `Flèches`, `Home`, `End` |
| Menu | `Entrée`, `Échap`, flèches |
| Table | `Tab` sur les actions, tri activable |

Aucun composant ne doit capturer une touche globale sans raison. Aucun piège au clavier en dehors d’une modale.

## 5. Formulaires

- Label visible et associé (`for`/`id`), jamais remplacé par le placeholder.
- `autocomplete` sur prénom, nom, e-mail, téléphone, adresse, mot de passe.
- `aria-required="true"` ou `required` natif.
- Aide reliée par `aria-describedby`.
- Erreur sous le champ, `aria-invalid="true"`, texte explicite.
- Résumé d’erreurs en tête de formulaire, `role="alert"`, focus sur le premier champ invalide.
- Le message d’erreur ne disparaît pas à la saisie suivante tant que l’erreur persiste.
- Les champs désactivés sont annoncés ; préférer `readonly` si la valeur reste utile.
- Le bouton « Afficher le mot de passe » a `aria-pressed`.

## 6. Messages et statuts

- `role="status"` pour les confirmations non bloquantes.
- `role="alert"` pour les erreurs bloquantes.
- `aria-live="polite"` pour le nombre de résultats, le panier, la synchronisation.
- `aria-busy="true"` sur la région en chargement.
- Les toasts ne sont jamais le seul canal d’une information critique.
- Les toasts se mettent en pause au survol et au focus, ou restent assez longtemps.
- Les changements de statut de commande sont annoncés.

## 7. Structure et sémantique

- Un seul `h1` par page, hiérarchie de titres continue.
- `header`, `nav`, `main`, `aside`, `footer` avec landmarks nommés si répétés.
- Lien d’évitement « Aller au contenu principal ».
- Listes réelles (`ul`, `ol`) pour les produits, étapes et chronologies.
- Tableaux avec `caption`, `th scope="col"`, `th scope="row"` si pertinent.
- Images informatives : `alt` descriptif. Images décoratives : `alt=""`.
- Icônes seules : `aria-label` sur le bouton, `aria-hidden="true"` sur le SVG.
- Aucun `div` cliquable à la place d’un bouton ou d’un lien.

## 8. Cibles et responsive

- Cible minimale 44 × 44 px, 48 px pour la vue livreur.
- Espacement suffisant entre deux cibles.
- Reflow à 320 px sans scroll horizontal.
- Zoom 200 % sans perte de contenu ni chevauchement.
- Le CTA sticky ne masque jamais le contenu ; prévoir un dégagement.
- Les tableaux admin deviennent des cartes en dessous de 768 px.
- Le texte ne doit pas être tronqué sans alternative accessible.

## 9. Mouvement

- Durées 120/180/240 ms.
- `prefers-reduced-motion: reduce` neutralise transitions, pulsations et parallaxe.
- Pas de clignotement, pas de défilement automatique.
- Les animations ne sont jamais le seul indicateur d’état.

## 10. État par composant

| Composant | Constat | Statut | Ticket |
|---|---|---|---|
| Button | Primaire conforme ; bordures secondaire/ghost sous 3:1 | ⚠️ | DSG-07-FIX-C01 |
| Button iconOnly | Nom accessible non obligatoire dans l’API | ❌ | DSG-07-FIX-C02 |
| Input / Select | Bordure 1,32:1 ; focus correct | ❌ | DSG-07-FIX-C03 |
| Checkbox / Radio / Toggle | `aria-describedby` vers un `id` absent | ❌ | DSG-07-FIX-C04 |
| Checkbox / Radio / Toggle | Contour de choix sous 3:1 | ⚠️ | DSG-07-FIX-C05 |
| Badge | Texte + couleur, mais variantes non mappées au métier | ⚠️ | DSG-07-FIX-05 |
| ProductCard | Deux liens vers le même produit ; CTA « Ajouter » sans contexte | ⚠️ | DSG-07-FIX-C06 |
| PriceTag | Prix barré sans libellé « Prix initial » | ⚠️ | DSG-07-FIX-C07 |
| SizeSelector | État indisponible non nommé | ❌ | DSG-07-FIX-C08 |
| Modal | Focus trap et Échap présents | ✅ | — |
| Toast | Fermeture automatique sans pause | ⚠️ | DSG-07-FIX-C09 |
| Skeleton | Chargement non annoncé seul | ⚠️ | DSG-07-FIX-C10 |
| Spinner | `role="status"` présent | ✅ | — |
| Table | Actions sans contexte de ligne, caption optionnelle | ❌ | DSG-07-FIX-C11 |
| Icon | Décoratif par défaut, label optionnel | ✅ | — |

## 11. État par parcours

| Parcours | Point critique | Exigence |
|---|---|---|
| Achat invité | Erreurs de coordonnées | Résumé `role=alert`, focus premier champ |
| Achat connecté | Retour à l’étape interrompue | Focus sur le titre de l’étape |
| Suivi | Chronologie | `ol`, `aria-current="step"`, statut textuel |
| Compte | Suppression | `alertdialog`, focus « Annuler » |
| Support | WhatsApp | Nom accessible, ouverture externe annoncée |
| Admin | Tables | `caption`, `scope`, actions nommées avec la ligne |

## 12. Tests à exécuter avant production

### Automatiques

- [ ] `axe-core` sur chaque écran, zéro violation critique.
- [ ] Contraste des tokens recalculé.
- [ ] `pnpm -C frontend lint`.
- [ ] `pnpm -C frontend test`.
- [ ] `pnpm -C frontend build`.

### Manuels

- [ ] Parcours complet au clavier, sans souris.
- [ ] NVDA + Firefox sur Windows.
- [ ] VoiceOver + Safari sur macOS/iOS.
- [ ] TalkBack sur Android.
- [ ] Zoom 200 % et 400 %.
- [ ] Reflow 320 px.
- [ ] `prefers-reduced-motion`.
- [ ] Mode contraste élevé.
- [ ] Lecteur d’écran sur les erreurs de formulaire.
- [ ] Lecture de la chronologie de commande.
- [ ] Lecture des tableaux admin.

**Aucun de ces tests n’a été exécuté dans DSG-07.** L’audit est documentaire ; les cases restent à cocher avant production.

## 13. Dérogations

Toute dérogation doit préciser :

1. le critère WCAG concerné ;
2. la raison ;
3. l’alternative offerte ;
4. la date de réexamen ;
5. le ticket associé.

Une dérogation sans alternative est refusée.
