# CNT-07 — Politique de sécurité des clés API Mobile Money

## Principes
- **Zéro clé dans le repo** : aucune clé API (test ou production) ne doit être commitée, même dans `.env.example`. Utiliser des placeholders `CHANGEME_*` et stocker les vraies clés dans un gestionnaire de secrets.
- **Zéro clé dans les documents** : les clés ne doivent pas apparaître dans `docs/`, dans les emails, dans Slack ou dans les tickets. Uniquement dans le gestionnaire de secrets.
- **Zéro clé partagée avec un tiers non autorisé** : le partage de clés (même de test) est interdit. Si un prestataire exige un partage, utiliser un canal chiffré et documenter l'incident.
- **Principe du moindre privilège** : chaque clé a les permissions minimales nécessaires (sandbox ≠ production, lecture ≠ écriture, clé de webhook séparée).
- **Rotation régulière** : rotation des clés tous les 90 jours (ou immédiatement en cas de suspicion de fuite).
- **Audit** : toutes les utilisations de clés sont loguées via `AuditService` (`PAYMENT_KEY_USED`, `PAYMENT_KEY_ROTATED`, `PAYMENT_KEY_COMPROMISED`).

## Environnements
- **Sandbox (dev/test)** : clés de test fournies par le prestataire, jamais en production, stockées dans `.env.local` (gitignored) ou le gestionnaire de secrets de dev.
- **Production** : clés de production uniquement dans le gestionnaire de secrets de production, jamais sur le poste du développeur, jamais dans les logs, jamais dans les erreurs.
- **Séparation stricte** : les clés de sandbox et de production sont différentes et ne se croisent jamais.

## Gestionnaire de secrets (recommandation)
- **MVP** : variables d'environnement injectées par la plateforme de déploiement (Docker secrets, Kubernetes secrets, ou `.env.production` chiffré avec `sops` + `age` — OPS-01).
- **V2** : gestionnaire de secrets dédié (HashiCorp Vault, AWS Secrets Manager, Infisical, Doppler, etc.) avec rotation automatique.
- **Accès** : 2 personnes maximum (dirigeant + lead technique), avec MFA obligatoire et audit des accès.

## Stockage des clés
- **Format** : paires clé-valeur (ex : `MOBILE_MONEY_PROVIDER_API_KEY`, `MOBILE_MONEY_PROVIDER_WEBHOOK_SECRET`).
- **Chiffrement** : au repos (AES-256) et en transit (TLS 1.3).
- **Variables d'env** : le code lit les clés via `ConfigService` (TEC-04), jamais de `process.env.MOMO_KEY` direct.
- **Validation au boot** : Joi validation (TEC-04) — si une clé est manquante en production, le backend refuse de démarrer (fail-fast).

## Rotation et révocation
- **Rotation trimestrielle** : générer une nouvelle clé chez le prestataire, déployer, révoquer l'ancienne après 7 jours de grâce.
- **Révocation immédiate** : en cas de fuite suspectée, révoquer la clé immédiatement chez le prestataire, générer une nouvelle, déployer, auditer les transactions des 24 dernières heures.
- **Documentation** : chaque rotation est documentée dans `docs/business/CNT-07/ROTATION-LOG.md` (date, clé révoquée (hash), nouvelle clé (hash), raison, opérateur).

## Gestion des incidents
- **Procédure** : (1) détection, (2) confinement (révocation clé), (3) investigation (audit logs), (4) correction, (5) communication (autorités si fuite de données), (6) post-mortem.
- **Contact** : le prestataire a un contact sécurité (email `security@provider.com` ou hotline) — à documenter.
- **Notification** : si fuite de clé de production → notifier le prestataire immédiatement, les autorités compétentes si données personnelles concernées.

## Webhooks
- **Signature** : chaque webhook doit être signé par le prestataire (HMAC-SHA256 avec un secret partagé). Le backend vérifie la signature avant de traiter (rejet 401 si signature invalide).
- **Secret** : le secret de webhook est une clé distincte de la clé API (rotation séparée).
- **Idempotence** : le backend doit être idempotent (un webhook peut être réémis — utiliser `providerRef` unique pour détecter les doublons).
- **Audit** : chaque webhook reçu est logué (payload hash, signature valide/invalide, action prise).

## Audit et conformité
- **Audit trail** (AUT-08) : toutes les actions sensibles sur les clés (création, rotation, révocation, utilisation) sont auditées avec `AuditService.logSensitiveChange`.
- **Logs** : jamais de clé en clair dans les logs (masquer `apiKey`, `secret`, `webhookSecret` via `redact` pino — TEC-04).
- **Conformité** : respecter les exigences du prestataire (KYC, PCI-DSS si cartes, COBAC/BEAC pour Mobile Money).
EOF