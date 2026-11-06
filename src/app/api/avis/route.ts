import { NextRequest, NextResponse } from 'next/server';
import {
  getSupabaseAdminClient,
  isSupabaseConfigured,
  FALLBACK_SITES,
  FALLBACK_COLLABORATEURS,
  FALLBACK_AVIS,
} from '@/lib/supabase';
import { Avis } from '@/lib/types';
import { getPhotoUrlFromKey } from '@/lib/r2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function formatPhotoKeys(rawPhotos: any[]) {
  if (!Array.isArray(rawPhotos)) return [];
  return rawPhotos.map((p) => {
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
      originalKey = p.original || p.thumbnail;
      thumbnailKey = p.thumbnail || p.original;
    }

    return {
      thumbnail: getPhotoUrlFromKey(thumbnailKey),
      original: getPhotoUrlFromKey(originalKey),
      key_thumbnail: thumbnailKey,
      key_original: originalKey,
    };
  });
}

function computeStats(avisList: Avis[]) {
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
  const sumConseil = avisList.reduce((acc, a) => acc + a.note_conseil, 0);
  const sumDiversite = avisList.reduce((acc, a) => acc + a.note_diversite, 0);
  const sumProprete = avisList.reduce((acc, a) => acc + a.note_proprete, 0);
  const sumEngagements = avisList.reduce((acc, a) => acc + a.note_engagements, 0);
  const sumQualitePrix = avisList.reduce((acc, a) => acc + a.note_qualite_prix, 0);
  const sumRecommandation = avisList.reduce((acc, a) => acc + a.note_recommandation, 0);

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

    // 1. Fallback mock si Supabase n'est pas encore configuré
    if (!isSupabaseConfigured()) {
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

    // 2. Query Supabase
    const supabase = getSupabaseAdminClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    let siteData = null;
    if (siteSlug && siteSlug !== 'all') {
      const { data: site, error: siteErr } = await supabase
        .from('sites')
        .select('*')
        .eq('slug', siteSlug)
        .is('deleted_at', null)
        .single();

      if (siteErr || !site) {
        return NextResponse.json(
          { error: `Agence introuvable pour le slug: ${siteSlug}` },
          { status: 404, headers: CORS_HEADERS }
        );
      }
      siteData = site;
    }

    let query = supabase
      .from('avis')
      .select(`
        id,
        intitule_prestation,
        note_conseil,
        note_diversite,
        note_proprete,
        note_engagements,
        note_qualite_prix,
        note_recommandation,
        commentaire,
        photos,
        nom,
        prenom,
        created_at,
        collaborateur_id,
        collaborateurs ( id, nom, role ),
        sites ( id, slug, nom )
      `)
      .eq('statut', 'approuve')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (siteData) {
      query = query.eq('site_id', siteData.id);
    }

    const { data: rawAvis, error: avisErr } = await query;
    if (avisErr) throw avisErr;

    const avisList: Avis[] = (rawAvis || []) as unknown as Avis[];
    const stats = computeStats(avisList);

    const formattedAvis = (rawAvis || []).map((a: any) => ({
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
      collaborateur: a.collaborateurs ? { nom: a.collaborateurs.nom, role: a.collaborateurs.role } : null,
      site: a.sites ? { nom: a.sites.nom, slug: a.sites.slug } : null,
      commentaire: a.commentaire,
      photos: formatPhotoKeys(a.photos || []),
    }));

    return NextResponse.json(
      {
        site: siteData ? { id: siteData.id, slug: siteData.slug, nom: siteData.nom } : { nom: 'Blue 2.0 (Global)', slug: 'all' },
        stats,
        avis: formattedAvis,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching reviews';
    console.error('Error in /api/avis:', message);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des avis' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
