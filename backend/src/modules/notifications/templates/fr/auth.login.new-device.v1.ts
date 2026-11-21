// auth.login.new-device.v1.ts
// Template d'alerte connexion sur nouvel appareil NTF-01.
// Variables : {{firstName}}, {{device}}, {{ip}}, {{timestamp}}, {{supportUrl}}

export const AuthLoginNewDeviceV1 = {
  key: 'auth.login.new-device',
  version: 'v1',
  subject: 'Nouvelle connexion sur votre compte BrunyShop',
  html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Nouvelle connexion</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f7f4; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    h1 { color: #b45309; font-size: 22px; margin: 0 0 12px; }
    p { color: #444; line-height: 1.6; margin: 0 0 12px; }
    .info { background: #fff7ed; border-left: 4px solid #e85d04; padding: 12px; margin: 12px 0; }
    .info code { background: #fff; padding: 2px 6px; border-radius: 4px; color: #c2410c; }
    .actions { text-align: center; margin-top: 18px; }
    a.cta { display: inline-block; background: #e85d04; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600; }
    a.cta:hover { background: #c94a00; }
    .footer { margin-top: 24px; color: #888; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Nouvelle connexion détectée</h1>
    <p>Bonjour {{firstName}},</p>
    <p>Une connexion a été détectée depuis un nouvel appareil. Si cela vous concerne, aucune action n'est requise.</p>
    <div class="info">
      <strong>Appareil :</strong> {{device}}<br>
      <strong>Adresse IP :</strong> {{ip}}<br>
      <strong>Date :</strong> {{timestamp}}
    </div>
    <p>Si ce n'est pas vous, changez immédiatement votre mot de passe et contactez le support.</p>
    <div class="actions">
      <a class="cta" href="{{supportUrl}}">Contacter le support</a>
    </div>
    <div class="footer">
      L'équipe BrunyShop
    </div>
  </div>
</body>
</html>`,
  text: "Nouvelle connexion BrunyShop : appareil {{device}}, IP {{ip}}, le {{timestamp}}. Si ce n'est pas vous, changez votre mot de passe.",
};
