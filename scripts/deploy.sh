#!/bin/bash
set -e

echo "== Starting deployment process..."

echo "-- Installing dependencies..."
npm ci --production=false

echo "-- Generating Prisma client..."
npx prisma generate

echo "-- Deploying database migrations..."
# Check if there are pending migrations before deploying
if npx prisma migrate status | grep -q "Database schema is up to date"; then
  echo "Database schema is already up to date, skipping migrations"
else
  echo "Applying pending migrations..."
  npx prisma migrate deploy
fi

echo "-- Building application..."
npm run build

echo "== Build completed successfully!"
