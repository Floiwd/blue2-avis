import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth-admin';
import { getDb, isDbConfigured, FALLBACK_SITES } from '@/lib/db';

export async function GET() {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ sites: FALLBACK_SITES });
  }

  try {
    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    const rows = await sql`
      SELECT id, slug, nom, actif, created_at, deleted_at
      FROM sites
      WHERE deleted_at IS NULL
      ORDER BY nom ASC
    `;

    return NextResponse.json({ sites: rows || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error fetching sites';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await req.json();
  const { nom, slug } = body;

  if (!nom || !slug) {
    return NextResponse.json({ error: 'Le nom et le slug sont requis' }, { status: 400 });
  }

  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');

  if (!isDbConfigured()) {
    return NextResponse.json({
      success: true,
      site: { id: 'new-' + Date.now(), nom, slug: cleanSlug, actif: true, created_at: new Date().toISOString() },
    });
  }

  try {
    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    const rows = await sql`
      INSERT INTO sites (nom, slug, actif)
      VALUES (${nom.trim()}, ${cleanSlug}, true)
      RETURNING *
    `;

    return NextResponse.json({ success: true, site: rows[0] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error creating site';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await req.json();
  const { id, nom, slug, actif, action } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ success: true, id, body });
  }

  try {
    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    if (action === 'soft_delete') {
      const rows = await sql`
        UPDATE sites
        SET deleted_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ success: true, site: rows[0] });
    }

    if (action === 'restore') {
      const rows = await sql`
        UPDATE sites
        SET deleted_at = NULL
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ success: true, site: rows[0] });
    }

    if (nom !== undefined || slug !== undefined || actif !== undefined) {
      const rows = await sql`
        UPDATE sites
        SET 
          nom = COALESCE(${nom !== undefined ? nom.trim() : null}, nom),
          slug = COALESCE(${slug !== undefined ? slug.toLowerCase().trim() : null}, slug),
          actif = COALESCE(${actif !== undefined ? Boolean(actif) : null}, actif)
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ success: true, site: rows[0] });
    }

    return NextResponse.json({ success: true, message: 'Aucune modification' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error updating site';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
