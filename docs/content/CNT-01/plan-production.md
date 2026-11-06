# CNT-01 — Plan de Production Photographe

## Planning sur 5 Jours Ouvrables

| Jour | Activité | Détails |
|------|----------|---------|
| **J1** | Installation & Tests | Installation du studio, test lumière, balance des blancs, validation cadrage et ratio avec un produit échantillon. Préparation du mapping.csv et des fichiers de référence. |
| **J2** | Shooting - Premier lot | Photo de 10 à 12 produits (première fournée). Respect du protocole 6 angles par produit. Vérification immédiate sur écran. |
| **J3** | Shooting - Deuxième lot | Photo de 10 à 12 produits supplémentaires. Ajustements si nécessaire suite au J2. Continuité des réglages lumière et cadrage. |
| **J4** | Shooting - Troisième lot | Photo de 10 à 12 produits supplémentaires. consolidation. À la fin du J4, 30+ produits doivent être en boîte. |
| **J5** | Tri / Export / Upload | Tri des photos, retouche légère, export JPEG + WebP, upload MinIO, génération du CSV product-images.csv, validation sur fiche produit P04. |

## Checklists par Phase

### Avant la séance (préalable)
- [ ] Studio installé, fond seamless en courbe, éclairage réglé
- [ ] Charte de balance des blancs créée, température 5500K fixée
- [ ] Matériel vérifié (appareil, objectif, éclairage, trépied, réflecteurs)
- [ ] Produits nettoyés, préparés, répertoriés avec slugs et couleurs
- [ ] mapping.csv prêt avec colonnes: modele, couleur, angle
- [ ] Disque dur externe prêt pour backups
- [ ] Validation photo test avec le PO (ratio 1:1, fond #F5F5F5)

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

## Budget Matériel (XAF)

| Équipement | Option Low-Cost (~50.000 F CFA) | Option Pro (~150.000 F CFA) |
|------------|----------------------------------|------------------------------|
| Appareil photo | Smartphone récent ≥ 48 MP, mode Pro | Hybride ≥ 24 MP |
| Objectif | 50mm f/1.8 ou 85mm | Zoombreau 24-70mm f/2.8 |
| Éclairage | 2 parapluies réfléchissants | 2 softbox LED professionnel |
| Fond neutre | Papier seamless blanc | Papier seamless professionnel |
| Trépied | Moyenne gamme | Stabilisateur professionnel |
| **Total** | **~50.000 F CFA** | **~150.000 F CFA** |

**Recommandation** : option low-cost pour MVP, évaluer qualité avant investissement pro.