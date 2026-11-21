# Glossaire — Design System BrunyShop

**Version** : 1.0.0
**Source complète** : [`../design/DSG-07/GLOSSAIRE-MICROTEXTES.md`](../design/DSG-07/GLOSSAIRE-MICROTEXTES.md).

Ce document est l’index de référence rapide. En cas de divergence, le glossaire complet prévaut.

## 1. Principes

- Vouvoiement, ton direct, français du Cameroun.
- Une action = un verbe.
- Pas de jargon, pas d’anglicisme, pas de promesse non tenue.
- Pas de point final dans un bouton ou un titre.
- Espace insécable entre nombre et unité.
- Une seule forme par concept.

## 2. Actions canoniques

| Concept | Forme |
|---|---|
| Ajouter un produit | **Ajouter au panier** |
| Voir le panier | **Voir le panier** |
| Passer commande | **Passer la commande** |
| Continuer | **Continuer** |
| Retour | **Retour** |
| Payer | **Payer** |
| Confirmer | **Confirmer la commande** |
| Créer un compte | **Créer mon compte** |
| Se connecter | **Se connecter** |
| Se déconnecter | **Se déconnecter** |
| Mot de passe oublié | **Mot de passe oublié ?** |
| Enregistrer | **Enregistrer** |
| Annuler | **Annuler** |
| Supprimer | **Supprimer** |
| Confirmer une suppression | **Confirmer la suppression** |
| Fermer | **Fermer** |
| Appliquer des filtres | **Appliquer les filtres** |
| Réinitialiser des filtres | **Réinitialiser les filtres** |
| Voir plus | **Voir plus** |
| Contacter le support | **Contacter le support** |
| Suivre une commande | **Suivre ma commande** |
| Demander un retour | **Demander un retour** |
| Réessayer | **Réessayer** |

## 3. Statuts

### Commande

`En attente de confirmation` · `En attente de paiement` · `Confirmée` · `Payée` · `En préparation` · `Expédiée` · `Livrée` · `Livraison échouée` · `Annulée` · `Retour demandé` · `Retournée` · `Remboursée` · `Échangée`

### Paiement

`En attente` · `Payé` · `Échoué` · `Remboursé`

### Produit

`Brouillon` · `Publié` · `Archivé`

### Compte

`Actif` · `Suspendu` · `Désactivé` · `E-mail à vérifier`

## 4. Moyens de paiement et livraison

| Concept | Forme |
|---|---|
| Paiement à la réception | **Paiement à la livraison** |
| Mobile Money | **Mobile Money** |
| Carte | **Carte bancaire** |
| Frais | **Frais de livraison** |
| Gratuit | **Livraison gratuite** |
| Délai | **Sous 24 à 48 h** |
| Zones | **Douala**, **Yaoundé**, **Autres villes** |
| Retrait | **Retrait en boutique** |

## 5. Messages d’erreur

| Situation | Forme |
|---|---|
| Obligatoire | **Ce champ est obligatoire.** |
| E-mail | **Adresse e-mail invalide.** |
| Téléphone | **Saisissez un numéro camerounais à 9 chiffres (ex. 6 71 23 45 67).** |
| Mot de passe court | **Le mot de passe doit contenir au moins 8 caractères.** |
| Confirmation différente | **Les mots de passe ne correspondent pas.** |
| Identifiants | **Adresse e-mail ou mot de passe incorrect.** |
| Compte non vérifié | **Vérifiez votre adresse e-mail avant de vous connecter.** |
| Stock | **Stock insuffisant : il reste 2 articles.** |
| Réseau | **Connexion impossible. Vérifiez votre réseau et réessayez.** |
| Session | **Votre session a expiré. Reconnectez-vous.** |
| Accès | **Vous n’avez pas accès à cette page.** |
| Serveur | **Une erreur est survenue. Réessayez dans quelques instants.** |

**Interdits** : « Erreur ! », « Invalid input », « Oops », « Email invalide » sans « Adresse », « Numéro invalide ».

## 6. Formats

| Donnée | Forme | Exemple |
|---|---|---|
| Prix | Nombre + espace insécable + `FCFA` | **25 000 FCFA** |
| Devise API | `XAF`, jamais affichée | `XAF` |
| Date courte | `j mois aaaa` abrégé | **15 janv. 2025** |
| Date relative | Aujourd’hui/hier + heure | **aujourd’hui à 14 h 30** |
| Heure | 24 h | **14 h 30** |
| Téléphone | 9 chiffres + préfixe | **+237 6 71 23 45 67** |
| Commande | `BRN-YYMM-XXXX` | **BRN-2511-0042** |
| Livraison | `LIV-YYMM-XXXX` | **LIV-2511-0017** |
| Pourcentage | Nombre + espace + `%` | **-20 %** |

## 7. États vides

| Contexte | Titre | Action |
|---|---|---|
| Panier | **Votre panier est vide** | **Découvrir la boutique** |
| Favoris | **Aucun favori** | **Découvrir la boutique** |
| Commandes | **Aucune commande** | **Découvrir la boutique** |
| Adresses | **Aucune adresse** | **Ajouter une adresse** |
| Recherche | **Aucun résultat** | **Réinitialiser les filtres** |
| Admin | **Aucun élément** | **Réinitialiser les filtres** |

## 8. Règles d’accessibilité des textes

- Un lien a un nom compréhensible hors contexte.
- Un bouton icône a un `aria-label`.
- Une image informative a un `alt` ; une image décorative a `alt=""`.
- Un statut est annoncé (`role="status"` ou `alert`).
- Une erreur n’est jamais seulement rouge.
- Les abréviations sont développées à la première occurrence.
- Le texte tient à 200 % de zoom et à 320 px.

## 9. Gouvernance

Toute nouvelle chaîne est ajoutée au glossaire complet avant la maquette. Une dérogation est écrite, datée et ticketée. La version du glossaire suit celle du Design System.
