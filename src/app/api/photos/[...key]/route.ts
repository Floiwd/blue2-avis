import { NextRequest, NextResponse } from 'next/server';
import { getR2Client, isR2Configured } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'blue2-avis-photos';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    const objectKey = Array.isArray(key) ? key.join('/') : key;

    if (!objectKey) {
      return NextResponse.json({ error: 'Clé manquante' }, { status: 400 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({ error: 'R2 non configuré' }, { status: 503 });
    }

    const client = getR2Client();
    if (!client) throw new Error('R2 client error');

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    });

    const response = await client.send(command);
    if (!response.Body) {
      return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 });
    }

    const contentType = response.ContentType || 'image/jpeg';
    const stream = response.Body.transformToWebStream();

    return new NextResponse(stream, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error streaming photo from R2:', error);
    return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 });
  }
}
