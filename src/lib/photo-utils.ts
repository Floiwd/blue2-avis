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
