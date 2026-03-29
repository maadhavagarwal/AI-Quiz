// MUST BE FIRST: Load environment variables
import './config.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Now import routes (which depend on env vars)
import authRoutes from './routes/auth.js';
import quizzesRoutes from './routes/quizzes.js';
import questionsRoutes from './routes/questions.js';
import testsRoutes from './routes/tests.js';
import dashboardRoutes from './routes/dashboard.js';
import debugRoutes from './routes/debug.js';
import modelsRoutes from './routes/models.js';
import aiModelRoutes from './routes/aiModel.js';

// Import middleware
import { errorHandler } from './middleware/auth.js';

const app = express();

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Keep local development resilient even if CORS_ORIGIN is configured too narrowly.
const devOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];
const isDevelopment = process.env.NODE_ENV !== 'production';

const allowedOrigins = Array.from(new Set([
  ...configuredOrigins,
  ...(isDevelopment ? devOrigins : []),
]));

// Add support for wildcard or more permissive prod settings
const allowAllOrigins = process.env.CORS_ORIGIN === '*' || (!isDevelopment && !process.env.CORS_ORIGIN);

// Middleware
app.use(helmet({
  // Cross-Origin-Resource-Policy check might block some fonts/images if not set correctly
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow server-to-server and same-origin requests with no Origin header.
    if (!origin || allowAllOrigins) {
      callback(null, true);
      return;
    }

    const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    const isVercelPreview = /\.vercel\.app$/i.test(origin); // Helper for vercel deployments

    // 2. Exact match against configured origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // 3. Additional patterns for development or preview
    if ((isDevelopment && (isLocalDevOrigin || origin === 'null')) || isVercelPreview) {
      callback(null, true);
      return;
    }

    // 4. Deny silently to avoid noisy stack traces for blocked cross-origin probes.
    console.warn(`⚠️ CORS blocked for origin: ${origin}`);
    console.warn(`ℹ️ Allowed origins: ${allowedOrigins.join(', ')} (Wildcard: ${allowAllOrigins})`);
    callback(null, new Error('CORS Not Allowed'));
  },
  credentials: true,
  optionsSuccessStatus: 200, // Important for older browsers and some mobile devices
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/ai', aiModelRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_RETRIES = 20;

function startServer(port, retries = 0) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    if (retries > 0) {
      console.log(`ℹ️ Port auto-fallback used after ${retries} attempt(s)`);
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && retries < MAX_PORT_RETRIES) {
      const nextPort = port + 1;
      console.warn(`⚠️ Port ${port} is in use, retrying with ${nextPort}...`);
      startServer(nextPort, retries + 1);
      return;
    }

    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });
}

startServer(DEFAULT_PORT);
