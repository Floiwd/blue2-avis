import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth-admin';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase';


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

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true,
      message: 'Mise à jour simulée (mode démo)',
      id,
      body,
    });
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const updatePayload: Record<string, any> = {};

    if (body.statut && ['approuve', 'masque', 'en_attente'].includes(body.statut)) {
      updatePayload.statut = body.statut;
    }

    if (body.action === 'soft_delete') {
      updatePayload.deleted_at = new Date().toISOString();
    } else if (body.action === 'restore') {
      updatePayload.deleted_at = null;
    }

    const { data, error } = await supabase
      .from('avis')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, avis: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
