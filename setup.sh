#!/bin/bash

# PG Finder - Development Setup Script
# Run this script to set up the development environment

set -e

echo "🚀 Setting up PG Finder for Girls..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Expo CLI globally if not present
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
fi

echo "✅ Expo CLI version: $(expo --version)"

# Install EAS CLI
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

echo "✅ EAS CLI version: $(eas --version)"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating .env.local from template..."
    cp .env.example .env.local
    echo "📝 Please edit .env.local with your Firebase and Razorpay credentials"
else
    echo "✅ .env.local already exists"
fi

# Create assets directory if not exists
mkdir -p src/assets

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your Firebase and Razorpay credentials"
echo "2. Add app icons to src/assets/ (icon.png, splash.png, adaptive-icon.png, favicon.png)"
echo "3. Run 'npm start' to start development server"
echo "4. Run 'npm run android' or 'npm run ios' for mobile testing"
echo "5. Run 'npm run web' for web testing"
echo ""
echo "For production builds:"
echo "- eas build --profile preview (for testing)"
echo "- eas build --profile production (for store submission)"
echo "- eas submit --platform all (to submit to stores)"
echo ""
echo "For web deployment:"
echo "- vercel (after connecting repo)"
echo ""
echo "Happy coding! 🎉"