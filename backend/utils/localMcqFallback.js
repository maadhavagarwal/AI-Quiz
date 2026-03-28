function normalizeText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 30);
}

function extractKeywords(text) {
  const words = normalizeText(text)
    .toLowerCase()
    .match(/[a-z]{5,}/g) || [];

  const stopWords = new Set([
    'about', 'after', 'again', 'against', 'because', 'before', 'between',
    'during', 'every', 'other', 'their', 'there', 'these', 'those', 'under',
    'which', 'while', 'where', 'would', 'could', 'should', 'being', 'through',
    'using', 'based', 'including', 'important', 'different', 'system', 'process'
  ]);

  const freq = new Map();
  for (const word of words) {
    if (stopWords.has(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

function titleCase(word) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function uniqueOptions(options) {
  return [...new Set(options)].slice(0, 4);
}

function buildDistractors(correct, keywordPool) {
  const fallbackTerms = ['analysis', 'framework', 'methodology', 'evaluation', 'hypothesis'];
  const pool = keywordPool.filter((k) => k !== correct);
  const distractors = [];

  for (const candidate of pool) {
    if (distractors.length >= 3) break;
    distractors.push(titleCase(candidate));
  }

  for (const fallback of fallbackTerms) {
    if (distractors.length >= 3) break;
    if (fallback.toLowerCase() !== correct) {
      distractors.push(titleCase(fallback));
    }
  }

  return distractors.slice(0, 3);
}

function createQuestionFromSentence(sentence, keywordPool, index) {
  const words = sentence.match(/[A-Za-z]{5,}/g) || [];
  const cleanWords = words.map((w) => w.toLowerCase());
  const correct = cleanWords.find((w) => keywordPool.includes(w)) || cleanWords[0] || 'concept';

  const replaced = sentence.replace(new RegExp(`\\b${correct}\\b`, 'i'), '_____');
  const distractors = buildDistractors(correct, keywordPool);
  const options = uniqueOptions([titleCase(correct), ...distractors]);

  while (options.length < 4) {
    options.push(`Option ${String.fromCharCode(65 + options.length)}`);
  }

  return {
    question: `Q${index + 1}. Which term best completes the statement: "${replaced}"?`,
    options,
    correctAnswer: 0,
    explanation: `The best answer is "${titleCase(correct)}" because it appears in the source sentence and preserves its original meaning.`
  };
}

export function generateLocalMCQsFromText(text, numberOfQuestions = 5) {
  const normalized = normalizeText(text);
  if (!normalized) {
    throw new Error('Cannot generate fallback MCQs from empty text');
  }

  const sentences = splitSentences(normalized);
  const keywordPool = extractKeywords(normalized);
  const source = sentences.length > 0 ? sentences : [normalized];

  const count = Math.max(1, Math.min(Number(numberOfQuestions) || 5, 20));
  const result = [];

  for (let i = 0; i < count; i++) {
    const sentence = source[i % source.length];
    result.push(createQuestionFromSentence(sentence, keywordPool, i));
  }

  return result;
}
