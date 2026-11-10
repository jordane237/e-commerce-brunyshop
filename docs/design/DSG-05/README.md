# DSG-05 — Compte client, informations et pages d'erreur

> Spécifications de design pour les écrans **P14 à P27e**.
> Ticket **design uniquement** : aucun composant Angular, aucun endpoint backend, aucune migration.

---

## 1. Contenu du dossier

| Fichier | Rôle |
| --- | --- |
| `ANALYSE-EXISTANT.md` | Analyse de la planche, du design system et de l'existant ; 25 incohérences |
| `CARTOGRAPHIE.md` | Routes, guards, shells, endpoints existants et manquants |
| `P14-connexion.md` | Connexion |
| `P15-inscription.md` | Inscription |
| `P16-mot-de-passe-oublie.md` | Demande de réinitialisation |
| `P16b-reinitialisation-mot-de-passe.md` | Saisie du code et nouveau mot de passe |
| `P17-tableau-de-bord-compte.md` | Tableau de bord |
| `P18-commandes.md` | Liste des commandes |
| `P18b-detail-commande.md` | Détail d'une commande |
| `P19-profil.md` | Profil et mot de passe |
| `P19b-suppression-compte.md` | Suppression de compte |
| `P20-adresses.md` | Liste des adresses |
| `P20b-edition-adresse.md` | Création / édition d'adresse |
| `P21-favoris.md` | Favoris |
| `P22-contact.md` | Contact |
| `P23-faq.md` | FAQ |
| `P24-livraison.md` | Livraison |
| `P25-retours.md` | Retours et échanges |
| `P26-a-propos.md` | À propos |
| `P27-pages-legales.md` | Mentions légales, CGV, confidentialité |
| `P27b-erreur-404.md` | Page introuvable |
| `P27c-erreur-500.md` | Erreur serveur |
| `P27d-hors-ligne.md` | Hors ligne |
| `P27e-maintenance.md` | Maintenance |
| `CONTENUS.md` | FAQ 18 Q/R, livraison, retours, à propos, mentions, CGV, confidentialité |
| `COMPOSANTS-REQUIS.md` | 17 composants à créer ou étendre |
| `MICROTEXTES.md` | Libellés, erreurs, statuts, formats |
| `PROTOTYPE.md` | Option B : Mermaid, wireframes, 20 scénarios |
| `VALIDATION.md` | Checklist signable, points ouverts, signature |

---

## 2. Structure d'une spec

Chaque fichier `PXX` suit le même gabarit en 10 sections :

1. Objectif & rôle
2. Wireframe textuel par breakpoint (360 / 768 / 1280)
3. Composants utilisés
4. États obligatoires (chargement, vide, erreur, succès)
5. Microtextes FR
6. Interactions & comportements
7. Accessibilité (WCAG 2.1 AA)
8. Données API nécessaires
9. Écarts / points à valider
10. Wireframe de référence

---

## 3. Décisions structurantes

- **Auth alignée sur l'API réelle** : `identifier`, e-mail seul pour l'oubli, code à 6 chiffres pour la réinitialisation, pas de route `/:token`.
- **Endpoints manquants documentés, jamais inventés** : `PATCH /me`, `DELETE /me`, adresses, favoris, commandes, contact, zones.
- **Suppression de compte** : conséquences explicites, case de compréhension, mot de passe + code + saisie `SUPPRIMER`, `ConfirmDialog` avec focus initial sur « Annuler », message final.
- **Navigation compte** : sidebar ≥ 1024 px, onglets en 768 px, liste verticale en 360 px.
- **Aucune promesse hors périmètre** : facture PDF, 2FA, Cercle Prestige, photo de profil et CAPTCHA sont soit V2, soit désactivés.
- **Zones de livraison** : alignées sur `delivery-zones.seed.ts` (Douala Centre 1 500 / 1 j, Douala Périphérie 2 500 / 2 j, Yaoundé 3 000 / 3 j, Bafoussam 4 000 / 4 j, Autres régions 5 000 / 5 j).
- **Prototype Option B** : Mermaid + wireframes ASCII + 20 scénarios, faute d'outil de prototypage.

---

## 4. Dépendances backend

| Fonctionnalité | Endpoint | Écrans |
| --- | --- | --- |
| Profil | `PATCH /me` | P19 |
| Mot de passe | `POST /me/password` | P19 |
| Suppression | `POST /me/deletion-code`, `DELETE /me` | P19b |
| Commandes | `GET /orders`, `GET /orders/:reference` | P17, P18, P18b |
| Adresses | `GET/POST/PATCH/DELETE /addresses` | P17, P20, P20b |
| Favoris | `GET /wishlist`, `DELETE /wishlist/:productId` | P17, P21 |
| Contact | `POST /contact` | P22 |
| Zones | `GET /delivery-zones` | P20b, P24 |

Les endpoints `POST /auth/*` et `GET /me` existent déjà.

---

## 5. Prochaines étapes

1. Faire signer `VALIDATION.md`.
2. Trancher les points ouverts (notamment `isDefault`, les APIs compte et le délai de retour).
3. Découper l'implémentation par lot : auth, compte, informations, erreurs.
4. Créer les composants listés dans `COMPOSANTS-REQUIS.md` avant les pages.
5. Aligner DSG-04 sur les tarifs de livraison du seed.
