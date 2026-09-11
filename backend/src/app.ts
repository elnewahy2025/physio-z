import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
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
import patientCareRoutes from './routes/patient-care.routes.js';
import roomRoutes from './routes/room.routes.js';
import reportRoutes from './routes/report.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import notificationRoutes from './routes/notification.routes.js';
import ratingRoutes from './routes/rating.routes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { setCacheHeaders } from './middleware/cacheHeaders.js';
import foundationRoutes from './routes/foundation.routes.js';
import surveyRoutes from './routes/survey.routes.js';
import phase2Routes from './routes/phase2.routes.js';


export function createApp() {
  const app = express();

  // ─── Trust proxy (for Railway/Vercel behind reverse proxy) ───
  // This ensures req.ip contains the real client IP, not the proxy IP
  app.set('trust proxy', 1);

  app.use(helmet());

  // ─── CORS ───
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  // ─── Body parsing ───
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // ─── Health check (no rate limit) ───
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', time: new Date().toISOString() }),
  );

  // ─── Apply general API rate limiting to all /api routes ───
  // Auth routes have their own stricter limits (applied in auth.routes.ts)
  app.use('/api', apiLimiter);

  // ─── Input sanitization (XSS prevention) ───
  app.use(sanitizeInput);

  // ─── Cache headers ───
  app.use(setCacheHeaders);

  // ─── Routes ───
  app.use('/api/auth', authRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/settings', settingsRoutes);
app.use('/api/patient-care', patientCareRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/ratings', ratingRoutes);
  app.use('/api', foundationRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
app.use('/api/surveys', surveyRoutes);
app.use('/api', phase2Routes);
  return app;
}

