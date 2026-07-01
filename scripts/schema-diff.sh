#!/usr/bin/env bash
#
# schema-diff.sh — normalize + diff a Supabase schema dump (prod vs local).
#
# SAFETY: This script NEVER connects to any database. It only reads two SQL
# files that you have already saved locally, strips cosmetic pg_dump noise into
# copies under sql/diff/, and prints a readable diff. It does not modify the
# original dump files.
#
# Usage:
#   scripts/schema-diff.sh                         # uses the default file paths below
#   scripts/schema-diff.sh <prod.sql> <local.sql>  # compare specific files
#
# Defaults:
#   PROD  = sql/prod/schema.sql   (from: supabase db dump --schema public ...)
#   LOCAL = sql/local/schema.sql  (from: supabase db dump --local --schema public ...)
#
# Works on macOS, Linux, and Git Bash (uses only grep/sed/diff).

set -euo pipefail

PROD="${1:-sql/prod/schema.sql}"
LOCAL="${2:-sql/local/schema.sql}"
OUT_DIR="sql/diff"

# --- guard rails ------------------------------------------------------------
if [ ! -f "$PROD" ]; then
  echo "ERROR: production dump not found: $PROD" >&2
  echo "Hint: run (SAFE, read-only)  supabase db dump --schema public -f $PROD" >&2
  exit 1
fi
if [ ! -f "$LOCAL" ]; then
  echo "ERROR: local dump not found: $LOCAL" >&2
  echo "Hint: run (LOCAL ONLY)  supabase db reset  then  supabase db dump --local --schema public -f $LOCAL" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

PROD_NORM="$OUT_DIR/prod.norm.sql"
LOCAL_NORM="$OUT_DIR/local.norm.sql"
DIFF_OUT="$OUT_DIR/schema.diff"

# --- normalization ----------------------------------------------------------
# Strip cosmetic, non-structural noise so the diff highlights only real schema
# differences (tables, columns, types, constraints, indexes, RLS, policies,
# triggers, functions). We intentionally KEEP CREATE EXTENSION lines.
#
# Dropped (all anchored to start-of-line so we never touch indented body lines
# inside function definitions):
#   - SQL comments (-- ...), incl. the "-- Dumped from" header
#   - session settings: SET ... / SELECT pg_catalog.set_config(...)
#   - psql meta commands: \connect, \restrict, etc.
#   - ownership / permissions: ALTER ... OWNER TO ..., GRANT, REVOKE
#   - COMMENT ON EXTENSION
# Also: trim trailing whitespace and collapse blank lines.
normalize() {
  grep -vE '^[[:space:]]*(--|SET |SELECT pg_catalog\.set_config|\\|GRANT |REVOKE |ALTER .*OWNER TO|COMMENT ON EXTENSION)' "$1" \
    | sed 's/[[:space:]]*$//' \
    | grep -vE '^$'
}

normalize "$PROD"  > "$PROD_NORM"
normalize "$LOCAL" > "$LOCAL_NORM"

# --- diff -------------------------------------------------------------------
# diff exits 1 when files differ; don't let that abort the script.
diff -u "$PROD_NORM" "$LOCAL_NORM" > "$DIFF_OUT" || true

added=$(grep -cE '^\+[^+]' "$DIFF_OUT" || true)
removed=$(grep -cE '^-[^-]' "$DIFF_OUT" || true)

echo "Normalized files written (originals untouched):"
echo "  prod : $PROD_NORM"
echo "  local: $LOCAL_NORM"
echo "Diff written to: $DIFF_OUT"
echo
echo "Summary (relative to production as the baseline):"
echo "  lines only in LOCAL (added)   : ${added:-0}"
echo "  lines only in PROD  (missing) : ${removed:-0}"
echo
if [ "${removed:-0}" = "0" ] && [ "${added:-0}" = "0" ]; then
  echo "RESULT: no structural differences after normalization. ✅"
else
  echo "RESULT: differences found — review $DIFF_OUT"
  echo "  '-' lines = present in PROD but missing LOCAL (e.g., goal tables/RPCs to add)"
  echo "  '+' lines = present in LOCAL but not PROD (e.g., inferred columns to correct)"
  echo
  echo "Tip: for a colored view run:  git diff --no-index $PROD_NORM $LOCAL_NORM"
fi
