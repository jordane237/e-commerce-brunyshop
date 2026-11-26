// password.reset.v1.ts
// Template de réinitialisation de mot de passe NTF-01.
// ATTENTION : ce template ne contient PAS de token ; le lien d'action est
// injecté par le contexte d'envoi (orderUrl / personalized link) pour éviter
// la fuite d'un secret dans le corps du message.
// Variables : {{firstName}}, {{actionUrl}}, {{supportUrl}}

export const PasswordResetV1 = {
  key: 'password.reset',
  version: 'v1',
  subject: 'Réinitialisation de mot de passe — BrunyShop',
  html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Réinitialisation du mot de passe</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f7f4; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    h1 { color: #b45309; font-size: 22px; margin: 0 0 12px; }
    p { color: #444; line-height: 1.6; margin: 0 0 12px; }
    .note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 12px 0; font-size: 13px; }
    .actions { text-align: center; margin-top: 18px; }
    a.cta { display: inline-block; background: #e85d04; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600; }
    a.cta:hover { background: #c94a00; }
    .footer { margin-top: 24px; color: #888; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Réinitialisation du mot de passe</h1>
    <p>Bonjour {{firstName}},</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
    <div class="note">
      Ce lien est valable une durée limitée. Si vous ne demandez pas cette réinitialisation, ignorez simplement ce message.
    </div>
    <div class="actions">
      <a class="cta" href="{{actionUrl}}">Réinitialiser mon mot de passe</a>
    </div>
    <p style="text-align:center; margin-top: 18px;">
      Ou copiez ce lien dans votre navigateur :<br>
      <a href="{{actionUrl}}">{{actionUrl}}</a>
    </p>
    <div class="footer">
      Besoin d'aide ? <a href="mailto:support@brunyshop.cm">support@brunyshop.cm</a><br>
      L'équipe BrunyShop
    </div>
  </div>
</body>
</html>`,
  text: "Réinitialisation du mot de passe BrunyShop. Liez : {{actionUrl}}. Si vous n'avez pas demandé cela, ignorez ce message.",
};
