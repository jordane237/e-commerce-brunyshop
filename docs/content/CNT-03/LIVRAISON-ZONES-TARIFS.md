# CNT-03 — Zones, tarifs et délais de livraison (CA #1)

## Zones et tarifs proposés

Basés sur le seed `delivery-zones.seed.ts` (TEC-06/TEC-07) et le réalisme du marché camerounais. **Tous les frais et délais sont des propositions à valider par le propriétaire.**

| Zone | Villes / Quartiers | Tarif (XAF) | Délai estimé | Statut |
|------|--------------------|-------------|--------------|--------|
| Douala Centre | Akwa, Bonanjo, Bonapriso, Deido, Bali, Bonabéri | 1 500 | 1-2 jours ouvrés | [À confirmer] |
| Douala Périphérie | Logbessou, Ndogbong, PK14, Bonadoum, Ndogpassi, Akwa Nord, Yabeta | 2 500 | 2-3 jours ouvrés | [À confirmer] |
| Yaoundé | Bastos, Centre-ville, Mvog-Mbi, Mvan, Nlongkak, Odza | 3 000 | 3-4 jours ouvrés | [À confirmer] |
| Bafoussam | Bafoussam centre + périphérie | 4 000 | 4-5 jours ouvrés | [À confirmer] |
| Autres régions | Bamenda, Buea, Limbe, Garoua, Ngaoundéré, Maroua, Bertoua, Ebolowa, Kribi | 5 000 | 5-7 jours ouvrés | [À confirmer] |
| Retrait en boutique | [Adresse boutique — à confirmer] | 0 (gratuit) | Immédiat / sous 24 h | [À confirmer] |

> ⚠️ Les frais et délais ci-dessus sont des **propositions** basées sur le seed technique. Le propriétaire doit les valider (rentabilité, coûts réels de transport) avant mise en production. Les prix ne doivent pas être présentés comme contractuels tant que le checkout ne les recalcule pas.

## Règles de livraison

- **Jours ouvrés** : lundi-vendredi uniquement, hors jours fériés camerounais.
- **Confirmation** : chaque commande est confirmée par téléphone ou WhatsApp avant préparation/expédition.
- **Suivi** : chaque commande reçoit une référence (format `BRN-AAAA-XXXX`) pour le suivi (page P13 à créer).
- **Notifications** : WhatsApp/SMS à l'expédition (NTF-01).
- **Créneaux** : [matin 8h-12h / après-midi 14h-18h / à convenir — à confirmer par le propriétaire].
- **Échec de livraison** : si le client est absent, nouvelle tentative sous [48 h — à confirmer]. Frais supplémentaires possibles [à confirmer].
- **Colis volumineux** : supplément pour commandes de plus de [X paires — à confirmer].
- **Livraison gratuite** : [à partir de X XAF d'achat ? À confirmer] — non retenue par défaut (aucun seuil défini).
- **Livraison internationale** : [non disponible au MVP / disponible vers CEMAC — à confirmer].
- **Ville non desservie** : "Nous ne livrons pas encore cette ville. Écrivez-nous : nous étudions les demandes." (P24).

## Modes de paiement

| Mode | Disponibilité | Détail |
|------|---------------|--------|
| Cash on Delivery (COD) | MVP — toutes zones [à confirmer] | Paiement à la livraison, en espèces ou par Mobile Money au moment de la réception, après vérification du colis |
| Mobile Money (V2) | Futur — CNT-07 en cours | MTN MoMo / Orange Money via agrégateur (Campay, CinetPay, etc.) — [disponible à partir de quand ? À confirmer] |
| Carte bancaire (V3) | Futur | Non MVP |

## Cohérence avec les maquettes

- **P24** (Livraison) : tableau zones avec délais et frais, 4 étapes, paiement à la livraison, suivi, hors zone — aligné avec ce document.
- **P01** (Home ReassuranceBand) : "Livraison à Douala et Yaoundé" → à affiner avec les délais précis (cf. CONTENUS-CONSOLIDES.md).
- **P25** (Retours) : "Le coursier vous livre et vous payez" → cohérent avec COD.

## Notes techniques

- L'endpoint `GET /delivery-zones` n'existe pas encore ; le tableau utilise le fallback seed (5 zones).
- Les frais affichés sont indicatifs ; le checkout recalcule selon la zone choisie.
- Aucun simulateur de frais en MVP ; le calcul se fait au checkout.
EOF