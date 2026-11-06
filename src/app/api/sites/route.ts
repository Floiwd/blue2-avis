import { NextResponse } from 'next/server';
import { getDb, isDbConfigured, FALLBACK_SITES, FALLBACK_COLLABORATEURS } from '@/lib/db';
import { Site, Collaborateur } from '@/lib/types';

export async function GET() {
  try {
    if (!isDbConfigured()) {
      const sitesWithCollabs = FALLBACK_SITES.map((site) => ({
        ...site,
        collaborateurs: FALLBACK_COLLABORATEURS.filter(
          (c) => c.site_id === site.id && c.actif
        ),
      }));
      return NextResponse.json({ sites: sitesWithCollabs, source: 'fallback' });
    }

    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    const sites = (await sql`
      SELECT id, slug, nom, actif, created_at
      FROM sites
      WHERE deleted_at IS NULL AND actif = true
      ORDER BY nom ASC
    `) as unknown as Site[];

    const collabs = (await sql`
      SELECT id, site_id, nom, role, actif, created_at
      FROM collaborateurs
      WHERE deleted_at IS NULL AND actif = true
      ORDER BY nom ASC
    `) as unknown as Collaborateur[];

    const sitesWithCollabs = sites.map((site) => ({
      ...site,
      collaborateurs: collabs.filter((c) => c.site_id === site.id),
    }));

    return NextResponse.json({ sites: sitesWithCollabs, source: 'neon' });
  } catch (error) {
    console.error('Error fetching sites from Neon:', error);
    const sitesWithCollabs = FALLBACK_SITES.map((site) => ({
      ...site,
      collaborateurs: FALLBACK_COLLABORATEURS.filter(
        (c) => c.site_id === site.id && c.actif
      ),
    }));
    return NextResponse.json({ sites: sitesWithCollabs, source: 'fallback_error' });
  }
}
