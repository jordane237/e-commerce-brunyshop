// stock.low.v1.ts
// Alerte interne de stock bas (STK-03).
// Variables : {{productName}}, {{sku}}, {{size}}, {{color}},
// {{currentStock}}, {{availableStock}}, {{threshold}}, {{stockUrl}}
// Les libellés reprennent le glossaire DSG-07, sans texte marketing inventé.

export const StockLowV1 = {
  key: 'stock.low',
  version: 'v1',
  subject: 'Stock bas — {{productName}} ({{size}})',
  html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Stock bas</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f7f4; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border-top: 4px solid #b98500; }
    h1 { color: #8a6200; font-size: 22px; margin: 0 0 12px; }
    p { color: #444; line-height: 1.6; margin: 0 0 12px; }
    .details { background: #fff3d6; border-radius: 8px; padding: 12px 16px; margin: 16px 0; }
    .details strong { color: #1a1a1a; }
    .actions { margin-top: 18px; }
    a.cta { display: inline-block; background: #e85d04; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600; }
    .footer { margin-top: 24px; color: #888; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Stock bas</h1>
    <p>{{productName}} — pointure {{size}}, couleur {{color}}.</p>
    <div class="details">
      <p>Stock actuel : <strong>{{currentStock}}</strong></p>
      <p>Disponible : <strong>{{availableStock}}</strong></p>
      <p>Seuil d’alerte : <strong>{{threshold}}</strong></p>
      <p>SKU : <strong>{{sku}}</strong></p>
    </div>
    <p>Plus que {{availableStock}} en stock.</p>
    <div class="actions">
      <a class="cta" href="{{stockUrl}}">Réapprovisionner</a>
    </div>
    <div class="footer">Alerte interne BrunyShop.</div>
  </div>
</body>
</html>`,
  text: 'Stock bas — {{productName}} ({{size}}, {{color}}). Stock actuel : {{currentStock}}. Disponible : {{availableStock}}. Seuil d’alerte : {{threshold}}. SKU : {{sku}}. Réapprovisionner : {{stockUrl}}',
};
