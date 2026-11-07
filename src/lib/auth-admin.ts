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

export function verifyAdminToken(_token: string | undefined | null): boolean {
  // Accès libre temporaire
  return true;
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  // Mot de passe désactivé pour l'instant : accès direct libre
  return true;
}

export { ADMIN_COOKIE_NAME };
