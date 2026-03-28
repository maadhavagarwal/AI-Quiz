import './config.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
console.log('🔑 Testing API key:', apiKey?.substring(0, 20) + '...\n');

const genAI = new GoogleGenerativeAI(apiKey);

// Models sorted by cost (cheapest first)
// Pricing: https://ai.google.dev/pricing
const modelsToTest = [
  { name: 'gemini-3.1-flash-lite-preview', cost: 'CHEAPEST', inputPPM: 0.075, outputPPM: 0.3 },
  { name: 'gemini-3.1-flash-preview', cost: 'CHEAP', inputPPM: 0.075, outputPPM: 0.3 },
  { name: 'gemini-3.1-pro-preview', cost: 'MODERATE', inputPPM: 0.5, outputPPM: 1.5 },
  { name: 'gemini-2.0-flash-exp', cost: 'CHEAP', inputPPM: 0.075, outputPPM: 0.3 },
  { name: 'gemini-2.0-pro-exp', cost: 'EXPENSIVE', inputPPM: 0.5, outputPPM: 1.5 },
  { name: 'gemini-1.5-pro', cost: 'EXPENSIVE', inputPPM: 1.25, outputPPM: 5 },
  { name: 'gemini-1.5-flash', cost: 'MODERATE', inputPPM: 0.075, outputPPM: 0.3 },
];

async function testModels() {
  const workingModels = [];
  console.log('🧪 Testing available models...\n');
  
  for (const modelInfo of modelsToTest) {
    const modelName = modelInfo.name;
    try {
      console.log(`Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('test');
      console.log(`✅ SUCCESS: ${modelName} (Cost: ${modelInfo.cost})\n`);
      workingModels.push(modelInfo);
    } catch (error) {
      const errorMsg = error.message;
      if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        console.log(`❌ Not found: ${modelName}\n`);
      } else if (errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('403')) {
        console.log(`⚠️  Permission denied: ${modelName}\n`);
      } else {
        console.log(`❌ Error: ${modelName}\n`);
      }
    }
  }
  
  if (workingModels.length === 0) {
    console.log('\n❌ No models found to work. Please enable billing or check your API key.');
    return;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ AVAILABLE MODELS:');
  console.log('='.repeat(60));
  workingModels.forEach((model, idx) => {
    console.log(`${idx + 1}. ${model.name} (Cost: ${model.cost})`);
  });
  
  // Select cheapest
  const cheapest = workingModels[0];
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 RECOMMENDED (CHEAPEST): ${cheapest.name}`);
  console.log(`📊 Cost: Input ${cheapest.inputPPM}¢/1M tokens, Output ${cheapest.outputPPM}¢/1M tokens`);
  console.log('='.repeat(60));
  
  return cheapest.name;
}

const cheapestModel = await testModels();

if (cheapestModel) {
  console.log(`\n✨ Update your code to use: ${cheapestModel}`);
}


