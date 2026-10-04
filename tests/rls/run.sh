#!/usr/bin/env bash
# Row level security tests.
#
# Builds a throwaway database from the real migrations and runs every
# *.test.sql file against it. Needs a reachable PostgreSQL server (15 or newer)
# and the psql client; connection settings come from the usual PG* variables:
#
#   PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres npm run test:rls
#
# The database named by RLS_TEST_DB (default: balance_rls_test) is dropped and
# recreated on every run. Never point this at a database you care about.
set -euo pipefail

cd "$(dirname "$0")/../.."

database="${RLS_TEST_DB:-balance_rls_test}"

# Migrations print NOTICE lines for "does not exist, skipping"; keep the output to results.
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
psql_quiet=(psql --no-psqlrc --quiet --set ON_ERROR_STOP=1)

"${psql_quiet[@]}" --dbname postgres --command "drop database if exists \"${database}\"" >/dev/null
"${psql_quiet[@]}" --dbname postgres --command "create database \"${database}\"" >/dev/null

apply() {
  if ! "${psql_quiet[@]}" --dbname "${database}" --file "$1" >/dev/null; then
    echo "FAILED to apply $1" >&2
    exit 1
  fi
}

apply tests/rls/00_supabase_shim.sql

for migration in supabase/migrations/*.sql; do
  apply "${migration}"
done

apply tests/rls/01_helpers.sql
apply tests/rls/02_fixtures.sql

failed=0
total=0

for test_file in tests/rls/*.test.sql; do
  total=$((total + 1))

  if output=$("${psql_quiet[@]}" --dbname "${database}" --file "${test_file}" 2>&1 >/dev/null); then
    echo "PASS  ${test_file}"
  else
    failed=$((failed + 1))
    echo "FAIL  ${test_file}"
    echo "${output}" | sed 's/^/      /'
  fi
done

echo
echo "${total} files, $((total - failed)) passed, ${failed} failed"

"${psql_quiet[@]}" --dbname postgres --command "drop database if exists \"${database}\"" >/dev/null || true

[ "${failed}" -eq 0 ]
