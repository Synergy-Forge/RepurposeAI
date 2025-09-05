#!/bin/bash

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Start the application
npm start
