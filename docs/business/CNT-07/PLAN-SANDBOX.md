# CNT-07 — Plan d'obtention du bac à sable (sandbox)

## Timeline

| Étape | Durée estimée | Dépendance | Responsable |
|-------|---------------|------------|-------------|
| 1. Choix du prestataire (comparatif validé) | 1 semaine | CNT-07 comparatif | PO |
| 2. Rassemblement des documents KYC | 1-2 semaines | Dirigeant, comptable | PO |
| 3. Dépôt du dossier via canal officiel | 1 jour | Étape 2 | PO |
| 4. Instruction du dossier par le prestataire | 1-4 semaines | Étape 3 | Prestataire |
| 5. Signature du contrat marchand | 1 semaine | Étape 4 | PO + prestataire |
| 6. Réception des clés sandbox | 1-3 jours | Étape 5 | Prestataire |
| 7. Tests sandbox (intégration technique) | 1-2 semaines | Étape 6 | Dev + PO |
| 8. Mise en production (après PAY-03) | - | Étape 7 + PAY-03 | Dev + PO |

**Durée totale estimée** : 5-9 semaines (dont 1-4 semaines d'instruction côté prestataire). Démarrer tôt pour ne pas bloquer PAY-03.

## Dépendances
- **PAY-03** (implémentation technique Mobile Money) ne peut pas démarrer tant que l'étape 6 (clés sandbox) n'est pas franchie.
- **Documents KYC** : dépend du dirigeant (RCCM, NIU, pièce d'identité, etc.) — préparer en parallèle du comparatif.
- **URL du site** : le prestataire peut demander une URL publique (brunyshop.cm) — dépend du déploiement OPS-01.

## Plan B (si refus ou délai excessif)
- **Refus d'un prestataire** : postuler chez un autre agrégateur (le comparatif liste 5+ options).
- **Délai excessif** : contacter le support commercial du prestataire pour accélérer, ou basculer sur un autre.
- **Prestataire non disponible au Cameroun** : vérifier la couverture réelle avant de postuler.
- **Solution de secours** : rester en COD (MVP) plus longtemps, ou intégrer un autre mode de paiement en attendant.

## Checklist avant PAY-03
- [ ] Prestataire choisi (comparatif validé par PO)
- [ ] Dossier KYC déposé via canal officiel
- [ ] Contrat marchand signé
- [ ] Clés sandbox reçues et stockées dans le gestionnaire de secrets
- [ ] URL de webhook configurée chez le prestataire (`https://api.brunyshop.cm/api/v1/payments/webhook`)
- [ ] Documentation API du prestataire lue (webhooks, signature, remboursements, statuts)
- [ ] Tests sandbox validés (transaction test réussie, webhook reçu et vérifié, idempotence, gestion d'échec)
- [ ] Plan de mise en production validé (clés production, monitoring, alertes)
EOF