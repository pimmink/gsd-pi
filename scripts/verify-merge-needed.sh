#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEFAULT_BASE_REF="upstream/main"
if ! git rev-parse --verify "$DEFAULT_BASE_REF" >/dev/null 2>&1; then
  DEFAULT_BASE_REF="origin/main"
fi

BASE_REF="$DEFAULT_BASE_REF"
HEAD_REF="HEAD"

while [ $# -gt 0 ]; do
  case "$1" in
    --)
      # pnpm/npm forward a literal `--` from `pnpm run ... -- --base ...`; skip it.
      shift
      ;;
    --base)
      BASE_REF="$2"
      shift 2
      ;;
    --head)
      HEAD_REF="$2"
      shift 2
      ;;
    *)
      echo "usage: bash scripts/verify-merge-needed.sh [--base <ref>] [--head <ref>]" >&2
      exit 2
      ;;
  esac
done

CLASSIFY_OUTPUT="$(mktemp "${TMPDIR:-/tmp}/verify-merge-needed.XXXXXX")"
cleanup() {
  rm -f "$CLASSIFY_OUTPUT"
}
trap cleanup EXIT

echo "── verify:merge scope check ──"
echo "Base ref: $BASE_REF"
echo "Head ref: $HEAD_REF"

if [ "${VERIFY_MERGE_VERBOSE:-0}" = "1" ]; then
  GITHUB_OUTPUT="$CLASSIFY_OUTPUT" \
    EVENT_NAME=pull_request \
    PR_BASE_SHA="$BASE_REF" \
    HEAD_SHA="$HEAD_REF" \
    bash scripts/ci-classify-changes.sh
else
  GITHUB_OUTPUT="$CLASSIFY_OUTPUT" \
    EVENT_NAME=pull_request \
    PR_BASE_SHA="$BASE_REF" \
    HEAD_SHA="$HEAD_REF" \
    bash scripts/ci-classify-changes.sh >/dev/null
fi

HEAVY_CODE_CHANGED="$(sed -n 's/^heavy-code-changed=//p' "$CLASSIFY_OUTPUT" | tail -n 1)"
PORTABILITY_CHANGED="$(sed -n 's/^portability-changed=//p' "$CLASSIFY_OUTPUT" | tail -n 1)"
DOCKER_CHANGED="$(sed -n 's/^docker-changed=//p' "$CLASSIFY_OUTPUT" | tail -n 1)"

if [ "$HEAVY_CODE_CHANGED" = "true" ]; then
  echo "Recommendation: verify:merge is required before review for this diff."
else
  echo "Recommendation: verify:merge is not required for CI parity for this diff."
  echo "Recommended minimum: pnpm run verify:fast plus targeted checks for touched files."
fi

if [ "$PORTABILITY_CHANGED" = "true" ]; then
  echo "Additional note: portability-sensitive paths changed; expect Windows/native coverage to matter."
fi

if [ "$DOCKER_CHANGED" = "true" ]; then
  echo "Additional note: docker-sensitive paths changed; also run pnpm run test:e2e:docker before review."
fi

if [ "${VERIFY_MERGE_VERBOSE:-0}" = "1" ]; then
  echo "Verbose mode preserved the raw change classification output above."
fi
