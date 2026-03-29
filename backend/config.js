import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local FIRST before anything else
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env FIRST, then overlay with .env.local if it exists
dotenv.config(); 
dotenv.config({ path: path.join(__dirname, '.env.local') });

console.log('✅ Environment variables loaded');
console.log('🔑 GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('🔑 GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length);
