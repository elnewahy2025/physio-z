import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { verifyAccessToken } from '../lib/tokens.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: Role;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  // SSE fallback: check query parameter (EventSource can't send headers)
  let token: string | null = null;
  if (header?.startsWith('Bearer ')) {
    token = header.slice(7);
  } else if (typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') throw new Error('wrong token type');
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ message: 'You do not have permission to perform this action' });
      return;
    }
    next();
  };
}