# MKT-06 — Bouton WhatsApp flottant et liens de contact

> Bouton WhatsApp flottant du storefront BRUNY SHOPPING.
> Branche : `feature/MKT-06-whatsapp-floating-button`.
> Base : `51f8f02` (`MKT-04`).
> Statut : **implémenté et vérifié localement**, non validé pour la production.

---

## 1. Objectif et périmètre

MKT-06 ajoute un point de contact WhatsApp discret sur les pages publiques du
storefront, avec un message prérempli adapté à la page consultée.

| Élément | Statut |
| --- | --- |
| FAB WhatsApp sur les pages publiques | Livré |
| Message contextuel par page | Livré |
| Masquage sur `/contact` | Livré |
| Masquage sur P04 mobile (sticky bar CAT-10) | Livré |
| Masquage pendant le bandeau de consentement | Livré |
| Masquage dans le tunnel | Codé, non démontrable en e2e |
| Numéro depuis la configuration existante | Livré |
| Accessibilité clavier, focus, nom, infobulle | Livrée |
| Tests unitaires | Livrés |
| Tests e2e | Livrés |
| Source de vérité en base | Hors périmètre |

Hors périmètre : modification du numéro par l’administration, suivi des clics
dans le Pixel Meta, enrichissement du message avec le nom réel du produit depuis
le layout, création des pages du tunnel.

---

## 2. Audit de l’existant

### 2.1 Aucun FAB préexistant

Le storefront ne contenait aucun bouton WhatsApp flottant. Les points de contact
existants étaient :

- les liens inline de `/contact` (WhatsApp, téléphone, Facebook) ;
- la sticky bar mobile de la fiche produit, avec WhatsApp ;
- les bandeaux de réassurance, sans lien ;
- le CTA Facebook de l’accueil.

La bottom-nav mobile de la planche, qui contient un onglet WhatsApp, n’est pas
implémentée dans le storefront.

### 2.2 Configuration existante

Le dépôt n’a pas de fichier `environment.ts`. La configuration du storefront est
fournie par `APP_CONFIG` dans :

`frontend/apps/storefront/src/app/core/app-config.ts`

La propriété existante est `contactWhatsappUrl`, avec la valeur placeholder
`https://wa.me/237600000000`. MKT-02 l’utilise déjà pour la page contact et la
fiche produit.

Le seed Prisma contient `support.whatsapp`, pas `contact.whatsapp`. L’endpoint
public `GET /api/v1/config` n’expose que la configuration Turnstile. Une source
de vérité en base demanderait un delta backend et une exposition publique, hors
périmètre MKT-06.

### 2.3 Layout

Le shell réel est `App`, dans :

- `frontend/apps/storefront/src/app/app.ts` ;
- `frontend/apps/storefront/src/app/app.html`.

Il contient le header, le `router-outlet`, le footer, le bandeau de consentement
et les toasts. Le FAB est monté avant `app-consent-banner`.

### 2.4 Routes

Les routes réelles du storefront sont notamment `/`, `/boutique`,
`/produit/:slug`, `/panier`, `/compte`, `/contact` et `/guide-des-tailles`.

Aucune route de tunnel n’existe : ni `/commande`, ni `/commande/paiement`, ni
`/checkout`, ni `/paiement`, ni `/confirmation`, ni `/suivi`. Le wildcard
redirige vers `/boutique`.

Conséquence : la détection du tunnel est implémentée et testée unitairement,
mais **CA2 ne peut pas être démontré de bout en bout aujourd’hui**.

---

## 3. Analyse du design

### 3.1 Sources disponibles

| Source | Contenu |
| --- | --- |
| `design1/bruny shopping/bruny shopping.png` | Unique planche visuelle |
| `docs/design-1/ANALYSE-MAQUETTES.md` | Cartographie de la planche |
| `docs/design/DSG-03/` | Analyse P01–P07, sans specs complètes |
| `docs/design/DSG-04/` | Specs P08–P13 |
| `docs/design/DSG-05/` | Specs P14–P27 |
| `docs/design/DSG-07/` | Gel design, microtextes, accessibilité, parcours |

La planche ne couvre que le mobile, autour de 390 px. Il n’existe pas de vue
768 px ni 1280 px.

### 3.2 Constat : aucun FAB dans la maquette

La planche ne dessine pas de bouton WhatsApp flottant. Elle montre :

- un CTA WhatsApp inline dans le hero ;
- des boutons WhatsApp inline dans la boutique et le panier ;
- un bouton WhatsApp dans la sticky bar de P04 ;
- un onglet WhatsApp dans une bottom-nav mobile P04/P06, non implémentée.

Le FAB MKT-06 est donc une **proposition nouvelle**, cohérente avec les couleurs
et les CTA existants, mais pas une reproduction pixel-perfect d’un écran.

### 3.3 Conflit futur avec la bottom-nav

La bottom-nav prévue par le design contient déjà WhatsApp. Le code actuel ne
l’implémente pas. Si elle est ajoutée plus tard, le FAB créerait un doublon.

Décision documentée : MKT-06 livre le FAB en l’absence de bottom-nav. Lors de
l’implémentation de celle-ci, il faudra soit retirer l’onglet WhatsApp, soit
masquer le FAB sur les écrans qui affichent la bottom-nav.

### 3.4 Proposition visuelle

| Propriété | Valeur |
| --- | --- |
| Forme | cercle |
| Taille desktop | 56 × 56 px |
| Taille mobile | 52 × 52 px |
| Position desktop | 24 px du bord droit et du bas |
| Position mobile | 16 px du bord droit et du bas |
| Fond | `--bs-color-whatsapp` (`#25D366`) |
| Glyphe | `--bs-color-primary` (`#131B2E`) |
| Ombre | `--bs-shadow-md`, hover `--bs-shadow-lg` |
| Infobulle | « Discuter sur WhatsApp » |
| z-index | `--bs-z-whatsapp-fab: 1030` |

Le FAB est au-dessus du contenu et de la sticky bar, mais sous
`--bs-z-overlay: 1040` et `--bs-z-consent: 1041`.

### 3.5 Contraste

Blanc sur `#25D366` = **1,98:1**, échec WCAG. Le prompt demandait à la fois le
vert `#25D366` et une icône blanche : ces deux exigences sont incompatibles avec
CA4.

Décision retenue :

- fond `#25D366` ;
- glyphe navy `#131B2E` → **8,65:1** ;
- alternative documentée : fond `#0F7A40` + glyphe blanc → **5,41:1**.

Le choix conserve le vert WhatsApp demandé et rend l’icône conforme.

### 3.6 Microtextes

Les libellés proviennent de DSG-07 :

- nom accessible : « Contacter le support sur WhatsApp » ;
- avertissement d’ouverture externe : « (nouvel onglet) » ;
- infobulle : « Discuter sur WhatsApp » ;
- aide tunnel : « Besoin d'aide ? » ;
- « pointures », pas « tailles » ;
- vouvoiement.

Aucun nouveau ton éditorial n’a été introduit.

---

## 4. Décisions

### 4.1 Source de vérité

`WhatsAppService` lit `APP_CONFIG.contactWhatsappUrl` et extrait le numéro. Aucun
`environment.ts`, aucun doublon `contactWhatsapp`, aucun appel backend.

Le numéro placeholder reste syntaxiquement valide. Il sera affiché tant que le
propriétaire ne l’a pas remplacé. La valeur doit être remplacée avant toute mise
en production.

### 4.2 Contextes

| URL | Contexte | Message |
| --- | --- | --- |
| `/` | `home` | visite de la boutique |
| `/boutique` | `catalog` | parcours de la boutique |
| `/produit/:slug` | `product` | intérêt pour un produit |
| `/panier` | `cart` | question sur le panier |
| `/commande`, `/checkout` | `checkout` | aide pour finaliser la commande |
| `/paiement`, `/confirmation`, `/suivi` | `confirmation` | question sur la commande |
| `/compte`, `/connexion`, `/inscription` | `account` | question sur le compte |
| `/guide-des-tailles` | `size-guide` | question sur les pointures |
| `/contact` | `contact` | contact direct (FAB masqué) |
| autres | `other` | question générale |

Le message produit générique est utilisé par le layout, car l’URL ne contient
pas le nom du produit. Le service accepte `productName`, `variant`,
`categoryName` et `orderReference` pour les tests et une évolution future.

### 4.3 Règles de masquage

Le FAB n’est pas rendu si :

- l’URL appartient au tunnel ;
- la page est `/contact` ;
- le bandeau de consentement est ouvert ;
- la configuration WhatsApp est vide ou invalide.

Sur P04 mobile, le FAB reste dans le DOM mais est masqué en CSS sous 768 px,
car la sticky bar CAT-10 porte déjà l’action WhatsApp. Ce choix évite un
`matchMedia` JavaScript et reste stable au SSR.

### 4.4 Lien d’aide dans le tunnel

Le FAB WhatsApp est masqué dans le tunnel. Aucun lien d’aide global n’a été
ajouté pour éviter un doublon avec les liens prévus par P08/P12.

P11 ne contient pas de lien d’aide WhatsApp dans sa spec DSG-04. C’est un manque
du design du tunnel, à traiter avec le ticket P08–P13, pas dans MKT-06.

---

## 5. Architecture

```text
frontend/apps/storefront/src/app/
├── core/services/
│   ├── whatsapp.service.ts
│   └── whatsapp.service.spec.ts
├── layout/components/whatsapp-fab/
│   ├── whatsapp-fab.component.ts
│   ├── whatsapp-fab.component.html
│   ├── whatsapp-fab.component.scss
│   └── whatsapp-fab.component.spec.ts
├── app.ts
└── app.html

frontend/e2e/whatsapp-fab.spec.ts
docs/features/MKT-06/ANALYSE-DESIGN.md
docs/features/MKT-06/VERIFICATION.md
```

`WhatsAppService` ne dépend que de `APP_CONFIG`. Le composant lit le Router et
`ConsentService`, puis délègue la construction du lien au service.

Le hero de l’accueil utilise désormais `APP_CONFIG.contactWhatsappUrl` au lieu
d’un numéro codé en dur.

---

## 6. Accessibilité

- Lien natif, focusable, nom accessible explicite.
- `target="_blank"` et `rel="noopener noreferrer"`.
- Avertissement « nouvel onglet » dans le nom accessible.
- Focus visible : anneau navy de 3 px, offset 3 px.
- Cible tactile 52 px mobile et 56 px desktop, au-dessus du minimum de 44 px.
- Infobulle `role="tooltip"` reliée par `aria-describedby`.
- SVG `aria-hidden="true"` et `focusable="false"`.
- Contraste du glyphe 8,65:1.
- `prefers-reduced-motion` respecté : plus de transition ni de mise à l’échelle.
- Aucune information portée uniquement par la couleur.

---

## 7. Vérifications prévues

Les résultats réels, les commandes et les limites sont consignés dans
[`VERIFICATION.md`](./VERIFICATION.md).

---

## 8. Limites connues

1. **Tunnel absent** : CA2 est couvert par le code et les tests unitaires, pas
   par un e2e réel.
2. **Pas de FAB dans la maquette** : proposition MKT-06.
3. **Bottom-nav future** : risque de doublon WhatsApp.
4. **Placeholder** : `237600000000` n’est pas un vrai numéro.
5. **Pas de source admin** : le numéro reste compilé dans le bundle.
6. **Message produit générique** dans le layout.
7. **Pas de suivi de clic** : aucun événement Meta ajouté, conformément au
   périmètre.
8. **Pas de test lecteur d’écran réel** : VoiceOver/NVDA reste manuel.
9. **Pas de page P11** : le lien d’aide du tunnel reste à spécifier.
