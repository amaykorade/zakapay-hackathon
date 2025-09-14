#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo "Verifying Prisma Client generation..."
if [ ! -d "node_modules/@prisma/client" ]; then
    echo "Error: Prisma Client not generated properly"
    exit 1
fi

echo "Building Next.js application..."
npx next build

echo "Build completed successfully!"
