# ORD-06 — Analyse design (P12 / P13)

## Sources consultées
- `docs/design/DSG-04/P12-confirmation.md`, `P13-suivi-public.md`
- `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md`
- Maquettes `/design-1` (collage mobile 360 px) — écran « Suivre ma commande » (formulaire) et « Suivi de commande » (résultat + timeline)
- Tokens DSG-02 (`frontend/libs/design-tokens/src/index.scss`)

## Fichiers design localisés
- P13 spec : `docs/design/DSG-04/P13-suivi-public.md` (wireframes 360/768/1280, composants, états, microtextes, a11y)
- P12 spec : `docs/design/DSG-04/P12-confirmation.md` (CTA « Suivre ma commande » → `/suivi`)
- Maquette : `design1/bruny shopping/bruny shopping.png` (écrans formulaire + résultat + timeline)

## Structure P13 retenue
- Formulaire : champ « Numéro de commande » (placeholder `BRN-2611-7K3F`, aide `Format : BRN-XXXX-XXXX`), champ « Téléphone » (`+237`), bouton « Suivre ma commande ».
- Résultat : référence + badge statut, timeline verticale (5 étapes), articles (nom, pointure, couleur, quantité, prix), récapitulatif (sous-total, remise, livraison, total), ville de livraison + date estimée, bouton WhatsApp contextualisé, lien « Demander un échange » conditionnel (`status === DELIVERED`).
- État vide : message neutre « Référence introuvable ou numéro incorrect » + « Vérifiez votre numéro de commande et le téléphone associé à votre commande. » + CTA « Réessayer ».
- États : loading (skeleton), erreur technique (réseau / 429), succès, vide.

## Microtextes (DSG-04 P13 + DSG-07)
- « Suivre ma commande », « Numéro de commande », « Téléphone », « Format : BRN-XXXX-XXXX »
- « Référence introuvable ou numéro incorrect » / « Vérifiez votre numéro de commande et le téléphone associé à votre commande. »
- « Réessayer », « Statut », statuts traduits (En attente de confirmation, Confirmée, En préparation, Expédiée, Livrée, Annulée)
- « Article », « Pointure », « Couleur », « Quantité », « Total », « Date », « Livraison à »
- « Besoin d'aide ? Contactez-nous sur WhatsApp », « Demander un échange » (V2)
- Vouvoiement systématique.

> Note : le ticket ORD-06 cite des chaînes (« Numéro de commande », « Total », « Livraison à ») qui diffèrent légèrement du glossaire (« Référence », « Total à régler »). Choix retenu : suivre les chaînes explicitement demandées par le ticket (CA/e2e), documenté ici.

## Tokens DSG-02 utilisés
- Couleurs : `--bs-color-primary`, `--bs-color-success`, `--bs-color-danger`, `--bs-color-warning`, `--bs-color-text`, `--bs-color-text-muted`, `--bs-color-border`, `--bs-color-surface`.
- Espacements : `--bs-space-*`. Rayons : `--bs-radius-*`. Typo : `--bs-font-size-*`, `--bs-font-weight-*`.
- Timeline : completed = success, current = primary (pulse), futur = neutre/border.

## Composants TEC-10 réutilisés
- `bruny-input` (label, hint, error, inputMode), `bruny-button` (block, loading, disabled), `bruny-status-badge`, `bruny-skeleton`, `bruny-empty-state`, `bruny-icon`, `bruny-timeline` (créé), `FcfaPipe`.

## Composants manquants créés
- `libs/ui/src/lib/timeline/timeline.component.ts` (+ template/scss/spec) : `<ol>/<li>`, `aria-current="step"`, marqueurs check/pulse/vide, dates `DatePipe` fr-CM.

## Décisions de cohérence
- P12 confirmation → lien « Suivre ma commande » mis à jour vers `/suivi?reference=...&phone=...` (pré-remplissage + soumission auto).
- FAB WhatsApp global masqué sur `/suivi` (déjà dans `TUNNEL_PREFIXES`) ; bouton contextualisé dans le résultat uniquement → pas de doublon.
- Page non indexée (`noIndex: true`), SSR-safe (formulaire vide au SSR).
- EmptyState CTA corrigé : `(clicked)` → `(click)` sur `bruny-button` (le composant Button n'expose pas d'output `clicked`), sinon le CTA « Réessayer » était inerte.
