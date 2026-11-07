import { processPhotoForR2 } from './image-compress';

/**
 * Utilitaire de résolution des clés photos Cloudflare R2
 */
export function resolvePhotoUrls(item: any): { thumbnail: string; original: string } {
  const publicBase =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_URL ||
    '';

  let originalKey = '';
  let thumbnailKey = '';

  if (typeof item === 'string') {
    if (item.startsWith('http://') || item.startsWith('https://') || item.startsWith('data:')) {
      return { thumbnail: item, original: item };
    }
    try {
      const parsed = JSON.parse(item);
      originalKey = parsed.original || parsed.thumbnail || item;
      thumbnailKey = parsed.thumbnail || parsed.original || item;
    } catch {
      originalKey = item;
      thumbnailKey = item;
    }
  } else if (typeof item === 'object' && item !== null) {
    originalKey = item.original || item.thumbnail || '';
    thumbnailKey = item.thumbnail || item.original || '';
  }

  const formatKeyToUrl = (key: string) => {
    if (!key) return '';
    if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
      return key;
    }
    if (publicBase) {
      return `${publicBase.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
    }
    return `/api/photos/${encodeURIComponent(key)}`;
  };

  return {
    thumbnail: formatKeyToUrl(thumbnailKey),
    original: formatKeyToUrl(originalKey),
  };
}

/**
 * Téléversement direct de photos vers Cloudflare R2 avec compression WebP HD + miniatures
 */
export async function uploadPhotosToR2(
  files: File[],
  onProgress?: (text: string) => void
): Promise<Array<{ original: string; thumbnail: string }>> {
  if (!files || files.length === 0) return [];

  onProgress?.('Optimisation et compression des photos...');
  const processed = await Promise.all(
    files.map((f) => processPhotoForR2(f, 1920, 800))
  );

  const filesToPresign: Array<{
    filename: string;
    contentType: string;
    size: number;
    type: 'original' | 'thumbnail';
  }> = [];

  processed.forEach((p) => {
    filesToPresign.push({
      filename: p.originalFile.name,
      contentType: p.originalFile.type || 'image/webp',
      size: p.originalFile.size,
      type: 'original',
    });
    filesToPresign.push({
      filename: p.thumbnailFile.name,
      contentType: 'image/webp',
      size: p.thumbnailFile.size,
      type: 'thumbnail',
    });
  });

  const presignRes = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: filesToPresign }),
  });

  if (!presignRes.ok) {
    const errData = await presignRes.json().catch(() => ({}));
    throw new Error(errData.error || 'Erreur lors de la préparation de l\'envoi des photos.');
  }

  const presignData = await presignRes.json();
  const urls = presignData.urls || [];
  const results: Array<{ original: string; thumbnail: string }> = [];

  for (let i = 0; i < processed.length; i++) {
    const p = processed[i];
    const origPresign = urls[i * 2];
    const thumbPresign = urls[i * 2 + 1];

    onProgress?.(`Envoi photo ${i + 1}/${processed.length} vers Cloudflare R2...`);

    if (origPresign?.uploadUrl) {
      await fetch(origPresign.uploadUrl, {
        method: 'PUT',
        body: p.originalFile,
        headers: {
          'Content-Type': p.originalFile.type || 'image/webp',
        },
      });
    }

    if (thumbPresign?.uploadUrl) {
      await fetch(thumbPresign.uploadUrl, {
        method: 'PUT',
        body: p.thumbnailFile,
        headers: {
          'Content-Type': 'image/webp',
        },
      });
    }

    results.push({
      original: origPresign?.key || `avis-orig-${Date.now()}-${p.originalFile.name}`,
      thumbnail: thumbPresign?.key || `avis-thumb-${Date.now()}-${p.thumbnailFile.name}`,
    });
  }

  return results;
}
