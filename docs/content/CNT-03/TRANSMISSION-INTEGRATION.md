# CNT-03 — Transmission pour intégration

## Objectif
Documenter comment intégrer les contenus validés (CNT-03) dans les pages existantes (MKT-01), sans coder dans ce ticket.

## Fichiers Angular à mettre à jour

| Page | Route | Composant | Contenu à intégrer |
|------|-------|-----------|---------------------|
| Livraison | `/livraison` | `features/info/delivery/` | Zones, tarifs, délais, règles, modes de paiement (CONTENUS-CONSOLIDES §1 + LIVRAISON-ZONES-TARIFS.md) |
| Retours | `/retours` | `features/info/returns/` | Éligibilité, procédure, remboursement, échange de pointure (CONTENUS-CONSOLIDES §2-3) |
| FAQ | `/faq` | `features/info/faq/` | 15-25 Q/R (CONTENUS-CONSOLIDES §4) |
| À propos | `/a-propos` | `features/info/about/` | Hero, histoire, sélection, travail, engagements, signature (CONTENUS-CONSOLIDES §5) |
| Accueil | `/` | `features/home/sections/reassurance-band/` | 4 points affinés (CONTENUS-CONSOLIDES §6) |
| CGV | `/cgv` | `features/legal/cgv/` | Article 5 mis à jour (Mobile Money V2) + placeholders |
| Confidentialité | `/confidentialite` | `features/legal/privacy/` | Données paiement Mobile Money (CNT-07) |
| Mentions légales | `/mentions-legales` | `features/legal/legal-notice/` | 6 champs CNT-03 complétés |

## Comment intégrer

1. **Mettre à jour `docs/design/DSG-05/CONTENUS.md`** avec les textes validés (remplacer les placeholders par les données confirmées).
2. **Mettre à jour les composants Angular** (`features/info/*`, `features/legal/*`) avec le contenu HTML/i18n définitif.
3. **Mettre à jour `fr-CM.json`** (TEC-13) avec les textes définitifs.
4. **Mettre à jour `CONTENT-VALIDATION.md`** (MKT-01) avec le statut réel (validé par le propriétaire, le juriste, le relecteur externe).

## Ordre d'intégration recommandé

1. Livraison (P24) — fondation pour le checkout
2. Retours / échange (P25) — dépend de la livraison
3. FAQ (P23) — dépend de la livraison et des retours
4. À propos (P26) — indépendant
5. Accueil (P01) — dépend de la livraison et de l'échange
6. Légales (P27) — dépend de la validation juriste

## Tests après intégration

- Vérifier que chaque page affiche le bon contenu (`curl http://localhost:4200/livraison`, etc.)
- Vérifier la cohérence entre les pages (livraison vs FAQ vs CGV)
- Vérifier les formats (XAF, téléphone, date) selon DSG-07
- Vérifier l'accessibilité (WCAG 2.1 AA) : titres, contraste, focus, zoom 200 %

## Validation après intégration

- Le PO vérifie que le contenu s'affiche correctement sur chaque page.
- Le juriste valide les pages légales.
- Le relecteur externe valide l'ensemble (CA #4).

## Note

CNT-03 est un ticket de contenu. Les textes sont produits dans `docs/content/CNT-03/`. L'intégration dans les pages Angular est un ticket séparé. Si le PO souhaite intégrer directement dans CNT-03, documenter le choix (mais la recommandation est de séparer rédaction et intégration).
EOF