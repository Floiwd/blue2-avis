/**
 * Gestion des photos pour Cloudflare R2 :
 * - Original : Qualité brute d'origine (aucun redimensionnement, aucune compression)
 * - Miniature : Générée côté client (~800px) pour affichage web ultra-rapide
 * Formats acceptés : JPEG, PNG, HEIC, WebP (max 15 Mo, max 8 photos)
 */

export interface PhotoProcessingResult {
  originalFile: File;
  thumbnailFile: File;
  previewUrl: string;
  originalSize: number;
  thumbnailSize: number;
}

export async function processPhotoForR2(
  file: File,
  thumbnailMaxDimension = 800
): Promise<PhotoProcessingResult> {
  const originalSize = file.size;

  // Création de l'aperçu et de la miniature via canvas
  return new Promise((resolve, reject) => {
    // Si c'est un format non supporté par le Canvas natif (ex. HEIC sur certains navigateurs desktop)
    const isImage = file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);
    if (!isImage) {
      return reject(new Error('Le fichier sélectionné n\'est pas une image.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        // Fallback si le décodeur canvas ne peut pas parser l'image (ex: HEIC brut sans lib externe)
        // On conserve alors le fichier original pour les deux
        const fallbackThumb = new File([file], `thumb-${file.name}`, { type: file.type });
        resolve({
          originalFile: file,
          thumbnailFile: fallbackThumb,
          previewUrl: URL.createObjectURL(file),
          originalSize,
          thumbnailSize: originalSize,
        });
      };

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Redimensionnement proportionnel à ~800px max pour la miniature
        if (width > thumbnailMaxDimension || height > thumbnailMaxDimension) {
          if (width > height) {
            height = Math.round((height * thumbnailMaxDimension) / width);
            width = thumbnailMaxDimension;
          } else {
            width = Math.round((width * thumbnailMaxDimension) / height);
            height = thumbnailMaxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const fallbackThumb = new File([file], `thumb-${file.name}`, { type: file.type });
          return resolve({
            originalFile: file,
            thumbnailFile: fallbackThumb,
            previewUrl: URL.createObjectURL(file),
            originalSize,
            thumbnailSize: originalSize,
          });
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              const fallbackThumb = new File([file], `thumb-${file.name}`, { type: file.type });
              return resolve({
                originalFile: file,
                thumbnailFile: fallbackThumb,
                previewUrl: URL.createObjectURL(file),
                originalSize,
                thumbnailSize: originalSize,
              });
            }

            const cleanThumbName = 'thumb-' + file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const thumbnailFile = new File([blob], cleanThumbName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);
            resolve({
              originalFile: file,
              thumbnailFile,
              previewUrl,
              originalSize,
              thumbnailSize: blob.size,
            });
          },
          'image/jpeg',
          0.85
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
