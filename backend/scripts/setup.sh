#!/bin/bash

# Simple Firebase Setup Script
echo "🔥 Setting up Firebase Backend..."

# Install dependencies
echo "📦 Installing dependencies..."
cd functions && npm install && cd ..

# Copy environment files
echo "⚙️ Setting up environment..."
if [ ! -f functions/.env ]; then
    cp functions/env.example functions/.env
    echo "📝 Edit functions/.env with your configuration"
fi

if [ ! -f config/service-account.json ]; then
    cp config/service-account.json.example config/service-account.json
    echo "📝 Replace config/service-account.json with your actual key"
fi

echo ""
echo "✅ Setup complete!"
echo "Next steps:"
echo "1. firebase login"
echo "2. firebase init (select Functions, Firestore, Storage)"
echo "3. firebase deploy"
