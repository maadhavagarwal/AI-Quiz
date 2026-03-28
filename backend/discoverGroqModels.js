import './config.js'; // Load env vars first
import Groq from 'groq-sdk';

async function getAvailableGroqModels() {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY not found in environment');
      process.exit(1);
    }
    
    const groq = new Groq({
      apiKey,
    });

    // Groq doesn't have a list models endpoint directly,
    // but we can test models programmatically
    const modelsToTest = [
      // Latest/Current Groq models (2026)
      'llama-3.2-90b-text-preview',
      'llama-3.2-11b-text-preview', 
      'llama-3.2-1b-preview',
      'llama-3.1-405b-reasoning',
      'llama3.2-90b-vision-preview',
      'mixtral-8x7-32k', // Alternative name
      'grok-2-1212',
      'grok-beta',
      'deepseek-r1-distill-llama-70b',
      'qwen2-72b',
    ];

    console.log('Testing Groq models for availability...\n');

    for (const model of modelsToTest) {
      try {
        const response = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: 'user',
              content: 'test',
            },
          ],
          max_tokens: 10,
          temperature: 0.1,
        });

        console.log(`✅ ${model} - AVAILABLE`);
      } catch (error) {
        const errorMsg = error.message || '';
        if (errorMsg.includes('decommissioned') || errorMsg.includes('model not found')) {
          console.log(`❌ ${model} - NOT AVAILABLE (deprecated/not found)`);
        } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          console.log(`⚠️  ${model} - AUTH ERROR (might be available)`);
        } else {
          console.log(`⚠️  ${model} - ERROR: ${errorMsg.substring(0, 60)}`);
        }
      }
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

getAvailableGroqModels();
