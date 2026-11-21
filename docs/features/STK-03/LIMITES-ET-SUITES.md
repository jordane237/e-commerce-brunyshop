# STK-03 — Limites et suites

## Limites assumées

- **Pas de frontend A03/A06** : l’endpoint et les notifications sont prêts, mais
  le widget d’alerte et la page stock restent à intégrer.
- **Pas d’outbox** : une coupure entre le commit de la commande et l’émission de
  l’événement peut perdre une alerte.
- **Flag posé avant l’envoi** : un échec d’email ne rejoue pas automatiquement
  l’alerte, pour éviter le spam.
- **Retry NTF-01** : `enqueueEmail` ne passe toujours pas d’options de retry
  explicites. Le comportement existant n’est pas modifié par STK-03.
- **Réapprovisionnement hors CAT-04** : un import SQL ou un futur ajustement
  manuel devra appeler la même logique de reset.
- **Seuil global non rétroactif** : modifier le Setting n’altère pas les seuils
  déjà enregistrés sur les variantes existantes.

## Suites recommandées

1. Implémenter les composants A03/A06 et brancher l’endpoint.
2. Ajouter l’affichage du centre de notifications in-app.
3. Introduire un outbox transactionnel pour les alertes critiques.
4. Ajouter le reset d’alerte aux futurs chemins d’ajustement manuel du stock.
5. Revoir la politique de retry des emails internes.
