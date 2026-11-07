import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth-admin';
import { getDb, isDbConfigured } from '@/lib/db';
import { deleteR2Object } from '@/lib/r2';

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

    // 1. Restauration de l'avis depuis la corbeille
    if (body.action === 'restore') {
      const statutToSet =
        body.statut && ['approuve', 'masque', 'en_attente'].includes(body.statut)
          ? body.statut
          : 'approuve';

      const rows = await sql`
        UPDATE avis
        SET deleted_at = NULL, statut = ${statutToSet}
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ success: true, avis: rows[0] });
    }

    // 2. Déplacement dans la corbeille (suppression logique)
    if (body.action === 'soft_delete') {
      const rows = await sql`
        UPDATE avis
        SET deleted_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ success: true, avis: rows[0] });
    }

    // 3. Modification complète de l'avis (Édition admin : photos, notes, texte, client, etc.)
    if (body.action === 'edit' || body.action === 'update' || body.prenom !== undefined) {
      const {
        prenom,
        nom,
        email,
        telephone,
        societe,
        site_id,
        collaborateur_id,
        intitule_prestation,
        commentaire,
        note_conseil,
        note_diversite,
        note_proprete,
        note_engagements,
        note_qualite_prix,
        note_recommandation,
        photos = [],
        statut = 'approuve',
      } = body;

      const sanitizedPhotos = Array.isArray(photos) ? photos : [];

      await sql`
        UPDATE avis
        SET
          prenom = ${prenom ? String(prenom).trim() : ''},
          nom = ${nom ? String(nom).trim() : ''},
          email = ${email ? String(email).trim() : null},
          telephone = ${telephone ? String(telephone).trim() : null},
          societe = ${societe ? String(societe).trim() : null},
          site_id = ${site_id},
          collaborateur_id = ${collaborateur_id},
          intitule_prestation = ${intitule_prestation ? String(intitule_prestation).trim() : null},
          commentaire = ${commentaire ? String(commentaire).trim() : null},
          note_conseil = ${Number(note_conseil) || 5},
          note_diversite = ${Number(note_diversite) || 5},
          note_proprete = ${Number(note_proprete) || 5},
          note_engagements = ${Number(note_engagements) || 5},
          note_qualite_prix = ${Number(note_qualite_prix) || 5},
          note_recommandation = ${Number(note_recommandation) || 5},
          photos = ${JSON.stringify(sanitizedPhotos)}::jsonb,
          statut = ${['approuve', 'masque', 'en_attente'].includes(statut) ? statut : 'approuve'}
        WHERE id = ${id}
      `;

      // Récupérer la version enrichie avec agence et collaborateur
      const enrichedRows = await sql`
        SELECT 
          a.*,
          json_build_object('id', s.id, 'nom', s.nom, 'slug', s.slug) as sites,
          json_build_object('id', c.id, 'nom', c.nom, 'role', c.role) as collaborateurs
        FROM avis a
        LEFT JOIN sites s ON s.id = a.site_id
        LEFT JOIN collaborateurs c ON c.id = a.collaborateur_id
        WHERE a.id = ${id}
      `;

      return NextResponse.json({ success: true, avis: enrichedRows[0] });
    }

    // 4. Modification classique du statut seul (approuver / masquer)
    if (body.statut && ['approuve', 'masque', 'en_attente'].includes(body.statut)) {
      const rows = await sql`
        UPDATE avis
        SET statut = ${body.statut}
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;

  if (!isDbConfigured()) {
    return NextResponse.json({ success: true, message: 'Suppression définitive simulée (mode démo)' });
  }

  try {
    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    // Nettoyage préalable des photos Cloudflare R2 associées à cet avis
    const rows = await sql`SELECT photos FROM avis WHERE id = ${id}`;
    if (rows.length > 0 && rows[0].photos) {
      const photos = rows[0].photos;
      if (Array.isArray(photos)) {
        for (const p of photos) {
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

    await sql`DELETE FROM avis WHERE id = ${id}`;
    return NextResponse.json({ success: true, message: 'Avis supprimé définitivement' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error deleting avis';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
