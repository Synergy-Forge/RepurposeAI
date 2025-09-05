#!/bin/bash

# Install dependencies
npm ci --production=false

# Generate Prisma client
npx prisma generate

# Start the application
npm start
