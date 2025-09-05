#!/bin/bash

# Install dependencies
npm ci --production=false

# Generate Prisma client
npx prisma generate

# Build the application
npm run build
