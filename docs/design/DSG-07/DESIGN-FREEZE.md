# Gel design MVP — BrunyShop

**Identifiant** : `GEL-MVP-DESIGN-1.0.0`
**Date** : 11 novembre 2026
**Branche** : `feature/DSG-07-final-a11y-coherence-review`
**Statut** : **gel documentaire proposé**, en attente de signature PO.
**Version du Design System** : 1.0.0.

## 1. Objet

Ce document fige les décisions de design nécessaires au MVP de BrunyShop : tokens, composants, microtextes, navigation, parcours et règles d’accessibilité. Il sert de référence contractuelle entre design, frontend, backend, QA et product owner.

Le gel ne certifie **ni** la conformité WCAG **ni** la complétude fonctionnelle. Il fige un socle cohérent et documenté, avec des réserves explicites.

## 2. Portée du gel

### Inclus

| Élément | Version / preuve |
|---|---|
| Tokens de couleur, typographie, espacement, rayon, ombre, focus, mouvement | 120 variables, `_tokens.scss` + `tokens.css` |
| 16 composants `@bruny/ui` | `COMPOSANTS.md` |
| 58 vues P01–P27e et A01–A16 | `AUDIT-ACCESSIBILITE.md` |
| Audit de cohérence composants / mots / positions | `AUDIT-COHERENCE.md` |
| Glossaire des microtextes | `GLOSSAIRE-MICROTEXTES.md` |
| Six parcours UX | `ux-flows.md` |
| Corrections documentaires | `CORRECTIONS.md` |
| Tickets post-gel | `TICKETS-POST-GEL.md` |
| Règles d’accessibilité | `docs/design-system/ACCESSIBILITY.md` |

### Exclu

- L’implémentation complète du storefront, du compte, du support et de l’admin.
- La certification WCAG et les tests utilisateurs réels.
- Les maquettes desktop et tablette, absentes.
- Les écrans P03, P05 et P07, sans maquette ni spec.
- Les fonctionnalités non supportées par le backend : facture PDF, Cercle Prestige, GPS temps réel, paiement en ligne de bout en bout, promotions avancées.
- La validation PO des specs DSG-04/05/06, non signée.
- Les composants manquants : `StatusBadge`, `CardList`, `ConfirmDialog`, `Tabs`, `Stepper`, `Timeline`, `Alert`, `EmptyState`.

## 3. Décisions figées

### 3.1 Couleur et contraste

| Décision | Valeur |
|---|---|
| Primaire | `#131B2E` |
| Canvas | `#FAFAF7` |
| Texte doré | `#8A6A1F` uniquement |
| Or décoratif | `#C89B3C`, jamais en texte sur clair |
| WhatsApp CTA | `#0F7A40` avec texte blanc |
| Succès texte | `#0F7A40` |
| Succès surface | `#1E8E5A`, jamais avec texte blanc normal |
| Danger | `#D62839` |
| Placeholder | `#6B7280` uniquement |
| Bordure de contrôle | doit atteindre 3:1 ; `#DCE0E7` est une dette à corriger |
| Focus | double anneau navy `0 0 0 2px #FAFAF7, 0 0 0 4px #131B2E` |

Toute combinaison non listée dans `ACCESSIBILITY.md` doit être calculée avant usage.

### 3.2 Typographie

- Plus Jakarta Sans, auto-hébergée, fallback `system-ui`.
- Échelle 11/12/14/16/18/20/24/30/38/48 px.
- 12 px minimum pour une information.
- Titres en majuscule initiale, micro-libellés en capitales.
- Interligne 1,5 pour le corps, 1,1 pour le display.

### 3.3 Layout

- Mobile-first, conteneur 1200 px.
- Breakpoints 480/768/1024/1280 px.
- Gouttière 16 px mobile, 24 px desktop.
- Cible tactile 44 px, 48 px livreur.
- Reflow à 320 px sans scroll horizontal.
- Une seule action primaire par écran.

### 3.4 Composants

- Les 16 composants livrés sont la base obligatoire.
- Aucun composant ne contient de couleur brute.
- Tout composant a les états normal, survol, focus, actif, désactivé, chargement, erreur, vide quand applicable.
- Les composants manquants sont des tickets, pas des improvisations.
- `Modal` reste le dialogue standard ; `ConfirmDialog` sera un `alertdialog` dédié.
- `Table` doit fournir une `caption` et des actions contextualisées.

### 3.5 Microtextes

- `GLOSSAIRE-MICROTEXTES.md` est la source de vérité.
- « Ajouter au panier », « Continuer », « Paiement à la livraison ».
- Prix « 25 000 FCFA » avec espace insécable.
- Date « 15 janv. 2025 ».
- Référence « BRN-YYMM-XXXX ».
- Aucune variante interdite.

### 3.6 Navigation

| Contexte | Navigation |
|---|---|
| Storefront hors tunnel | Header + bottom-nav |
| Tunnel | Header minimal + retour, pas de bottom-nav |
| Auth | Header minimal, pas de bottom-nav |
| Compte | Sidebar ≥1024, tabs 768, liste 360 |
| Admin | Sidebar ≥1024, drawer mobile |
| Livreur | Barre d’action terrain, cibles 48 px |

### 3.7 Règles commerciales

| Règle | Valeur |
|---|---|
| Devise d’affichage | FCFA |
| Devise API | XAF |
| Douala | 1 500 FCFA, 24 h |
| Yaoundé | 3 000 FCFA, 24–48 h |
| Autres villes | sur devis |
| Paiement MVP | Paiement à la livraison |
| Statut initial | `PENDING_CONFIRMATION` |
| Référence commande | `BRN-YYMM-XXXX` |
| Référence livraison | `LIV-YYMM-XXXX` |

### 3.8 Accessibilité

- WCAG 2.1 AA comme cible minimale.
- Contrastes calculés, pas déclarés.
- Clavier complet, focus visible, pas de piège.
- Erreurs localisées et annoncées.
- Statuts annoncés.
- Aucune information par la couleur seule.
- `prefers-reduced-motion` respecté.
- Aucune conformité certifiée tant que les tests manuels ne sont pas exécutés.

## 4. Réserves bloquantes

Ces réserves ne bloquent pas le **gel documentaire**, mais bloquent la **mise en production** ou l’implémentation de l’écran concerné.

| # | Réserve | Impact | Ticket |
|---|---|---|---|
| R01 | DSG-04, DSG-05 et DSG-06 non signés | Pas d’autorisation d’implémentation | DSG-07-FIX-45 |
| R02 | P03, P05, P07 sans maquette ni spec | Écrans non implémentables | DSG-07-FIX-34/35/36 |
| R03 | Aucune vue desktop/tablette | Layout non prouvé | DSG-07-FIX-38 |
| R04 | Aucun test lecteur d’écran réel | Conformité non prouvée | `ACCESSIBILITY.md` §12 |
| R05 | Bordures de contrôle à 1,32:1 | Échec 1.4.11 | DSG-07-FIX-C03 |
| R06 | `aria-describedby` cassé sur Checkbox/Radio/Toggle | Échec 4.1.2 / 3.3.1 | DSG-07-FIX-C04 |
| R07 | `StatusBadge`, `CardList`, `ConfirmDialog` absents | Écrans admin et destructifs incomplets | DSG-07-FIX-05/09/10 |
| R08 | Planche PNG non éditable | Corrections visuelles non appliquées | DSG-07-FIX-37 |
| R09 | Fonctionnalités affichées non supportées | Risque de promesse mensongère | DSG-07-FIX-40/41/42 |
| R10 | Tarif Yaoundé historiquement divergent | Corrigé à 3 000 FCFA, à vérifier en recette | A01/A02 |

## 5. Procédure de modification après gel

### 5.1 Qui peut demander

Product Owner, design lead, frontend lead, backend lead, QA accessibilité.

### 5.2 Formulaire de demande

Toute demande doit contenir :

1. identifiant `CR-MVP-XXX` ;
2. description du changement ;
3. raison (bug, accessibilité, sécurité, obligation légale, évolution) ;
4. écrans et documents impactés ;
5. impact accessibilité ;
6. impact backend ;
7. alternative si refusée ;
8. priorité.

### 5.3 Classification

| Classe | Exemple | Décision |
|---|---|---|
| **Correctif P0** | Contraste bloquant, ARIA cassé, faille | Application immédiate, information PO |
| **Correctif P1** | Libellé incohérent, position erronée | File post-gel, prochaine version |
| **Évolution** | Nouvel écran, nouveau composant, nouvelle fonctionnalité | Hors gel MVP, version mineure ou majeure |
| **Dérogation** | Écart assumé et documenté | Validation PO + date de réexamen |

### 5.4 Approbation

- Correctif P0 : design lead + frontend lead, information PO sous 24 h.
- Correctif P1 : design lead + PO.
- Évolution : PO + design lead + frontend lead.
- Dérogation accessibilité : PO + QA accessibilité.

### 5.5 Mise à jour

1. Modifier la source (spec, glossaire, token, composant).
2. Mettre à jour `CHANGELOG.md` du Design System.
3. Mettre à jour l’audit concerné.
4. Ajouter ou fermer le ticket.
5. Incrémenter la version :
   - **PATCH** : correction sans impact visuel ou fonctionnel ;
   - **MINOR** : ajout compatible (composant, écran) ;
   - **MAJOR** : changement de token, de navigation ou de parcours.
6. Re-signer le gel si la portée change.

### 5.6 Interdits après gel

- Changer une couleur de token sans audit de contraste.
- Ajouter un composant sans spec et sans ticket.
- Modifier un libellé hors glossaire.
- Introduire une fonctionnalité non supportée.
- Contourner une réserve bloquante par du code.

## 6. Traçabilité

| Décision | Document source | Preuve |
|---|---|---|
| Audit des 58 vues | `AUDIT-ACCESSIBILITE.md` | 1 102 critères, 16 fiches composants |
| Cohérence | `AUDIT-COHERENCE.md` | 36 incohérences, 9 corrigées, 27 ticketées ; `Icon` conforme |
| Corrections | `CORRECTIONS.md` | A01–A10 |
| Glossaire | `GLOSSAIRE-MICROTEXTES.md` | Version 1.0.0 |
| Parcours | `ux-flows.md` | 6 diagrammes Mermaid |
| Design System | `docs/design-system/` | 9 documents, version 1.0.0 |
| Tickets | `TICKETS-POST-GEL.md` | FIX-01 à FIX-45, C01 à C11 |
| Commit | `docs(design): final a11y and coherence review with MVP design freeze [DSG-07]` | Branche DSG-07 |

## 7. Critères de sortie du gel

Le gel pourra être levé lorsque :

- [ ] Le PO a signé ce document.
- [ ] Les checklists DSG-04/05/06 sont signées ou leurs réserves acceptées.
- [ ] P03, P05 et P07 ont une spec.
- [ ] Les vues 768/1280 existent ou sont validées en wireframe.
- [ ] Les tickets P0 sont fermés.
- [ ] Les tests clavier et lecteur d’écran sont exécutés.
- [ ] Les contrastes des bordures de contrôle sont corrigés.
- [ ] Les composants manquants P0 sont livrés.
- [ ] La recette confirme les tarifs de livraison.

## 8. Signature

| Rôle | Nom | Décision | Date | Commentaire |
|---|---|---|---|---|
| Product Owner | | ☐ Approuve ☐ Refuse | | |
| Design lead | | ☐ Approuve ☐ Refuse | | |
| Frontend lead | | ☐ Approuve ☐ Refuse | | |
| QA accessibilité | | ☐ Approuve ☐ Refuse | | |

**Mention** : toute signature vaut acceptation du périmètre **et** des réserves listées en section 4. Une signature sans lecture des réserves est invalide.

## 9. Déclaration finale

Le présent gel atteste que le design MVP est **documenté, cohérent et audité**, pas que le produit est terminé. Les parcours décrivent une cible ; les écrans non implémentés ne doivent pas être annoncés comme disponibles. Toute communication produit doit reprendre cette distinction.
