import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth-admin';
import { getSupabaseAdminClient, isSupabaseConfigured, FALLBACK_COLLABORATEURS } from '@/lib/supabase';


export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get('site_id');

  if (!isSupabaseConfigured()) {
    const list = siteId
      ? FALLBACK_COLLABORATEURS.filter((c) => c.site_id === siteId)
      : FALLBACK_COLLABORATEURS;
    return NextResponse.json({ collaborateurs: list });
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    let query = supabase.from('collaborateurs').select('*, sites(nom, slug)').order('nom');
    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ collaborateurs: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  if (!isSupabaseConfigured()) {
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
    const supabase = getSupabaseAdminClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const { data, error } = await supabase
      .from('collaborateurs')
      .insert([
        {
          site_id,
          nom: nom.trim(),
          role: role?.trim() || 'Conseiller',
          actif: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, collaborateur: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, id, body });
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const updates: Record<string, any> = {};
    if (nom !== undefined) updates.nom = nom.trim();
    if (role !== undefined) updates.role = role.trim();
    if (site_id !== undefined) updates.site_id = site_id;
    if (actif !== undefined) updates.actif = Boolean(actif);
    if (action === 'soft_delete') updates.deleted_at = new Date().toISOString();
    if (action === 'restore') updates.deleted_at = null;

    const { data, error } = await supabase
      .from('collaborateurs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, collaborateur: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
