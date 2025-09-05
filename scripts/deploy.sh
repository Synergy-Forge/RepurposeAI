#!/bin/bash

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Build the application
npm run build
