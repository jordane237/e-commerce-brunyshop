# TEC-13 — Socle i18n et migration restante

> État au 16 novembre 2026.
> Branche : `feature/TEC-13-cross-cutting-utils`.

---

## 1. Ce qui est prêt

| Élément | État |
| --- | --- |
| Bibliothèque | `@jsverse/transloco` `8.4.0` |
| Langues déclarées | `fr-CM` (défaut, fallback), `en` |
| `LOCALE_ID` Angular | `fr-CM` |
| Données de locale | `@angular/common/locales/fr-CM` |
| Chargement | `/i18n/fr-CM.json`, `/i18n/en.json` |
| SSR | Loader qui résout l’origine de la requête |
| Démarrage | Traduction `fr-CM` chargée par un initializer |
| Attribut HTML | `<html lang="fr-CM">` |
| Clés disponibles | `common`, `validation`, `errors` |

Les fichiers sont dans `frontend/apps/storefront/public/i18n/`. Le dossier
`public` est copié tel quel dans le build ; aucune entrée supplémentaire dans
`angular.json` n’est nécessaire.

---

## 2. Pourquoi la migration n’est pas terminée

Le storefront contient encore environ 271 occurrences de texte français en dur
dans les templates, les messages de formulaire et les données de démonstration.
TEC-13 livre le mécanisme et les clés communes ; il ne remplace pas ces textes,
car :

- chaque écran doit être relu pour distinguer un libellé stable d’un contenu
  éditorial ou juridique ;
- les messages de validation sont aussi produits par des validateurs TypeScript
  (`PHONE_ERROR_MESSAGE` par exemple) ;
- les pages SEO ont des titres et descriptions rédigés par page, qui demandent
  une stratégie de clés et de traduction ;
- l’administration n’entre pas dans le périmètre.

**Il ne faut donc pas considérer le storefront comme intégralement traduit ni
comme exempt de textes en dur.**

---

## 3. Convention de clés proposée

```json
{
  "common": {
    "actions": { "save": "…", "cancel": "…" },
    "states": { "loading": "…", "empty": "…" },
    "labels": { "email": "…", "phone": "…" }
  },
  "validation": {
    "required": "…",
    "phone": "…",
    "minlength": "…"
  },
  "errors": {
    "generic": "…",
    "network": "…"
  }
}
```

Règles :

- clés en anglais, valeurs en français camerounais ;
- pas de phrase complète comme nom de clé ;
- interpolation Transloco `{{min}}`, `{{max}}` pour les messages paramétrés ;
- une clé ne doit pas être réutilisée pour deux sens différents ;
- les contenus juridiques longs restent des documents éditoriaux, pas des
  chaînes de template.

---

## 4. Ordre de migration recommandé

1. **Authentification** : libellés, aides, erreurs et messages de succès
   (connexion, inscription, mot de passe oublié, profil).
2. **Contact** : libellés du formulaire, sujets, confirmation et erreurs.
3. **Panier et tunnel** : états vides, totaux, actions et messages de stock.
4. **Catalogue et fiche produit** : filtres, tri, pagination, disponibilité.
5. **Pages info et légales** : titres et intros ; le corps juridique reste
   relu séparément.
6. **SEO** : titres, descriptions et libellés JSON-LD par page.
7. **Administration** : ticket distinct, une fois le storefront stabilisé.

Pour chaque lot :

- extraire les chaînes vers `fr-CM.json` ;
- ajouter les mêmes clés dans `en.json` ;
- remplacer le texte par `translate` dans le template ou
  `TranslocoService.translate` dans le TypeScript ;
- conserver les tests de rendu en français ;
- vérifier le HTML SSR de la page concernée.

---

## 5. Cas particuliers

### Messages de validation

Les validateurs partagés renvoient aujourd’hui un message français
(`PHONE_ERROR_MESSAGE`). Une migration propre doit renvoyer une **clé** ou un
code d’erreur, puis laisser le composant traduire. Changer le validateur sans
mettre à jour tous ses consommateurs casserait les formulaires actuels.

### Dates et nombres

`LOCALE_ID` vaut `fr-CM`. Les formats de date ne sont pas uniformisés par
TEC-13 : DSG-07 utilise `15 janv. 2025`, tandis que certaines pages admin
affichent `15/01/2025`. Cette divergence doit être tranchée avant d’ajouter un
pipe de date partagé.

### SEO

Les titres et descriptions sont actuellement des arguments de `setPageMeta`.
Ils peuvent être traduits, mais le JSON-LD doit rester cohérent avec la langue
de la page. Si une langue autre que `fr-CM` est exposée, il faudra également
adapter `inLanguage` et les balises `og:locale`.

### Langue `en`

Le fichier existe pour valider la structure et le fallback. Aucun sélecteur de
langue n’est livré : l’application reste en `fr-CM` pour l’utilisateur final.

---

## 6. Critères de sortie de la migration

- plus aucune chaîne utilisateur en dur dans les templates du storefront ;
- `fr-CM.json` et `en.json` ont la même arborescence de clés ;
- les tests de rendu passent dans les deux langues ;
- les messages de validation sont traduits à l’affichage ;
- le HTML SSR contient la bonne langue et les bonnes métadonnées ;
- aucune régression sur les parcours AUT-09, AUT-11, MKT-02 et CAT-07.

---

## 7. Vérifications associées

Voir [`VERIFICATION.md`](./VERIFICATION.md) pour les commandes exécutées et les
contrôles SSR du socle.
