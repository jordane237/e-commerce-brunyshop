# CNT-01 — Convention de Nomination & Arborescence des Photos Produits

## Convention de Nomination Obligatoire

**Format** : `modele-couleur-angle.ext`

| Composant | Description | Exemple |
|-----------|-------------|---------|
| **modele** | Slug kebab-case du produit | `air-max-90`, `stan-smith`, `chuck-taylor` |
| **couleur** | Slug kebab-case de la couleur | `noir`, `blanc`, `rouge`, `bleu-marine`, `gris-clair` |
| **angle** | Parmi les 6 angles définis | `face`, `profil`, `dessus`, `semelle`, `detail`, `porte` |
| **extension** | `.jpg` (source) ou `.webp` (optimisé) | `.jpg`, `.webp` |

### Exemples valides

- `air-max-90-noir-face.jpg`
- `air-max-90-noir-face.webp`
- `stan-smith-blanc-detail.webp`
- `chuck-taylor-noir-profil.jpg`

### Regex stricte

```
^[a-z0-9]+(-[a-z0-9]+)*-(face|profil|dessus|semelle|detail|porte)\.(jpg|jpeg|webp)$
```

### Interdits (à proscrire)

- ✗ Espaces dans le nom de fichier
- ✗ Majuscules (A-Z)
- ✗ Accents (é, à, ù, etc.)
- ✗ Caractères spéciaux (`!@#$%^&*()`)
- ✗ underscores (`_`)
- ✗ Numérotation libre (`product_01`, `img_23`)