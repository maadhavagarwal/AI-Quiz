import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => v.length === 4,
      message: 'Must have exactly 4 options',
    },
  },
  correctAnswerIndex: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3],
  },
  explanation: {
    type: String,
    required: true,
  },
  marks: {
    type: Number,
    default: 1,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  generatedBy: {
    type: String,
    enum: ['gemini', 'groq', 'ollama', 'hybrid', 'mixed', 'manual', 'unknown'],
    default: 'gemini',
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Question', questionSchema);
