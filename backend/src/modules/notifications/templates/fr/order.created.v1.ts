// order.created.v1.ts
// Accusé de réception envoyé à la création de la commande (ORD-01).
// Le statut est PENDING_CONFIRMATION : on parle de commande « enregistrée »,
// jamais de commande confirmée ou payée (DSG-04 P12).
// Variables : {{customerName}}, {{reference}}, {{total}}, {{supportUrl}}.

export const OrderCreatedV1 = {
  key: 'order.created',
  version: 'v1',
  subject: 'Commande enregistrée — {{reference}} (BrunyShop)',
  html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Commande enregistrée</title>
  <style>
    body { font-family: Arial, sans-serif; background: #fafaf7; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 8px 24px rgba(19,27,46,0.08); }
    h1 { color: #131b2e; font-size: 22px; margin: 0 0 12px; }
    p { color: #3b4353; line-height: 1.6; margin: 0 0 12px; }
    .reference { font-size: 18px; letter-spacing: 0.05em; color: #131b2e; font-weight: 700; }
    .total { font-weight: 700; color: #131b2e; font-size: 18px; margin-top: 12px; }
    .footer { margin-top: 24px; color: #687087; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Merci {{customerName}}, votre commande est enregistrée</h1>
    <p>Nous vous appelons pour confirmer votre commande avant de la préparer.</p>
    <p>Référence de commande : <span class="reference">{{reference}}</span></p>
    <p class="total">Total à régler à la livraison : {{total}} FCFA</p>
    <p>Vous réglez au coursier, après avoir essayé vos chaussures. Aucun paiement en ligne n'est demandé.</p>
    <p class="footer">
      Une question ? Écrivez-nous : <a href="{{supportUrl}}">notre page contact</a>.<br>
      L'équipe BrunyShop
    </p>
  </div>
</body>
</html>`,
  text: 'Merci {{customerName}}, votre commande {{reference}} est enregistrée. Total à régler à la livraison : {{total}} FCFA. Nous vous appelons pour confirmer avant préparation. Une question ? {{supportUrl}}',
};
