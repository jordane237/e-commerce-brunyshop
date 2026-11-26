# Microtextes — DSG-05

> Source consolidée des libellés, messages d'erreur, statuts et confirmations. Les textes détaillés par écran restent dans chaque spec ; ce document sert de référence pour l'implémentation et la relecture.

---

## 1. Règles de ton

- Vouvoiement systématique, phrases courtes, pas de jargon technique.
- Les erreurs disent **ce qui s'est passé**, **ce qui n'a pas été fait**, **ce que l'utilisateur peut faire**.
- Jamais de « Erreur 500 », « null », « undefined », ni de message serveur brut.
- Les actions irréversibles sont nommées explicitement : « Supprimer définitivement ».
- Les succès sont sobres : pas d'exclamation, pas d'emoji.
- Les délais sont annoncés comme indicatifs dès qu'ils dépendent d'un tiers.
- Les montants sont en FCFA, sans décimale, avec espace insécable.
- Les dates sont au format « 10 novembre 2026 » ; les heures « 18 h ».

---

## 2. Libellés transverses

| Usage | Texte |
| --- | --- |
| Chargement | Chargement… |
| Réessayer | Réessayer |
| Annuler | Annuler |
| Enregistrer | Enregistrer |
| Fermer | Fermer |
| Retour | Retour |
| Continuer | Continuer |
| Confirmer | Confirmer |
| Supprimer | Supprimer |
| Modifier | Modifier |
| Voir le détail | Voir le détail |
| Page précédente | Page précédente |
| Page suivante | Page suivante |
| Aucun résultat | Aucun résultat |
| Champ obligatoire | Ce champ est obligatoire. |
| Session expirée | Votre session a expiré. Reconnectez-vous. |
| Réseau | Connexion interrompue. Vérifiez votre connexion puis réessayez. |
| Erreur générique | Une erreur est survenue. Réessayez. |
| Support | support@brunyshop.cm |

---

## 3. Par écran

### P14 — Connexion

| Emplacement | Texte |
| --- | --- |
| Titre | Connexion |
| Sous-titre | Retrouvez vos commandes, vos adresses et vos favoris. |
| Label identifiant | E-mail ou téléphone |
| Label mot de passe | Mot de passe |
| CTA | Se connecter |
| Lien | Mot de passe oublié ? |
| Lien inscription | Pas encore de compte ? Créer un compte |
| Erreur identifiants | E-mail, téléphone ou mot de passe incorrect. |
| Erreur 2FA | Saisissez le code à 6 chiffres. |
| Succès | Connexion réussie. |

### P15 — Inscription

| Emplacement | Texte |
| --- | --- |
| Titre | Créer un compte |
| Onglet e-mail | Avec mon e-mail |
| Onglet téléphone | Avec mon téléphone |
| CTA | Créer mon compte |
| CGV | J'accepte les conditions générales de vente. |
| Doublon | Si un compte existe déjà, vous recevrez un message pour vous connecter. |
| Succès | Votre compte est créé. Bienvenue chez BRUNY SHOPPING. |
| Erreur mot de passe | Votre mot de passe doit contenir au moins 10 caractères. |

### P16 — Mot de passe oublié

| Emplacement | Texte |
| --- | --- |
| Titre | Mot de passe oublié |
| Corps | Saisissez l'e-mail associé à votre compte. Nous vous enverrons un code de vérification. |
| CTA | Envoyer le code |
| Succès neutre | Si un compte existe avec cet e-mail, un code vous a été envoyé. |
| Erreur e-mail | Saisissez un e-mail valide. |

### P16b — Réinitialisation

| Emplacement | Texte |
| --- | --- |
| Titre | Nouveau mot de passe |
| Label code | Code à 6 chiffres |
| CTA | Définir mon mot de passe |
| Erreur code | Ce code n'est pas valide ou a expiré. |
| Succès | Votre mot de passe a été mis à jour. Vous pouvez vous connecter. |

### P17 — Tableau de bord

| Emplacement | Texte |
| --- | --- |
| Titre | Bonjour {prénom} |
| Sous-titre | Voici l'essentiel de votre compte. |
| Commande en cours | Commande en cours |
| CTA | Suivre ma commande |
| Aide | Besoin d'aide ? |
| Vide commandes | Votre première commande vous attend. |
| Déconnexion | Se déconnecter |

### P18 — Commandes

| Emplacement | Texte |
| --- | --- |
| Titre | Mes commandes |
| Compteur | {n} commande(s) |
| Filtres | Toutes · En cours · Livrées · Annulées |
| Vide | Vous n'avez pas encore de commande |
| Vide filtre | Aucune commande ne correspond à ce filtre. |
| CTA vide | Découvrir la boutique |
| Lien invité | Une commande passée sans compte ? Suivez-la avec votre référence. |

### P18b — Détail commande

| Emplacement | Texte |
| --- | --- |
| Titre | Commande {référence} |
| Timeline | Suivi de votre commande |
| Articles | Articles commandés |
| Adresse | Adresse de livraison |
| Récapitulatif | Récapitulatif |
| CTA | Suivre ma commande |
| CTA | Contacter le support |
| CTA | Recommander cette commande |
| Facture | Télécharger la facture — Disponible prochainement |
| Introuvable | Nous ne trouvons pas cette commande dans votre compte. |

### P19 — Profil

| Emplacement | Texte |
| --- | --- |
| Titre | Mon profil |
| Section | Informations personnelles |
| Aide | Toute modification devra être confirmée. |
| CTA | Enregistrer les modifications |
| Section | Mot de passe |
| CTA | Modifier mon mot de passe |
| 2FA | Double authentification — Bientôt disponible |
| Danger | Supprimer mon compte |
| Succès | Profil mis à jour. |
| Erreur 409 | Cette information est déjà associée à un autre compte. |

### P19b — Suppression de compte

| Emplacement | Texte |
| --- | --- |
| Titre | Supprimer mon compte |
| Alerte | Cette action est définitive. |
| Case | Je comprends les conséquences de la suppression. |
| CTA 1 | Continuer la suppression |
| Titre 2 | Confirmez votre identité |
| Label | Saisissez SUPPRIMER pour confirmer |
| CTA 2 | Supprimer définitivement mon compte |
| Dialog | Supprimer définitivement votre compte ? |
| Dialog corps | Cette action est irréversible. Vos commandes passées seront conservées de façon anonymisée. |
| Succès | Votre compte a été supprimé |
| Erreur commande | Une commande est en cours de livraison. Contactez-nous pour supprimer votre compte après réception. |

### P20 — Adresses

| Emplacement | Texte |
| --- | --- |
| Titre | Mes adresses |
| Badge | Par défaut |
| CTA | Ajouter une adresse |
| Aide | Un repère précis aide le coursier à vous trouver. |
| Vide | Aucune adresse enregistrée |
| Suppression | Supprimer cette adresse ? |
| Toast | Adresse supprimée. |

### P20b — Édition d'adresse

| Emplacement | Texte |
| --- | --- |
| Titre | Nouvelle adresse / Modifier l'adresse |
| Label | Nom de l'adresse |
| Choix | Maison · Bureau · Autre |
| Label | Ville · Quartier · Adresse · Point de repère · Téléphone de livraison |
| Aide repère | Indispensable pour que le coursier vous trouve. |
| Toggle | Utiliser comme adresse par défaut |
| CTA | Enregistrer l'adresse |
| Erreur repère | Ajoutez un point de repère : un commerce, un immeuble, une rue connue. |
| Toast | Adresse enregistrée. |

### P21 — Favoris

| Emplacement | Texte |
| --- | --- |
| Titre | Mes favoris |
| Action | Retirer {produit} des favoris |
| Toast | Produit retiré de vos favoris. |
| Vide | Votre liste de favoris est vide |
| Vide corps | Explorez le catalogue et enregistrez vos coups de cœur. |
| Badge | Épuisé |

### P22 — Contact

| Emplacement | Texte |
| --- | --- |
| Titre | Contactez-nous |
| Chapô | Une question, une commande, un retour ? Écrivez-nous, nous vous répondons sous 24 h ouvrées. |
| CTA | Envoyer le message |
| Succès | Message envoyé. Merci, nous vous répondrons sous 24 h ouvrées. |
| Erreur | Votre message n'a pas pu être envoyé. Réessayez ou écrivez à support@brunyshop.cm. |
| Aide | Pour une commande en cours, indiquez sa référence : nous répondrons plus vite. |

### P23 — FAQ

| Emplacement | Texte |
| --- | --- |
| Titre | Questions fréquentes |
| Recherche | Rechercher une question |
| Vide | Aucune question ne correspond à “{terme}”. |
| Bloc final | Vous ne trouvez pas votre réponse ? |
| CTA | Nous contacter |

### P24 — Livraison

| Emplacement | Texte |
| --- | --- |
| Titre | Livraison |
| Chapô | Nous livrons à Douala, Yaoundé, Bafoussam et dans plusieurs régions du Cameroun. |
| Note | Les délais sont indicatifs et courent à partir de la confirmation de votre commande. |
| Paiement | Vous réglez en espèces ou par Mobile Money au moment de la réception. |
| Hors zone | Ma ville n'est pas listée — Nous étudions les demandes de nouvelles zones. |

### P25 — Retours

| Emplacement | Texte |
| --- | --- |
| Titre | Retours et échanges |
| Chapô | Vous avez 7 jours après réception pour nous demander un retour ou un échange. |
| CTA | Demander un retour |
| Remboursement | Le remboursement est traité sous 7 jours ouvrés après réception du retour. |
| Non éligible | Le produit a été porté à l'extérieur ou endommagé. |

### P26 — À propos

| Emplacement | Texte |
| --- | --- |
| Titre | La bonne paire, au bon moment. |
| Signature | « Nous préférons une paire bien choisie à dix paires oubliées. » |
| CTA | Découvrir la boutique |

### P27 — Pages légales

| Emplacement | Texte |
| --- | --- |
| Titre | Mentions légales / Conditions générales de vente / Politique de confidentialité |
| Mise à jour | Dernière mise à jour : {date} |
| Sommaire | Sommaire |
| Aide | Une question sur cette page ? Écrivez-nous à support@brunyshop.cm. |
| Liens | Voir aussi : CGV · Politique de confidentialité |

### P27b–P27e — Erreurs

| Écran | Titre | Corps | CTA |
| --- | --- | --- | --- |
| 404 | Cette page est introuvable. | Le lien est peut-être ancien, ou la page a changé d'adresse. | Retour à la boutique |
| 500 | Un problème est survenu. | Nous n'avons pas pu afficher cette page. Votre commande n'est pas affectée. | Réessayer |
| Hors ligne | Pas de connexion. | Certaines pages déjà ouvertes restent consultables. Le panier sera conservé sur cet appareil. | Réessayer |
| Maintenance | Nous revenons très vite. | Le site est en maintenance pour améliorer votre expérience. Merci de votre patience. | Nous contacter |

---

## 4. Messages de validation transverses

| Cas | Texte |
| --- | --- |
| E-mail vide | Saisissez votre e-mail. |
| E-mail invalide | Saisissez un e-mail valide. |
| Téléphone invalide | Saisissez un numéro camerounais à 9 chiffres après +237. |
| Mot de passe vide | Saisissez votre mot de passe. |
| Mot de passe trop court | Votre mot de passe doit contenir au moins 10 caractères. |
| Mots de passe différents | Les deux mots de passe ne correspondent pas. |
| Code invalide | Ce code n'est pas valide. Vérifiez les 6 chiffres reçus. |
| Code expiré | Ce code a expiré. Demandez un nouveau code. |
| Champ requis | Ce champ est obligatoire. |
| Texte trop long | Votre message dépasse la longueur autorisée. |
| Consentement | Vous devez accepter pour continuer. |

---

## 5. Statuts de commande

| Statut technique | Libellé | Message d'aide |
| --- | --- | --- |
| `PENDING_CONFIRMATION` | En attente de confirmation | Nous vous appelons pour confirmer votre commande. |
| `AWAITING_PAYMENT` | En attente de paiement | Le paiement sera demandé à la livraison. |
| `CONFIRMED` | Confirmée | Votre commande est confirmée. |
| `PAID` | Payée | Votre paiement est enregistré. |
| `PREPARING` | En préparation | Nous préparons votre colis. |
| `SHIPPED` | Expédiée | Votre colis est en route. |
| `DELIVERED` | Livrée | Votre commande a été livrée. |
| `DELIVERY_FAILED` | Livraison échouée | Nous n'avons pas pu livrer. Contactez-nous. |
| `CANCELLED` | Annulée | Cette commande a été annulée. |
| `RETURN_REQUESTED` | Retour demandé | Votre demande de retour est en cours d'examen. |
| `RETURNED` | Retournée | Nous avons reçu votre retour. |
| `REFUNDED` | Remboursée | Votre remboursement a été effectué. |
| `EXCHANGED` | Échangée | Votre échange a été traité. |

---

## 6. Règles de format

- Prix : `15 000 FCFA`, espace insécable, jamais `15,000` ni `15000`.
- Téléphone : `+237 6 12 34 56 78` à l'affichage, `+237612345678` en payload.
- Référence : `BRN-2611-7K3F`, copiable, jamais tronquée.
- Date : `10 novembre 2026` ; date courte `10 nov. 2026`.
- Heure : `18 h`, `8 h 30`.
- Pourcentage : `-10 %`, espace avant `%`.
