# Validation — DSG-06 Back-office A01–A16

## Statut

**Brouillon à signer.** Aucune signature ne doit être ajoutée avant la revue complète des 21 specs. La signature vaut validation du **design et des parcours**, pas validation de l’implémentation backend.

## Périmètre validé

| Groupe | Écrans | Specs |
| --- | --- | --- |
| Authentification | A01, A02 | 2 |
| Dashboard | A03 | 1 |
| Catalogue | A04, A05, A05b, A06 | 4 |
| Commandes & livraisons | A07, A08, A09, A09b, A09c | 5 |
| Clients & utilisateurs | A10, A10b, A11 | 3 |
| Promotions & avis | A12, A12b, A13 | 3 |
| Paramètres & audit | A14, A15 | 2 |
| Profil | A16 | 1 |
| **Total** | | **21** |

Le brief mentionne « 20 écrans » ; la liste réelle contient 21 vues, dont 5 sous-vues. La validation porte sur 21.

## CA #2 — Chaque table desktop devient une CardList mobile

| Écran | Table desktop | CardList mobile | Vérifié |
| --- | --- | --- | --- |
| A03 Dashboard | `DataTable` commandes | Cartes commandes + livraisons | ☐ |
| A04 Produits | `DataTable` | Cartes produit | ☐ |
| A06 Stock | `DataTable` | Cartes variante | ☐ |
| A07 Commandes | `DataTable` | Cartes commande | ☐ |
| A08 Détail commande | Bloc articles | Bloc articles empilé | ☐ |
| A09 Livraisons | `DataTable` | Cartes livraison | ☐ |
| A09b Mes livraisons | Aucune table | `DeliveryCardMobile` | ☐ |
| A10 Clients | `DataTable` | Cartes client | ☐ |
| A11 Utilisateurs | `DataTable` | Cartes utilisateur | ☐ |
| A12 Promotions | `DataTable` | Cartes coupon | ☐ |
| A13 Avis | `DataTable` | Cartes avis | ☐ |
| A14 Paramètres | `DataTable` zones | Cartes zone | ☐ |
| A15 Audit | `DataTable` | Cartes événement | ☐ |

Critères :

- [ ] Aucun scroll horizontal à 360 px.
- [ ] Chaque carte contient les informations prioritaires et un accès au détail.
- [ ] Les actions critiques sont visibles sans menu.
- [ ] Les filtres passent en drawer.

## CA #3 — A09b optimisée mobile

- [ ] KPI sticky sous le header, hauteur ≤ 120 px.
- [ ] Trois KPI : courses restantes, COD à encaisser, progression livrées/total.
- [ ] Cartes `DeliveryCardMobile` empilées, une course par carte.
- [ ] Actions Appeler, Itinéraire, Marquer livrée, Signaler un échec.
- [ ] Cibles ≥ **48 px**, espacement ≥ 12 px.
- [ ] Texte critique ≥ 16 px, montants ≥ 18 px.
- [ ] Contraste renforcé, lisible en extérieur.
- [ ] Bandeau hors ligne persistant.
- [ ] File d’attente d’actions avec clé d’idempotence.
- [ ] Conflit de synchronisation expliqué, serveur prioritaire.
- [ ] Aucune table, aucun suivi GPS, aucune preuve photo/signature.
- [ ] Le livreur ne voit que ses courses.

## CA #4 — A05b générateur couleurs × pointures

- [ ] Ajout/suppression de couleurs et pointures.
- [ ] Compteur `couleurs × pointures` visible.
- [ ] Limite 30 couleurs, 30 pointures, 300 variantes annoncée avant génération.
- [ ] Génération du produit cartésien sans perte des valeurs existantes.
- [ ] SKU en aperçu, jamais éditables.
- [ ] Édition prix, stock, seuil.
- [ ] Sélection multiple et actions groupées.
- [ ] Suppression avec confirmation, variantes liées à une commande protégées.
- [ ] Mobile : cartes groupées par couleur, édition en feuille.
- [ ] Prototype HTML testé sur les 18 scénarios de `PROTOTYPE.md`.

## Revue UX par groupe

### Authentification

- [ ] A01 ne révèle pas l’existence d’un compte.
- [ ] A02 couvre enrôlement, vérification et code de secours.
- [ ] Les erreurs sont génériques et les verrouillages annoncés.

### Dashboard et catalogue

- [ ] A03 adapte les KPI au rôle.
- [ ] A04 permet recherche, filtres, tri, sélection et actions groupées.
- [ ] A05 distingue brouillon et publication.
- [ ] A05b respecte les contraintes backend réelles.
- [ ] A06 trace chaque ajustement avec motif.

### Commandes et livraisons

- [ ] A07 retrouve une commande par référence, client ou téléphone.
- [ ] A08 n’autorise que les transitions listées.
- [ ] A09 permet d’assigner et réassigner un livreur.
- [ ] A09b est utilisable à moto, hors ligne.
- [ ] A09c est en lecture seule pour un livreur non assigné.

### Clients, utilisateurs, promotions, avis

- [ ] A10/A10b ne permettent pas de modifier l’identité du client.
- [ ] A11 empêche l’auto-modification et la perte du dernier SUPER_ADMIN.
- [ ] A12/A12b n’inventent ni portée produit ni cumul.
- [ ] A13 permet d’approuver et rejeter sans supprimer.

### Paramètres, audit, profil

- [ ] A14 ne propose aucun réglage non implémenté.
- [ ] A15 est strictement en lecture seule.
- [ ] A16 exige le mot de passe actuel pour les actions sensibles.

## Décisions à confirmer

| # | Sujet | Décision proposée | Validé |
| --- | --- | --- | --- |
| 1 | Routes | `/admin/*` canoniques, alias possibles pour `/connexion` et `/produits` | ☐ |
| 2 | CA du dashboard | `createdAt` pour le volume, `paidAt` pour le CA | ☐ |
| 3 | Annulation commande | Liste fermée de motifs + note | ☐ |
| 4 | Stock négatif | Interdit, plancher à 0 | ☐ |
| 5 | A09b hors ligne | File d’attente pour livrée/échec, serveur prioritaire | ☐ |
| 6 | Export audit | Endpoint dédié, sinon désactivé | ☐ |
| 7 | Rôles admin | Seul SUPER_ADMIN attribue ADMIN/SUPER_ADMIN | ☐ |
| 8 | Désactivation 2FA | Mot de passe + TOTP, validation renforcée pour admins | ☐ |

## Dépendances backend bloquantes

- [ ] `GET /admin/products` et `GET /admin/products/:id`
- [ ] `GET /admin/brands`, `GET /admin/categories`
- [ ] Dashboard
- [ ] Stock et mouvements
- [ ] Commandes, transitions et historique
- [ ] Livraisons, assignation et tournée livreur
- [ ] Clients
- [ ] Utilisateurs internes et invitation
- [ ] Coupons
- [ ] Avis
- [ ] Paramètres et zones
- [ ] Lecture de l’audit
- [ ] `PATCH /me`, mot de passe, désactivation 2FA, sessions

## Signatures

### Gérant / responsable produit

Je valide le périmètre des 21 vues, les parcours, les règles RBAC, les quatre états et les décisions proposées ci-dessus.

- Nom : ______________________________
- Fonction : __________________________
- Date : ______________________________
- Signature : _________________________

### Livreur test — A09b

Je confirme que la vue « Mes livraisons » est utilisable sur mobile, en plein soleil, avec une main, et que les actions Appeler, Itinéraire, Marquer livrée et Échec sont accessibles.

- Nom : ______________________________
- Date du test : ______________________
- Appareil utilisé : __________________
- Signature : _________________________

### Responsable technique

Je confirme que les dépendances backend listées sont identifiées et qu’aucune intégration absente n’est présentée comme terminée.

- Nom : ______________________________
- Date : ______________________________
- Signature : _________________________

## Réserves

Toute réserve doit être écrite ici avant signature.

```text
1.
2.
3.
```
