# CNT-07 — Analyse de l'existant

## Branche
`feature/CNT-07-mobile-money-onboarding`

## État du projet au démarrage de CNT-07
- Backend NestJS `/api/v1` avec auth, catalogue, panier, commandes, paiements (squelette), notifications BullMQ, audit, health.
- Frontend Angular SSR (boutique) + admin SPA.
- Paiement MVP : Cash on Delivery (COD) uniquement.
- Modèle Prisma `Payment` prêt pour un provider externe (`provider`, `providerRef`, `amount`, `status`, `rawPayloadHash`, `paidAt`).
- `Order.paymentMethod` enum : `COD`, `MOBILE_MONEY`, `CARD` (défini, seul COD utilisé).

## Documents existants liés
- `docs/design/DSG-04/P11-paiement.md`, `P11b-attente-paiement.md`, `P11c-echec-paiement.md` : specs UX Mobile Money V2 à relire pour PAY-03.
- `docs/design/DSG-05/P27-pages-legales.md` et `docs/design/DSG-05/CONTENUS.md` : contenus CGV et Politique de confidentialité.
- `docs/features/MKT-01/CONTENT-VALIDATION.md` : validation des contenus légaux.
- `docs/features/OPS-01/SECURITY.md` : sécurité des images et du déploiement, à compléter pour les secrets de paiement.

## Variables d'environnement existantes
- `.env.example` contient déjà :
  - `PAYMENT_PROVIDER=fake`
  - `PAYMENT_WEBHOOK_SECRET=CHANGE_ME`
- Aucune variable `MOBILE_MONEY_*` n'existe encore.

## Pages légales existantes
- CGV : article 5 mentionne le paiement à la livraison et Mobile Money de façon générique.
- Politique de confidentialité : collecte des données de commande, mais pas encore les données de paiement Mobile Money (numéro, référence, statut).

## Design / UX
- CNT-07 est un ticket juridique/PO : aucune maquette n'est produite.
- Les besoins UX Mobile Money sont documentés pour le futur ticket PAY-03 (écran d'attente, écran d'échec, timeout, confirmation sur téléphone, webhooks).
- Les pages légales sont à mettre à jour pour mentionner Mobile Money V2.

## Conflits potentiels / points d'attention
- La CGV et la Politique de confidentialité sont partagées avec MKT-01 : ne pas écraser le contenu existant, ajouter une mention Mobile Money V2 avec placeholders.
- `.env.example` est partagé avec TEC-04/OPS-01 : ajouter uniquement des variables `MOBILE_MONEY_*` en `CHANGEME_*`.
- `docs/features/OPS-01/SECURITY.md` est partagé avec OPS-01 : ajouter une section "Secrets de paiement Mobile Money" sans modifier le reste.
- Aucun canal non officiel ne doit être documenté.
EOF