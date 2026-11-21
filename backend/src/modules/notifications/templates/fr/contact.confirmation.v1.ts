// contact.confirmation.v1.ts
// Accusé de réception envoyé au visiteur après une demande MKT-02.
// Variables : name, subjectLabel.

export const ContactConfirmationV1 = {
  key: 'contact.confirmation',
  version: 'v1',
  subject: 'Nous avons bien reçu votre message — BrunyShop',
  html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Votre message a bien été reçu</title>
  <style>
    body { font-family: Arial, sans-serif; background: #fafaf7; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 8px 24px rgba(19,27,46,0.08); }
    h1 { color: #131b2e; font-size: 22px; margin: 0 0 12px; }
    p { color: #3b4353; line-height: 1.6; margin: 0 0 12px; }
    .footer { margin-top: 24px; color: #687087; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Merci {{name}}, nous avons bien reçu votre message.</h1>
    <p>Votre demande concerne : <strong>{{subjectLabel}}</strong>.</p>
    <p>Notre équipe vous répondra à l'adresse indiquée sous 24 h ouvrées.</p>
    <p>Pour une question urgente, vous pouvez aussi nous joindre sur WhatsApp ou par téléphone depuis la page Contact.</p>
    <p class="footer">À bientôt,<br />L'équipe BRUNY SHOPPING</p>
  </div>
</body>
</html>`,
  text: 'Merci {{name}}, nous avons bien reçu votre message concernant {{subjectLabel}}. Notre équipe vous répondra à l’adresse indiquée sous 24 h ouvrées. À bientôt, l’équipe BRUNY SHOPPING.',
};
