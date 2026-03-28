import mongoose from 'mongoose';

const testSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  uniqueLink: {
    type: String,
    required: true,
    unique: true,
  },
  studentName: String,
  studentEmail: String,
  startedAt: Date,
  completedAt: Date,
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'submitted'],
    default: 'not-started',
  },
  totalTime: Number, // in seconds
  responses: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
    selectedOptionIndex: Number,
    isCorrect: Boolean,
    timeSpent: Number,
  }],
  presentedQuestions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
    optionOrder: {
      type: [Number],
      default: [0, 1, 2, 3],
    },
  }],
  score: Number,
  percentage: Number,
  tabSwitchCount: {
    type: Number,
    default: 0,
  },
  isAutoSubmitted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    index: true,
  },
});

// Auto-expire test links after 24 hours
testSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Test', testSchema);
