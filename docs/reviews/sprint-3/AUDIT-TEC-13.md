# Audit TEC-13 — Utilitaires transverses : SEO, prix FCFA, téléphone +237, locale

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Pipe `fcfa` : `15000` → « 15 000 FCFA », sans décimale | ✅ | `frontend/libs/util/src/lib/fcfa.pipe.ts:6`, `money.ts` ; 9 tests `fcfa.pipe.spec.ts` |
| 2 | Validateur téléphone `+237` avec message clair | ✅ | `phone.validator.ts:6` (message), `:20` (regex) ; 15 tests `phone.validator.spec.ts` |
| 3 | Service SEO : titre, description, Open Graph, canonique par page | ✅ | `core/seo.service.ts:38-96` ; 7 tests `seo.service.spec.ts` |
| 4 | Locale `fr-CM` et structure de traduction prêtes, aucun texte en dur | ⚠️ | Transloco et `LOCALE_ID` configurés (`app.config.ts:59-74`), mais la migration des textes est partielle : `docs/features/TEC-13/VERIFICATION.md` §6 documente ~271 occurrences encore en dur |

## 2. Conformité au cahier des charges

Le CDC §4.8 (SSR/SEO) et §4.10 (i18n) sont couverts par le socle technique. L'écart porte uniquement sur le CA #4 : l'infrastructure i18n existe, mais l'application n'est pas encore intégralement traduite, ce que le ticket reconnaît explicitement.

## 3. Qualité du code

- Utilitaires centralisés dans `libs/util`, sans duplication dans les features.
- Aucun `any` non justifié ni `@ts-ignore` dans les fichiers du ticket.
- `SeoService` est le seul point d'écriture des métadonnées ; JSON-LD échappe `<` en `\u003c`.
- Aucun TODO/FIXME introduit.

## 4. Tests

- **29 tests ciblés** : 9 FCFA, 15 téléphone, 3 `PhoneFormatPipe`, 7 SEO, 4 JSON-LD (certains se recoupent).
- Suite frontend complète exécutée le 19/11 : **515/515**. Backend : **270/270**.
- Tests SSR et métadonnées documentés dans `VERIFICATION.md` §4.

## 5. Sécurité

- Aucun secret ni numéro réel codé en dur ; le placeholder WhatsApp reste centralisé dans `APP_CONFIG`.
- Le JSON-LD est échappé contre l'injection de `</script>`.
- Aucune donnée personnelle dans les métadonnées générées.

## 6. Documentation

- `docs/features/TEC-13/ANALYSE-DESIGN.md` et `VERIFICATION.md` complets.
- `I18N-MIGRATION.md` décrit la dette restante.
- Aucun impact OpenAPI (ticket frontend).

## 7. Points d'attention

- Le CA #4 ne peut pas être coché tel qu'écrit : « aucun texte en dur » n'est pas vrai.
- Le sélecteur de langue n'existe pas ; `en.json` n'est pas exposé.
- Aucun audit lecteur d'écran.

## 8. Statut global

**⚠️ Conforme avec réserves**

Recommandation : **merge acceptable avec réserve**. Créer un ticket de migration i18n progressive et retirer la mention « aucun texte en dur » de la clôture tant que la migration n'est pas faite.
