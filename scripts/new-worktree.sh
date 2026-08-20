#!/usr/bin/env bash
# new-worktree.sh — Create a fully-wired GatherGrove worktree
#
# Usage:
#   ./scripts/new-worktree.sh <branch-name>
#   ./scripts/new-worktree.sh feat/my-feature
#   ./scripts/new-worktree.sh fix/stripe-webhook
#
# Creates .worktrees/<slug>/ with:
#   - Isolated git worktree on <branch-name>
#   - Copied .env files for all sub-projects
#   - dotnet restore for backend
#   - npm install for client and mobile
#   - git hooks wired up

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREES_DIR="$REPO_ROOT/.worktrees"

# ── Validate argument ────────────────────────────────────────────────────────
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <branch-name>"
  echo "  e.g. $0 feat/my-feature"
  exit 1
fi

BRANCH="$1"

if ! git check-ref-format --branch "$BRANCH" &>/dev/null; then
  echo "Error: '$BRANCH' is not a valid git branch name."
  exit 1
fi

# Convert branch name to safe directory slug (replace / and . with -)
SLUG="${BRANCH//\//-}"
SLUG="${SLUG//./-}"
WORKTREE_PATH="$WORKTREES_DIR/$SLUG"

if [[ -d "$WORKTREE_PATH" ]]; then
  echo "Error: Worktree '$WORKTREE_PATH' already exists."
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Creating worktree: $SLUG"
echo " Branch:            $BRANCH"
echo " Path:              $WORKTREE_PATH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p "$WORKTREES_DIR"

# ── Create worktree ──────────────────────────────────────────────────────────
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo ""
  echo "▶ Branch '$BRANCH' exists — checking it out in new worktree..."
  git worktree add "$WORKTREE_PATH" "$BRANCH"
else
  echo ""
  echo "▶ Creating new branch '$BRANCH' from main..."
  git worktree add "$WORKTREE_PATH" -b "$BRANCH" main
fi

# ── Copy .env files ──────────────────────────────────────────────────────────
echo ""
echo "▶ Copying .env files..."

copy_env() {
  local src_dir="$1"
  local dst_dir="$2"
  for f in "$src_dir"/.env*; do
    [[ -f "$f" ]] || continue
    filename="$(basename "$f")"
    if [[ "$filename" == *.example || "$filename" == *.template ]]; then
      continue  # skip templates — they're in source control
    fi
    dest="$dst_dir/$filename"
    if [[ ! -f "$dest" ]]; then
      cp "$f" "$dest"
      echo "  copied $filename → $(realpath --relative-to="$REPO_ROOT" "$dest")"
    fi
  done
}

copy_env "$REPO_ROOT"                               "$WORKTREE_PATH"
copy_env "$REPO_ROOT/client"                        "$WORKTREE_PATH/client"
copy_env "$REPO_ROOT/backend/src/GatherGrove.API"   "$WORKTREE_PATH/backend/src/GatherGrove.API"
copy_env "$REPO_ROOT/mobile"                        "$WORKTREE_PATH/mobile"

# ── Backend — dotnet restore ─────────────────────────────────────────────────
echo ""
echo "▶ Restoring .NET dependencies..."
(cd "$WORKTREE_PATH/backend" && dotnet restore --nologo -v minimal) \
  && echo "  dotnet restore OK" \
  || echo "  ⚠ dotnet restore failed — run manually: cd backend && dotnet restore"

# ── Frontend — npm install ───────────────────────────────────────────────────
echo ""
echo "▶ Installing client npm packages..."
(cd "$WORKTREE_PATH/client" && npm install --silent) \
  && echo "  client npm install OK" \
  || echo "  ⚠ client npm install failed — run manually: cd client && npm install"

# ── Mobile — npm install (optional) ─────────────────────────────────────────
if [[ -f "$WORKTREE_PATH/mobile/package.json" ]]; then
  echo ""
  echo "▶ Installing mobile npm packages..."
  (cd "$WORKTREE_PATH/mobile" && npm install --silent) \
    && echo "  mobile npm install OK" \
    || echo "  ⚠ mobile npm install failed — run manually: cd mobile && npm install"
fi

# ── Design tokens — generate for new worktree ────────────────────────────────
echo ""
echo "▶ Generating design tokens..."
(cd "$WORKTREE_PATH" && node shared/design-tokens/build.mjs) \
  && echo "  tokens:build OK" \
  || echo "  ⚠ tokens:build failed — run manually: npm run tokens:build"

# ── Wire git hooks ───────────────────────────────────────────────────────────
echo ""
echo "▶ Configuring git hooks..."
(cd "$WORKTREE_PATH" && git config core.hooksPath "$REPO_ROOT/.githooks")
echo "  hooksPath → $REPO_ROOT/.githooks"

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✓ Worktree ready at: $WORKTREE_PATH"
echo ""
echo " Next steps:"
echo "   cd $WORKTREE_PATH"
echo "   # ... do your work ..."
echo "   ./scripts/check.sh          # run quality gates"
echo "   git add <files> && git commit -m 'type(scope): description'"
echo ""
echo " When done:"
echo "   git worktree remove $WORKTREE_PATH"
echo "   # or if generated files are dirty:"
echo "   git worktree remove --force $WORKTREE_PATH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
