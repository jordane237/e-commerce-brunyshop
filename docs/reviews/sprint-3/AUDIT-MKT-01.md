# Audit MKT-01 — Pages statiques et pages légales

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Huit pages : À propos, FAQ, Livraison, Retours, Guide des tailles, CGV, Confidentialité, Mentions | ✅ | `app.routes.ts:63-121` ; 8 composants dans `features/info` et `features/legal` |
| 2 | Sommaire ancré sur les pages longues, lisibilité optimale | ✅ | `legal-page-layout.component.ts:25` (`toc`), `nav aria-label="Sommaire de la page"` ; 2 tests layout |
| 3 | Contenu validé par le propriétaire et un professionnel pour le juridique | ❌ | `CONTENT-VALIDATION.md` : toutes les cases propriétaire/juriste sont à faire ; six champs légaux sont des placeholders dans `legal.ts` |
| 4 | Rendu serveur, balises titre et description | ✅ | SSR vérifié pour les 8 routes (`VERIFICATION.md` §2), canonical et meta description présents |

## 2. Conformité au cahier des charges

Le CDC §6.9 (pages institutionnelles) et §7.4 (contenus légaux) sont visés. La livraison technique est complète ; la validation éditoriale et juridique, exigée par le CA #3, ne l'est pas.

## 3. Qualité du code

- Pages standalone réutilisant un layout commun ; pas de duplication de mise en page.
- Contenus centralisés autant que possible.
- Aucun `any`, aucun TODO.
- `/confidentialite` redirige vers `/politique-confidentialite`.

## 4. Tests

- **25 tests unitaires** de pages (2 à 3 par page) + 2 tests de layout.
- SSR vérifié pour les 8 pages ; home exclue à cause d'un blocage préexistant.
- Suite frontend 515/515.

## 5. Sécurité

- Aucun secret réel : les données légales manquantes sont des placeholders explicites.
- Aucun formulaire ni PII sur ces pages.
- Les liens externes sont en `noopener noreferrer`.

## 6. Documentation

- `ANALYSE-DESIGN.md`, `CONTENT-VALIDATION.md`, `VERIFICATION.md` complets.
- Les placeholders sont listés et assumés.

## 7. Points d'attention

- CA #3 non satisfait : aucune signature ni relecture externe.
- Les mentions légales contiennent six champs `[À fournir]`.
- Le sitemap ne contient pas les URL produits dynamiques.
- La redirection `/confidentialite` est un 302, pas un 301.

## 8. Statut global

**⚠️ Conforme avec réserves**

Recommandation : **merge acceptable**, mais le ticket ne peut pas être déclaré « contenu validé ». Escalader la validation PO/juriste avant production.
