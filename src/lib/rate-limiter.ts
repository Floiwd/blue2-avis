/**
 * In-memory sliding-window rate limiter per IP.
 * Protège les soumissions d'avis contre le spam et le flood.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const ipMap = new Map<string, RateLimitRecord>();

// Nettoyage régulier pour éviter les fuites mémoire
setInterval(() => {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 heure
  for (const [ip, record] of ipMap.entries()) {
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
    if (record.timestamps.length === 0) {
      ipMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  ip: string,
  limit = 5, // max 5 avis
  windowMs = 60 * 60 * 1000 // par heure
): { success: boolean; remaining: number } {
  const now = Date.now();
  let record = ipMap.get(ip);

  if (!record) {
    record = { timestamps: [] };
    ipMap.set(ip, record);
  }

  // Filtrer les requêtes en dehors de la fenêtre
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= limit) {
    return { success: false, remaining: 0 };
  }

  record.timestamps.push(now);
  return { success: true, remaining: limit - record.timestamps.length };
}
