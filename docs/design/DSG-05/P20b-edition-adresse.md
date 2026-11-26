# P20b — Ajouter / modifier une adresse

> DSG-05 · groupe Compte · routes `/compte/adresses/nouvelle` et `/compte/adresses/:id`
> Endpoints à créer : `POST /addresses`, `PATCH /addresses/:id`.

---

## 1. Objectif & rôle

Saisir une adresse de livraison complète et fiable, avec un repère indispensable. Le formulaire est le même en création et en édition ; seul le préremplissage et le titre changent.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header + fil d'Ariane « Accueil › Mon compte › Adresses › Nouvelle adresse ».
2. `h1` « Nouvelle adresse » ou « Modifier l'adresse ».
3. Carte formulaire :
   - libellé : « Maison », « Bureau », « Autre » (segmented) + champ libre si Autre ;
   - ville (select) ;
   - quartier (select ou texte selon la zone) ;
   - adresse / rue (texte) ;
   - point de repère (textarea, obligatoire) ;
   - téléphone de livraison (préfixe +237) ;
   - toggle « Utiliser comme adresse par défaut ».
4. Bouton « Enregistrer l'adresse ».
5. Lien « Annuler ».
6. Aide zones : « Nous livrons à Douala, Yaoundé, Bafoussam et dans plusieurs régions. » + lien P24.

### 768 px

- Carte 600 px centrée, champs sur deux colonnes pour ville/quartier.

### 1280 px

- Sidebar compte + formulaire 640 px + panneau d'aide 280 px (repères, zones, exemple).

```text
┌──────────────┬───────────────────────────────────────────────┐
│ MON COMPTE   │ Nouvelle adresse                              │
│ Adresses ●   │ [Maison][Bureau][Autre]                       │
│              │ Ville [Douala ▼]  Quartier [Bonapriso ▼]      │
│              │ Adresse [_____________________________]       │
│              │ Repère  [_____________________________]       │
│              │ Téléphone [+237][____________________]        │
│              │ [x] Adresse par défaut                        │
│              │ [ Enregistrer ]   Annuler                     │
└──────────────┴───────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `AccountNav` | NOUVEAU | sidebar | actif |
| `Input` | TEC-10 | text, tel | normal, focus, error |
| `Textarea` | NOUVEAU (DSG-04) | 3 lignes | normal, error |
| `Select` | TEC-10 | ville, quartier | normal, loading, error |
| `Toggle` | TEC-10 | — | on/off |
| `Button` | TEC-10 | primary, ghost | normal, loading |
| `Alert` | NOUVEAU | danger, info | — |

---

## 4. États obligatoires

- **Chargement** : si édition, skeleton du formulaire ; si zones, selects en `loading`.
- **Vide** : formulaire vierge en création ; en édition, tous les champs sont préremplis.
- **Erreur** : validation par champ, zone indisponible, 409, réseau.
- **Succès** : retour P20 avec toast « Adresse enregistrée. ».

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Libellé vide | « Donnez un nom à cette adresse, par exemple Maison ou Bureau. » |
| Ville vide | « Choisissez votre ville. » |
| Ville non desservie | « Nous ne livrons pas encore cette ville. Consultez nos zones de livraison. » |
| Quartier vide | « Précisez votre quartier. » |
| Adresse vide | « Indiquez la rue, l'immeuble ou la résidence. » |
| Repère vide | « Ajoutez un point de repère : un commerce, un immeuble, une rue connue. » |
| Repère trop court | « Décrivez le repère en quelques mots (10 caractères minimum). » |
| Téléphone invalide | « Saisissez un numéro camerounais à 9 chiffres après +237. » |
| Adresse introuvable (404) | « Cette adresse n'existe plus. Retournez à la liste. » |
| Réseau | « L'adresse n'a pas été enregistrée. Vérifiez votre connexion. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre création | Nouvelle adresse | neutre | `h1` |
| Titre édition | Modifier l'adresse | neutre | `h1` |
| Libellé | Nom de l'adresse * | neutre | — |
| Choix Maison | Maison | familier | radio |
| Choix Bureau | Bureau | neutre | radio |
| Choix Autre | Autre | neutre | radio |
| Label ville | Ville * | neutre | — |
| Label quartier | Quartier * | neutre | — |
| Label adresse | Adresse * | neutre | — |
| Placeholder adresse | Rue, immeuble, résidence | aide | — |
| Label repère | Point de repère * | neutre | — |
| Aide repère | Indispensable pour que le coursier vous trouve. | aide | — |
| Placeholder repère | Ex. Immeuble bleu, face à la pharmacie | aide | — |
| Label téléphone | Téléphone de livraison * | neutre | — |
| Toggle défaut | Utiliser comme adresse par défaut | neutre | — |
| CTA | Enregistrer l'adresse | action | — |
| CTA chargement | Enregistrement… | statut | — |
| Annuler | Annuler | action | — |
| Aide zones | Nous livrons à Douala, Yaoundé, Bafoussam et dans plusieurs régions. | info | lien P24 |
| Succès | Adresse enregistrée. | succès | `role="status"` |

---

## 6. Interactions & comportements

- Préremplissage en édition depuis `GET /addresses/:id` (ou depuis l'état de navigation).
- Le libellé « Autre » révèle un champ texte obligatoire.
- Ville : liste issue de `GET /delivery-zones` ; changement → recharge les quartiers et affiche les frais.
- Repère : compteur 0/200, minimum 10 caractères.
- Téléphone : même normalisation que P09.
- Si le toggle « par défaut » est activé, l'ancienne adresse par défaut est désactivée côté serveur.
- Annulation : retour P20 ; en cas de saisie, `ConfirmDialog` « Quitter sans enregistrer ? ».
- Aucun brouillon local pour ce formulaire.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, `fieldset`/`legend` pour le type d'adresse.
- Labels liés, `autocomplete` (`street-address`, `address-level2`, `tel-national`).
- Erreurs : `aria-invalid`, `aria-describedby`, résumé `role="alert"`.
- Textarea avec compteur `aria-live="polite"` non répétitif.
- Toggle : `role="switch"`, `aria-checked`, label cliquable.
- Cibles ≥ 44 px, focus visible, contraste AA.
- Zoom 200 % : une colonne, aucun défilement horizontal.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Création | `POST /addresses` **à créer** | Erreur + conserver la saisie |
| Édition | `PATCH /addresses/:id` **à créer** | Erreur |
| Zones | `GET /delivery-zones` **à créer** | Liste locale de secours + message |
| Détail | `GET /addresses/:id` **à créer** | Données de navigation |

Payload : `{ label, city, district, line, landmark, phone, isDefault }`.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Zone K affiche des repères, pas de formulaire | Formulaire conçu avec les patterns P09 |
| « Par défaut » non modélisé | Champ `isDefault` requis |
| Quartier en texte dans la maquette | Select si la zone fournit une liste, sinon texte |
| Aucune confirmation d'abandon | `ConfirmDialog` ajouté |

---

## 10. Wireframe de référence

Zone K, bloc adresses ; formulaire de référence P09/P10.
