const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { MongoMemoryServer } = require('mongodb-memory-server');

const todoRoutes = require('./routes/todos');
const projectRoutes = require('./routes/projects');
const bidRoutes = require('./routes/bids');
const assignmentRoutes = require('./routes/assignments');
const stageProgressRoutes = require('./routes/stageProgress');
const milestoneRoutes = require('./routes/milestones');
const paymentRoutes = require('./routes/payments');
const authRoutes = require('./routes/auth');
const loanRoutes = require('./routes/loans');
const { seed } = require('./scripts/seed');

const app = express();

let mongoMemoryServer;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === process.env.FRONTEND_URL) return true;
  // Same machine, different hostname (localhost vs 127.0.0.1) or alternate dev port
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    optionsSuccessStatus: 200
  })
);

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/stage-progress', stageProgressRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/loans', loanRoutes);

const PORT = Number(process.env.PORT) || 9001;

function startServer() {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

async function resolveMongoUri() {
  if (process.env.USE_MEMORY_MONGO === '1') {
    mongoMemoryServer = await MongoMemoryServer.create();
    const base = mongoMemoryServer.getUri().replace(/\/?$/, '');
    return `${base}/freelance_app`;
  }
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set; add it to backend/.env, or set USE_MEMORY_MONGO=1');
    process.exit(1);
  }
  return process.env.MONGO_URI;
}

async function bootstrap() {
  try {
    const mongoUri = await resolveMongoUri();
    if (process.env.USE_MEMORY_MONGO === '1') {
      console.log('USE_MEMORY_MONGO: using embedded MongoDB (no Atlas required)');
    }
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
    if (process.env.USE_MEMORY_MONGO === '1') {
      await seed({ skipConnect: true, disconnectAfter: false });
    }
    startServer();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

bootstrap();