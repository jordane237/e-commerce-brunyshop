# CNT-01 — Brief Photographe : Séance Photo Produits BrunyShop

## Contexte & Objectif

Boutique e-commerce **BrunyShop** — Cameroun, spécialisée dans la vente de **chaussures** (et éventuellement vêtements). Nous préparons le lancement **MVP** avec **30 à 50 produits réels** photographiés avant la fin de la phase de construction.

**Objectif** : produire de belles photos nettes sous plusieurs angles pour permettre au client de choisir en confiance sur la fiche produit (P04) et le catalogue (P02).

**Spécifications** :
- **5 à 6 angles** par modèle : face, profil, dessus, semelle, détail, porté
- **Fond neutre** et **lumière identiques** pour tous les produits
- **Ratio constant** : 1:1 (carré, aligné avec composant `bruny-product-card` existant et Design System DSG-02). Alternate : 4:5 portrait si décision différente.
- **Résolution** : minimum 2000px sur le grand côté, idéal 3000px
- **Formats** : JPEG qualité 90% (source) + WebP qualité 85% (optimisé web), couleur sRGB
- **30 à 50 produits** les plus vendus doivent être prêts avant fin de phase de construction

---

## Matériel Requêt (Tableau de Budget Estimé en XAF)

| Équipement | Option Low-Cost (~50.000 F CFA) | Option Pro (~150.000 F CFA) |
|------------|----------------------------------|------------------------------|
| Appareil photo | Smartphone récent ≥ 48 MP, mode Pro | Hybride ≥ 24 MP |
| Objectif | 50mm f/1.8 ou 85mm | Zoombreau 24-70mm f/2.8 |
| Éclairage | 2 parapluies réfléchissants | 2 softbox LED professionnel |
| Fond neutre | Papier seamless blanc | Papier seamless professionnel |
| Trépied | Moyenne gamme | Stabilisateur professionnel |
| Total estimé | **~50.000 F CFA** | **~150.000 F CFA** |

**Recommandation** : commencer avec l'option **low-cost** pour le MVP.

---

## Installation Studio

**Espace minimum** : 3×2m avec fond seamless en courbe.

**Réglages lumière** :
- **Key light** à **45°** devant la chaussure
- **Fill light** à **30-45%** d'intensité à l'opposé
- **Balance des blancs** : manuelle sur **charte grise** avant chaque série
- **Température de couleur** : **fixe 5500K** — **jamais changer**
---

## Protocole de Prise de Vue — 6 Angles par Produit

### 1. **face**
- Vue de face, chaussure orientée vers l'objectif
- Deux pieds côte à côte, parallèle
- Fond et lumière identiques aux autres produits

### 2. **profil**
- Vue de côté (côté extérieur) du chaussure de profil complet
- La chaussure de profil, du talon à la pointe
- Aucun débordement du fond

### 3. **dessus**
- Vue du dessus (plongée à 90°)
- Laçage and empeigne visibles
- Appareil au-dessus de la chaussure, vertical

### 4. **semelle**
- Vue du dessous
- Chaussure retournée, crampons/rainures visibles
- Poser la chaussure sur une surface propre

### 5. **detail**
- Gros plan sur élément distinctif (logo, couture, matière, fermeture)
- Distance **30-40cm**, ouverture **f/4-f/5.6** pour shallow depth of field
- Identifier l'élément clé à mettre en avant par avance

### 6. **porte**
- Chaussure portée par un mannequin (pied + cheville + bas de jambe)
- Angle **3/4 dynamique**
- Fond identique à tous les autres produits (ne pas changer)

---

## Contraintes (TOUTES OBLIGATOIRES)

| Contrainte | Spécification |
|------------|---------------|
| Fond | Identique pour tous les produits : **#F5F5F5** (blanc cassé) — décidé et documenté |
| Lumière | Identique installation, mêmes réglages, même balance 5500K |
| Ratio | **1:1** (carré), aligné avec `bruny-product-card` DSG-02. Alternate 4:5 documentée. |
| Résolution | Min 2000px grand côté, idéal 3000px |
| Format sortie | JPEG qualité 90% (source) + WebP qualité 85% (optimisé web), sRGB |
| Retouche | Légère : exposition, balance des blancs, poussières uniquement — **AUCUNE** modification de la forme ou couleur du produit |
| Cohérence couleurs | Aligner avec tokens Design System DSG-02 : `--color-surface: #ffffff`, `--color-muted: #f4f3ef`, accent or `#c9a227` |
| Nombre de prises | **3 minimum par angle**, garder la meilleure |
| Conservation RAW/JPEG | Conserver originaux 30j avant événementiel nettoyage |

---

## Direction Artistique

- **Style** : épuré, moderne, fidèle au produit
- **Pas de surexposition**, pas de saturation à outrance
- **Retouche légère** uniquement (exposition/balance/poussières)
- **Cohérence avec les couleurs BrunyShop** extraites des tokens DSG-02
- **Images principales** : vue `face` uniquement en isPrimary sur la fiche produit
- **Images supplémentaires** : les 5 autres angles en galerie cliquable

---

## Checklist de Séance

### Avant la séance
- [ ] Matériel livré et testé (appareil, objectif, éclairage, fond, réflecteur)
- [ ] Espace studio nettoyé, fond seamless en courbe installé
- [ ] Charte de balance des blancs disponible
- [ ] Produits déballés, nettoyés, vérifiés (pas de défaut, laçage correct, semelle propre)
- [ ] Mannequin (pied/cheville) disponible pour les vues "porte"
- [ ] Disque dur externe formaté pour backups
- [ ] Fichier **mapping.csv** prêt (colonne : modele, couleur, angle par fichier)
- [ ] Validation du ratio et du fond avec le PO (photo test validée AVANT la séance complète)

### Pendant la séance (par produit)
- [ ] Balance des blancs refaite si changement de lumière
- [ ] **3 prises minimum par angle**, meilleure retenue
- [ ] Vérification en direct sur écran (tethering) : netteté, cadrage, propreté
- [ ] Étiquetage **immédiat** dans mapping.csv (pas de "je renommerai après")
- [ ] Nommer les photos selon convention `modele-couleur-angle.jpg` immédiatement après chaque angle

### Après la séance
- [ ] Backup originaux sur disque externe + cloud (2 copies minimum)
- [ ] Tri : **1 photo par angle par produit** (6 photos/produit)
- [ ] Retouche légère (exposition, balance, poussières — PAS modification produit)
- [ ] Export 2 formats : JPEG q90 + WebP q85
- [ ] Renommage via script (validation regex stricte)
- [ ] Upload MinIO (products/{modele}/{couleur}/)
- [ ] Génération CSV product-images.csv (productSlug, couleur, angle, url, alt, position, isPrimary)
- [ ] Insertion en DB (Prisma upsert via script)
- [ ] Validation visuelle sur fiche produit P04 en local : 6 angles s'affichent, image principale correcte, alt corrects
- [ ] Livraison aux développeurs : lien MinIO + credentials + CSV de seed + rapport de livraison
- **Position appareil** : hauteur chaussure, distance **1,2-1,5m**, objectif **50mm**, ouverture **f/8-f/11**, **ISO 100**, vitesse **≥ 1/125s**