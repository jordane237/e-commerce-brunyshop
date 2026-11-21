// order.delivered.v1.ts
// Template livraison de commande NTF-01 (statut DELIVERED).
// Variables : {{firstName}}, {{orderRef}}, {{supportUrl}}

export const OrderDeliveredV1 = {
  key: 'order.delivered',
  version: 'v1',
  subject: 'Commande livrée — {{orderRef}} (BrunyShop)',
  html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Commande livrée</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f7f4; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    h1 { color: #15803d; font-size: 22px; margin: 0 0 12px; }
    p { color: #444; line-height: 1.6; margin: 0 0 12px; }
    .order-ref { font-size: 14px; color: #666; }
    .actions { text-align: center; margin-top: 18px; }
    a.cta { display: inline-block; background: #e85d04; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600; }
    a.cta:hover { background: #c94a00; }
    .footer { margin-top: 24px; color: #888; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Votre commande est livrée</h1>
    <p>Bonjour {{firstName}},</p>
    <p>Votre commande {{orderRef}} a été livrée. Merci de votre achat sur BrunyShop.</p>
    <p class="order-ref">Référence : <strong>{{orderRef}}</strong></p>
    <div class="actions">
      <a class="cta" href="{{supportUrl}}">Écrire au support</a>
    </div>
    <div class="footer">
      Vos retours nous aident à nous améliorer.<br>
      L'équipe BrunyShop
    </div>
  </div>
</body>
</html>`,
  text: 'Votre commande {{orderRef}} est livrée. Merci de votre achat sur BrunyShop.',
};
