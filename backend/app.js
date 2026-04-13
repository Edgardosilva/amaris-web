import express from 'express';
import proceduresRouter from './routes/procedures.js';
import appoimentsRouter from './routes/appoiments.js';
import loginRouter from './routes/login.js';
import patientsRouter from './routes/patients.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.disable('x-powered-by');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:3001',
  'https://amaris-frontend-production.up.railway.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use('/procedures', proceduresRouter);
app.use('/appointments', appoimentsRouter);
app.use('/login', loginRouter);
app.use('/patients', patientsRouter);

export default app;
