# CNT-07 — Démarches d'accès au paiement Mobile Money

## Objectif
Préparer, côté Product Owner (PO) et juridique, l'accès au paiement Mobile Money pour BrunyShop, afin que le développement technique (ticket PAY-03) puisse démarrer avec un accès sandbox déjà obtenu.

## Périmètre
- Ce dossier est **documentaire** : il ne contient aucun code applicatif, aucune migration Prisma et aucune clé réelle.
- Les livrables sont des documents de préparation, de comparaison, de KYC, de sécurité des clés et de suivi.

## Ordre de lecture recommandé
1. `ANALYSE-EXISTANT.md` — état du projet et dépendances
2. `COMPARATIF-PRESTATAIRES.md` — comparatif des prestataires Mobile Money (CA #1)
3. `DOSSIER-KYC.md` — documents à rassembler et canaux officiels (CA #2)
4. `POLITIQUE-SECURITE-CLES.md` — politique de sécurité des clés (CA #4)
5. `PLAN-SANDBOX.md` — plan d'obtention du bac à sable (CA #3)
6. `STATUS.md` — suivi réel par le PO
7. `VERIFICATION.md` — vérifications documentaires et non-régression

## Critères d'acceptation
- CA #1 : prestataires officiels comparés (frais, délais, documentation, bac à sable)
- CA #2 : dossier complet déposé via les canaux officiels uniquement
- CA #3 : accès bac à sable obtenu avant le début de PAY-03
- CA #4 : aucune clé communiquée à un tiers non autorisé

## Règle absolue
Aucune clé API (même de test) ne doit être stockée dans ce dossier, dans le repo, dans les emails ou dans les tickets. Utiliser uniquement des placeholders `CHANGEME_*` et un gestionnaire de secrets.

## Statut global
⏳ En cours — voir `STATUS.md`.
EOF