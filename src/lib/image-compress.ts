/**
 * Compression d'images côté client avant envoi.
 * Réduit la résolution (max 1600px) et compresse en JPEG/WebP (qualité 0.82)
 * pour un chargement ultra-rapide et économique en data mobile.
 */

export interface CompressedImageResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
}

export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<CompressedImageResult> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    // Si ce n'est pas une image, rejeter
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Le fichier sélectionné n\'est pas une image.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcul du redimensionnement proportionnel
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Impossible d\'initialiser le contexte canvas'));
        }

        // Amélioration du lissage
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Détection du format : WebP ou JPEG
        const outputMime = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Erreur lors de la compression de l\'image'));
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanFileName, {
              type: outputMime,
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);
            resolve({
              file: compressedFile,
              previewUrl,
              originalSize,
              compressedSize: blob.size,
            });
          },
          outputMime,
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
