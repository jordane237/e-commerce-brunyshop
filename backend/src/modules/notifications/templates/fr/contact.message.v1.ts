// contact.message.v1.ts
// Notification interne envoyée à l'équipe support après une demande MKT-02.
// Variables : contactId, name, email, phone, subjectLabel, orderReference,
// message, submittedAt.

export const ContactMessageV1 = {
  key: 'contact.message',
  version: 'v1',
  subject: '[Contact BrunyShop] {{subjectLabel}} — {{name}}',
  html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Nouveau message de contact</title>
  <style>
    body { font-family: Arial, sans-serif; background: #fafaf7; margin: 0; padding: 24px; }
    .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 8px 24px rgba(19,27,46,0.08); }
    h1 { color: #131b2e; font-size: 22px; margin: 0 0 16px; }
    p { color: #3b4353; line-height: 1.6; margin: 0 0 12px; }
    dt { color: #687087; font-size: 13px; margin-top: 12px; }
    dd { color: #131b2e; margin: 2px 0 0; }
    blockquote { border-left: 3px solid #c89b3c; background: #fbf7ed; margin: 16px 0 0; padding: 12px 16px; white-space: pre-wrap; color: #131b2e; }
    .footer { margin-top: 24px; color: #687087; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Nouveau message de contact</h1>
    <dl>
      <dt>De</dt>
      <dd>{{name}} &lt;<a href="mailto:{{email}}">{{email}}</a>&gt;</dd>
      <dt>Téléphone</dt>
      <dd>{{phone}}</dd>
      <dt>Sujet</dt>
      <dd>{{subjectLabel}}</dd>
      <dt>Référence de commande</dt>
      <dd>{{orderReference}}</dd>
      <dt>Reçu le</dt>
      <dd>{{submittedAt}}</dd>
    </dl>
    <p><strong>Message</strong></p>
    <blockquote>{{message}}</blockquote>
    <p class="footer">Identifiant de la demande : {{contactId}}</p>
  </div>
</body>
</html>`,
  text: 'Nouveau message de contact. De : {{name}} <{{email}}>. Téléphone : {{phone}}. Sujet : {{subjectLabel}}. Référence : {{orderReference}}. Reçu le : {{submittedAt}}. Message : {{message}}. Identifiant : {{contactId}}.',
};
