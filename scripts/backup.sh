#!/bin/sh
set -eu

timestamp="$(date +%Y-%m-%d-%H-%M-%S)"
target="/backups/balance-${timestamp}.sql"

pg_dump \
  --host=db \
  --port=5432 \
  --username="${POSTGRES_USER}" \
  --dbname="${POSTGRES_DB}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  > "${target}"
