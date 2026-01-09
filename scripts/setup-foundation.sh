#!/bin/bash
set -e

echo "🚀 Starting Foundation Setup..."

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "📦 Installing Dependencies..."
npm install

echo "🛠️ Configuring Husky..."
npm run prepare

echo "📁 Creating Storage Directories..."
mkdir -p storage/{auth,images,reports,backups,logs,temp}

echo "✅ Setup Complete!"
echo "Run 'npm run dev' to start."
