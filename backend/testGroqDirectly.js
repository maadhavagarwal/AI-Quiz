import axios from 'axios';

const testText = `DNA (deoxyribonucleic acid) is a molecule that carries genetic instructions for life. 
It is found in the nucleus of cells and is composed of nucleotides. Each nucleotide contains a sugar molecule, 
a phosphate group, and a nitrogenous base.`;

// Test direct Groq API call
async function testGroqDirectly() {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY not set');
      return;
    }

    const prompt = `Generate exactly 1 multiple-choice question. Return ONLY this JSON:
{
  "questions": [
    {
      "question": "Q1",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Exp"
    }
  ]
}

Text: ${testText}`;

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [{role: 'user', content: prompt}],
      temperature: 0.7,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0]?.message?.content;
    console.log('Groq Response (first 200 chars):');
    console.log(content?.substring(0, 200));
    
    // Try to parse
    const jsonMatch = content?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const json = JSON.parse(jsonMatch[0]);
      console.log('\nParsed JSON structure:');
      console.log(JSON.stringify(json, null, 2).substring(0, 300));
      if (json.questions?.[0]) {
        console.log('\nFirst question:');
        console.log(`- question type: ${typeof json.questions[0].question}`);
        console.log(`- correctAnswer type: ${typeof json.questions[0].correctAnswer}`);
        console.log(`- correctAnswer value: ${json.questions[0].correctAnswer}`);
      }
    }
  } catch (err) {
    console.error('Groq test failed:', err.message);
  }
}

testGroqDirectly();
