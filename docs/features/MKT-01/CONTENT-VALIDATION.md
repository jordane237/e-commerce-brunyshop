# MKT-01 — Validation des contenus

> Statut global : **contenus transcrits, non validés pour la production**.
> Ce document liste la provenance de chaque texte et les points qui doivent être
> approuvés par le propriétaire puis, pour les pages légales, par un juriste.

---

## 1. Sources utilisées

| Contenu | Source | Statut de la source |
| --- | --- | --- |
| Textes des pages P23–P27 | `docs/design/DSG-05/CONTENUS.md` | Rédigés, non signés |
| Microtextes et ton | `docs/design/DSG-05/MICROTEXTES.md`, `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md` | Référence éditoriale |
| Identité légale | `apps/storefront/src/app/core/legal.ts` | Partielle : CNT-03 absent |
| Guide des pointures | `backend/prisma/seeds/size-guides.seed.ts` (CAT-06) | À valider par le propriétaire (CNT-02) |
| Zones et frais de livraison | `docs/design/DSG-05/P24-livraison.md`, seed P24 | Valeurs de référence, endpoint absent |
| Turnstile | `docs/security/CAPTCHA.md`, MKT-02 | Implémentation réelle côté backend et formulaire contact |
| Page contact P22 | `docs/design/DSG-05/P22-contact.md`, `docs/features/MKT-02/` | Livrée ; coordonnées directes encore provisoires |

Aucun texte n’a été inventé pour combler un manque : les informations d’identification
inconnues restent des placeholders explicites.

---

## 2. Statut par page

| Page | Contenu | Validation propriétaire | Validation juridique | Observations |
| --- | --- | --- | --- | --- |
| À propos | P26 / CONTENUS §4 | ☐ À faire | Sans objet | Aucune date, aucun chiffre, aucun nom de fondatrice inventé |
| FAQ | P23 / CONTENUS §1 | ☐ À faire | Sans objet | 18 Q/R, prix et délais alignés sur le seed |
| Livraison | P24 / CONTENUS §2 | ☐ À faire | Sans objet | Frais et délais indicatifs ; endpoint `GET /delivery-zones` absent |
| Retours et échanges | P25 / CONTENUS §3 | ☐ À faire | ☐ À faire | Délai de 7 jours et frais de retour à confirmer |
| Guide des tailles | CAT-06 / CONTENUS | ☐ À faire (CNT-02) | Sans objet | Tables EU/US/UK/cm recopiées du seed |
| CGV | P27 / CONTENUS §6 | ☐ À faire | ☐ À faire | Version 1.0, 10 novembre 2026 |
| Confidentialité | P27 / CONTENUS §7 | ☐ À faire | ☐ À faire | Section Turnstile ajoutée depuis `docs/security/CAPTCHA.md` |
| Mentions légales | P27 / CONTENUS §5 | ☐ À faire | ☐ À faire | 6 champs d’identité manquants |
| Contact | P22 / MKT-02 | ☐ À faire | Sans objet | Formulaire livré ; WhatsApp et téléphone sont des placeholders |

Les cases ne peuvent être cochées que par les personnes habilitées ; le dépôt ne contient
aucune signature ni validation formelle à ce jour.

---

## 3. Informations légales manquantes (CNT-03)

Les valeurs suivantes valent `[À fournir par le propriétaire]` dans
`frontend/apps/storefront/src/app/core/legal.ts` :

- adresse du siège ;
- téléphone ;
- numéro de contribuable ;
- registre du commerce (RCCM) ;
- directeur de la publication ;
- nom, adresse et contact de l’hébergeur.

La raison sociale `BRUNY SHOPPING SARL` et la ville `Douala` sont les seules valeurs
d’identification renseignées ; elles doivent elles aussi être confirmées.

Avant production :

1. compléter `legal.ts` avec les valeurs validées ;
2. supprimer le bloc `.legal-pending` et les styles de placeholder des mentions légales ;
3. faire relire les trois pages légales par un juriste ;
4. vérifier la cohérence avec la version CGV acceptée à l’inscription (`termsVersion` 1.0).

---

## 4. Points juridiques ouverts

| Point | Emplacement | Décision actuelle | À trancher |
| --- | --- | --- | --- |
| Délai de retour | Retours, CGV art. 7 | 7 jours après réception | Le brief ne fixait aucun délai |
| Frais de retour | Retours, CGV art. 8 | À la charge du client sauf erreur BRUNY | À confirmer |
| Produits soldés | Retours | Non exclus explicitement | Validation juridique demandée par P25 |
| Moyen de remboursement | Retours, CGV art. 8 | « selon le moyen de paiement utilisé » | Mobile Money à confirmer |
| Paiement à la livraison | Livraison, CGV art. 5 | Espèces ou Mobile Money | Exploitation à confirmer |
| Cookies de mesure d’audience | Confidentialité, Mentions | Consentement requis s’ils sont ajoutés | Aucun outil d’analytics installé |
| Transferts hors Cameroun | Confidentialité | Garanties appropriées | Prestataires non finalisés |

---

## 5. Contenus dynamiques non disponibles

- **Contact P22** : la page `/contact` et l’endpoint `POST /api/v1/contact` sont livrés.
  Le header, le footer et le layout légal pointent vers la page. Certains CTA des pages
  info conservent un `mailto:support@brunyshop.cm` avec sujet prérempli, car la page
  contact ne préremplit pas encore le sujet depuis l’URL.
- **Coordonnées directes** : le téléphone et le WhatsApp affichés sur `/contact` sont des
  placeholders (`+237600000000`). Ils doivent être remplacés par les numéros réels avant
  toute mise en production.
- **Suivi de commande P13** : la page n’existe pas. Les pages Livraison et Retours
  invitent à écrire au support avec la référence.
- **Zones de livraison** : `GET /delivery-zones` n’existe pas ; le tableau reprend les
  cinq zones du seed et le mentionne comme indicatif.
- **Préremplissage de la référence de commande** : impossible sans session de commande
  sur ces pages publiques.
- **Recherche FAQ** : reportée ; les questions restent accessibles par catégorie.

---

## 6. Exactitude des informations sensibles

- Les prix de livraison et les délais proviennent du seed P24 ; ils ne doivent pas être
  présentés comme contractuels tant que le checkout ne les recalcule pas.
- Le guide des tailles reprend les tables CAT-06 sans modification. Une erreur de
  correspondance aurait un impact direct sur les échanges : la validation CNT-02 est
  bloquante avant production.
- La section Turnstile décrit uniquement ce qui est réellement déployé : le widget est
  actif sur la connexion administrateur et sur le formulaire de contact public. Les autres
  formulaires client ne sont pas encore protégés. Cette nuance est volontaire et ne doit
  pas être supprimée.

---

## 7. Checklist avant mise en production

- [ ] Valider chaque page avec le propriétaire (contenu, prix, délais, ton).
- [ ] Valider CGV, Confidentialité et Mentions légales avec un juriste.
- [ ] Renseigner les six champs CNT-03 et retirer les placeholders visibles.
- [ ] Valider les tables de pointures (CNT-02).
- [ ] Confirmer le délai de retour, les frais de retour et le traitement des soldes.
- [ ] Confirmer les moyens de paiement à la livraison.
- [x] Livrer la page Contact P22 et l’endpoint public.
- [ ] Remplacer le téléphone et le WhatsApp provisoires de `/contact` par les coordonnées validées.
- [ ] Décider quels CTA `mailto` des pages info basculent vers `/contact`.
- [ ] Remplacer le renvoi e-mail par la page de suivi lorsque P13 sera livrée.
- [ ] Brancher `GET /delivery-zones` et retirer la mention « tarifs indicatifs ».
- [ ] Mettre à jour `sitemap.xml` avec les URL produit générées côté serveur.
- [ ] Exécuter un audit Lighthouse et une vérification lecteur d’écran.
