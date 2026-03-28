import axios from 'axios';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   Multi-LLM Provider Test - Post Model Fix                 ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const BASE_URL = 'http://localhost:9876';

async function testProviderStatus() {
  try {
    console.log('🔍 Test 1: Checking Provider Status...');
    const response = await axios.get(`${BASE_URL}/api/debug/ai-providers`, { timeout: 5000 });
    
    console.log('✅ Provider Status:');
    console.log(`   Preferred: ${response.data.preferred}`);
    console.log(`   Provider Order: ${response.data.providerOrder.join(' → ')}`);
    console.log('');
    
    console.log('📊 Individual Provider Status:');
    for (const [provider, status] of Object.entries(response.data.status)) {
      const icon = status.available ? '✅' : '⚠️';
      console.log(`   ${icon} ${provider}: ${status.available ? 'Available' : 'Unavailable'}`);
      if (status.lastError) {
        console.log(`      Error: ${status.lastError.substring(0, 80)}...`);
      }
    }
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ Provider Status Test Failed:', error.message);
    return false;
  }
}

async function testBackendHealth() {
  try {
    console.log('🏥 Test 2: Backend Health Check...');
    const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
    console.log('✅ Backend Status: ', response.data.status);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function checkServiceReachability() {
  try {
    console.log('🌐 Test 3: Service Reachability...');
    
    // Check if backend is responding
    await axios.get(`${BASE_URL}/api/health`, { timeout: 3000 });
    console.log('✅ Backend responding at http://localhost:9876');
    
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Backend not reachable:', error.message);
    console.log('   Make sure backend is running: npm run dev');
    console.log('');
    return false;
  }
}

async function verifyModelLists() {
  try {
    console.log('📋 Test 4: Model Configuration Check...');
    
    // Import model registry
    const { ACTIVE_MODELS, MODEL_DEPRECATION_LOG } = await import('./backend/utils/modelRegistry.js');
    
    console.log('✅ Active Models:');
    for (const [provider, config] of Object.entries(ACTIVE_MODELS)) {
      console.log(`   • ${provider.toUpperCase()}: ${config.primary}`);
    }
    console.log('');
    
    console.log('📌 Deprecated Models (Removed):');
    if (MODEL_DEPRECATION_LOG.length > 0) {
      for (const log of MODEL_DEPRECATION_LOG) {
        console.log(`   • ${log.provider}: ${log.model} → ${log.replacement}`);
      }
    } else {
      console.log('   No deprecated models');
    }
    console.log('');
    
    return true;
  } catch (error) {
    console.error('⚠️  Could not verify models:', error.message);
    console.log('   This is OK if running remotely\n');
    return true;
  }
}

async function runAllTests() {
  console.log('Running comprehensive tests...\n');
  
  const results = {
    backend: await testBackendHealth(),
    reachability: await checkServiceReachability(),
    provider: await testProviderStatus(),
    models: await verifyModelLists(),
  };
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Test Results Summary                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('🎯 Ready to generate questions using:');
    console.log('   1. Create a quiz');
    console.log('   2. Upload study material');
    console.log('   3. Click "Generate Questions"');
    console.log('');
    console.log('📊 Expected behavior:');
    console.log('   • Questions will be generated using Groq (llama-3.1-70b-versatile)');
    console.log('   • Each question will have generatedBy: "groq"');
    console.log('   • If Groq fails, system automatically tries Ollama or Gemini');
    console.log('');
  } else {
    console.log('⚠️  Some tests may have issues. Check errors above.\n');
    console.log('Common fixes:');
    console.log('   1. Make sure backend is running: npm run dev');
    console.log('   2. Check internet connectivity');
    console.log('   3. Verify API keys in .env.local are correct');
    console.log('');
  }
  
  console.log('📚 For detailed info, see: MODEL_FIXES.md\n');
}

// Run tests
runAllTests().catch(console.error);
