import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth-admin';
import { getDb, isDbConfigured } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (!isDbConfigured()) {
    return NextResponse.json({
      success: true,
      message: 'Mise à jour simulée (mode démo)',
      id,
      body,
    });
  }

  try {
    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    if (body.statut && ['approuve', 'masque', 'en_attente'].includes(body.statut)) {
      const rows = await sql`
        UPDATE avis
        SET statut = ${body.statut}
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ success: true, avis: rows[0] });
    }

    if (body.action === 'soft_delete') {
      const rows = await sql`
        UPDATE avis
        SET deleted_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ success: true, avis: rows[0] });
    } else if (body.action === 'restore') {
      const rows = await sql`
        UPDATE avis
        SET deleted_at = NULL
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ success: true, avis: rows[0] });
    }

    return NextResponse.json({ success: true, message: 'Aucune modification demandée' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error updating avis';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
