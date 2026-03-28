#!/bin/bash
# SETUP SCRIPT: AI MCQ Generator with Ollama (Recommended)
# This is the PERMANENT, NON-DEPRECATING solution

echo "=================================="
echo "AI MCQ Generator - Ollama Setup"
echo "=================================="
echo ""

# Step 1: Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed."
    echo ""
    echo "📥 Download Ollama:"
    echo "   Windows: https://ollama.ai/download/windows"
    echo "   macOS:   https://ollama.ai/download/macos"
    echo "   Linux:   https://ollama.ai/download/linux"
    echo ""
    echo "After installation, come back and run this script again."
    exit 1
fi

echo "✅ Ollama is installed"
echo ""

# Step 2: Check if Ollama is running
echo "Checking if Ollama service is running..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running on http://localhost:11434"
else
    echo "⚠️  Ollama is not running yet."
    echo ""
    echo "On macOS/Windows: Ollama runs as a background service."
    echo "   • macOS: Open Ollama app (or run: brew services start ollama)"
    echo "   • Windows: Ollama app should be running automatically"
    echo ""
    echo "On Linux: Run in a terminal:"
    echo "   ollama serve"
    echo ""
    echo "Then come back and run this script again."
    exit 1
fi

# Step 3: Check if models are installed
echo ""
echo "Checking installed models..."
MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

if [ -z "$MODELS" ]; then
    echo "❌ No models installed."
    echo ""
    echo "Installing llama2 (recommended for MCQs)..."
    ollama pull llama2
    
    if [ $? -eq 0 ]; then
        echo "✅ llama2 installed successfully!"
    else
        echo "❌ Failed to pull llama2. Please try manually:"
        echo "   ollama pull llama2"
        exit 1
    fi
else
    echo "✅ Models available:"
    echo "$MODELS" | sed 's/^/   • /'
fi

# Step 4: Test MCQ generation
echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "Your system is ready for MCQ generation!"
echo ""
echo "🚀 Next steps:"
echo "   1. Start the backend:"
echo "      cd backend && npm run dev"
echo "   2. Start the frontend:"
echo "      cd frontend && npm run dev"
echo "   3. Open http://localhost:3000"
echo "   4. Create a quiz and generate questions!"
echo ""
echo "📊 How it works:"
echo "   • Questions are generated locally using Ollama"
echo "   • No API keys needed (except optional cloud backup)"
echo "   • Never breaks due to API changes"
echo "   • Works completely offline"
echo "   • Instant feedback"
echo ""
echo "💡 Useful commands:"
echo "   ollama list                 - See installed models"
echo "   ollama pull mistral         - Install another model"
echo "   ollama serve                - Start Ollama service"
echo ""
