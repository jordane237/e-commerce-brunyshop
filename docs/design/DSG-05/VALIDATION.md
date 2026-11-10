# Validation — DSG-05

> **Document signable.** La signature vaut autorisation de passer à l'implémentation. Sans signature, aucune story d'implémentation ne doit être lancée.

---

## 1. Périmètre soumis

| Réf. | Écran | Fichier | Statut spec |
| --- | --- | --- | --- |
| P14 | Connexion | `P14-connexion.md` | À valider |
| P15 | Inscription | `P15-inscription.md` | À valider |
| P16 | Mot de passe oublié | `P16-mot-de-passe-oublie.md` | À valider |
| P16b | Réinitialisation | `P16b-reinitialisation-mot-de-passe.md` | À valider |
| P17 | Tableau de bord | `P17-tableau-de-bord-compte.md` | À valider |
| P18 | Commandes | `P18-commandes.md` | À valider |
| P18b | Détail commande | `P18b-detail-commande.md` | À valider |
| P19 | Profil | `P19-profil.md` | À valider |
| P19b | Suppression de compte | `P19b-suppression-compte.md` | À valider |
| P20 | Adresses | `P20-adresses.md` | À valider |
| P20b | Édition adresse | `P20b-edition-adresse.md` | À valider |
| P21 | Favoris | `P21-favoris.md` | À valider |
| P22 | Contact | `P22-contact.md` | À valider |
| P23 | FAQ | `P23-faq.md` | À valider |
| P24 | Livraison | `P24-livraison.md` | À valider |
| P25 | Retours | `P25-retours.md` | À valider |
| P26 | À propos | `P26-a-propos.md` | À valider |
| P27 | Pages légales | `P27-pages-legales.md` | À valider |
| P27b | 404 | `P27b-erreur-404.md` | À valider |
| P27c | 500 | `P27c-erreur-500.md` | À valider |
| P27d | Hors ligne | `P27d-hors-ligne.md` | À valider |
| P27e | Maintenance | `P27e-maintenance.md` | À valider |

---

## 2. Checklist par écran

Chaque ligne doit être cochée pour **tous** les écrans :

- [ ] Les 10 sections sont présentes et renseignées.
- [ ] Les wireframes 360 / 768 / 1280 px sont décrits.
- [ ] Les 4 états (chargement, vide, erreur, succès) sont spécifiés.
- [ ] Les microtextes sont en français, sans texte provisoire.
- [ ] Les interactions et redirections sont explicites.
- [ ] Les critères WCAG 2.1 AA sont listés.
- [ ] Les endpoints existants sont distingués des endpoints à créer.
- [ ] Les écarts avec la maquette sont documentés.
- [ ] La référence visuelle est indiquée.

### Checklist spécifique

- [ ] **P14** : `identifier`, pas de distinction e-mail/téléphone à l'écran ; 2FA conditionnelle.
- [ ] **P15** : CGV `1.0`, doublon neutre, pas de règle majuscule/chiffre.
- [ ] **P16** : e-mail uniquement, succès neutre.
- [ ] **P16b** : e-mail + code 6 chiffres, pas de route `/:token`.
- [ ] **P17** : compteurs issus de l'API, pas de faux zéro.
- [ ] **P18** : filtres alignés sur `OrderStatus`, URL synchronisée.
- [ ] **P18b** : commande d'un autre compte → message neutre.
- [ ] **P19** : `PATCH /me` et `POST /me/password` documentés comme manquants.
- [ ] **P19b** : double confirmation, saisie `SUPPRIMER`, `ConfirmDialog` avec focus sur « Annuler ».
- [ ] **P20** : `isDefault` documenté comme manquant.
- [ ] **P20b** : repère obligatoire, téléphone +237.
- [ ] **P21** : retrait optimiste avec annulation.
- [ ] **P22** : fallback mailto, CAPTCHA inactif.
- [ ] **P23** : 18 Q/R dans `CONTENUS.md`.
- [ ] **P24** : zones et tarifs alignés sur le seed.
- [ ] **P25** : 7 jours, conditions claires, pas de portail fictif.
- [ ] **P26** : aucun chiffre ou fait non vérifié.
- [ ] **P27** : identité légale injectée, jamais inventée.
- [ ] **P27b–e** : aucun détail technique exposé.

---

## 3. Checklist microtextes

- [ ] Tous les libellés sont en français.
- [ ] Aucun texte de remplissage ni marqueur de travail inachevé.
- [ ] Les messages d'erreur disent quoi faire.
- [ ] Les actions destructives sont nommées explicitement.
- [ ] Les montants sont en FCFA avec espace insécable.
- [ ] Les téléphones sont au format `+237` à l'affichage et en payload.
- [ ] Les statuts sont libellés en français, jamais le code technique.
- [ ] Les textes sont cohérents avec `MICROTEXTES.md`.

---

## 4. Checklist contenus

- [ ] FAQ : 18 questions/réponses, catégories cohérentes.
- [ ] Livraison : 5 zones, tarifs et délais exacts.
- [ ] Retours : conditions, procédure, remboursement.
- [ ] À propos : récit sans fait inventé.
- [ ] Mentions légales : sections obligatoires présentes.
- [ ] CGV : 12 articles, version 1.0.
- [ ] Confidentialité : finalités, durées, droits, cookies.
- [ ] Les variables `{{legal.*}}` sont documentées et résolues avant publication.

---

## 5. Checklist accessibilité

- [ ] Un seul `h1` par page, hiérarchie de titres cohérente.
- [ ] Tous les champs ont un label lié.
- [ ] Les erreurs sont associées aux champs (`aria-describedby`, `aria-invalid`).
- [ ] Les composants interactifs sont utilisables au clavier.
- [ ] Le focus est visible et l'ordre de tabulation logique.
- [ ] `ConfirmDialog` : `role="alertdialog"`, focus trap, focus initial sur « Annuler ».
- [ ] Les informations ne reposent jamais sur la couleur seule.
- [ ] Les cibles tactiles font au moins 44 px.
- [ ] Le contraste atteint AA.
- [ ] Le zoom 200 % ne casse aucune mise en page.
- [ ] Les animations respectent `prefers-reduced-motion`.

---

## 6. Checklist cohérence

- [ ] Les routes correspondent à `CARTOGRAPHIE.md`.
- [ ] Les endpoints existants sont ceux du backend réel.
- [ ] Les endpoints manquants sont listés, pas inventés.
- [ ] Les statuts utilisés existent dans `OrderStatus`.
- [ ] Les tarifs de livraison correspondent au seed.
- [ ] Les composants réutilisent `libs/ui` quand ils existent.
- [ ] Aucun composant `Tabs` n'est supposé exister.
- [ ] Aucune promesse de facture PDF, de 2FA ou de Cercle Prestige en MVP.
- [ ] La suppression de compte ne promet pas l'effacement des commandes.

---

## 7. Points ouverts à trancher avant signature

| # | Point | Décision proposée | Propriétaire |
| --- | --- | --- | --- |
| 1 | `Address.isDefault` absent | Migration Prisma recommandée | Backend |
| 2 | `PATCH /me` absent | À créer avant P19 | Backend |
| 3 | `DELETE /me` absent | À créer avant P19b | Backend |
| 4 | Commandes, adresses, favoris, contact, zones | APIs à créer | Backend |
| 5 | Délai de retour de 7 jours | À valider par l'exploitation | Produit |
| 6 | Frais de retour | À la charge du client sauf erreur BRUNY | Produit |
| 7 | Numéro WhatsApp support | À fournir et configurer | Exploitation |
| 8 | Identité légale (`legal.ts`) | À fournir avant publication | Juridique |
| 9 | CAPTCHA | Inactif tant que non disponible | Backend |
| 10 | DSG-04 affiche Yaoundé à 2 000 FCFA | Aligner sur 3 000 | Design |

---

## 8. Signature

| Rôle | Nom | Décision | Date |
| --- | --- | --- | --- |
| Product Owner | | ☐ Validé ☐ Validé avec réserves ☐ Refusé | |
| Design Lead | | ☐ Validé ☐ Validé avec réserves ☐ Refusé | |
| Tech Lead | | ☐ Validé ☐ Validé avec réserves ☐ Refusé | |
| Accessibilité | | ☐ Validé ☐ Validé avec réserves ☐ Refusé | |

**Réserves / commentaires :**

```text

```

**Condition de levée** : les points ouverts 1 à 4 doivent être planifiés avant l'implémentation des écrans concernés ; les points 5 à 8 doivent être tranchés avant la mise en production.

---

## 9. Définition de terminé (design)

- [ ] Les 22 specs sont présentes dans `docs/design/DSG-05/`.
- [ ] `CONTENUS.md`, `COMPOSANTS-REQUIS.md`, `MICROTEXTES.md`, `PROTOTYPE.md` et `CARTOGRAPHIE.md` sont présents.
- [ ] Les 20 scénarios du prototype sont documentés.
- [ ] Les vérifications de forme (prettier, absence de texte provisoire) passent.
- [ ] Le commit unique est créé sur la branche DSG-05.
- [ ] Ce document est signé.
