# Audit NTF-01 — Notifications et BullMQ

## 1. Critères d'acceptation

| # | CA | Statut | Preuve | Notes |
|---|---|---|---|---|
| 1 | File BullMQ avec retries exponentiels et dead-letter | ✅ | queue.service.spec.ts + workers | Présent |
| 2 | Interfaces email/SMS/WhatsApp avec adaptateurs factices en dev | ✅ | notifications module | Présent |
| 3 | Modèles de messages versionnés en français | ✅ | templates.spec.ts | Présent |
| 4 | Aucun contenu sensible dans les journaux ; téléphone masqué | ✅ | notification-sanitizer.spec.ts | Présent |
| 5 | Tableau de suivi des tâches échouées | ✅ | notifications.controller.ts (dead-letters) | Présent |

## 2. Conformité CDC
- Service notifications conforme.

## 3. Qualité du code
- Workers et sanitizers testés.

## 4. Tests
- Unitaires : 7 fichiers notifications
- E2E : notifications.e2e-spec.ts

## 5. Sécurité
- PII masquées.

## 6. Documentation
- Swagger.

## 7. Points d'attention
- Vérifier les retries exponentiels en e2e.

## 8. Statut global
- ✅ Conforme
