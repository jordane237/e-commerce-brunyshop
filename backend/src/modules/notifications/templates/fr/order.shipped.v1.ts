// order.shipped.v1.ts
// Template expédition de commande NTF-01 (statut SHIPPED).
// Variables : {{firstName}}, {{orderRef}}, {{carrier}}, {{trackingUrl}}, {{estimatedDays}}, {{supportUrl}}

export const OrderShippedV1 = {
  key: 'order.shipped',
  version: 'v1',
  subject: 'Votre commande {{orderRef}} est expédiée',
  html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Votre commande est expédiée</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f7f4; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    h1 { color: #2563eb; font-size: 22px; margin: 0 0 12px; }
    p { color: #444; line-height: 1.6; margin: 0 0 12px; }
    .order-ref { font-size: 14px; color: #666; }
    .carrier { background: #eff6ff; border-radius: 8px; padding: 12px; margin: 12px 0; }
    .actions { text-align: center; margin-top: 18px; }
    a.cta { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600; }
    a.cta:hover { background: #1d4ed8; }
    .footer { margin-top: 24px; color: #888; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Votre commande est en route</h1>
    <p>Bonjour {{firstName}},</p>
    <p>Bonne nouvelle : votre commande a été expédiée.</p>
    <p class="order-ref">Référence de commande : <strong>{{orderRef}}</strong></p>
    <div class="carrier">
      <strong>Transporteur :</strong> {{carrier}}<br>
      <strong>Délai estimé :</strong> {{estimatedDays}} jours ouvrés<br>
      <a href="{{trackingUrl}}">Suivre la livraison</a>
    </div>
    <div class="actions">
      <a class="cta" href="{{trackingUrl}}">Suivre la livraison</a>
    </div>
    <div class="footer">
      Questions ? <a href="mailto:support@brunyshop.cm">support@brunyshop.cm</a><br>
      L'équipe BrunyShop
    </div>
  </div>
</body>
</html>`,
  text: 'Votre commande {{orderRef}} est expédiée par {{carrier}}. Estimation : {{estimatedDays}} jours. Suivre : {{trackingUrl}}',
};
