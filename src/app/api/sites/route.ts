import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, FALLBACK_SITES, FALLBACK_COLLABORATEURS, isSupabaseConfigured } from '@/lib/supabase';


export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      // Mode fallback pré-configuré
      const sitesWithCollabs = FALLBACK_SITES.map((site) => ({
        ...site,
        collaborateurs: FALLBACK_COLLABORATEURS.filter(
          (c) => c.site_id === site.id && c.actif
        ),
      }));
      return NextResponse.json({ sites: sitesWithCollabs, source: 'fallback' });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      throw new Error('Supabase client unavailable');
    }

    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .is('deleted_at', null)
      .eq('actif', true)
      .order('nom');

    if (sitesError) throw sitesError;

    const { data: collabs, error: collabsError } = await supabase
      .from('collaborateurs')
      .select('*')
      .is('deleted_at', null)
      .eq('actif', true)
      .order('nom');

    if (collabsError) throw collabsError;

    const sitesWithCollabs = (sites || []).map((site) => ({
      ...site,
      collaborateurs: (collabs || []).filter((c) => c.site_id === site.id),
    }));

    return NextResponse.json({ sites: sitesWithCollabs, source: 'supabase' });
  } catch (error) {
    console.error('Error fetching sites:', error);
    // Graceful fallback
    const sitesWithCollabs = FALLBACK_SITES.map((site) => ({
      ...site,
      collaborateurs: FALLBACK_COLLABORATEURS.filter(
        (c) => c.site_id === site.id && c.actif
      ),
    }));
    return NextResponse.json({ sites: sitesWithCollabs, source: 'fallback_error' });
  }
}
