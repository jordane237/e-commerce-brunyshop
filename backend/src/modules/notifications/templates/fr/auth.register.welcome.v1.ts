// auth.register.welcome.v1.ts
// Template de bienvenue post-inscription NTF-01.
// Variables : {{firstName}}, {{lastName}}, {{catalogUrl}}, {{supportUrl}}

export const AuthRegisterWelcomeV1 = {
  key: 'auth.register.welcome',
  version: 'v1',
  subject: 'Bienvenue chez BrunyShop, {{firstName}} !',
  html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Bienvenue chez BrunyShop</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f7f4; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    h1 { color: #1a1a1a; font-size: 22px; margin: 0 0 12px; }
    p { color: #444; line-height: 1.6; margin: 0 0 12px; }
    a.cta { display: inline-block; background: #e85d04; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600; }
    a.cta:hover { background: #c94a00; }
    .footer { margin-top: 24px; color: #888; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Bienvenue {{firstName}} {{lastName}} !</h1>
    <p>Votre compte <strong>BrunyShop</strong> a bien été créé.</p>
    <p>Découvrez notre catalogue de chaussures et chaussages :</p>
    <p style="text-align:center; margin-top: 18px;">
      <a class="cta" href="{{catalogUrl}}">Voir le catalogue</a>
    </p>
    <p>Besoin d'aide ? Contactez notre support : <a href="mailto:support@brunyshop.cm">support@brunyshop.cm</a>.</p>
    <div class="footer">
      À bientôt,<br>
      L'équipe BrunyShop
    </div>
  </div>
</body>
</html>`,
  text: 'Bienvenue {{firstName}} {{lastName}} ! Votre compte BrunyShop est créé. Catalogue : {{catalogUrl}}',
};
