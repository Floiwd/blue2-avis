import { NextRequest, NextResponse } from 'next/server';
import { createPresignedUploadUrl, isR2Configured } from '@/lib/r2';
import crypto from 'crypto';

interface FileToPresign {
  filename: string;
  contentType: string;
  size: number;
  type: 'original' | 'thumbnail';
}

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 Mo max par photo

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const files: FileToPresign[] = body.files;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'Aucun fichier spécifié' },
        { status: 400 }
      );
    }

    // Compter le nombre de photos originales (max 8 par avis)
    const originalCount = files.filter((f) => f.type === 'original').length;
    if (originalCount > 8) {
      return NextResponse.json(
        { error: 'Limite de 8 photos maximum par avis dépassée.' },
        { status: 400 }
      );
    }

    // Validation des formats et tailles
    for (const file of files) {
      const mime = file.contentType.toLowerCase();
      const ext = file.filename.split('.').pop()?.toLowerCase();
      const isHeic = ext === 'heic' || ext === 'heif' || mime.includes('heic') || mime.includes('heif');

      if (!ALLOWED_CONTENT_TYPES.includes(mime) && !isHeic) {
        return NextResponse.json(
          {
            error: `Format non supporté pour ${file.filename}. Formats acceptés : JPEG, PNG, HEIC, WebP.`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `Le fichier ${file.filename} dépasse la taille maximale autorisée de 15 Mo.`,
          },
          { status: 400 }
        );
      }
    }

    // Si Cloudflare R2 n'est pas encore configuré
    if (!isR2Configured()) {
      return NextResponse.json({
        configured: false,
        message: 'Cloudflare R2 non configuré, mode démo activé.',
        urls: files.map((f, i) => ({
          key: `demo-${f.type}-${Date.now()}-${i}-${f.filename}`,
          uploadUrl: null,
          type: f.type,
        })),
      });
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const batchId = crypto.randomUUID().substring(0, 8);

    const presignedResults = await Promise.all(
      files.map(async (file, idx) => {
        const rawExt = file.filename.split('.').pop() || 'jpg';
        const cleanExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomHex = crypto.randomBytes(4).toString('hex');
        const key = `avis/${yearMonth}/${batchId}-${randomHex}-${file.type}.${cleanExt}`;

        const { uploadUrl } = await createPresignedUploadUrl(
          key,
          file.contentType || 'image/jpeg'
        );

        return {
          uploadUrl,
          key,
          type: file.type,
        };
      })
    );

    return NextResponse.json({
      configured: true,
      urls: presignedResults,
    });
  } catch (error: any) {
    console.error('Error generating presigned URLs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la préparation de l\'envoi direct vers Cloudflare R2.' },
      { status: 500 }
    );
  }
}
