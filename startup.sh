#!/bin/bash
# Startup script for AI MCQ Maker

echo "🚀 Starting AI MCQ Maker..."
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Download from https://nodejs.org"
    exit 1
fi

echo "✓ Node.js version: $(node -v)"
echo ""

# Check backend .env
if [ ! -f "backend/.env.local" ]; then
    echo "⚠️  backend/.env.local not found"
    echo "   Create it with MongoDB URI and Gemini API key"
    echo "   See ENV_SETUP.md for details"
fi

# Check frontend .env
if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local not found"
    echo "   Create it with NEXT_PUBLIC_API_URL"
fi

echo ""
echo "📦 Installing dependencies..."

# Backend
if [ ! -d "backend/node_modules" ]; then
    echo "  → Backend..."
    cd backend && npm install && cd ..
fi

# Frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "  → Frontend..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📌 Next steps:"
echo "   1. Terminal 1: cd backend && npm run start"
echo "   2. Terminal 2: cd frontend && npm run dev"
echo "   3. Open http://localhost:3000"
echo ""
echo "🎓 Happy learning!"
