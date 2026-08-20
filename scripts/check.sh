#!/usr/bin/env bash
# check.sh — Run GatherGrove quality gates
#
# Usage:
#   ./scripts/check.sh              # run all checks in parallel (backend + client + mobile)
#   ./scripts/check.sh backend      # backend only
#   ./scripts/check.sh client       # client (frontend) only
#   ./scripts/check.sh mobile       # mobile only
#
# Runs from the current directory, so works both from repo root
# and from inside a worktree.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
TRACK="${1:-all}"

TMPDIR_CHECK=$(mktemp -d)
trap 'rm -rf "$TMPDIR_CHECK"' EXIT

run_backend() {
  local log="$TMPDIR_CHECK/backend.log"
  {
    echo ""
    echo "══════════════════════════════════════════════"
    echo " Backend checks (.NET)"
    echo "══════════════════════════════════════════════"

    local failed=0

    echo ""
    echo "▶ Format check (lint)..."
    (cd "$REPO_ROOT/backend" && dotnet format --verify-no-changes --no-restore) \
      && echo "  ✓ Format check passed" \
      || { echo "  ✗ Format check FAILED — run: dotnet format"; failed=1; }

    echo ""
    echo "▶ Build (type check)..."
    (cd "$REPO_ROOT/backend" && dotnet build --nologo -v minimal -warnaserror:false) \
      && echo "  ✓ Build passed" \
      || { echo "  ✗ Build FAILED"; failed=1; }

    echo ""
    echo "▶ Tests (unit + integration)..."
    (cd "$REPO_ROOT/backend" && dotnet test --nologo --logger "console;verbosity=minimal" \
      --filter "Category!=E2E") \
      && echo "  ✓ Tests passed" \
      || { echo "  ✗ Tests FAILED"; failed=1; }

    return $failed
  } > "$log" 2>&1
}

run_client() {
  local log="$TMPDIR_CHECK/client.log"
  {
    echo ""
    echo "══════════════════════════════════════════════"
    echo " Client checks (Next.js)"
    echo "══════════════════════════════════════════════"

    local failed=0

    echo ""
    echo "▶ Lint..."
    (cd "$REPO_ROOT/client" && npm run lint) \
      && echo "  ✓ Lint passed" \
      || { echo "  ✗ Lint FAILED"; failed=1; }

    echo ""
    echo "▶ Type check..."
    (cd "$REPO_ROOT/client" && npm run typecheck) \
      && echo "  ✓ Type check passed" \
      || { echo "  ✗ Type check FAILED"; failed=1; }

    echo ""
    echo "▶ Tests..."
    (cd "$REPO_ROOT/client" && npm test -- --watchAll=false --passWithNoTests) \
      && echo "  ✓ Tests passed" \
      || { echo "  ✗ Tests FAILED"; failed=1; }

    echo ""
    echo "▶ Build..."
    (cd "$REPO_ROOT/client" && npm run build) \
      && echo "  ✓ Build passed" \
      || { echo "  ✗ Build FAILED"; failed=1; }

    return $failed
  } > "$log" 2>&1
}

run_mobile() {
  local log="$TMPDIR_CHECK/mobile.log"
  {
    echo ""
    echo "══════════════════════════════════════════════"
    echo " Mobile checks (React Native)"
    echo "══════════════════════════════════════════════"

    local failed=0

    echo ""
    echo "▶ Lint..."
    (cd "$REPO_ROOT/mobile" && npm run lint) \
      && echo "  ✓ Lint passed" \
      || { echo "  ✗ Lint FAILED"; failed=1; }

    echo ""
    echo "▶ Type check..."
    (cd "$REPO_ROOT/mobile" && npm run typecheck) \
      && echo "  ✓ Type check passed" \
      || { echo "  ✗ Type check FAILED"; failed=1; }

    echo ""
    echo "▶ Tests..."
    (cd "$REPO_ROOT/mobile" && npm test -- --watchAll=false --passWithNoTests) \
      && echo "  ✓ Tests passed" \
      || { echo "  ✗ Tests FAILED"; failed=1; }

    return $failed
  } > "$log" 2>&1
}

print_logs() {
  for track in "$@"; do
    [ -f "$TMPDIR_CHECK/$track.log" ] && cat "$TMPDIR_CHECK/$track.log"
  done
}

case "$TRACK" in
  backend)
    run_backend
    print_logs backend
    RESULT=$?
    ;;
  client)
    run_client
    print_logs client
    RESULT=$?
    ;;
  mobile)
    run_mobile
    print_logs mobile
    RESULT=$?
    ;;
  all)
    PIDS=()
    run_backend & PIDS+=($!)
    run_client  & PIDS+=($!)
    run_mobile  & PIDS+=($!)

    RESULT=0
    for pid in "${PIDS[@]}"; do
      wait "$pid" || RESULT=1
    done

    print_logs backend client mobile
    ;;
  *)
    echo "Unknown track: $TRACK"
    echo "Usage: $0 [backend|client|mobile|all]"
    exit 1
    ;;
esac

echo ""
if [[ $RESULT -eq 0 ]]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo " ✓ All checks passed — safe to commit"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo " ✗ Checks FAILED — fix issues before committing"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
