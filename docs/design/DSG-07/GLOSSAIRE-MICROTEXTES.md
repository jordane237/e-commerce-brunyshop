# Glossaire des microtextes — BrunyShop

**Version** : 1.0.0 (gel MVP, 11 novembre 2026)
**Statut** : source de vérité pour toute interface utilisateur.
**Langue** : français du Cameroun, ton direct, respectueux, sans jargon technique.

## 1. Règles de rédaction

1. **Une action = un verbe.** Le libellé décrit ce qui se passe, pas l’état interne.
2. **Pas de jargon** : « commande », « livraison », « paiement », « retour » sont préférés à « transaction », « fulfilment », « refund ».
3. **Pas de promesse non tenue** : ne jamais afficher une fonctionnalité absente du backend.
4. **Pas de majuscules décoratives** : les titres commencent par une majuscule, les micro-libellés peuvent être en capitales.
5. **Pas d’anglicismes** : « e-mail » est admis, « login », « checkout » et « tracking » ne le sont pas.
6. **Pas de point final** dans les boutons, les titres et les libellés courts.
7. **Une seule espace insécable** entre le nombre et l’unité (`25 000 FCFA`, `24 h`, `100 %`).
8. **Le tutoiement est interdit** ; le vouvoiement est la norme.
9. **Le ton reste calme en erreur** : pas de « Erreur ! », pas de majuscules, pas de reproche.
10. **Tout texte visible est dans ce glossaire** avant d’être maquetté.

## 2. Actions et boutons

| Concept | Forme canonique | Variantes interdites | Contexte |
|---|---|---|---|
| Ajouter un produit | **Ajouter au panier** | Ajouter, Commander, Ajouter Panier | ProductCard, fiche produit |
| Voir le panier | **Voir le panier** | Mon panier (bouton), Panier | Après ajout |
| Passer commande | **Passer la commande** | Commander, Valider | Panier, checkout |
| Continuer | **Continuer** | Suivant, Étape suivante, Passer à l’étape suivante | Tunnel |
| Retour | **Retour** | Précédent, Back | Tunnel |
| Payer | **Payer** | Régler, Valider le paiement | Checkout |
| Confirmer la commande | **Confirmer la commande** | Valider, Terminer | Récapitulatif |
| Créer un compte | **Créer mon compte** | S’inscrire, Enregistrer | Auth |
| Se connecter | **Se connecter** | Connexion (bouton), Login | Auth |
| Se déconnecter | **Se déconnecter** | Déconnexion (bouton) | Compte |
| Mot de passe oublié | **Mot de passe oublié ?** | Forgot password | Auth |
| Réinitialiser | **Réinitialiser le mot de passe** | Changer mot de passe (sans contexte) | Auth |
| Enregistrer | **Enregistrer** | Sauvegarder, Valider | Formulaires |
| Annuler | **Annuler** | Retour, Non | Modales, formulaires |
| Supprimer | **Supprimer** | Effacer, Retirer | Actions destructives |
| Confirmer la suppression | **Confirmer la suppression** | Oui, Supprimer définitivement | Modale destructive |
| Modifier | **Modifier** | Éditer, Changer | Compte, admin |
| Fermer | **Fermer** | X (seul), OK | Modales, tiroirs |
| Appliquer les filtres | **Appliquer les filtres** | Filtrer, OK | Filtres |
| Réinitialiser les filtres | **Réinitialiser les filtres** | Effacer, Tout effacer | Filtres |
| Rechercher | **Rechercher** | Chercher, Go | Recherche |
| Voir plus | **Voir plus** | Charger plus, Afficher plus | Listes mobiles |
| Contacter le support | **Contacter le support** | Aide, Support | Aide |
| Suivre ma commande | **Suivre ma commande** | Tracking, Suivi | Confirmation |
| Demander un retour | **Demander un retour** | Retourner, Remboursement | Commande |
| Réessayer | **Réessayer** | Nouvelle tentative, Retry | Erreur réseau |
| Utiliser ma position | **Utiliser ma position** | Géolocalisation, GPS | Livraison |

## 3. Navigation et titres

| Élément | Forme canonique | Remarque |
|---|---|---|
| Accueil | **Accueil** | Onglet |
| Catalogue | **Boutique** | Le mot « Catalogue » reste un terme interne |
| Recherche | **Recherche** | |
| Panier | **Panier** | |
| Commande | **Commande** | |
| Livraison | **Livraison** | |
| Compte | **Mon compte** | |
| Commandes | **Mes commandes** | |
| Adresses | **Mes adresses** | |
| Favoris | **Mes favoris** | |
| Aide | **Aide** | |
| Administrations | **Administration** | Réservé aux rôles autorisés |
| Livraisons du jour | **Livraisons du jour** | Livreur |
| Tableau de bord | **Tableau de bord** | Admin |
| Produits | **Produits** | Admin |
| Stock | **Stock** | Admin |
| Clients | **Clients** | Admin |
| Paramètres | **Paramètres** | Admin |

## 4. Statuts de commande

Le libellé utilisateur est dérivé de l’enum backend. Aucun statut libre n’est autorisé.

| Enum | Libellé | Ton | Description |
|---|---|---|---|
| `PENDING_CONFIRMATION` | **En attente de confirmation** | Neutre | Commande reçue, non confirmée |
| `AWAITING_PAYMENT` | **En attente de paiement** | Attention | Paiement non reçu |
| `CONFIRMED` | **Confirmée** | Succès | Confirmée par l’équipe |
| `PAID` | **Payée** | Succès | Paiement encaissé |
| `PREPARING` | **En préparation** | Neutre | Colis en préparation |
| `SHIPPED` | **Expédiée** | Info | Remise au livreur |
| `DELIVERED` | **Livrée** | Succès | Remise au client |
| `DELIVERY_FAILED` | **Livraison échouée** | Danger | Client absent ou adresse incorrecte |
| `CANCELLED` | **Annulée** | Danger | Annulée par le client ou l’équipe |
| `RETURN_REQUESTED` | **Retour demandé** | Attention | Demande reçue |
| `RETURNED` | **Retournée** | Neutre | Colis revenu |
| `REFUNDED` | **Remboursée** | Succès | Remboursement effectué |
| `EXCHANGED` | **Échangée** | Succès | Échange effectué |

### Statuts de paiement

| Enum | Libellé |
|---|---|
| `PENDING` | **En attente** |
| `SUCCEEDED` | **Payé** |
| `FAILED` | **Échoué** |
| `REFUNDED` | **Remboursé** |

### Statuts de produit

| Enum | Libellé |
|---|---|
| `DRAFT` | **Brouillon** |
| `PUBLISHED` | **Publié** |
| `ARCHIVED` | **Archivé** |

### Statuts de compte

| Enum | Libellé |
|---|---|
| `ACTIVE` | **Actif** |
| `SUSPENDED` | **Suspendu** |
| `DISABLED` | **Désactivé** |
| `PENDING_VERIFICATION` | **E-mail à vérifier** |

### Rôles

| Enum | Libellé |
|---|---|
| `SUPER_ADMIN` | **Super administrateur** |
| `ADMIN` | **Administrateur** |
| `ORDER_MANAGER` | **Gestionnaire des commandes** |
| `STOCK_MANAGER` | **Gestionnaire du stock** |
| `LIVREUR` | **Livreur** |
| `CUSTOMER` | **Client** |

## 5. Moyens de paiement et livraison

| Concept | Forme canonique | Variantes interdites |
|---|---|---|
| Paiement à la réception | **Paiement à la livraison** | Paiement à la réception, Paiement à réception, COD |
| Mobile Money | **Mobile Money** | MoMo, MTN Money, Orange Money (sauf mention explicite) |
| Carte bancaire | **Carte bancaire** | Carte, CB |
| Frais de livraison | **Frais de livraison** | Livraison, Shipping |
| Livraison gratuite | **Livraison gratuite** | Franco, Free |
| Délai | **Sous 24 à 48 h** | 24-48h, 24/48h |
| Zone | **Douala**, **Yaoundé**, **Autres villes** | Ydé, DLA |
| Retrait | **Retrait en boutique** | Pick-up, Click and collect |

## 6. Champs de formulaire

| Champ | Libellé | Placeholder | Autocomplete |
|---|---|---|---|
| Prénom | **Prénom** | `` | `given-name` |
| Nom | **Nom** | `` | `family-name` |
| E-mail | **Adresse e-mail** | `vous@exemple.cm` | `email` |
| Téléphone | **Téléphone** | `6 71 23 45 67` | `tel-national` |
| Mot de passe | **Mot de passe** | `` | `current-password` / `new-password` |
| Confirmation | **Confirmer le mot de passe** | `` | `new-password` |
| Adresse | **Adresse** | `Quartier, rue, repère` | `street-address` |
| Ville | **Ville** | `Douala` | `address-level2` |
| Quartier | **Quartier** | `Bonapriso` | `address-level3` |
| Point de repère | **Point de repère** | `Ex. face à la pharmacie` | `` |
| Code postal | **Code postal** (facultatif) | `` | `postal-code` |
| Quantité | **Quantité** | `` | `` |
| Pointure | **Pointure** | `Sélectionnez votre pointure` | `` |
| Couleur | **Couleur** | `Sélectionnez une couleur` | `` |
| Recherche | **Rechercher un produit** | `Nom, marque, catégorie` | `search` |

**Règles :**

- L’astérisque n’est pas utilisée seule : ajouter « (obligatoire) » dans le libellé ou `aria-required`.
- Le texte d’aide est placé **sous** le libellé et **au-dessus** du champ.
- L’erreur est placée **sous** le champ et reliée par `aria-describedby`.
- Le placeholder ne remplace jamais le libellé.

## 7. Messages d’erreur

| Situation | Forme canonique |
|---|---|
| Champ obligatoire | **Ce champ est obligatoire.** |
| E-mail vide | **Saisissez votre adresse e-mail.** |
| E-mail invalide | **Adresse e-mail invalide.** |
| Téléphone vide | **Saisissez votre numéro de téléphone.** |
| Téléphone invalide | **Saisissez un numéro camerounais à 9 chiffres (ex. 6 71 23 45 67).** |
| Mot de passe trop court | **Le mot de passe doit contenir au moins 8 caractères.** |
| Mots de passe différents | **Les mots de passe ne correspondent pas.** |
| Identifiants incorrects | **Adresse e-mail ou mot de passe incorrect.** (ne jamais préciser lequel) |
| Compte non vérifié | **Vérifiez votre adresse e-mail avant de vous connecter.** |
| Compte suspendu | **Votre compte est suspendu. Contactez le support.** |
| Stock insuffisant | **Stock insuffisant : il reste 2 articles.** |
| Produit indisponible | **Ce produit n’est plus disponible.** |
| Quantité invalide | **Saisissez une quantité entre 1 et 10.** |
| Adresse hors zone | **Nous ne livrons pas encore à cette adresse.** |
| Frais indisponibles | **Impossible de calculer les frais de livraison. Réessayez.** |
| Paiement refusé | **Le paiement n’a pas abouti. Aucun montant n’a été débité.** |
| Réseau | **Connexion impossible. Vérifiez votre réseau et réessayez.** |
| Session expirée | **Votre session a expiré. Reconnectez-vous.** |
| Accès refusé | **Vous n’avez pas accès à cette page.** |
| Page introuvable | **Cette page n’existe pas ou a été déplacée.** |
| Erreur serveur | **Une erreur est survenue. Réessayez dans quelques instants.** |
| Champ trop long | **Ce champ dépasse la longueur autorisée.** |
| Fichier trop volumineux | **Le fichier dépasse 5 Mo.** |
| Format de fichier | **Formats acceptés : JPG, PNG ou WebP.** |

**Interdits :** « Erreur ! », « Invalid input », « Something went wrong », « Oops », « Email invalide » (sans « Adresse »), « Numéro invalide ».

## 8. Messages de succès et confirmations

| Situation | Forme canonique |
|---|---|
| Produit ajouté | **Produit ajouté au panier.** |
| Produit retiré | **Produit retiré du panier.** |
| Quantité mise à jour | **Quantité mise à jour.** |
| Commande passée | **Votre commande est confirmée. Référence : BRN-2511-0042.** |
| Compte créé | **Votre compte est créé. Vérifiez votre adresse e-mail.** |
| E-mail vérifié | **Votre adresse e-mail est vérifiée.** |
| Mot de passe modifié | **Votre mot de passe est modifié.** |
| Lien envoyé | **Si un compte existe pour cette adresse, un lien vient d’être envoyé.** |
| Adresse enregistrée | **Adresse enregistrée.** |
| Profil enregistré | **Profil enregistré.** |
| Commande annulée | **La commande est annulée.** |
| Retour demandé | **Votre demande de retour est envoyée.** |
| Message support envoyé | **Votre message est envoyé. Nous répondons sous 24 h ouvrées.** |
| Copie | **Copié.** |
| Déconnexion | **Vous êtes déconnecté.** |

**Confirmations destructives :**

- Titre : **Confirmer la suppression ?**
- Corps : **Cette action est définitive. La commande et son historique seront supprimés.**
- Actions : **Annuler** (focus initial) / **Confirmer la suppression** (danger).

## 9. États vides

| Contexte | Titre | Texte | Action |
|---|---|---|---|
| Panier | **Votre panier est vide** | **Ajoutez un produit pour commencer votre commande.** | **Découvrir la boutique** |
| Favoris | **Aucun favori** | **Enregistrez les produits que vous aimez pour les retrouver ici.** | **Découvrir la boutique** |
| Commandes | **Aucune commande** | **Vos commandes apparaîtront ici après votre premier achat.** | **Découvrir la boutique** |
| Adresses | **Aucune adresse** | **Ajoutez une adresse pour vos livraisons.** | **Ajouter une adresse** |
| Recherche | **Aucun résultat** | **Essayez un autre mot-clé ou retirez un filtre.** | **Réinitialiser les filtres** |
| Admin — liste | **Aucun élément** | **Aucun élément ne correspond à ces filtres.** | **Réinitialiser les filtres** |
| Livreur | **Aucune livraison aujourd’hui** | **Les livraisons assignées apparaîtront ici.** | — |
| Notifications | **Aucune notification** | **Vous êtes à jour.** | — |

## 10. Formats

| Donnée | Format | Exemple |
|---|---|---|
| Prix | Nombre + espace insécable + `FCFA` | **25 000 FCFA** |
| Prix barré | `<s>` + « Prix initial » en SR-only | **<s>30 000 FCFA</s> 25 000 FCFA** |
| Devise API | ISO 4217, jamais affichée | `XAF` |
| Date courte | `j mois aaaa` abrégé | **15 janv. 2025** |
| Date longue | `j mois aaaa` | **15 janvier 2025** |
| Date relative | Aujourd’hui/hier + heure | **aujourd’hui à 14 h 30** |
| Heure | 24 h, `h` entouré d’espaces | **14 h 30** |
| Téléphone | 9 chiffres groupés, préfixe `+237` séparé | **+237 6 71 23 45 67** |
| Référence commande | `BRN-YYMM-XXXX` | **BRN-2511-0042** |
| Référence livraison | `LIV-YYMM-XXXX` | **LIV-2511-0017** |
| Pourcentage | Nombre + espace insécable + `%` | **-20 %** |
| Poids | Nombre + espace + `kg` | **0,8 kg** |
| Dimensions | `L × l × H` en cm | **30 × 20 × 12 cm** |

## 11. Ton et voix

- **Personne** : vouvoiement.
- **Voix** : active. « Nous avons annulé votre commande » plutôt que « La commande a été annulée ».
- **Phrases** : courtes, une idée par phrase.
- **Chiffres** : en chiffres pour les prix, quantités, dates et délais.
- **Émojis** : interdits dans l’interface, tolérés uniquement dans un message marketing validé.
- **Urgence** : ne jamais utiliser de faux compte à rebours ni de pression artificielle.
- **Excuses** : uniquement en cas de faute avérée, avec une action concrète.

## 12. Accessibilité des textes

- Chaque lien doit avoir un nom compréhensible hors contexte : « Voir la commande BRN-2511-0042 », pas « Voir ».
- Chaque bouton icône doit avoir un `aria-label`.
- Chaque image informative doit avoir un `alt` descriptif ; les images décoratives ont `alt=""`.
- Chaque message de statut doit être annoncé via `role="status"` ou `role="alert"`.
- Les erreurs ne reposent jamais sur la couleur seule : icône + texte.
- Les abréviations sont développées à la première occurrence (`FCFA` = franc CFA).
- Les textes ne sont pas justifiés ; alignement à gauche.

## 13. Contrôle avant maquette

- [ ] Chaque libellé existe dans ce glossaire.
- [ ] Aucune variante interdite n’est utilisée.
- [ ] Les statuts viennent des enums backend.
- [ ] Les prix, dates et téléphones respectent les formats.
- [ ] Les messages d’erreur sont sous le champ et reliés en ARIA.
- [ ] Les états vides ont un titre, un texte et une action.
- [ ] Les confirmations destructives nomment la conséquence.
- [ ] Aucune promesse absente du backend.
- [ ] Le texte tient à 200 % de zoom et à 320 px.
- [ ] Le texte est compréhensible sans les images.

## 14. Gouvernance

Toute nouvelle chaîne passe par ce glossaire avant d’entrer dans une spec ou une maquette. Une dérogation doit être écrite dans la spec de l’écran, avec une justification et une date. Le glossaire est versionné avec le Design System ; sa version majeure suit celle de `DESIGN-FREEZE.md`.
