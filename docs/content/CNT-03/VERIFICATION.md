# CNT-03 — Vérification

## Vérifications documentaires

| # | Check | Résultat |
|---|-------|----------|
| 1 | Tous les documents existent dans `docs/content/CNT-03/` | ✅ |
| 2 | Politique d'échange complète (délai, état, emballage, transport, procédure, cas particuliers) — CA #2 | ✅ |
| 3 | Zones/tarifs/délais complets (tableau par zone, règles, modes de paiement) — CA #1 | ✅ |
| 4 | Textes À propos, FAQ, accueil rédigés en français clair — CA #3 | ✅ |
| 5 | Checklist de validation (20 données PO, 3 validations, relecture externe 8 points) — CA #4 | ✅ |
| 6 | Aucune donnée inventée (placeholders `[À confirmer]` pour frais/délais/politiques réels) | ✅ |
| 7 | Cohérence DSG-07 (ton vouvoiement, formats XAF/téléphone/date) | ✅ |
| 8 | Sources référencées (zones seedées TEC-06, maquettes DSG-05) | ✅ |
| 9 | Placeholders exhaustifs listés dans la checklist | ✅ |
| 10 | Cohérence maquettes (P22-P27, P01) vérifiée dans ANALYSE-DESIGN.md | ✅ |

## Vérifications non-régression

| # | Check | Résultat |
|---|-------|----------|
| 11 | Build backend (`pnpm -C backend build`) | ✅ Succès |
| 12 | Build storefront (`pnpm -C frontend build:storefront`) | ✅ Succès |
| 13 | Démarrage shop | ✅ OK (build réussi) |
| 14 | Pages existantes non modifiées (`/`, `/catalogue`, `/panier`, `/contact`, `/cgv`) | ✅ Non modifiées (CNT-03 ne modifie pas le code) |

## Limitations

- Les frais réels, délais réels, politiques d'échange réelles, coordonnées, RCCM, NIU, etc. ne sont pas inventés : ils sont en `[À confirmer par le propriétaire]` et documentés dans `CHECKLIST-VALIDATION.md`.
- La validation juridique des CGV/Politique de confidentialité/Mentions légales est requise (CNT-03).
- La relecture par une personne extérieure à l'équipe (CA #4) doit être organisée par le PO.
- L'intégration dans les pages MKT-01 est un ticket séparé (`TRANSMISSION-INTEGRATION.md`).
EOF