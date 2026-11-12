# API d'inscription client — POST /api/v1/auth/register

Authentification et sécurité — AUT-01 | Priorité MVP

---

## Description

Crée un compte client avec un e-mail **ou** un téléphone (+237). Le mot de passe est haché avec **Argon2id** (64 MB / time 3 / parallelism 1). Le compte est créé avec le statut `PENDING_VERIFICATION` et un rôle `CUSTOMER`.

> **Attention : cas de doublon.** Si l'email ou le téléphone existe déjà, la réponse est **201 neutre** (même structure, même message) et **aucun nouveau User n'est créé**. Cela empêche l'énumération de comptes.

---

## Payload demandé

| Champ | Type | Obligatoire | Exemple | Notes |
|---|---|---|---|---|
| `email` | string | non | `client@example.cm` | Facultatif si `phone` fourni |
| `phone` | string | non | `+237612345678` | Format strict `+237` suivi de 9 chiffres |
| `password` | string | oui | `SuperSecurePassword123` | Min 10 / Max 128 caractères |
| `firstName` | string | non | `Jean` | Max 100 chars |
| `lastName` | string | non | `Dupont` | Max 100 chars |
| `termsAccepted` | boolean | oui | `true` | Doit être `true` |
| `termsVersion` | string | oui | `"1.0"` | Version des CGV acceptée |

### Règles de validation croisée

- Au moins un des deux (`email` **ou** `phone`) doit être fourni. Sinon **400 `MISSING_IDENTIFIER`**.
- L'email, si fourni, doit correspondre au format email.
- Le téléphone, s'il est fourni, doit correspondre au format strict `+237XXXXXXXXX` (9 chiffres après `+237`).

---

## Codes d'erreur

| Code | HTTP | Condition |
|---|---|---|
| `MISSING_IDENTIFIER` | 400 | Aucun email ni téléphone fourni |
| `WEAK_PASSWORD` | 400 | Password dans la liste noire des mots courants (≥50 entrées) |
| `TERMS_NOT_ACCEPTED` | 400 | `termsAccepted` vaut `false` |
| `TERMS_VERSION_MISMATCH` | 400 | `termsVersion` différent de la version courante des CGV (cf. `Setting.terms.version`) |
| `INVALID_CREDENTIALS` | 401 | (login) |

> **Pas de `409` à l'inscription** : un doublon d'e-mail ou de téléphone est traité
> par la réponse neutre `201` décrite ci-dessous (anti-énumération de comptes).

---

## Réponse 201 — `RegisterResponseDto`

```json
{
  "id": "9f8j3k2l-9m5n-4p6q-7r8s-9t0u1v2w3x4y",
  "emailMasked": "c***@example.cm",
  "phoneMasked": null,
  "firstName": "Jean",
  "lastName": "Dupont",
  "status": "PENDING_VERIFICATION",
  "createdAt": "2026-11-05T10:30:00.000Z",
  "message": "Compte créé avec succès. Vous pouvez maintenant vous connecter."
}
```

> **Règle de neutralité** : en cas de doublon (email ou téléphone déjà existant), la réponse RESTITUE EXACTEMENT la même structure, avec un `id` factice généré aléatoirement (`crypto.randomUUID()`), et le même message. Cela uniformise la réponse et empêche tout test de savoir si un compte existe. Chaque tentative est journalisée (`AuditLog`, action `USER_REGISTERED_DUPLICATE`).
>
> **Connexion** : `POST /auth/login` accepte un compte `PENDING_VERIFICATION`
> (aucun parcours de vérification n'est encore livré) ; seuls les comptes
> `SUSPENDED` et `DISABLED` sont refusés.

---

## Exemples de requêtes

### 1. Inscription réussie

```http
POST /api/v1/auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "client@example.cm",
  "password": "SuperSecurePassword123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "termsAccepted": true,
  "termsVersion": "1.0"
}
```

### 2. Doublon silencieux

```http
POST /api/v1/auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "dup@example.cm",
  "password": "AnotherSecurePassword456",
  "firstName": "Juan",
  "lastName": "Perez",
  "termsAccepted": true,
  "termsVersion": "1.0"
}
```

Réponse : identique à un succès nominal, avec un `id` aléatoire.

---

## Sécurité

- **Argon2id** avec `memoryCost: 2^16` (64 MB), `timeCost: 3`, `parallelism: 1`.
- **Liste noire de mots de passe courants** (≥50 entrées, `constants/common-passwords.ts`).
- **Aucun `passwordHash` jamais journalisé ni retourné**.
- **Rate limiting** spécifique : **5 tentatives / minute / IP** pour `/auth/register` (annotation `@Throttle` sur le controller).
- **AuditLog** pour toutes les tentatives (inscription réussie, doublon silencieux, mot de passe faible, CGV mismatch) avec PII masqué (email → `c***@example.com`, phone → `***1234`).
- **Transaction Prisma** pour la création de User + UserRole(CUSTOMER) + AuditLog (atomicité).

---

## Migration Prisma

La migration `add_terms_consent_aut01` ajoute les champs suivants à la table `User` :

- `termsVersion` : `VARCHAR(255) NOT NULL DEFAULT '1.0'` (version des CGV)
- `termsAcceptedAt` : `TIMESTAMP WITH TIME ZONE` (timestamp du consentement)

La valeur par défaut des CGV est récupérée depuis `Setting.terms.version` (ou `'1.0'` si absente).
