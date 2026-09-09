import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, type RefreshTokenPayload } from '../lib/tokens.js';

export interface LoginResult {
  user: { id: string; name: string; phone: string; email: string | null; role: string };
  accessToken: string;
  refreshToken: string;
}

export async function login(identifier: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findFirst({
    where: { OR: [{ phone: identifier }, { email: identifier }] },
  });
  if (!user || !user.isActive) throw new HttpError(401, 'Invalid credentials');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, 'Invalid credentials');
  return {
    user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role },
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: signRefreshToken(user.id),
  };
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: RefreshTokenPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw new HttpError(401, 'User no longer active');
  return {
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: signRefreshToken(user.id),
  };
}