#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm run test

# Build the application
echo "🏗️ Building application..."
npm run build

# Run performance checks
echo "⚡ Running performance checks..."
npm run lint

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ VERCEL_TOKEN not found. Please set it as an environment variable."
  exit 1
fi

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
  echo "📥 Installing Vercel CLI..."
  npm i -g vercel
fi

# Deploy with production settings
vercel deploy --prod \
  --token $VERCEL_TOKEN \
  --confirm \
  --build-env NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta \
  --build-env NEXT_PUBLIC_SAROS_PROGRAM_ID=11111111111111111111111111111111

echo "✅ Deployment completed successfully!"
