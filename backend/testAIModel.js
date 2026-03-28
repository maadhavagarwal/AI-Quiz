/**
 * AI Model Service Test - Demonstrates MCQ generation and analysis
 * Run: node testAIModel.js
 */

import 'dotenv/config';
import AIModelService from './utils/aiModelService.js';

// Sample text for MCQ generation
const SAMPLE_TEXT = `
Machine Learning is a subset of Artificial Intelligence that enables systems to learn and improve from experience without being explicitly programmed. 
The field of Machine Learning is based on the premise that systems can learn from data, identify patterns, and make decisions with minimal human intervention.

There are three main types of Machine Learning:

1. Supervised Learning: In this type, the algorithm learns from labeled data. The training data contains input-output pairs, and the algorithm learns to predict the output for new inputs.

2. Unsupervised Learning: Here, the algorithm learns from unlabeled data. It tries to find hidden patterns or structures in the data without predefined categories.

3. Reinforcement Learning: This involves learning through interaction with an environment. The algorithm learns by receiving rewards or penalties for its actions.

Some common applications of Machine Learning include:
- Image recognition
- Natural language processing
- Recommendation systems
- Autonomous vehicles
- Fraud detection
- Medical diagnosis

Machine Learning has revolutionized various industries and continues to be one of the most important technologies of our time.
`;

async function runTests() {
  console.log('🚀 Starting AI Model Service Tests...\n');

  try {
    // Test 1: Initialize Service
    console.log('📍 Test 1: Initialize AI Model Service');
    console.log('─'.repeat(50));
    const initSuccess = await AIModelService.initialize();
    console.log(`✅ Initialization: ${initSuccess ? 'SUCCESS' : 'FAILED'}\n`);

    // Test 2: Get available providers
    console.log('📍 Test 2: Get Available Providers');
    console.log('─'.repeat(50));
    const providers = AIModelService.getAvailableProviders();
    console.log(`Available Providers: ${providers.join(', ')}`);
    console.log(`Current Provider: ${AIModelService.currentProvider}\n`);

    // Test 3: Generate MCQs with Gemini
    console.log('📍 Test 3: Generate MCQs with Gemini');
    console.log('─'.repeat(50));
    if (providers.includes('gemini')) {
      try {
        const mcqs = await AIModelService.generateMCQs(SAMPLE_TEXT, 3, 'gemini');
        console.log(`✅ Generated ${mcqs.length} MCQs\n`);
        
        // Display first MCQ
        if (mcqs.length > 0) {
          console.log('Sample MCQ:');
          console.log(`Q: ${mcqs[0].question}`);
          console.log(`Options:`);
          mcqs[0].options.forEach((opt, i) => {
            console.log(`  ${String.fromCharCode(65 + i)}) ${opt}`);
          });
          console.log(`Correct Answer: ${String.fromCharCode(65 + mcqs[0].correctAnswer)}`);
          console.log(`Explanation: ${mcqs[0].explanation}\n`);
        }
      } catch (error) {
        console.log(`⚠️  Gemini test skipped: ${error.message}\n`);
      }
    } else {
      console.log('⚠️  Gemini not available\n');
    }

    // Test 4: Generate MCQs with Groq
    console.log('📍 Test 4: Generate MCQs with Groq');
    console.log('─'.repeat(50));
    if (providers.includes('groq')) {
      try {
        const mcqs = await AIModelService.generateMCQs(SAMPLE_TEXT, 3, 'groq');
        console.log(`✅ Generated ${mcqs.length} MCQs\n`);
        
        // Display first MCQ
        if (mcqs.length > 0) {
          console.log('Sample MCQ:');
          console.log(`Q: ${mcqs[0].question}`);
          console.log(`Options:`);
          mcqs[0].options.forEach((opt, i) => {
            console.log(`  ${String.fromCharCode(65 + i)}) ${opt}`);
          });
          console.log(`Correct Answer: ${String.fromCharCode(65 + mcqs[0].correctAnswer)}`);
          console.log(`Explanation: ${mcqs[0].explanation}\n`);
        }
      } catch (error) {
        console.log(`⚠️  Groq test skipped: ${error.message}\n`);
      }
    } else {
      console.log('⚠️  Groq not available\n');
    }

    // Test 5: Switch Provider
    console.log('📍 Test 5: Switch AI Provider');
    console.log('─'.repeat(50));
    if (providers.length > 1) {
      const targetProvider = providers[0] === 'gemini' ? 'groq' : 'gemini';
      const switched = AIModelService.setProvider(targetProvider);
      console.log(`Switched to: ${AIModelService.currentProvider}`);
      console.log(`Switch Result: ${switched ? 'SUCCESS' : 'FAILED'}\n`);
    } else {
      console.log('⚠️  Only one provider available, skipping provider switch\n');
    }

    // Test 6: Validate MCQ Structure
    console.log('📍 Test 6: Validate MCQ Structure');
    console.log('─'.repeat(50));
    const validMCQ = {
      question: "What is 2+2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 1,
      explanation: "2+2 equals 4"
    };

    try {
      AIModelService.validateMCQ(validMCQ);
      console.log('✅ Valid MCQ passes validation\n');
    } catch (error) {
      console.log(`❌ Validation failed: ${error.message}\n`);
    }

    const invalidMCQ = {
      question: "What is 2+2?",
      options: ["3", "4"],  // Only 2 options
      correctAnswer: 1,
      explanation: "2+2 equals 4"
    };

    try {
      AIModelService.validateMCQ(invalidMCQ);
      console.log('❌ Invalid MCQ incorrectly passed validation\n');
    } catch (error) {
      console.log(`✅ Invalid MCQ correctly rejected: ${error.message}\n`);
    }

    // Test 7: Analyze Answers
    console.log('📍 Test 7: Analyze Quiz Answers');
    console.log('─'.repeat(50));
    const mockQuiz = {
      title: "Machine Learning Basics",
      questions: [
        { question: "What is Machine Learning?", id: 1 },
        { question: "What are the types of ML?", id: 2 },
        { question: "What is Supervised Learning?", id: 3 }
      ]
    };

    const mockAnswers = [
      { questionId: 1, selectedOption: 0, isCorrect: true },
      { questionId: 2, selectedOption: 1, isCorrect: true },
      { questionId: 3, selectedOption: 0, isCorrect: false }
    ];

    try {
      const analysis = await AIModelService.analyzeAnswers(mockQuiz, mockAnswers);
      console.log('✅ Quiz Analysis Results:');
      console.log(JSON.stringify(analysis, null, 2));
      console.log();
    } catch (error) {
      console.log(`⚠️  Analysis test skipped: ${error.message}\n`);
    }

    // Test 8: Performance Metrics
    console.log('📍 Test 8: Service Status');
    console.log('─'.repeat(50));
    console.log(`Initialized: ${AIModelService.initialized}`);
    console.log(`Current Provider: ${AIModelService.currentProvider}`);
    console.log(`Available Providers: ${AIModelService.getAvailableProviders().join(', ')}\n`);

    console.log('✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
