import { cookies } from 'next/headers';
import crypto from 'crypto';

const ADMIN_COOKIE_NAME = 'blue2_admin_token';

function getAdminSecret(): string {
  return process.env.ADMIN_PASSWORD || 'blue2admin2026';
}

export function generateAdminToken(): string {
  const secret = getAdminSecret();
  const timestamp = Date.now().toString();
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(`admin-authenticated-${timestamp}`)
    .digest('hex');
  return `${timestamp}.${hmac}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestamp, hmac] = parts;
  const secret = getAdminSecret();

  // Token expiré après 7 jours
  const tokenAge = Date.now() - parseInt(timestamp, 10);
  if (isNaN(tokenAge) || tokenAge > 7 * 24 * 60 * 60 * 1000) {
    return false;
  }

  const expectedHmac = crypto
    .createHmac('sha256', secret)
    .update(`admin-authenticated-${timestamp}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(expectedHmac)
  );
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}

export { ADMIN_COOKIE_NAME };
