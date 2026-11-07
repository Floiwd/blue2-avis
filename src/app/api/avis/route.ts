import { NextRequest, NextResponse } from 'next/server';
import {
  getDb,
  isDbConfigured,
  FALLBACK_SITES,
  FALLBACK_COLLABORATEURS,
  FALLBACK_AVIS,
} from '@/lib/db';
import { Avis } from '@/lib/types';
import { getPhotoUrlFromKey } from '@/lib/r2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Pragma, Cache-Control',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function formatPhotoKeys(rawPhotos: unknown) {
  let list: unknown[] = [];
  if (Array.isArray(rawPhotos)) {
    list = rawPhotos;
  } else if (typeof rawPhotos === 'string') {
    try {
      const parsed = JSON.parse(rawPhotos);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = [rawPhotos];
    }
  }

  return list.map((p) => {
    let originalKey = '';
    let thumbnailKey = '';
    if (typeof p === 'string') {
      try {
        const parsed = JSON.parse(p);
        if (parsed.original || parsed.thumbnail) {
          originalKey = parsed.original || parsed.thumbnail;
          thumbnailKey = parsed.thumbnail || parsed.original;
        } else {
          originalKey = p;
          thumbnailKey = p;
        }
      } catch {
        originalKey = p;
        thumbnailKey = p;
      }
    } else if (typeof p === 'object' && p !== null) {
      const obj = p as { original?: string; thumbnail?: string };
      originalKey = obj.original || obj.thumbnail || '';
      thumbnailKey = obj.thumbnail || obj.original || '';
    }

    return {
      thumbnail: getPhotoUrlFromKey(thumbnailKey),
      original: getPhotoUrlFromKey(originalKey),
      key_thumbnail: thumbnailKey,
      key_original: originalKey,
    };
  });
}

function computeStats(avisList: Array<{
  note_conseil: number;
  note_diversite: number;
  note_proprete: number;
  note_engagements: number;
  note_qualite_prix: number;
  note_recommandation: number;
}>) {
  if (avisList.length === 0) {
    return {
      total: 0,
      moyenne_globale: 0,
      moyenne_conseil: 0,
      moyenne_diversite: 0,
      moyenne_proprete: 0,
      moyenne_engagements: 0,
      moyenne_qualite_prix: 0,
      moyenne_recommandation: 0,
    };
  }

  const round1 = (val: number) => Math.round(val * 10) / 10;

  const total = avisList.length;
  const sumConseil = avisList.reduce((acc, a) => acc + Number(a.note_conseil), 0);
  const sumDiversite = avisList.reduce((acc, a) => acc + Number(a.note_diversite), 0);
  const sumProprete = avisList.reduce((acc, a) => acc + Number(a.note_proprete), 0);
  const sumEngagements = avisList.reduce((acc, a) => acc + Number(a.note_engagements), 0);
  const sumQualitePrix = avisList.reduce((acc, a) => acc + Number(a.note_qualite_prix), 0);
  const sumRecommandation = avisList.reduce((acc, a) => acc + Number(a.note_recommandation), 0);

  const moyConseil = round1(sumConseil / total);
  const moyDiversite = round1(sumDiversite / total);
  const moyProprete = round1(sumProprete / total);
  const moyEngagements = round1(sumEngagements / total);
  const moyQualitePrix = round1(sumQualitePrix / total);
  const moyRecommandation = round1(sumRecommandation / total);

  const moyGlobale = round1(
    (moyConseil +
      moyDiversite +
      moyProprete +
      moyEngagements +
      moyQualitePrix +
      moyRecommandation) /
      6
  );

  return {
    total,
    moyenne_globale: moyGlobale,
    moyenne_conseil: moyConseil,
    moyenne_diversite: moyDiversite,
    moyenne_proprete: moyProprete,
    moyenne_engagements: moyEngagements,
    moyenne_qualite_prix: moyQualitePrix,
    moyenne_recommandation: moyRecommandation,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteSlug = searchParams.get('site');

    // 1. Fallback mock si la base Neon n'est pas encore configurée
    if (!isDbConfigured()) {
      let matchedSite = FALLBACK_SITES[0];
      if (siteSlug && siteSlug !== 'all') {
        const found = FALLBACK_SITES.find((s) => s.slug === siteSlug);
        if (found) matchedSite = found;
      }

      const relevantAvis = siteSlug && siteSlug !== 'all'
        ? FALLBACK_AVIS.filter((a) => a.site_id === matchedSite.id && a.statut === 'approuve')
        : FALLBACK_AVIS.filter((a) => a.statut === 'approuve');

      const stats = computeStats(relevantAvis);

      const formattedAvis = relevantAvis.map((a) => {
        const collab = FALLBACK_COLLABORATEURS.find((c) => c.id === a.collaborateur_id);
        return {
          id: a.id,
          prenom: a.prenom,
          initiale_nom: a.nom ? a.nom.charAt(0).toUpperCase() + '.' : '',
          created_at: a.created_at,
          intitule_prestation: a.intitule_prestation || null,
          notes: {
            conseil: a.note_conseil,
            diversite: a.note_diversite,
            proprete: a.note_proprete,
            engagements: a.note_engagements,
            qualite_prix: a.note_qualite_prix,
            recommandation: a.note_recommandation,
            moyenne: Math.round(
              ((a.note_conseil +
                a.note_diversite +
                a.note_proprete +
                a.note_engagements +
                a.note_qualite_prix +
                a.note_recommandation) /
                6) *
                10
            ) / 10,
          },
          collaborateur: collab ? { nom: collab.nom, role: collab.role } : null,
          commentaire: a.commentaire,
          photos: formatPhotoKeys(a.photos || []),
        };
      });

      return NextResponse.json(
        {
          site: siteSlug && siteSlug !== 'all' ? matchedSite : { nom: 'Blue 2.0 (Toutes agences)', slug: 'all' },
          stats,
          avis: formattedAvis,
        },
        { headers: CORS_HEADERS }
      );
    }

    // 2. Query Neon PostgreSQL
    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    interface DbAvisRow {
      id: string;
      site_id: string;
      collaborateur_id: string;
      intitule_prestation: string | null;
      note_conseil: number;
      note_diversite: number;
      note_proprete: number;
      note_engagements: number;
      note_qualite_prix: number;
      note_recommandation: number;
      commentaire: string | null;
      photos: unknown;
      nom: string;
      prenom: string;
      created_at: string;
      site_slug: string;
      site_nom: string;
      collaborateur_nom: string;
      collaborateur_role: string | null;
    }

    let rows: DbAvisRow[];
    let siteInfo = { nom: 'Blue 2.0 (Toutes agences)', slug: 'all' };

    if (siteSlug && siteSlug !== 'all') {
      const siteRows = (await sql`
        SELECT id, slug, nom FROM sites WHERE slug = ${siteSlug} AND deleted_at IS NULL
      `) as Array<{ id: string; slug: string; nom: string }>;

      if (siteRows.length === 0) {
        return NextResponse.json(
          { error: `Agence introuvable pour le slug: ${siteSlug}` },
          { status: 404, headers: CORS_HEADERS }
        );
      }
      siteInfo = { nom: siteRows[0].nom, slug: siteRows[0].slug };

      rows = (await sql`
        SELECT 
          a.id, a.site_id, a.collaborateur_id, a.intitule_prestation,
          a.note_conseil, a.note_diversite, a.note_proprete, a.note_engagements, a.note_qualite_prix, a.note_recommandation,
          a.commentaire, a.photos, a.nom, a.prenom, a.created_at,
          s.slug as site_slug, s.nom as site_nom,
          c.nom as collaborateur_nom, c.role as collaborateur_role
        FROM avis a
        JOIN sites s ON s.id = a.site_id
        JOIN collaborateurs c ON c.id = a.collaborateur_id
        WHERE a.statut = 'approuve' 
          AND a.deleted_at IS NULL 
          AND s.slug = ${siteSlug}
        ORDER BY a.created_at DESC
      `) as unknown as DbAvisRow[];
    } else {
      rows = (await sql`
        SELECT 
          a.id, a.site_id, a.collaborateur_id, a.intitule_prestation,
          a.note_conseil, a.note_diversite, a.note_proprete, a.note_engagements, a.note_qualite_prix, a.note_recommandation,
          a.commentaire, a.photos, a.nom, a.prenom, a.created_at,
          s.slug as site_slug, s.nom as site_nom,
          c.nom as collaborateur_nom, c.role as collaborateur_role
        FROM avis a
        JOIN sites s ON s.id = a.site_id
        JOIN collaborateurs c ON c.id = a.collaborateur_id
        WHERE a.statut = 'approuve' 
          AND a.deleted_at IS NULL
        ORDER BY a.created_at DESC
      `) as unknown as DbAvisRow[];
    }

    const stats = computeStats(rows);

    const formattedAvis = rows.map((a) => ({
      id: a.id,
      prenom: a.prenom,
      initiale_nom: a.nom ? a.nom.charAt(0).toUpperCase() + '.' : '',
      created_at: a.created_at,
      intitule_prestation: a.intitule_prestation || null,
      notes: {
        conseil: a.note_conseil,
        diversite: a.note_diversite,
        proprete: a.note_proprete,
        engagements: a.note_engagements,
        qualite_prix: a.note_qualite_prix,
        recommandation: a.note_recommandation,
        moyenne: Math.round(
          ((a.note_conseil +
            a.note_diversite +
            a.note_proprete +
            a.note_engagements +
            a.note_qualite_prix +
            a.note_recommandation) /
            6) *
            10
        ) / 10,
      },
      collaborateur: a.collaborateur_nom
        ? { nom: a.collaborateur_nom, role: a.collaborateur_role }
        : null,
      site: a.site_nom ? { nom: a.site_nom, slug: a.site_slug } : null,
      commentaire: a.commentaire,
      photos: formatPhotoKeys(a.photos),
    }));

    return NextResponse.json(
      {
        site: siteInfo,
        stats,
        avis: formattedAvis,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching reviews';
    console.error('Error in /api/avis (Neon):', message);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des avis' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
