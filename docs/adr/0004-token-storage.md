# ADR 0004 — Stockage des jetons

- Statut : accepté
- Décision : access JWT court en mémoire; refresh token opaque en cookie HttpOnly, rotation côté API et empreinte hachée persistée.
- Motif : ne pas exposer les jetons au stockage persistant JavaScript et permettre révocation/détection de réutilisation côté serveur. Les protections CSRF doivent être adaptées au domaine et au déploiement réels.
