import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = 'http://localhost:9879/api';

// Test data
const testText = `DNA (deoxyribonucleic acid) is a molecule that carries genetic instructions for life. 
It is found in the nucleus of cells and is composed of nucleotides. Each nucleotide contains a sugar molecule, 
a phosphate group, and a nitrogenous base. The four bases are Adenine (A), Thymine (T), Guanine (G), and Cytosine (C). 
A always pairs with T, and G pairs with C. This complementary base pairing is crucial for DNA replication and protein synthesis.
DNA is organized into structures called chromosomes, which are found in the nucleus of eukaryotic cells.
Each human cell contains 46 chromosomes (23 pairs), except for sex cells which contain 23.
The process of DNA replication ensures that genetic information is accurately passed on to daughter cells during cell division.`;

let authToken = null;
let quizId = null;

async function test(step, description, fn) {
  try {
    console.log(`\n${step}. ${description}...`);
    const result = await fn();
    console.log(`   ✅ SUCCESS`);
    return result;
  } catch (err) {
    console.error(`   ❌ FAILED: ${err.message}`);
    if (err.response?.data) {
      console.error(`   Response: ${JSON.stringify(err.response.data, null, 2)}`);
    }
    console.error(`   Full error:`, err);
    throw err;
  }
}

async function main() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     System Flow Validation - AI MCQ Maker                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    // Step 1: Health Check
    await test('1', 'Health Check', async () => {
      const response = await axios.get(`${API_URL}/health`);
      console.log(`   API running on port 9879`);
      return response.data;
    });

    // Step 2: Register User
    const uniqueEmail = `test${Date.now()}@example.com`;
    const signupData = await test('2', 'User Registration', async () => {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email: uniqueEmail,
        password: 'Test@123456',
        name: 'Test User'
      });
      authToken = response.data.token;
      return response.data;
    });

    const headers = { Authorization: `Bearer ${authToken}` };

    // Step 3: Create Quiz
    const createQuizData = await test('3', 'Create Quiz with Text', async () => {
      const response = await axios.post(`${API_URL}/quizzes`, {
        title: 'DNA Basics Quiz ' + Date.now(),
        description: 'Test quiz for DNA',
        subject: 'Biology',
        studyMaterial: testText,
        totalmarks: 100,
        passingMarks: 40,
        marksPerQuestion: 1,
        duration: 30
      }, { headers });
      quizId = response.data.quiz._id;
      console.log(`   Quiz ID: ${quizId}`);
      return response.data;
    });

    // Step 4: Get Quiz
    const getQuizData = await test('4', 'Get Quiz Details', async () => {
      const response = await axios.get(`${API_URL}/quizzes/${quizId}`, { headers });
      console.log(`   Extracted Text Length: ${response.data.extractedText?.length || 'N/A'}`);
      return response.data;
    });

    // Step 5: Generate Questions
    const generateQuestionsData = await test('5', 'Generate Questions', async () => {
      const response = await axios.post(`${API_URL}/questions/generate`, {
        quizId: quizId,
        text: testText,
        numberOfQuestions: 3,
        difficulty: 'medium'
      }, { headers });
      console.log(`   Generated ${response.data.questions?.length || 0} questions`);
      return response.data;
    });

    if (!generateQuestionsData.questions || generateQuestionsData.questions.length === 0) {
      throw new Error('No questions generated');
    }
    // Step 6: Publish Quiz
    const publishQuizData = await test('6', 'Publish Quiz', async () => {
      const response = await axios.post(`${API_URL}/quizzes/${quizId}/publish`, {}, { headers });
      console.log(`   Quiz published`);
      return response.data;
    });
    // Step 7: Create Test
    const createTestData = await test('7', 'Generate Test Link', async () => {
      const response = await axios.post(`${API_URL}/tests/generate-link`, {
        quizId: quizId
      }, { headers });
      console.log(`   Unique Code: ${response.data.uniqueCode}`);
      console.log(`   Full URL: ${response.data.testLink}`);
      console.log(`   Test ID: ${response.data._id}`);
      return response.data;
    });

    const testId = createTestData._id;
    const testLink = createTestData.uniqueCode;

    // Step 8: Get Test (public endpoint)
    const getTestData = await test('8', 'Access Test via Link (Public)', async () => {
      const response = await axios.get(`${API_URL}/tests/${testLink}`);
      console.log(`   Quiz Title: ${response.data.quiz?.title}`);
      console.log(`   Questions: ${response.data.presentedQuestions?.length || 0}`);
      return response.data;
    });

    // Step 9: Start Test
    const startTestData = await test('9', 'Start Test Session', async () => {
      const response = await axios.post(`${API_URL}/tests/${testLink}/start`, {}, { headers });
      console.log(`   Test started`);
      return response.data;
    });

    // Step 10: Submit Answers
    let userResponses = [];
    if (getTestData.presentedQuestions && getTestData.presentedQuestions.length > 0) {
      userResponses = getTestData.presentedQuestions.map((pq, idx) => ({
        questionId: pq.questionId,
        selectedOptionIndex: idx % 4 // Cycle through options
      }));
    }

    const submitTestData = await test('10', 'Submit Test Answers', async () => {
      const response = await axios.post(`${API_URL}/tests/${testId}/submit`, {
        responses: userResponses
      }, { headers });
      console.log(`   Score: ${response.data.score}/${response.data.totalMarks}`);
      console.log(`   Percentage: ${response.data.percentage}%`);
      return response.data;
    });

    // Step 11: Get Results
    const getResultsData = await test('11', 'Get Test Results', async () => {
      const response = await axios.get(`${API_URL}/tests/${testId}/results`, { headers });
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Final Score: ${response.data.score}${response.data.totalMarks ? '/' + response.data.totalMarks : ''}`);
      return response.data;
    });

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ ALL TESTS PASSED - SYSTEM WORKING!          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (err) {
    console.error('\n❌ Validation failed:', err.message);
    process.exit(1);
  }
}

main();
