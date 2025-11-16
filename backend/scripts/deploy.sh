#!/bin/bash

# Simple Firebase Deploy Script
echo "🚀 Deploying to Firebase..."

# Build functions
echo "🔨 Building functions..."
cd functions && npm run build && cd ..

# Deploy based on argument
case "$1" in
    "functions")
        firebase deploy --only functions
        ;;
    "rules")
        firebase deploy --only firestore:rules,storage
        ;;
    *)
        firebase deploy
        ;;
esac

echo "✅ Deployment complete!"
