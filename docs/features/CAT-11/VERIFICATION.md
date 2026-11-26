# CAT-11 — Vérification

## Checks automatisés

- ✅ Branche `feature/CAT-11-size-guide-share` créée et active
- ✅ Build storefront production : succès
- ✅ Typecheck storefront : succès
- ✅ ESLint fichiers modifiés : 0 erreur
- ✅ Tests unitaires product-detail + share + seo : 60+ verts
- ✅ Build admin non modifié (non-régression)

## Checks manuels / e2e

- ⚠️ Test manuel modale, Échap, focus trap, partage Facebook/WhatsApp/copie, OG curl et Facebook Sharing Debugger à exécuter selon `TEST-OG.md`
- ⚠️ Lighthouse non exécuté dans cette session

## Limitations

- P05 n’a pas de maquette validée ; composition fondée sur la page statique existante et CAT-06.
- Web Share API dépend du navigateur et n’est pas testable de façon déterministe en unitaire.