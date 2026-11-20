# CNT-03 — Checklist de validation (CA #4)

## Données à fournir par le propriétaire

| # | Donnée | Où | Responsable | Statut |
|---|--------|-----|-------------|--------|
| 1 | Frais de livraison réels par zone (Douala Centre, Périphérie, Yaoundé, Bafoussam, autres) | LIVRAISON-ZONES-TARIFS.md | PO | ⏳ |
| 2 | Délais de livraison réels par zone | LIVRAISON-ZONES-TARIFS.md | PO | ⏳ |
| 3 | Politique d'échange : délai (7j ? 14j ? 30j ?) | POLITIQUE-ECHANGE-POINTURE.md | PO | ⏳ |
| 4 | Politique d'échange : état article accepté (essayé ? boîte abîmée ?) | POLITIQUE-ECHANGE-POINTURE.md | PO | ⏳ |
| 5 | Politique d'échange : qui paie le transport (défaut vs convenance) | POLITIQUE-ECHANGE-POINTURE.md | PO | ⏳ |
| 6 | Adresse de retour (physique) | POLITIQUE-ECHANGE-POINTURE.md | PO | ⏳ |
| 7 | Frais de livraison offerts à partir de X XAF ? | LIVRAISON-ZONES-TARIFS.md | PO | ⏳ |
| 8 | Numéro WhatsApp officiel | CONTENUS-CONSOLIDES.md | PO | ✅ (+237 6 79 17 62 96) |
| 9 | Numéro téléphone officiel | CONTENUS-CONSOLIDES.md | PO | ⏳ |
| 10 | E-mail contact officiel | CONTENUS-CONSOLIDES.md | PO | ⏳ |
| 11 | Page Facebook officielle URL | CONTENUS-CONSOLIDES.md | PO | ✅ (profile.php?id=100087026340515) |
| 12 | Histoire de l'entreprise (année, fondateur, anecdote) | CONTENUS-CONSOLIDES.md | PO | ⏳ |
| 13 | Chiffres (+X clients, X paires livrées) | CONTENUS-CONSOLIDES.md | PO | ⏳ |
| 14 | Photos équipe (prénoms + rôles) | CONTENUS-CONSOLIDES.md | PO | ⏳ |
| 15 | RCCM | Mentions légales | PO | ⏳ |
| 16 | NIU | Mentions légales | PO | ⏳ |
| 17 | Adresse siège social | Mentions légales | PO | ⏳ |
| 18 | Directeur de publication | Mentions légales | PO | ⏳ |
| 19 | Hébergeur (nom, adresse, tél) | Mentions légales | PO | ⏳ |
| 20 | DPO / e-mail contact RGPD | Politique de confidentialité | PO | ⏳ |

## Validations requises

| # | Validation | Contenu | Responsable | Statut |
|---|------------|---------|-------------|--------|
| 1 | Validation propriétaire | Tous les contenus (livraison, échange, FAQ, à propos, accueil) | PO | ⏳ |
| 2 | Validation juridique | CGV, Politique de confidentialité, Mentions légales | **Juriste** | ⏳ **REQUIS** |
| 3 | **Relecture par une personne extérieure à l'équipe** (CA #4) | Tous les contenus | **Relecteur externe** | ⏳ **REQUIS** |

## Checklist de relecture externe (CA #4)

La personne extérieure à l'équipe doit vérifier :

- [ ] **Clarté** : le texte est-il compréhensible par un client non-technique ?
- [ ] **Français** : orthographe, grammaire, ton (vouvoiement, chaleureux professionnel) ?
- [ ] **Complétude** : toutes les questions client sont-elles traitées ?
- [ ] **Cohérence** : les informations sont-elles cohérentes entre les pages (livraison vs FAQ vs CGV) ?
- [ ] **Réalisme** : les délais, frais, procédures sont-ils réalistes pour le Cameroun ?
- [ ] **Conformité** : pas de promesse impossible, pas de clause abusive ?
- [ ] **Longueur** : ni trop court (incomplet), ni trop long (personne ne lit) ?
- [ ] **Ton** : cohérent avec l'image de marque BrunyShop ?

**Signature du relecteur** : `[Nom, date, version relue]`

## Étapes suivantes (après validation)

1. [ ] Intégrer les contenus validés dans les pages MKT-01 (mise à jour `docs/design/DSG-05/CONTENUS.md` + composants Angular `features/info/*` et `features/legal/*`)
2. [ ] Mettre à jour `fr-CM.json` (TEC-13) avec les textes définitifs
3. [ ] Mettre à jour `CONTENT-VALIDATION.md` (MKT-01) avec le statut réel
4. [ ] Test manuel des pages (MKT-01) avec les nouveaux contenus
5. [ ] Validation finale propriétaire + juriste + relecteur externe
EOF