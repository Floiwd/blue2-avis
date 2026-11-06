import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth-admin';
import {
  getDb,
  isDbConfigured,
  FALLBACK_AVIS,
  FALLBACK_SITES,
  FALLBACK_COLLABORATEURS,
} from '@/lib/db';

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  if (!isDbConfigured()) {
    const enrichedAvis = FALLBACK_AVIS.map((a) => ({
      ...a,
      sites: FALLBACK_SITES.find((s) => s.id === a.site_id),
      collaborateurs: FALLBACK_COLLABORATEURS.find((c) => c.id === a.collaborateur_id),
    }));
    return NextResponse.json({ avis: enrichedAvis, count: enrichedAvis.length });
  }

  try {
    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    const rows = await sql`
      SELECT 
        a.*,
        json_build_object('id', s.id, 'nom', s.nom, 'slug', s.slug) as sites,
        json_build_object('id', c.id, 'nom', c.nom, 'role', c.role) as collaborateurs
      FROM avis a
      LEFT JOIN sites s ON s.id = a.site_id
      LEFT JOIN collaborateurs c ON c.id = a.collaborateur_id
      WHERE a.deleted_at IS NULL
      ORDER BY a.created_at DESC
    `;

    return NextResponse.json({ avis: rows || [], count: rows?.length || 0 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error fetching admin avis';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
