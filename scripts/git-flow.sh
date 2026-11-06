#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# git-flow.sh — commandes du workflow BRUNY SHOPPING
#   feature/*  ->  working  ->  main
# Activé via les alias Git définis dans aliases.gitconfig (nf, sync, publish, release).
# ---------------------------------------------------------------------------
set -euo pipefail

usage() {
  echo "Usage :"
  echo "  git nf <nom>    Créer feature/<nom> à partir de working à jour"
  echo "  git sync        Mettre à jour working depuis origin/working"
  echo "  git publish     Merger la feature courante dans working, puis pousser"
  echo "  git release     Merger working dans main (avec confirmation), puis pousser"
  exit 1
}

require_clean_worktree() {
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "✖ Copie de travail sale. Committez ou stash d'abord." >&2
    exit 1
  fi
}

cmd="${1:-}"

case "$cmd" in
  nf)
    nom="${2:-}"
    [ -n "$nom" ] || usage
    # Nom de branche normalisé : kebab-case, minuscules, chiffres et tirets.
    if ! printf '%s' "$nom" | grep -Eq '^[a-z0-9]+(-[a-z0-9]+)*$'; then
      echo "✖ Nom de branche invalide : '$nom'" >&2
      echo "  Format attendu : kebab-case en minuscules, ex. 'ajout-panier'." >&2
      exit 1
    fi
    git fetch origin working
    git checkout working
    git merge --ff-only origin/working
    git checkout -b "feature/$nom"
    echo "✅ Branche feature/$nom créée depuis working à jour."
    ;;

  sync)
    git fetch origin working
    git checkout working
    git merge --ff-only origin/working
    echo "✅ working est à jour avec origin/working."
    ;;

  publish)
    require_clean_worktree
    branche="$(git rev-parse --abbrev-ref HEAD)"
    case "$branche" in
      feature/*) ;;
      *)
        echo "✖ publish doit être lancé depuis une branche feature/* (actuellement : $branche)." >&2
        exit 1
        ;;
    esac
    git fetch origin working
    git checkout working
    git merge --ff-only origin/working
    git merge --no-ff "$branche" -m "chore(merge): $branche -> working"
    git push origin working
    git checkout "$branche"
    echo "✅ $branche mergée dans working et poussée sur origin."
    ;;

  release)
    require_clean_worktree
    read -r -p "⚠️  Confirmer le release de working dans main ? (oui/non) : " rep
    if [ "$rep" != "oui" ]; then
      echo "Release annulé."
      exit 1
    fi
    git fetch origin main working
    git checkout main
    git merge --ff-only origin/main
    git merge --no-ff working -m "chore(merge): working -> main (release)"
    # ALLOW_MAIN_PUSH=1 autorise ce push unique via le hook pre-push.
    ALLOW_MAIN_PUSH=1 git push origin main
    echo "✅ working mergée dans main et poussée sur origin."
    ;;

  *)
    usage
    ;;
esac
