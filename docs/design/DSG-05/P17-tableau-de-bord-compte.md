# P17 — Tableau de bord du compte

> DSG-05 · groupe Compte · route `/compte`
> Endpoints : `GET /me` **existant** ; `GET /orders`, `GET /addresses`, `GET /wishlist` **à créer**.

---

## 1. Objectif & rôle

Donner en un écran une vue d'ensemble de la relation client : identité, commande en cours, dernières commandes, adresses et favoris. C'est le hub de navigation du compte, pas une page de configuration.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header storefront avec « Compte » actif.
2. Fil d'Ariane « Accueil › Mon compte ».
3. `h1` « Bonjour Jean-Paul » + sous-titre « Voici l'essentiel de votre compte. ».
4. **Carte profil navy** : avatar à initiales, nom, téléphone masqué, badge « Vérifié », lien « Modifier » vers P19.
5. **Raccourcis** : 4 tuiles 2 × 2 — Commandes (n), Adresses (n), Favoris (n), Profil.
6. **Commande en cours** (si existe) : référence, badge de statut, total, estimation, CTA « Suivre ma commande ».
7. **Dernières commandes** : 2 lignes maximum + « Voir toutes mes commandes ».
8. **Adresse par défaut** : carte compacte + « Gérer mes adresses ».
9. **Besoin d'aide ?** : carte avec liens FAQ, contact, WhatsApp.
10. Bouton « Se déconnecter » en bas, style ghost danger.
11. Bottom nav avec « Compte » actif.

### 768 px

- Onglets horizontaux : Vue d'ensemble, Commandes, Profil, Adresses, Favoris.
- Grille 2 colonnes : profil + raccourcis à gauche, commande en cours à droite.
- Dernières commandes en pleine largeur.

### 1280 px

```text
┌──────────────────────────────────────────────────────────────┐
│ Header storefront                                             │
├──────────────┬───────────────────────────────────────────────┤
│ MON COMPTE   │ Bonjour Jean-Paul                             │
│ Vue d'ensemble│ ┌─────────────┐ ┌──────────────────────────┐ │
│ Commandes    │ │ Profil navy │ │ Commande en cours        │ │
│ Profil       │ └─────────────┘ │ statut + total + suivi   │ │
│ Adresses     │ ┌────┬────┬────┐ └──────────────────────────┘ │
│ Favoris      │ │Cmd │Adr │Fav │ Dernières commandes          │ │
│ Déconnexion  │ └────┴────┴────┘ Adresse par défaut          │ │
│              │ Besoin d'aide ?                               │ │
└──────────────┴───────────────────────────────────────────────┘
```

- Sidebar 240 px fixe, contenu 900 px, conteneur 1 200 px.

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `AccountNav` | NOUVEAU | sidebar / tabs | actif |
| `Avatar` | NOUVEAU | lg, initiales | — |
| `Badge` | TEC-10 | success, warning, neutral | — |
| `Button` | TEC-10 | primary, ghost, danger | normal, loading |
| `AddressCard` | NOUVEAU (DSG-04) | compact | — |
| `StatutBadge` | NOUVEAU | sémantique | — |
| `EmptyState` | NOUVEAU | compact | — |
| `Skeleton` | TEC-10 | carte, ligne | — |
| `Breadcrumb` | NOUVEAU | — | — |

---

## 4. États obligatoires

- **Chargement** : skeleton du profil, des tuiles et de la commande ; navigation immédiatement visible.
- **Vide** : aucune commande → module « Votre première commande vous attend » + CTA boutique ; aucune adresse → « Ajoutez une adresse pour commander plus vite ».
- **Erreur** : `GET /me` en échec → page d'erreur locale avec « Réessayer » ; module secondaire en échec → carte « Impossible de charger… » sans casser la page.
- **Succès** : données affichées, toast après mise à jour du profil.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Session expirée (401) | Redirection P14 avec « Votre session a expiré. Reconnectez-vous. » |
| Profil indisponible | « Impossible de charger votre profil. Réessayez. » |
| Commandes indisponibles | « Vos commandes ne peuvent pas être affichées pour le moment. » |
| Adresses indisponibles | « Vos adresses ne peuvent pas être affichées pour le moment. » |
| Réseau | « Connexion interrompue. Vérifiez votre connexion puis réessayez. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Bonjour {prénom} | chaleureux | `h1` |
| Sous-titre | Voici l'essentiel de votre compte. | neutre | — |
| Badge | Vérifié | confiance | texte + icône |
| Lien profil | Modifier | action | — |
| Tuile commandes | Mes commandes | neutre | lien |
| Tuile adresses | Mes adresses | neutre | lien |
| Tuile favoris | Mes favoris | neutre | lien |
| Tuile profil | Mon profil | neutre | lien |
| Commande en cours | Commande en cours | info | `h2` |
| CTA suivi | Suivre ma commande | action | — |
| Dernières commandes | Dernières commandes | neutre | `h2` |
| Voir tout | Voir toutes mes commandes | action | — |
| Adresse | Adresse par défaut | neutre | `h2` |
| Gérer | Gérer mes adresses | action | — |
| Aide titre | Besoin d'aide ? | chaleureux | `h2` |
| Aide corps | Consultez la FAQ ou écrivez-nous : nous répondons du lundi au samedi. | aide | — |
| Déconnexion | Se déconnecter | action | — |
| Vide commandes | Votre première commande vous attend. | encourageant | — |
| Vide adresses | Ajoutez une adresse pour commander plus vite. | aide | — |

---

## 6. Interactions & comportements

- Les tuiles sont des liens vers P18, P20, P21, P19.
- La carte commande en cours ouvre P18b ; le CTA peut ouvrir P13 (suivi public) si la commande est expédiée.
- « Se déconnecter » ouvre un `ConfirmDialog` léger « Se déconnecter ? » ; confirmation → `POST /auth/logout` → `/boutique`.
- Les compteurs proviennent des réponses API ; en cas d'échec, afficher « — » plutôt qu'un faux zéro.
- Rafraîchissement au retour sur l'écran (navigation interne).
- Aucun module ne bloque le reste de la page en cas d'erreur isolée.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` nominatif, un seul par page.
- Tuiles : liens avec libellé complet, pas seulement une icône.
- Sidebar : `nav aria-label="Navigation du compte"`, page active `aria-current="page"`.
- Onglets mobile : `role="tablist"` si utilisés, sinon liste de liens.
- Skeleton : `aria-busy="true"` sur la région, texte « Chargement de votre compte… ».
- Erreurs de module : `role="status"` non intrusif.
- Cibles ≥ 44 px, contraste AA, focus visible.
- Ordre de tabulation : navigation → profil → tuiles → commande → aide → déconnexion.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Profil | `GET /me` **existant** | Erreur + réessayer |
| Commandes récentes | `GET /orders?limit=3` **à créer** | Module vide + erreur locale |
| Commande en cours | `GET /orders?status=active` **à créer** | Module masqué |
| Adresses | `GET /addresses` **à créer** | Module masqué |
| Favoris | `GET /wishlist` **à créer** | Compteur « — » |

`GET /me` renvoie : `id`, `email`, `phone`, `firstName`, `lastName`, `status`, `roles`.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Zone K sans sidebar | Sidebar desktop, onglets mobile |
| « Cercle Prestige » non modélisé | Retiré du dashboard |
| « 2 commandes » incohérent | Compteur calculé depuis l'API |
| « Concierge dédié » | Remplacé par le bloc « Besoin d'aide ? » |
| Pas de lien compte dans le header | À ajouter (ticket implémentation) |

---

## 10. Wireframe de référence

Zone K de `design1/bruny shopping/bruny shopping.png` (3416, 800, 396 × 1740), réinterprétée avec navigation et états.
