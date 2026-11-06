import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth-admin';
import { getSupabaseAdminClient, isSupabaseConfigured, FALLBACK_SITES } from '@/lib/supabase';


export async function GET() {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sites: FALLBACK_SITES });
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('nom');

    if (error) throw error;
    return NextResponse.json({ sites: data || [] });
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
  const { nom, slug } = body;

  if (!nom || !slug) {
    return NextResponse.json({ error: 'Le nom et le slug sont requis' }, { status: 400 });
  }

  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true,
      site: { id: 'new-' + Date.now(), nom, slug: cleanSlug, actif: true, created_at: new Date().toISOString() },
    });
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const { data, error } = await supabase
      .from('sites')
      .insert([{ nom: nom.trim(), slug: cleanSlug, actif: true }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, site: data });
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
  const { id, nom, slug, actif, action } = body;

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
    if (slug !== undefined) updates.slug = slug.toLowerCase().trim();
    if (actif !== undefined) updates.actif = Boolean(actif);
    if (action === 'soft_delete') updates.deleted_at = new Date().toISOString();
    if (action === 'restore') updates.deleted_at = null;

    const { data, error } = await supabase
      .from('sites')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, site: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
