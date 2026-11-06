import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'blue2-avis-photos';
const R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  process.env.R2_PUBLIC_URL ||
  '';

export function isR2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

let s3Client: S3Client | null = null;

export function getR2Client(): S3Client | null {
  if (!isR2Configured()) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

/**
 * Génère une URL présignée de type PUT pour upload direct depuis le navigateur.
 */
export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300 // 5 minutes
): Promise<{ uploadUrl: string; key: string }> {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 n\'est pas configuré.');
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return { uploadUrl, key };
}

/**
 * Convertit une clé R2 en URL publique d'accès
 */
export function getPhotoUrlFromKey(key: string): string {
  if (!key) return '';
  // Si c'est déjà une URL complète (ex: fallback local / mock)
  if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
    return key;
  }
  if (R2_PUBLIC_URL) {
    const base = R2_PUBLIC_URL.replace(/\/$/, '');
    return `${base}/${key.replace(/^\//, '')}`;
  }
  // Route proxy Next.js si aucun domaine public R2 n'est configuré
  return `/api/photos/${encodeURIComponent(key)}`;
}
