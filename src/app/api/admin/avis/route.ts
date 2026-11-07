import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth-admin';
import { deleteR2Object } from '@/lib/r2';
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

    // Récupère les avis actifs ainsi que ceux placés dans la corbeille depuis moins de 7 jours
    const rows = await sql`
      SELECT 
        a.*,
        json_build_object('id', s.id, 'nom', s.nom, 'slug', s.slug) as sites,
        json_build_object('id', c.id, 'nom', c.nom, 'role', c.role) as collaborateurs
      FROM avis a
      LEFT JOIN sites s ON s.id = a.site_id
      LEFT JOIN collaborateurs c ON c.id = a.collaborateur_id
      WHERE a.deleted_at IS NULL OR a.deleted_at >= NOW() - INTERVAL '7 days'
      ORDER BY a.created_at DESC
    `;

    return NextResponse.json({ avis: rows || [], count: rows?.length || 0 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error fetching admin avis';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const emptyTrash = searchParams.get('empty_trash');

  if (emptyTrash !== 'true') {
    return NextResponse.json({ error: 'Paramètre manquant (empty_trash=true requis)' }, { status: 400 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ success: true, count: 0, message: 'Corbeille vidée (mode démo)' });
  }

  try {
    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    // Récupérer les photos des avis dans la corbeille pour nettoyage Cloudflare R2
    const deletedAvisRows = await sql`
      SELECT photos FROM avis WHERE deleted_at IS NOT NULL
    `;
    for (const row of deletedAvisRows) {
      if (Array.isArray(row.photos)) {
        for (const p of row.photos) {
          let origKey = '';
          let thumbKey = '';
          if (typeof p === 'string') {
            try {
              const parsed = JSON.parse(p);
              origKey = parsed.original || parsed.thumbnail || p;
              thumbKey = parsed.thumbnail || parsed.original || p;
            } catch {
              origKey = p;
              thumbKey = p;
            }
          } else if (typeof p === 'object' && p !== null) {
            const obj = p as { original?: string; thumbnail?: string };
            origKey = obj.original || '';
            thumbKey = obj.thumbnail || '';
          }
          if (origKey) await deleteR2Object(origKey);
          if (thumbKey && thumbKey !== origKey) await deleteR2Object(thumbKey);
        }
      }
    }

    const result = await sql`
      DELETE FROM avis WHERE deleted_at IS NOT NULL RETURNING id
    `;

    return NextResponse.json({ success: true, count: result.length, message: 'Corbeille vidée avec succès' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error emptying trash';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
