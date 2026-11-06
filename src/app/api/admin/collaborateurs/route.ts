import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth-admin';
import { getDb, isDbConfigured, FALLBACK_COLLABORATEURS } from '@/lib/db';

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get('site_id');

  if (!isDbConfigured()) {
    const list = siteId
      ? FALLBACK_COLLABORATEURS.filter((c) => c.site_id === siteId)
      : FALLBACK_COLLABORATEURS;
    return NextResponse.json({ collaborateurs: list });
  }

  try {
    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    const rows = siteId
      ? await sql`
          SELECT c.*, json_build_object('id', s.id, 'nom', s.nom, 'slug', s.slug) as sites
          FROM collaborateurs c
          JOIN sites s ON s.id = c.site_id
          WHERE c.deleted_at IS NULL AND c.site_id = ${siteId}
          ORDER BY c.nom ASC
        `
      : await sql`
          SELECT c.*, json_build_object('id', s.id, 'nom', s.nom, 'slug', s.slug) as sites
          FROM collaborateurs c
          JOIN sites s ON s.id = c.site_id
          WHERE c.deleted_at IS NULL
          ORDER BY c.nom ASC
        `;

    return NextResponse.json({ collaborateurs: rows || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error fetching collaborateurs';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await req.json();
  const { site_id, nom, role } = body;

  if (!site_id || !nom) {
    return NextResponse.json(
      { error: 'Le site et le nom du collaborateur sont requis' },
      { status: 400 }
    );
  }

  if (!isDbConfigured()) {
    return NextResponse.json({
      success: true,
      collaborateur: {
        id: 'new-c-' + Date.now(),
        site_id,
        nom,
        role: role || 'Conseiller',
        actif: true,
        created_at: new Date().toISOString(),
      },
    });
  }

  try {
    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    const rows = await sql`
      INSERT INTO collaborateurs (site_id, nom, role, actif)
      VALUES (${site_id}, ${nom.trim()}, ${role?.trim() || 'Conseiller'}, true)
      RETURNING *
    `;

    return NextResponse.json({ success: true, collaborateur: rows[0] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error creating collaborateur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await req.json();
  const { id, nom, role, site_id, actif, action } = body;

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
        UPDATE collaborateurs
        SET deleted_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ success: true, collaborateur: rows[0] });
    }

    if (action === 'restore') {
      const rows = await sql`
        UPDATE collaborateurs
        SET deleted_at = NULL
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ success: true, collaborateur: rows[0] });
    }

    if (nom !== undefined || role !== undefined || site_id !== undefined || actif !== undefined) {
      const rows = await sql`
        UPDATE collaborateurs
        SET
          nom = COALESCE(${nom !== undefined ? nom.trim() : null}, nom),
          role = COALESCE(${role !== undefined ? role.trim() : null}, role),
          site_id = COALESCE(${site_id !== undefined ? site_id : null}, site_id),
          actif = COALESCE(${actif !== undefined ? Boolean(actif) : null}, actif)
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ success: true, collaborateur: rows[0] });
    }

    return NextResponse.json({ success: true, message: 'Aucune modification' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error updating collaborateur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
