import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';

// Route imports
import authRoutes from './routes/auth';
import businessRoutes from './routes/business';
import transactionRoutes from './routes/transaction';
import predictionRoutes from './routes/prediction';
import riskRoutes from './routes/risk';
import recommendationRoutes from './routes/recommendation';
import loanRoutes from './routes/loan';
import analyticsRoutes from './routes/analytics';
import reportRoutes from './routes/report';
import notificationRoutes from './routes/notification';
import adminRoutes from './routes/admin';
import copilotRoutes from './routes/copilot';
import schemeRoutes from './routes/scheme';
import simulationRoutes from './routes/simulation';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connections
connectDB();
connectRedis();

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`WebSocket client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`WebSocket client disconnected: ${socket.id}`);
  });
});

// Expose Socket.IO client globally on request
app.use((req: any, res: Response, next: NextFunction) => {
  req.io = io;
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// API Routes Mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/predictions', predictionRoutes);
app.use('/api/v1/risk', riskRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/copilot', copilotRoutes);
app.use('/api/v1/schemes', schemeRoutes);
app.use('/api/v1/simulation', simulationRoutes);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`AI Rural Finance Backend running on port ${PORT}`);
});
