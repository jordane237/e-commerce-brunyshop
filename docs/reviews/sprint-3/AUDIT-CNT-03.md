# Audit CNT-03 — Politiques de livraison, d'échange et textes du site

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Zones, tarifs et délais de livraison réels définis | ⚠️ | `LIVRAISON-ZONES-TARIFS.md` : tarifs/délais proposés et marqués `[À confirmer]` ; valeurs non contractuelles, intégrables sans bloquer MKT-01 |
| 2 | Politique d'échange de pointure : délai, état, emballage, transport | ⚠️ | `POLITIQUE-ECHANGE-POINTURE.md` couvre les quatre points mais laisse le délai, l'état et le payeur en `[À confirmer]` |
| 3 | Textes À propos, FAQ, accueil en français clair | ✅ | `CONTENUS-CONSOLIDES.md` et pages MKT-01 ; 18 Q/R FAQ, textes relus en interne |
| 4 | Texte relu par une personne extérieure à l'équipe | ⚠️ | `CHECKLIST-VALIDATION.md` : relecture externe recommandée, non bloquante pour l'intégration |

## 2. Conformité au cahier des charges

Le CDC §6.9 (contenus) et §12 (règles de gestion) sont visés. Les livrables sont des **brouillons structurés**, pas des politiques validées : les valeurs métier manquent.

## 3. Qualité du code

- Documents Markdown structurés, sourcés et cohérents avec DSG-07.
- Aucun chiffre inventé : les inconnues sont explicites.
- Pas de code modifié par ce ticket.

## 4. Tests

- Aucun test automatisé (ticket documentaire).
- Vérifications de non-régression builds documentées.
- Relecture humaine externe absente.

## 5. Sécurité

- Aucun secret ; les coordonnées sont des placeholders.
- Aucune donnée client réelle dans les exemples.

## 6. Documentation

- `docs/content/CNT-03/` complet : analyse, contenus, livraison, échange, checklist, transmission, vérification.
- Le statut « non validé » est honnêtement indiqué.

## 7. Points d'attention

- CA #1 et #4 non satisfaits.
- CA #2 partiel : les choix structurants restent à trancher.
- L'intégration dans les pages MKT-01 utilise des valeurs provisoires.
- Aucune validation juridique.

## 8. Statut global

**⚠️ Conforme avec réserves**

Recommandation : **merge OK avec réserves**. Le ticket reste ouvert pour validation PO/relecture externe, mais il ne bloque plus l'intégration des autres tickets : les valeurs sont explicitement provisoires et non contractuelles.

## 9. Impact sur les autres tickets

- CNT-03 ne bloque pas MKT-01 : l'intégration peut utiliser les contenus avec placeholders `[À confirmer]`.
- Les coordonnées de contact réelles (WhatsApp, Facebook) sont désormais utilisées.
- Les valeurs métier restantes (tarifs, délais, RCCM, etc.) sont à confirmer par le PO sans bloquer le développement.
