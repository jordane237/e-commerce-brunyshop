# CNT-07 — Comparatif des prestataires Mobile Money (Cameroun / CEMAC)

## Objet
Comparer les prestataires de paiement Mobile Money disponibles au Cameroun, pour permettre au PO de choisir le prestataire le plus adapté (frais, délais, documentation, bac à sable, support).

## Prestataires comparés
- **Opérateurs directs** : MTN Mobile Money (MoMo), Orange Money.
- **Agrégateurs** : Campay, CinetPay, Flutterwave, NotchPay.

> Préférence exprimée par le propriétaire : privilégier un **agrégateur** avec des **frais moins coûteux**. Les agrégateurs locaux (Campay, NotchPay, CinetPay) sont généralement mieux positionnés sur les frais et le support francophone que les agrégateurs internationaux, mais les frais réels doivent être confirmés par le PO.

## Tableau comparatif

| Critère | MTN MoMo | Orange Money | Campay | CinetPay | Flutterwave | NotchPay |
|---------|----------|--------------|--------|----------|-------------|----------|
| Type | Opérateur direct | Opérateur direct | Agrégateur | Agrégateur | Agrégateur | Agrégateur |
| Couverture | Cameroun | Cameroun | Cameroun | CEMAC+ | Afrique | Cameroun |
| Frais d'installation | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Frais par transaction | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Frais de retrait | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Délai d'onboarding | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Délai de versement | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Documentation API | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Sandbox disponible | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Qualité doc (1-5) | [À évaluer] | [À évaluer] | [À évaluer] | [À évaluer] | [À évaluer] | [À évaluer] |
| Support technique | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Langue du support | FR | FR | FR | FR/EN | EN/FR | FR |
| Webhooks | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Signature webhook | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Remboursements | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| KYC requis | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Site officiel | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Portail marchand | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |
| Contact officiel | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] | [À confirmer] |

## Sécurité des prestataires
- Vérifier pour chaque prestataire : signature webhook (HMAC), TLS, gestion des clés, conformité (COBAC/BEAC pour Mobile Money, PCI-DSS si cartes), procédure d'incident.
- Documenter ces points dans la colonne "Sécurité" lors de la validation par le PO.

## Disponibilité réelle au Cameroun
- Vérifier que chaque prestataire est **réellement actif au Cameroun** (pas seulement "disponible en Afrique").
- Certains agrégateurs internationaux ne couvrent pas encore le Cameroun ou imposent des frais supplémentaires.

## Recommandation (orientation, décision finale au PO)
- **Option recommandée** : agrégateur local (Campay, NotchPay ou CinetPay) — intégration unique MTN + Orange, onboarding plus rapide, support en français, frais potentiellement moins élevés, sandbox à confirmer.
- **Option alternative** : intégration directe MTN MoMo + Orange Money — plus de contrôle, mais deux intégrations séparées, plus de complexité et délais.
- **Critères de décision** : frais totaux, délai d'onboarding, qualité de la documentation, sandbox disponible, support, webhooks, couverture réelle Cameroun.

## Questions à poser au prestataire choisi
1. Quels sont les frais d'installation, de transaction et de retrait ?
2. Quel est le délai d'onboarding et de versement ?
3. Le sandbox est-il disponible ? Quelle est l'URL ?
4. Les webhooks sont-ils signés ? Quel algorithme ?
5. Quelle est la procédure de remboursement ?
6. Quels documents KYC sont requis ?
7. Quels sont les contacts officiels (email, téléphone, portail) ?
8. Quelle est la conformité (COBAC/BEAC, PCI-DSS) ?

## Sources
- Sites officiels des prestataires (à vérifier par le PO) : MTN MoMo Cameroun, Orange Money Cameroun, Campay, CinetPay, Flutterwave, NotchPay.
- Documentation publique des API (à vérifier par le PO).
- Toute information non publique est marquée `[À confirmer avec le prestataire]`.

> ⚠️ Aucune donnée de frais réel n'est inventée. Le PO doit contacter les prestataires via les canaux officiels pour obtenir les frais réels et valider le comparatif.
EOF