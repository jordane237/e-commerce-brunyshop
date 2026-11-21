// order.confirmed.v1.ts
// Template confirmation de commande NTF-01 (statut CONFIRMED).
// Variables : {{firstName}}, {{orderRef}}, {{total}}, {{orderUrl}}, {{supportUrl}}

export const OrderConfirmedV1 = {
  key: 'order.confirmed',
  version: 'v1',
  subject: 'Commande confirmée — {{orderRef}} (BrunyShop)',
  html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Commande confirmée</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f7f4; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    h1 { color: #15803d; font-size: 22px; margin: 0 0 12px; }
    p { color: #444; line-height: 1.6; margin: 0 0 12px; }
    .order-ref { font-size: 14px; letter-spacing: 0.05em; color: #666; }
    .total { font-weight: 700; color: #1a1a1a; font-size: 18px; margin-top: 12px; }
    .actions { text-align: center; margin-top: 18px; }
    a.cta { display: inline-block; background: #e85d04; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600; }
    a.cta:hover { background: #c94a00; }
    .footer { margin-top: 24px; color: #888; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Commande confirmée</h1>
    <p>Bonjour {{firstName}},</p>
    <p>Votre commande a bien été enregistrée. Vous recevrez une autre notification quand le paiement sera confirmé et quand la commande sera expédiée.</p>
    <p class="order-ref">Référence de commande : <strong>{{orderRef}}</strong></p>
    <p class="total">Montant : {{total}} FCFA</p>
    <div class="actions">
      <a class="cta" href="{{orderUrl}}">Suivre ma commande</a>
    </div>
    <div class="footer">
      Besoin d'aide ? <a href="mailto:support@brunyshop.cm">support@brunyshop.cm</a><br>
      L'équipe BrunyShop
    </div>
  </div>
</body>
</html>`,
  text: 'Commande confirmée {{orderRef}} — Montant {{total}} FCFA. Suivre la commande : {{orderUrl}}',
};
