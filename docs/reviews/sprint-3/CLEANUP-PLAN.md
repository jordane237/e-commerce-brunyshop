# Plan de nettoyage — Sprint 3

- **Date** : 20 novembre 2026
- **Branche** : `review/sprint-3-final-audit`
- **Statut** : proposition, aucune suppression appliquée sans validation.

## 1. Fichiers à supprimer ou ignorer

| Fichier | Proposition | Justification |
|---|---|---|
| `.~lock.Tickets_BRUNY_SHOPPING.docx#` | Supprimer | Verrou LibreOffice non suivi, sans impact projet. |
| `Tickets_BRUNY_SHOPPING.docx` | Décider | Doublon du CSV, suivi malgré `.gitignore` « specs confidentielles ». |
| `docker-compose.production.yml` / `docker-compose.prod.yml` | Documenter ou fusionner | Deux stacks de production concurrentes. |

## 2. Gitignore

Ajouter au `.gitignore` :

```gitignore
~$*
.~lock.*
```

## 3. Fast-forward proposé

Après validation PO :

```bash
git checkout working
git merge --ff-only review/sprint-3-final-audit
git push origin working
```

## 4. Ce qui n'est pas nettoyé

- Aucune correction fonctionnelle de tickets n'est incluse dans ce plan.
- Aucune branche Sprint 3 n'est supprimée.
- Aucun tag n'est créé.