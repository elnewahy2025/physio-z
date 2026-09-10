// backend/src/middleware/rateLimiter.ts
// Rate limiting middleware to prevent brute-force attacks and API abuse.
// Uses express-rate-limit with in-memory storage (sufficient for small clinics).

import rateLimit from 'express-rate-limit';

/**
 * Login rate limiter.
 * - 5 attempts per 15 minutes per IP
 * - Blocks brute-force password guessing
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: {
    message: 'Too many login attempts. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_LOGIN',
    retryAfterSeconds: 900,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Store in memory (default) — resets on server restart
  // For production with multiple instances, use Redis:
  // store: new RedisStore({ sendCommand: (...args: string[]) => redisClient.call(...args) }),
});

/**
 * Registration rate limiter.
 * - 3 registrations per hour per IP
 * - Prevents spam account creation
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    message: 'Too many registration attempts. Please try again in 1 hour.',
    code: 'RATE_LIMIT_REGISTER',
    retryAfterSeconds: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password-sensitive operation limiter.
 * - 10 attempts per 15 minutes per IP
 * - For refresh token, password change, etc.
 */
export const sensitiveOpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    message: 'Too many attempts. Please try again later.',
    code: 'RATE_LIMIT_SENSITIVE',
    retryAfterSeconds: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter.
 * - 200 requests per 15 minutes per IP
 * - Prevents API abuse and scraping
 * - Applied to all /api routes (except auth which has stricter limits)
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: {
    message: 'Too many requests. Please slow down.',
    code: 'RATE_LIMIT_API',
    retryAfterSeconds: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful requests from authenticated users
  // (Only counts failed/unauthenticated requests)
  skip: (req) => {
    // Skip for SSE connections (they're long-lived)
    if (req.path.includes('/notifications/stream')) return true;
    // Skip for health checks
    if (req.path === '/health') return true;
    return false;
  },
});

/**
 * More lenient limiter for authenticated API routes.
 * - 500 requests per 15 minutes
 * - Applied AFTER authentication succeeds
 */
export const authenticatedApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    message: 'Rate limit exceeded. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_AUTHENTICATED',
    retryAfterSeconds: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.path.includes('/notifications/stream')) return true;
    if (req.path === '/health') return true;
    return false;
  },
});

/**
 * Admin/report generation limiter.
 * - 20 requests per 5 minutes (reports can be expensive)
 */
export const reportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: {
    message: 'Too many report requests. Please wait before generating more.',
    code: 'RATE_LIMIT_REPORT',
    retryAfterSeconds: 300,
  },
  standardHeaders: true,
  legacyHeaders: false,
});