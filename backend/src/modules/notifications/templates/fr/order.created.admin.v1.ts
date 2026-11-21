// order.created.admin.v1.ts
// Notification interne : une nouvelle commande attend une confirmation
// téléphonique (ORD-01). Variables : {{reference}}, {{customerName}},
// {{customerPhone}}, {{total}}, {{itemCount}}, {{itemsSummary}}, {{createdAt}}.

export const OrderCreatedAdminV1 = {
  key: 'order.created.admin',
  version: 'v1',
  subject: 'Nouvelle commande {{reference}} — {{total}} FCFA',
  html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Nouvelle commande</title>
  <style>
    body { font-family: Arial, sans-serif; background: #fafaf7; margin: 0; padding: 24px; }
    .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 8px 24px rgba(19,27,46,0.08); }
    h1 { color: #131b2e; font-size: 22px; margin: 0 0 16px; }
    dt { color: #687087; font-size: 13px; margin-top: 12px; }
    dd { color: #131b2e; margin: 2px 0 0; }
    pre { background: #f4f4f1; border-radius: 8px; padding: 12px 16px; white-space: pre-wrap; color: #131b2e; }
    .footer { margin-top: 24px; color: #687087; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Nouvelle commande à confirmer</h1>
    <dl>
      <dt>Référence</dt>
      <dd>{{reference}}</dd>
      <dt>Client</dt>
      <dd>{{customerName}}</dd>
      <dt>Téléphone</dt>
      <dd>{{customerPhone}}</dd>
      <dt>Total</dt>
      <dd>{{total}} FCFA</dd>
      <dt>Articles</dt>
      <dd>{{itemCount}}</dd>
      <dt>Reçue le</dt>
      <dd>{{createdAt}}</dd>
    </dl>
    <p><strong>Détail</strong></p>
    <pre>{{itemsSummary}}</pre>
    <p class="footer">Paiement à la livraison. Appeler le client pour confirmer avant préparation.</p>
  </div>
</body>
</html>`,
  text: 'Nouvelle commande {{reference}} — {{customerName}} ({{customerPhone}}) — {{total}} FCFA — {{itemCount}} article(s) — {{createdAt}}. Détail : {{itemsSummary}}',
};
