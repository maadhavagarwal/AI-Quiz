import axios from 'axios';

async function testProviderStatus() {
  try {
    console.log('Testing AI Provider Status Endpoint...\n');
    const response = await axios.get('http://localhost:9876/api/debug/ai-providers', {
      timeout: 5000
    });
    
    console.log('✅ Provider Status Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testProviderStatus();
