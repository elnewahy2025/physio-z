import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import userRoutes from './routes/user.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import sessionRoutes from './routes/session.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import roomRoutes from './routes/room.routes.js';
import reportRoutes from './routes/report.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
  app.use('/api/auth', authRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/reports', reportRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}