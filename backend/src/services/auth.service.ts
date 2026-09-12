import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, type RefreshTokenPayload } from '../lib/tokens.js';

export interface LoginResult {
  user: { id: string; name: string; phone: string; email: string | null; role: string; patientId?: string | null };
  accessToken: string;
  refreshToken: string;
}

export async function login(identifier: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findFirst({
    where: { OR: [{ phone: identifier }, { email: identifier }] },
    include: { patient: true },
  });
  if (!user || !user.isActive) throw new HttpError(401, 'Invalid credentials');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, 'Invalid credentials');
  return {
    user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role, patientId: user.patient?.id },
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
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { patient: true } });
  if (!user || !user.isActive) throw new HttpError(401, 'User no longer active');
  return {
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: signRefreshToken(user.id),
  };
}
// ─── Change Password ───

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ user: LoginResult['user']; accessToken: string; refreshToken: string }> {
  // 1. Find the user
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { patient: true } });
  if (!user) throw new HttpError(404, 'User not found');
  if (!user.isActive) throw new HttpError(403, 'Account is deactivated');

  // 2. Verify current password
  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    throw new HttpError(401, 'Current password is incorrect');
  }

  // 3. Validate new password strength
  if (newPassword.length < 8) {
    throw new HttpError(400, 'New password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(newPassword)) {
    throw new HttpError(400, 'New password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(newPassword)) {
    throw new HttpError(400, 'New password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(newPassword)) {
    throw new HttpError(400, 'New password must contain at least one number');
  }

  // 4. Ensure new password is different from current
  if (currentPassword === newPassword) {
    throw new HttpError(400, 'New password must be different from current password');
  }

  // 5. Hash and update
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // 6. Generate fresh tokens (invalidates old session implicitly by replacing them)
  return {
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      patientId: user.patient?.id,
    },
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: signRefreshToken(user.id),
  };
}