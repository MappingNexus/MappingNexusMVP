#!/bin/bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Build TypeScript
npm run build
