# CNT-03 — Analyse du design (maquettes P22-P27 et P01)

## Maquettes localisées

| Maquette | Fichier source | Route | Contenu |
|----------|----------------|-------|---------|
| P22 Contact | `docs/design/DSG-05/P22-contact.md` | `/contact` | Formulaire, canaux, horaires, FAQ courte |
| P23 FAQ | `docs/design/DSG-05/P23-faq.md` | `/faq` | 18 Q/R, recherche, catégories, accordéon |
| P24 Livraison | `docs/design/DSG-05/P24-livraison.md` | `/livraison` | Tableau zones, 4 étapes, paiement à la livraison, suivi, hors zone |
| P25 Retours | `docs/design/DSG-05/P25-retours.md` | `/retours` | Éligibilité, procédure 4 étapes, échange taille, remboursement |
| P26 À propos | `docs/design/DSG-05/P26-a-propos.md` | `/a-propos` | Hero, histoire, sélection, travail, engagements, signature |
| P27 Légales | `docs/design/DSG-05/P27-pages-legales.md` | `/mentions-legales`, `/cgv`, `/confidentialite` | Structure commune, sommaire, sections, liens croisés |
| P01 Home | CAT-07 ReassuranceBand | `/` | 4 points de réassurance, hero, sections |

## Microtextes validés extraits

### P24 — Livraison
- Titre : "Livraison"
- Chapô : "Nous livrons à Douala, Yaoundé, Bafoussam et dans plusieurs régions du Cameroun."
- Tableau : Zone / Délai indicatif / Frais de livraison
- Zones : Douala Centre, Douala Périphérie, Yaoundé, Bafoussam, Autres régions
- Délais : 1 jour, 2 jours, 3 jours, 4 jours, 5 jours ouvrés
- Frais : 1 500, 2 500, 3 000, 4 000, 5 000 FCFA
- Étapes : commande → confirmation → préparation → livraison
- Paiement à la livraison : espèces ou Mobile Money au moment de la réception
- Hors zone : "Écrivez-nous : nous étudions les demandes de nouvelles zones."

### P25 — Retours et échanges
- Titre : "Retours et échanges"
- Chapô : "Un problème de taille ou de produit ? Vous avez 7 jours après réception pour nous demander un retour ou un échange."
- L'essentiel : 7 jours après réception, produit non porté, emballage et étiquettes conservés, preuve d'achat
- Éligible : état d'origine, non porté à l'extérieur, emballage conservé, demande dans les 7 jours, référence de commande
- Non éligible : porté à l'extérieur, article d'hygiène ou personnalisé
- Procédure : écrire avec référence et motif → vérification → dépôt du colis → contrôle et traitement
- Échange : possible selon stocks disponibles, sinon remboursement
- Remboursement : selon moyen de paiement, frais de livraison non remboursés sauf erreur Bruny, sous 7 jours ouvrés

### P26 — À propos
- Titre : "La bonne paire, au bon moment."
- Chapô : "BRUNY SHOPPING sélectionne des chaussures pour le quotidien, à Douala et partout au Cameroun, avec un service simple : de vraies tailles, des prix clairs et un humain au bout du fil."
- Sections : Notre histoire, Ce que nous choisissons (3 cartes), Comment nous travaillons (3 étapes), Nos engagements (4 puces), Signature
- Aucun chiffre d'années d'existence, de clients ou de paires vendues sans donnée vérifiée
- Signature sans nom propre tant que la fondatrice n'est pas nommée publiquement

### P23 — FAQ
- Titre : "Questions fréquentes"
- Chapô : "Livraison, tailles, retours, commandes : les réponses aux questions que vous nous posez le plus souvent."
- Catégories : Toutes, Commandes, Livraison, Tailles, Retours et échanges, Paiement, Mon compte
- 18 Q/R rédigées dans CONTENUS.md

### P22 — Contact
- Titre : "Contactez-nous"
- Chapô : "Une question, une commande, un retour ? Écrivez-nous, nous vous répondons sous 24 h ouvrées."
- Canaux : e-mail, WhatsApp, horaires (lundi-samedi 8h-18h)
- Formulaire : nom, e-mail, téléphone (facultatif), sujet, message, consentement, CAPTCHA

### P27 — Pages légales
- Titre mentions : "Mentions légales", CGV : "Conditions générales de vente", Confidentialité : "Politique de confidentialité"
- Sommaire sticky, liens croisés, date de mise à jour
- Version CGV : 1.0, 10 novembre 2026

### P01 — Home (ReassuranceBand)
- 4 points actuels :
  1. "Paiement à la livraison" — "Payez une fois la paire reçue."
  2. "Livraison à Douala et Yaoundé" — "Vos commandes livrées dans les villes desservies."
  3. "Échange sous 7 jours" — "Pas la bonne pointure ? L'échange est possible."
  4. "Support WhatsApp" — "Une question ? Notre équipe vous répond."

## Formats (DSG-07)

| Élément | Format canonique |
|---------|------------------|
| Montants | "25 000 FCFA" (espace insécable) |
| Téléphone | "+237 6 XX XX XX XX" |
| Date | "15 janv. 2025" |
| Ton | Vouvoiement, chaleureux professionnel |
| Action | Un verbe par bouton |
| Erreur | Calme, pas de majuscules, pas de reproche |

## Cohérence

- **Alignement maquettes ↔ CONTENUS.md** : les microtextes de P22-P27 sont repris dans `docs/design/DSG-05/CONTENUS.md` (FAQ, livraison, retours, à propos, mentions, CGV, confidentialité).
- **Alignement seed ↔ P24** : les frais du seed (1 500 / 2 500 / 3 000 / 4 000 / 5 000 XAF) sont repris dans P24 et CONTENUS. Un écart DSG-04 (Yaoundé à 2 000) a été résolu par DSG-07 (aligné à 3 000).
- **Alignement ReassuranceBand ↔ P24/P25** : "Échange sous 7 jours" correspond au délai P25. "Livraison à Douala et Yaoundé" est moins précis que P24 (1-2j Douala, 3-4j Yaoundé) → à affiner.
- **Alignement P25 ↔ CGV** : article 7 (retour 7 jours) et article 8 (remboursement sous 7 jours ouvrés) sont cohérents avec P25.

## Écarts identifiés

| # | Écart | Maquette | CONTENUS.md | Décision |
|---|-------|----------|-------------|----------|
| 1 | Politique d'échange de pointure | P25 mentionne "Échange de taille" en une ligne | Absent dans CONTENUS.md | **À rédiger** (CA #2) |
| 2 | FAQ sans Q/R sur l'échange de pointure | P23 catégories incluent "Retours et échanges" | 18 Q/R existantes | **À compléter** avec Q/R échange |
| 3 | ReassuranceBand "Livraison à Douala et Yaoundé" | P24 précise les délais par zone | Texte générique | **À affiner** avec délais précis |
| 4 | ReassuranceBand "Retours 7 jours" | P25 parle d'échange de pointure | Texte "Retours 7 jours" | **À affiner** → "Échange de pointure sous 7 jours" |
| 5 | À propos sans chiffres | P26 interdit les chiffres non vérifiés | Aucun chiffre inventé | **À compléter** par le PO (chiffres, histoire, équipe) |
| 6 | Coordonnées contact | P22 placeholders `+237600000000` | Placeholders | **À fournir** par le PO |
| 7 | Identité légale | P27 masque les sections si données absentes | 6 champs manquants | **À fournir** par le PO (CNT-03) |
| 8 | Endpoint `GET /delivery-zones` | P24 prévoit l'endpoint | Fallback seed | **À créer** (ticket technique futur) |

## Contenus à produire / compléter

1. **Politique d'échange de pointure** (absente) — CA #2
2. **Zones, tarifs, délais réels** (proposition à valider) — CA #1
3. **Textes À propos affinés** (histoire, mission, valeurs, chiffres, équipe) — CA #3
4. **FAQ complétée** (15-25 Q/R dont échange pointure et Mobile Money V2) — CA #3
5. **ReassuranceBand affiné** (4 points plus précis) — CA #3
6. **Checklist de validation** (20 données PO, 3 validations, relecture externe) — CA #4
7. **Transmission pour intégration** (où/comment intégrer dans MKT-01) — documentation
EOF