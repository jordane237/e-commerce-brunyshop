# CNT-03 — Audit des contenus existants

## Tableau d'inventaire

| Contenu | Fichier source | Statut | Placeholders | TODO | Écarts |
|---------|----------------|--------|--------------|------|--------|
| Zones livraison | DSG-05 CONTENUS.md + seed DeliveryZone | ⚠️ Partiel | Frais/délais à valider | Validation propriétaire | Douala Centre 1 500 XAF, Yaoundé 3 000 XAF — à confirmer |
| Politique de retour | DSG-05 CONTENUS.md P25 | ✅ Rédigé | Aucun | Validation juriste | 7 jours, conditions, procédure — OK |
| Politique d'échange de pointure | **ABSENT** | ❌ Manquant | — | — | **CA #2 explicite — à rédiger** |
| FAQ | DSG-05 CONTENUS.md P23 | ✅ Rédigé (18 Q/R) | Aucun | Validation propriétaire | À vérifier exhaustivité (échange pointure, Mobile Money V2) |
| À propos | DSG-05 CONTENUS.md P26 | ⚠️ Partiel | Chiffres, photos équipe | Validation propriétaire | Histoire crédible mais à valider |
| Textes accueil (P01) | CAT-07 + ReassuranceBand | ⚠️ Partiel | — | Validation propriétaire | 4 points réassurance — à affiner |
| CGV | DSG-05 CONTENUS.md P27 | ⚠️ Partiel | RCCM, NIU, adresse | **Validation juriste REQUISE** | À compléter avec données entreprise |
| Politique de confidentialité | DSG-05 CONTENUS.md P27 | ⚠️ Partiel | DPO, email contact | **Validation juriste REQUISE** | À compléter (Mobile Money V2 CNT-07) |
| Mentions légales | DSG-05 CONTENUS.md P27 | ⚠️ Partiel | RCCM, NIU, hébergeur | **Validation juriste REQUISE** | À compléter |
| Contact P22 | DSG-05 P22-contact.md + MKT-02 | ✅ Livré | Coordonnées directes | Validation propriétaire | Formulaire livré, WhatsApp/téléphone placeholders |

## Synthèse

### Contenus rédigés (à valider)
- FAQ (18 Q/R), retours (7 jours, conditions, procédure), à propos (partiel), CGV (partiel), politique de confidentialité (partiel), mentions légales (partiel), contact (livré).

### Contenus manquants (à rédiger)
- **Politique d'échange de pointure** (CA #2 explicite) — absent de MKT-01 et CONTENUS.md
- Textes accueil à affiner (ReassuranceBand 4 points plus précis)

### Données à fournir par le PO
- Frais/délais livraison réels par zone
- Politique d'échange réelle (délai, état article, emballage, qui paie le transport)
- Chiffres à propos (clients, paires livrées, villes couvertes)
- Histoire de l'entreprise (année, fondateur, anecdote)
- Photos équipe (prénoms + rôles)
- Numéro WhatsApp officiel, téléphone, e-mail contact, page Facebook
- RCCM, NIU, adresse siège social, directeur de publication, hébergeur, DPO

### Validations requises
- Propriétaire : tous les contenus (livraison, échange, FAQ, à propos, accueil)
- Juriste : CGV, politique de confidentialité, mentions légales
- **Personne extérieure à l'équipe** : relecture de tous les contenus (CA #4)

### Écarts identifiés
1. Politique d'échange de pointure absente (P25 ne l'aborde qu'en une ligne)
2. FAQ sans Q/R sur l'échange de pointure ni Mobile Money V2
3. ReassuranceBand "Livraison à Douala et Yaoundé" moins précis que P24 (délais par zone)
4. ReassuranceBand "Retours 7 jours" devrait mettre en avant l'échange de pointure
5. À propos sans chiffres (volontaire, à compléter par le PO)
6. Coordonnées contact en placeholder (`+237600000000`)
7. Identité légale incomplète (6 champs CNT-03)
8. Endpoint `GET /delivery-zones` absent (fallback seed)
EOF