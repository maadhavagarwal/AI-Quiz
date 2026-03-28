// Type definitions for the application

export interface Teacher {
  _id: string;
  name: string;
  email: string;
  institution?: string;
  bio?: string;
  profileImage?: string;
  totalQuizzes: number;
  totalStudents: number;
  createdAt: string;
}

export interface Question {
  _id: string;
  quizId: string;
  question: string;
  options: [string, string, string, string];
  correctAnswerIndex: 0 | 1 | 2 | 3;
  explanation: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  generatedBy: 'gemini' | 'hybrid';
  isApproved: boolean;
  createdAt: string;
}

export interface Quiz {
  _id: string;
  teacherId: string;
  title: string;
  description?: string;
  subject: string;
  totalmarks: number;
  passingMarks: number;
  totalQuestions: number;
  marksPerQuestion: number;
  duration: number;
  isPublished: boolean;
  sourceFile?: {
    filename: string;
    fileType: 'pdf' | 'text' | 'notes';
    uploadedAt: string;
  };
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface TestResponse {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface Test {
  _id: string;
  quizId: string;
  uniqueLink: string;
  studentName?: string;
  studentEmail?: string;
  startedAt?: string;
  completedAt?: string;
  status: 'not-started' | 'in-progress' | 'submitted';
  totalTime?: number;
  responses: TestResponse[];
  score?: number;
  percentage?: number;
  tabSwitchCount: number;
  isAutoSubmitted: boolean;
  createdAt: string;
}

export interface GenerateQuestionsRequest {
  text?: string;
  fileName?: string;
  numberOfQuestions: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}

export interface GenerateQuestionsResponse {
  questions: Question[];
  totalGenerated: number;
  timestamp: string;
}
