# [CNT-01] Plan de Production

## Planning type sur 5 jours ouvrables (pour 30-50 produits)

| Jour | Activités |
|------|-----------|
| **J1** | Installation studio (2h), tests lumière et balance des blancs (1h), shooting 8-10 produits × 6 angles (4h) |
| **J2** | Shooting 10-12 produits × 6 angles (5h) + tri en fin de journée (1h) |
| **J3** | Shooting 10-12 produits × 6 angles (5h) + tri en fin de journée (1h) |
| **J4** | Shooting 10-12 produits × 6 angles (5h) + tri en fin de journée (1h) |
| **J5** | Tri final, retouche légère (exposition/balance/poussières), export WebP, renommage, upload MinIO, intégration DB, validation finale |

## Checklist avant la séance

- [ ] Matériel livré et testé (appareil, objectif, flash, softbox, fond, réflecteur)
- [ ] Espace studio nettoyé, fond seamless installé en courbe
- [ ] Charte de balance des blancs disponible
- [ ] Produits déballés, nettoyés, vérifiés (pas de rayures, laçage correct, semelle propre)
- [ ] Mannequin (pied/cheville) disponible pour les vues "porté"
- [ ] Disque dur externe formaté pour les backups
- [ ] Fichier CSV mapping.csv prêt à remplir (modele, couleur, angle par fichier)
- [ ] Validation des ratios et du fond avec le PO (photo test validée avant la séance complète)

## Checklist pendant la séance (par produit)

- [ ] Balance des blancs refaite si changement de lumière
- [ ] 3 prises minimum par angle, la meilleure est retenue
- [ ] Vérification en direct sur écran (tethering) : netteté, cadrage, propreté
- [ ] Étiquetage immédiat dans mapping.csv (pas de "je renommerai après")

## Checklist après la séance

- [ ] Backup des originaux sur disque externe + cloud (2 copies minimum)
- [ ] Tri : garder 1 photo par angle par produit (soit 6 photos par produit)
- [ ] Retouche légère (exposition, balance, poussières - PAS de modification produit)
- [ ] Export 2 formats : JPEG qualité 90% (source) + WebP qualité 85% (optimisé web)
- [ ] Renommage via script (validation regex)
- [ ] Upload MinIO (dossier products/{modele}/{couleur}/)
- [ ] Génération CSV ou SQL de seed ProductImage (url, alt, position, isPrimary)
- [ ] Insertion en DB (Prisma seed ou script migration données)
- [ ] Validation visuelle sur la fiche produit (P04) en local : les 6 angles s'affichent, l'image principale est la bonne, les alt sont corrects
- [ ] Livraison aux développeurs : lien MinIO + credentials + CSV de seed + rapport de livraison