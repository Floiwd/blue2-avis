import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth-admin';
import { getDb, isDbConfigured, FALLBACK_COLLABORATEURS, FALLBACK_AVIS } from '@/lib/db';

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

    const withStats = list.map((c) => {
      const colAvis = FALLBACK_AVIS.filter((a) => a.collaborateur_id === c.id);
      const approuves = colAvis.filter((a) => a.statut === 'approuve');
      const count = approuves.length;

      const avg = (fn: (a: typeof colAvis[0]) => number) =>
        count > 0 ? Math.round((approuves.reduce((s, a) => s + fn(a), 0) / count) * 10) / 10 : 0;

      const moyConseil = avg((a) => a.note_conseil);
      const moyDiversite = avg((a) => a.note_diversite);
      const moyProprete = avg((a) => a.note_proprete);
      const moyEngagements = avg((a) => a.note_engagements);
      const moyQualitePrix = avg((a) => a.note_qualite_prix);
      const moyRecommandation = avg((a) => a.note_recommandation);
      const moyGlobale =
        count > 0
          ? Math.round(
              ((moyConseil +
                moyDiversite +
                moyProprete +
                moyEngagements +
                moyQualitePrix +
                moyRecommandation) /
                6) *
                10
            ) / 10
          : 0;

      return {
        ...c,
        stats: {
          total_avis: colAvis.length,
          total_approuve: count,
          moyenne_globale: moyGlobale,
          moyenne_conseil: moyConseil,
          moyenne_diversite: moyDiversite,
          moyenne_proprete: moyProprete,
          moyenne_engagements: moyEngagements,
          moyenne_qualite_prix: moyQualitePrix,
          moyenne_recommandation: moyRecommandation,
        },
      };
    });

    return NextResponse.json({ collaborateurs: withStats });
  }

  try {
    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    const rows = siteId
      ? await sql`
          SELECT 
            c.id, c.site_id, c.nom, c.role, c.actif, c.created_at, c.deleted_at,
            json_build_object('id', s.id, 'nom', s.nom, 'slug', s.slug) as sites,
            COUNT(a.id)::int as total_avis,
            COUNT(a.id) FILTER (WHERE a.statut = 'approuve')::int as total_approuve,
            COALESCE(ROUND(AVG((a.note_conseil + a.note_diversite + a.note_proprete + a.note_engagements + a.note_qualite_prix + a.note_recommandation)::numeric / 6.0) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_globale,
            COALESCE(ROUND(AVG(a.note_conseil) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_conseil,
            COALESCE(ROUND(AVG(a.note_diversite) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_diversite,
            COALESCE(ROUND(AVG(a.note_proprete) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_proprete,
            COALESCE(ROUND(AVG(a.note_engagements) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_engagements,
            COALESCE(ROUND(AVG(a.note_qualite_prix) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_qualite_prix,
            COALESCE(ROUND(AVG(a.note_recommandation) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_recommandation
          FROM collaborateurs c
          JOIN sites s ON s.id = c.site_id
          LEFT JOIN avis a ON a.collaborateur_id = c.id AND a.deleted_at IS NULL
          WHERE c.deleted_at IS NULL AND c.site_id = ${siteId}
          GROUP BY c.id, s.id, s.nom, s.slug
          ORDER BY c.nom ASC
        `
      : await sql`
          SELECT 
            c.id, c.site_id, c.nom, c.role, c.actif, c.created_at, c.deleted_at,
            json_build_object('id', s.id, 'nom', s.nom, 'slug', s.slug) as sites,
            COUNT(a.id)::int as total_avis,
            COUNT(a.id) FILTER (WHERE a.statut = 'approuve')::int as total_approuve,
            COALESCE(ROUND(AVG((a.note_conseil + a.note_diversite + a.note_proprete + a.note_engagements + a.note_qualite_prix + a.note_recommandation)::numeric / 6.0) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_globale,
            COALESCE(ROUND(AVG(a.note_conseil) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_conseil,
            COALESCE(ROUND(AVG(a.note_diversite) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_diversite,
            COALESCE(ROUND(AVG(a.note_proprete) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_proprete,
            COALESCE(ROUND(AVG(a.note_engagements) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_engagements,
            COALESCE(ROUND(AVG(a.note_qualite_prix) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_qualite_prix,
            COALESCE(ROUND(AVG(a.note_recommandation) FILTER (WHERE a.statut = 'approuve'), 1), 0)::float as moyenne_recommandation
          FROM collaborateurs c
          JOIN sites s ON s.id = c.site_id
          LEFT JOIN avis a ON a.collaborateur_id = c.id AND a.deleted_at IS NULL
          WHERE c.deleted_at IS NULL
          GROUP BY c.id, s.id, s.nom, s.slug
          ORDER BY c.nom ASC
        `;

    interface CollabDbRow {
      id: string;
      site_id: string;
      nom: string;
      role: string | null;
      actif: boolean;
      created_at: string;
      deleted_at: string | null;
      sites: { id: string; nom: string; slug: string };
      total_avis: number;
      total_approuve: number;
      moyenne_globale: number;
      moyenne_conseil: number;
      moyenne_diversite: number;
      moyenne_proprete: number;
      moyenne_engagements: number;
      moyenne_qualite_prix: number;
      moyenne_recommandation: number;
    }

    const formatted = (rows as unknown as CollabDbRow[]).map((r) => ({
      id: r.id,
      site_id: r.site_id,
      nom: r.nom,
      role: r.role || '',
      actif: r.actif,
      created_at: r.created_at,
      deleted_at: r.deleted_at,
      sites: r.sites,
      stats: {
        total_avis: Number(r.total_avis || 0),
        total_approuve: Number(r.total_approuve || 0),
        moyenne_globale: Number(r.moyenne_globale || 0),
        moyenne_conseil: Number(r.moyenne_conseil || 0),
        moyenne_diversite: Number(r.moyenne_diversite || 0),
        moyenne_proprete: Number(r.moyenne_proprete || 0),
        moyenne_engagements: Number(r.moyenne_engagements || 0),
        moyenne_qualite_prix: Number(r.moyenne_qualite_prix || 0),
        moyenne_recommandation: Number(r.moyenne_recommandation || 0),
      },
    }));

    return NextResponse.json({ collaborateurs: formatted });
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
