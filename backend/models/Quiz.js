import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  subject: {
    type: String,
    required: true,
  },
  totalmarks: {
    type: Number,
    required: true,
  },
  passingMarks: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  marksPerQuestion: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  sourceFiles: [{
    filename: String,
    fileType: String, // 'pdf', 'text', 'notes'
    originalName: String,
    fileSize: Number,
    uploadedAt: Date,
  }],
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Quiz', quizSchema);
