import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth-admin';
import {
  getSupabaseAdminClient,
  isSupabaseConfigured,
  FALLBACK_AVIS,
  FALLBACK_SITES,
  FALLBACK_COLLABORATEURS,
} from '@/lib/supabase';


export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    // Mode fallback
    const enrichedAvis = FALLBACK_AVIS.map((a) => ({
      ...a,
      sites: FALLBACK_SITES.find((s) => s.id === a.site_id),
      collaborateurs: FALLBACK_COLLABORATEURS.find((c) => c.id === a.collaborateur_id),
    }));
    return NextResponse.json({ avis: enrichedAvis, count: enrichedAvis.length });
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const { data, error } = await supabase
      .from('avis')
      .select(`
        *,
        sites ( id, nom, slug ),
        collaborateurs ( id, nom, role )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ avis: data || [], count: data?.length || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
