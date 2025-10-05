#!/bin/bash
set -e

echo "== Starting deployment process..."

echo "-- Installing dependencies..."
npm ci --production=false

echo "-- Generating Prisma client..."
npx prisma generate

echo "-- Deploying database migrations..."
npx prisma migrate deploy

echo "-- Building application..."
npm run build

echo "== Build completed successfully!"
