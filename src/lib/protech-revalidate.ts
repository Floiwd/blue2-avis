const DEFAULT_PROTECH_REVALIDATE_URL =
  'https://www.protechpiscine88.fr/api/revalidate';
const PROTECH_TARGET_SLUG = 'saint-die-vosges';

/**
 * Notifie le site Protech Piscine pour invalider le cache ISR des avis
 * lorsque un avis lié au site saint-die-vosges est approuvé, modifié, restauré ou supprimé.
 * Ne lève jamais d'exception afin de ne pas bloquer l'action admin.
 */
export async function triggerProtechRevalidation(
  siteSlug?: string | null
): Promise<void> {
  const normalizedSlug = siteSlug?.trim() || PROTECH_TARGET_SLUG;
  if (normalizedSlug !== PROTECH_TARGET_SLUG) {
    return;
  }

  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (!secret) {
    return;
  }

  const targetUrl = (
    process.env.PROTECH_REVALIDATE_URL?.trim() || DEFAULT_PROTECH_REVALIDATE_URL
  ).trim();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({
        secret,
        slug: normalizedSlug,
      }),
    });

    if (!response.ok) {
      console.warn(
        `[protech-revalidate] HTTP ${response.status} lors de la revalidation pour "${normalizedSlug}".`
      );
    }
  } catch (error) {
    console.warn('[protech-revalidate] Échec appel revalidation Protech:', error);
  } finally {
    clearTimeout(timeoutId);
  }
}
