#!/bin/bash

echo "🚀 Deploying Multi LLM Routing Orchestrator to Vercel..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🏗️ Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
npx vercel --prod

echo "✅ Deployment complete!"
echo "🔗 Your app will be available at the URL provided by Vercel"