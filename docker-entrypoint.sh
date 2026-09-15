#!/bin/sh
# Runs once every time the container starts, before the Next.js server.
# Both steps are safe to repeat: `migrate deploy` only applies pending
# migrations (no-op if already up to date), and prisma/seed.ts skips any
# word that already exists — so restarting the container never duplicates
# data or wipes anything in the mounted /app/data volume.
set -e

echo "==> Applying database migrations..."
npx prisma migrate deploy

echo "==> Seeding starter word bank (skips words that already exist)..."
npx prisma db seed

echo "==> Starting server..."
exec "$@"
