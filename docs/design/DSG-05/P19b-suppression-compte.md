# P19b — Suppression de compte

> DSG-05 · groupe Compte · route `/compte/supprimer`
> Endpoint à créer : `DELETE /me` (mot de passe + code de vérification).
> **Critère d'acceptation #4** : confirmation claire, conséquences expliquées, double étape, saisie `SUPPRIMER`.

---

## 1. Objectif & rôle

Permettre une suppression volontaire, définitive et comprise. L'écran doit empêcher les suppressions accidentelles, expliquer ce qui est conservé pour des raisons légales, et confirmer explicitement la fin de l'opération.

---

## 2. Wireframe textuel par breakpoint

### 360 px — étape 1, conséquences

1. Header + fil d'Ariane « Accueil › Mon compte › Supprimer mon compte ».
2. `h1` « Supprimer mon compte ».
3. `Alert danger` : « Cette action est définitive. »
4. Liste des conséquences :
   - profil, adresses et favoris supprimés ;
   - connexion impossible ;
   - commandes passées conservées pour obligations comptables, avec données personnelles anonymisées ;
   - aucun retour en arrière possible.
5. Lien « Télécharger mes données » (V2, désactivé).
6. Case « Je comprends les conséquences ».
7. Bouton danger « Continuer la suppression », désactivé tant que la case n'est pas cochée.
8. Lien « Annuler et revenir à mon compte ».

### 360 px — étape 2, vérification

1. Stepper 1/2.
2. Rappel : « Confirmez votre identité. »
3. Champ mot de passe actuel.
4. Champ code à 6 chiffres envoyé par e-mail (ou SMS si disponible).
5. Bouton « Renvoyer le code » avec compte à rebours 60 s.
6. Champ texte « Saisissez SUPPRIMER pour confirmer ».
7. Bouton danger « Supprimer définitivement mon compte », désactivé tant que les trois conditions ne sont pas remplies.

### 360 px — étape 3, confirmation

1. Coche ou icône neutre.
2. « Votre compte a été supprimé. »
3. « Vos commandes passées restent disponibles dans notre historique pour des raisons légales. »
4. CTA « Retour à la boutique ».
5. Aucune reconnexion possible.

### 768 / 1280 px

- Carte centrée 560 px pour les étapes 1 et 2 ; 480 px pour l'étape 3.
- Stepper horizontal au-dessus.
- Aucune sidebar : parcours focalisé, comme le checkout.
- `ConfirmDialog` s'ouvre après l'étape 2, avant l'appel final.

```text
┌──────────────────────────────────────────────┐
│  BRUNY SHOPPING                              │
├──────────────────────────────────────────────┤
│  ① Conséquences ─ ② Vérification ─ ③ Fini    │
│  Supprimer mon compte                        │
│  ⚠ Action définitive                         │
│  • Profil, adresses, favoris supprimés       │
│  • Commandes conservées (obligations légales)│
│  ☐ Je comprends les conséquences             │
│  [ Continuer la suppression ]  Annuler       │
└──────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `Stepper` | NOUVEAU | 2–3 étapes | actif, done |
| `Alert` | NOUVEAU | danger | — |
| `Checkbox` | TEC-10 | — | coché, décoché |
| `Input` | TEC-10 | password, text numeric | normal, error |
| `Button` | TEC-10 | danger, ghost | normal, loading, disabled |
| `ConfirmDialog` | NOUVEAU | danger | ouvert / fermé |
| `Toast` | TEC-10 | error | — |

### 3.1 Spécification `ConfirmDialog`

| Élément | Valeur |
| --- | --- |
| Rôle | `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| Focus initial | Bouton « Annuler » (jamais « Supprimer ») |
| Focus trap | Cyclique entre les deux boutons |
| Échap | Ferme sans supprimer |
| Backdrop | Ferme sans supprimer |
| Libellé | « Supprimer définitivement votre compte ? » |
| Description | « Cette action est irréversible. Vos commandes passées seront conservées de façon anonymisée. » |
| Actions | « Annuler » (secondaire), « Supprimer définitivement » (danger) |
| Après confirmation | Appel `DELETE /me`, bouton `loading`, dialog non fermable |

---

## 4. États obligatoires

- **Chargement** : envoi du code, vérification, suppression ; boutons `loading`, formulaires désactivés.
- **Vide** : aucun code demandé, case non cochée, champ `SUPPRIMER` vide.
- **Erreur** : code invalide/expiré, mot de passe incorrect, 429, réseau, 409 (commande en cours).
- **Succès** : étape 3, session effacée, redirection uniquement via le CTA.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Case non cochée | « Cochez la case pour continuer. » |
| Mot de passe vide | « Saisissez votre mot de passe actuel. » |
| Mot de passe incorrect | « Votre mot de passe n'est pas correct. » |
| Code vide | « Saisissez le code à 6 chiffres. » |
| Code invalide | « Ce code n'est pas valide. Vérifiez les 6 chiffres reçus. » |
| Code expiré | « Ce code a expiré. Demandez un nouveau code. » |
| `SUPPRIMER` incorrect | « Saisissez SUPPRIMER en majuscules pour confirmer. » |
| Commande en cours (409) | « Une commande est en cours de livraison. Contactez-nous pour supprimer votre compte après réception. » |
| Trop de tentatives | « Trop de tentatives. Patientez 10 minutes. » |
| Réseau | « La suppression n'a pas abouti. Votre compte est intact. Réessayez. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Supprimer mon compte | neutre | `h1` |
| Alerte | Cette action est définitive. | clair | `role="alert"` |
| Conséquence 1 | Votre profil, vos adresses et vos favoris seront supprimés. | clair | liste |
| Conséquence 2 | Vous ne pourrez plus vous connecter avec ces informations. | clair | liste |
| Conséquence 3 | Vos commandes passées sont conservées pour nos obligations comptables, avec vos données personnelles anonymisées. | juridique | liste |
| Conséquence 4 | La suppression est immédiate et irréversible. | clair | liste |
| Case | Je comprends les conséquences de la suppression. | clair | — |
| CTA étape 1 | Continuer la suppression | action | — |
| Annuler | Annuler et revenir à mon compte | action | — |
| Étape 2 titre | Confirmez votre identité | neutre | `h2` |
| Label mot de passe | Mot de passe actuel * | neutre | — |
| Label code | Code à 6 chiffres * | neutre | — |
| Renvoi | Renvoyer le code | action | — |
| Label confirmation | Saisissez SUPPRIMER pour confirmer * | clair | — |
| Aide confirmation | Le mot doit être écrit en majuscules, sans espace. | aide | — |
| CTA étape 2 | Supprimer définitivement mon compte | danger | — |
| Dialog titre | Supprimer définitivement votre compte ? | clair | `alertdialog` |
| Dialog corps | Cette action est irréversible. Vos commandes passées seront conservées de façon anonymisée. | clair | — |
| Dialog annuler | Annuler | action | focus initial |
| Dialog confirmer | Supprimer définitivement | danger | — |
| Succès titre | Votre compte a été supprimé | neutre | `role="status"` |
| Succès corps | Vos commandes passées restent disponibles dans notre historique pour des raisons légales. | juridique | — |
| Succès CTA | Retour à la boutique | action | — |

---

## 6. Interactions & comportements

- Étape 1 : case obligatoire, bouton désactivé sinon.
- Étape 2 : mot de passe + code + saisie exacte `SUPPRIMER` (sensible à la casse, sans espace).
- Code envoyé à la demande, valable quelques minutes, usage unique.
- `ConfirmDialog` avant l'appel final ; focus sur « Annuler ».
- Pendant l'appel : dialog bloqué, bouton `loading`, aucun double envoi.
- Succès : `SessionService.clear()`, purge du panier local, redirection manuelle uniquement.
- Échec : le compte reste intact, message explicite, aucun état partiel.
- Retour navigateur après succès : P19b affiche l'état final, pas le formulaire.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, stepper `aria-current="step"`.
- Liste des conséquences en `<ul>`, lisible par lecteur d'écran.
- Case 44 px, label cliquable, erreur liée.
- Confirmation textuelle : `autocomplete="off"`, `spellcheck="false"`, `aria-describedby`.
- `ConfirmDialog` : `role="alertdialog"`, focus trap, focus initial sur « Annuler », Échap ferme, restitution du focus.
- Erreurs : `role="alert"`, focus sur le message.
- Succès : `role="status"`, focus sur le titre.
- Contraste danger AA, aucune information par la couleur seule.
- Aucune limite de temps sur la saisie ; seul le code expire.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Envoi du code | `POST /me/deletion-code` **à créer** | Erreur + WhatsApp |
| Suppression | `DELETE /me` **à créer** | Erreur, compte intact |

Requête attendue : `{ password, code, confirmation: "SUPPRIMER" }`.
Réponse : `204` ou `{ ok: true, anonymized: true }`.

Traitement backend attendu : `deletedAt`, anonymisation de `firstName`, `lastName`, `email`, `phone`, conservation des commandes.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucune maquette | Conçu intégralement |
| `DELETE /me` absent | Dépendance backend bloquante |
| Double étape demandée | Mot de passe + code + saisie |
| Commandes conservées | Anonymisation, jamais suppression |
| 2FA | Non utilisée pour cette confirmation en MVP |

---

## 10. Wireframe de référence

Aucun fichier dédié. À produire : ce document + `ConfirmDialog` dans `COMPOSANTS-REQUIS.md`.
