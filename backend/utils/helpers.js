import jwt from 'jsonwebtoken';

export function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function generateUniqueTestLink() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function calculateScore(responses, maxMarks) {
  let score = 0;
  responses.forEach((response) => {
    if (response.isCorrect) {
      score += 1; // 1 mark per correct answer
    }
  });
  return {
    score: Math.min(score, maxMarks),
    totalMarks: maxMarks,
    percentage: Math.round((score / maxMarks) * 100),
  };
}
