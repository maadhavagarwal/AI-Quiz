import { ACTIVE_MODELS, getDeprecationInfo, listAvailableModels } from './utils/modelRegistry.js';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   Active AI Models & Deprecation Status                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Check each provider
for (const [provider, config] of Object.entries(ACTIVE_MODELS)) {
  console.log(`📌 ${provider.toUpperCase()}`);
  console.log(`   Primary Model: ${config.primary}`);
  console.log(`   Available Models: ${listAvailableModels(provider).join(', ')}`);
  console.log(`   Description: ${config.description}`);
  console.log(`   Docs: ${config.docs}`);
  if (config.setup) {
    console.log(`   Setup: ${config.setup}`);
  }
  console.log('');
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Model Deprecation History                                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

import { MODEL_DEPRECATION_LOG } from './utils/modelRegistry.js';

if (MODEL_DEPRECATION_LOG.length === 0) {
  console.log('✅ No deprecated models in current use\n');
} else {
  for (const log of MODEL_DEPRECATION_LOG) {
    console.log(`❌ ${log.date} | ${log.provider.toUpperCase()}`);
    console.log(`   Deprecated: ${log.model}`);
    console.log(`   Reason: ${log.reason}`);
    console.log(`   Replacement: ${log.replacement}`);
    console.log(`   Status: ${log.status}`);
    console.log('');
  }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Model Update Required                                   ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('✅ FIXED:');
console.log('   • Groq: mixtral-8x7b-32768 → llama-3.1-70b-versatile');
console.log('   • Gemini: gemini-3.1-flash-lite-preview → gemini-1.5-flash');
console.log('');

console.log('📌 Groq Model Comparison:');
console.log('   • llama-3.1-70b-versatile (NEW) - Best quality, slightly slower');
console.log('   • llama-3.1-8b-instant - Faster, good for quick generation');
console.log('   • mixtral-8x7b-32768 (DEPRECATED) - No longer available');
console.log('');

console.log('📌 Gemini Model Comparison:');
console.log('   • gemini-1.5-flash (NEW) - Fast, free tier available');
console.log('   • gemini-1.5-pro - More powerful, limited free tier');
console.log('   • gemini-2.0-flash - Upcoming, may require waitlist');
console.log('');

console.log('🚀 Next Steps:');
console.log('   1. Restart backend: npm run dev');
console.log('   2. Test provider status: curl http://localhost:9876/api/debug/ai-providers');
console.log('   3. Generate questions: Create quiz → Upload material → Generate');
console.log('   4. Check logs for which provider was used (groq, ollama, gemini)');
console.log('');
